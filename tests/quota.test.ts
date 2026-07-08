import { describe, it, expect, vi, beforeEach } from "vitest";
import { chainable, selectQueue } from "./helpers/db-mock";
import { analiseRequest, jsonRequest, sessionFor, RUN_ID, USER_A_ID, validAnaliseBody } from "./helpers/fixtures";

/**
 * C-04 — reserva de cota por "run" (Idempotency-Key).
 *
 * Cobre a lógica descrita em src/app/api/analise/route.ts e
 * src/app/api/analise/complete/route.ts:
 *  - 402 "quota_exceeded" quando analysesUsed >= analysesLimit, SEM chamar a
 *    Anthropic (a checagem acontece antes de qualquer client Anthropic ser
 *    usado).
 *  - a PRIMEIRA chamada com um dado runId cria a run e debita 1 unidade.
 *  - chamadas SEGUINTES com o mesmo runId não debitam de novo (idempotência).
 *  - POST /api/analise/complete com outcome="failed" estorna 1 unidade (nunca
 *    abaixo de zero) e é idempotente (não reprocessa uma run que já saiu de
 *    "running").
 *  - POST /api/analise/save não toca a tabela users (não debita cota).
 *
 * Os testes mockam @/lib/db-server e @/auth (conforme orientado), e também
 * @anthropic-ai/sdk + @/lib/aws-ssm para isolar a chamada de rede real da
 * Anthropic — o que interessa aqui é o efeito sobre `analysesUsed`, não o
 * conteúdo da resposta em streaming.
 */

const { authMock, txMock, dbMock, anthropicStreamMock } = vi.hoisted(() => {
  const txMock = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const dbMock = {
    transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock)),
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  };
  const anthropicStreamMock = vi.fn();
  return { authMock: vi.fn(), txMock, dbMock, anthropicStreamMock };
});

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db-server", () => ({ db: dbMock, getDb: () => dbMock }));
vi.mock("@/lib/aws-ssm", () => ({ getClaudeApiKey: vi.fn().mockResolvedValue("test-anthropic-key") }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: () => ({ allowed: true, remaining: 9, resetAt: Date.now() + 60_000, retryAfterSeconds: 0 }),
}));
vi.mock("@anthropic-ai/sdk", () => {
  class FakeAnthropic {
    messages = { stream: anthropicStreamMock };
    constructor(_opts: unknown) {}
  }
  return { default: FakeAnthropic };
});

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(sessionFor(USER_A_ID));
  anthropicStreamMock.mockResolvedValue((async function* () {})());
});

function chainableSelectQueue(results: unknown[][]) {
  txMock.select.mockImplementation(selectQueue(results));
}

