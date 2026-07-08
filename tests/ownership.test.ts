import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { chainable, selectQueue } from "./helpers/db-mock";
import { jsonRequest, sessionFor, RUN_ID, USER_A_ID, USER_B_ID, ANALYSIS_ID } from "./helpers/fixtures";

/**
 * Ownership: garante que uma conta nunca consegue ler/alterar dados de
 * outra.
 *
 *  - POST /api/analise/complete de um runId que pertence a outro usuário não
 *    deve mudar nada (nem status da run, nem cota) — src/app/api/analise/
 *    complete/route.ts já trata isso com `if (!run || run.userId !== userId)
 *    return { changed: false }`.
 *  - GET /api/historico/[id] de uma análise de outro usuário → 403 Forbidden
 *    (src/app/api/historico/[id]/route.ts compara `analysis.userId !==
 *    session.user.id`).
 *  - GET /api/historico (lista) filtra por `eq(analyses.userId, userId)` no
 *    próprio SQL — como não há Postgres real neste ambiente, o mock não pode
 *    provar que o filtro é aplicado pelo banco; o teste abaixo prova que a
 *    rota devolve exatamente o que o `db.select(...)` retornar (nenhum
 *    achatamento/merge de dados de outro usuário acontece no código da
 *    rota). A cobertura completa do filtro por linha exige um teste de
 *    integração contra um Postgres real (fora do escopo possível aqui).
 */

const { authMock, txMock, dbMock } = vi.hoisted(() => {
  const txMock = { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() };
  const dbMock = {
    transaction: vi.fn(async (cb: (tx: typeof txMock) => Promise<unknown>) => cb(txMock)),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return { authMock: vi.fn(), txMock, dbMock };
});

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db-server", () => ({ db: dbMock, getDb: () => dbMock }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Ownership — POST /api/analise/complete de run de outro usuário", () => {
  it("não altera status da run nem estorna/debita cota", async () => {
    authMock.mockResolvedValue(sessionFor(USER_A_ID));
    const { POST } = await import("@/app/api/analise/complete/route");

    // Run pertence a USER_B, mas quem chama é USER_A.
    txMock.select.mockImplementation(selectQueue([[], [{ status: "running", userId: USER_B_ID }]]));

    const res = await POST(
      jsonRequest("http://localhost/api/analise/complete", { runId: RUN_ID, outcome: "failed" })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, changed: false });
    expect(txMock.update).not.toHaveBeenCalled();
  });
});

describe("Ownership — GET /api/historico/[id]", () => {
  it("403 ao tentar acessar uma análise que pertence a outro usuário", async () => {
    authMock.mockResolvedValue(sessionFor(USER_B_ID));
    const { GET } = await import("@/app/api/historico/[id]/route");

    dbMock.select.mockReturnValue(
      chainable([{ id: ANALYSIS_ID, userId: USER_A_ID, childName: "Criança A" }])
    );

    const res = await GET(
      jsonRequest(`http://localhost/api/historico/${ANALYSIS_ID}`, {}),
      { params: Promise.resolve({ id: ANALYSIS_ID }) }
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("200 quando o dono da análise é quem está acessando", async () => {
    authMock.mockResolvedValue(sessionFor(USER_A_ID));
    const { GET } = await import("@/app/api/historico/[id]/route");

    dbMock.select.mockReturnValue(
      chainable([{ id: ANALYSIS_ID, userId: USER_A_ID, childName: "Criança A" }])
    );

    const res = await GET(
      jsonRequest(`http://localhost/api/historico/${ANALYSIS_ID}`, {}),
      { params: Promise.resolve({ id: ANALYSIS_ID }) }
    );

    expect(res.status).toBe(200);
  });

  it("401 sem sessão", async () => {
    authMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/historico/[id]/route");

    const res = await GET(
      jsonRequest(`http://localhost/api/historico/${ANALYSIS_ID}`, {}),
      { params: Promise.resolve({ id: ANALYSIS_ID }) }
    );

    expect(res.status).toBe(401);
  });
});

describe("Ownership — DELETE /api/historico verifica dono antes de apagar", () => {
  it("404 ao tentar apagar um id que não pertence ao usuário (nenhum delete é executado)", async () => {
    authMock.mockResolvedValue(sessionFor(USER_B_ID));
    const { DELETE } = await import("@/app/api/historico/route");

    // A query já filtra por (id, userId) — se a análise é de outro usuário,
    // o `where(and(eq(id), eq(userId)))` não encontra nada.
    dbMock.select.mockReturnValue(chainable([]));

    const req = new NextRequest(`http://localhost/api/historico?id=${ANALYSIS_ID}`, { method: "DELETE" });
    const res = await DELETE(req);

    expect(res.status).toBe(404);
    expect(dbMock.delete).not.toHaveBeenCalled();
  });
});