describe("POST /api/analise — reserva de cota (C-04)", () => {
  it("retorna 402 quota_exceeded quando analysesUsed >= analysesLimit, sem chamar a Anthropic", async () => {
    const { POST } = await import("@/app/api/analise/route");

    // 1ª select = existingRun (nenhuma), 2ª select = usuário sob lock (cota esgotada)
    chainableSelectQueue([[], [{ used: 5, limit: 5 }]]);

    const res = await POST(analiseRequest());

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body).toMatchObject({
      error: "quota_exceeded",
      analysesUsed: 5,
      analysesLimit: 5,
      upgradeUrl: "/planos",
    });

    // Nunca deve debitar nem criar run quando a cota já estourou.
    expect(txMock.insert).not.toHaveBeenCalled();
    expect(txMock.update).not.toHaveBeenCalled();
    // Nem chamar a Anthropic.
    expect(anthropicStreamMock).not.toHaveBeenCalled();
  });

  it("primeira chamada com um runId cria a run e debita 1 unidade", async () => {
    const { POST } = await import("@/app/api/analise/route");

    chainableSelectQueue([[], [{ used: 2, limit: 5 }]]);
    const insertChain = chainable(undefined);
    const updateChain = chainable(undefined);
    txMock.insert.mockReturnValue(insertChain);
    txMock.update.mockReturnValue(updateChain);

    const res = await POST(analiseRequest());

    expect(res.status).toBe(200);
    expect(txMock.insert).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ id: RUN_ID, userId: USER_A_ID, status: "running" })
    );
    expect(txMock.update).toHaveBeenCalledTimes(1);
    expect(updateChain.set).toHaveBeenCalledTimes(1);
  });

  it("segunda chamada com o mesmo runId NÃO debita de novo (idempotência)", async () => {
    const { POST } = await import("@/app/api/analise/route");

    // existingRun já existe → early return antes de qualquer insert/update.
    chainableSelectQueue([[{ id: RUN_ID }], [{ used: 2, limit: 5 }]]);

    const res = await POST(analiseRequest({ body: { ...validAnaliseBody, task: "debate" } }));

    expect(res.status).toBe(200);
    expect(txMock.insert).not.toHaveBeenCalled();
    expect(txMock.update).not.toHaveBeenCalled();
  });

  it("400 quando o header Idempotency-Key está ausente ou não é um UUID válido", async () => {
    const { POST } = await import("@/app/api/analise/route");

    const res = await POST(analiseRequest({ headers: { "Idempotency-Key": "" } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("missing_idempotency_key");
    // Não deve nem abrir transação de reserva.
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });

  it("401 quando não há sessão autenticada", async () => {
    const { POST } = await import("@/app/api/analise/route");
    authMock.mockResolvedValueOnce(null);

    const res = await POST(analiseRequest());
    expect(res.status).toBe(401);
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });
});

describe("POST /api/analise/complete — encerramento e estorno (C-04)", () => {
  it("outcome=failed estorna 1 unidade de cota", async () => {
    const { POST } = await import("@/app/api/analise/complete/route");

    chainableSelectQueue([[], [{ status: "running", userId: USER_A_ID }]]);
    const updateChain = chainable(undefined);
    txMock.update.mockReturnValue(updateChain);

    const res = await POST(
      jsonRequest("http://localhost/api/analise/complete", { runId: RUN_ID, outcome: "failed" })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, changed: true });
    // 2 updates: status da run (failed) + GREATEST(analyses_used-1,0) no usuário.
    expect(txMock.update).toHaveBeenCalledTimes(2);
  });

  it("outcome=done NÃO estorna cota (apenas marca a run como concluída)", async () => {
    const { POST } = await import("@/app/api/analise/complete/route");

    chainableSelectQueue([[], [{ status: "running", userId: USER_A_ID }]]);
    const updateChain = chainable(undefined);
    txMock.update.mockReturnValue(updateChain);

    const res = await POST(
      jsonRequest("http://localhost/api/analise/complete", { runId: RUN_ID, outcome: "done" })
    );

    expect(res.status).toBe(200);
    // Só 1 update: status da run. Nenhum ajuste de analysesUsed.
    expect(txMock.update).toHaveBeenCalledTimes(1);
  });

  it("é idempotente: reenviar complete para uma run que não está mais 'running' não estorna 2x", async () => {
    const { POST } = await import("@/app/api/analise/complete/route");

    // Run já está "failed" (primeiro complete já processado).
    chainableSelectQueue([[], [{ status: "failed", userId: USER_A_ID }]]);

    const res = await POST(
      jsonRequest("http://localhost/api/analise/complete", { runId: RUN_ID, outcome: "failed" })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, changed: false });
    expect(txMock.update).not.toHaveBeenCalled();
  });
});

describe("POST /api/analise/save — não debita cota", () => {
  it("persiste a análise sem tocar a tabela users", async () => {
    const { POST } = await import("@/app/api/analise/save/route");

    const insertChain = chainable([{ id: "analysis-1" }]);
    dbMock.insert.mockReturnValue(insertChain);

    const res = await POST(
      jsonRequest("http://localhost/api/analise/save", {
        childName: "Criança Teste",
        childAge: "5 anos",
        lang: "pt",
      })
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ id: "analysis-1" });

    // Único efeito colateral é o insert em `analyses`; nunca update em `users`.
    expect(dbMock.insert).toHaveBeenCalledTimes(1);
    expect(dbMock.update).not.toHaveBeenCalled();
    expect(dbMock.transaction).not.toHaveBeenCalled();
  });
});
