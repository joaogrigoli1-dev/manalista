import { describe, it, expect, vi } from "vitest";

/**
 * C-02 — middleware (src/middleware.ts) deve devolver 401 JSON (nunca um
 * redirect 302) para qualquer rota "/api/*" não-pública quando não há
 * sessão, e liberar sem exigir sessão as rotas verdadeiramente públicas
 * (health check e webhook do Stripe — este último é validado por assinatura
 * HMAC, não por cookie de sessão).
 *
 * O middleware usa `auth(handler)` (o wrapper de middleware do next-auth v5,
 * exportado por src/auth.ts) — aqui mockamos "@/auth" para que `auth(handler)`
 * simplesmente devolva `handler` (o próprio middleware real do arquivo é
 * exercitado sem alterações), e cada teste injeta um `req` fake com a
 * propriedade `.auth` já resolvida (é exatamente essa propriedade que o
 * next-auth real preencheria a partir do cookie de sessão antes de invocar o
 * handler — replicar esse contrato é suficiente para testar a lógica de
 * roteamento do middleware sem precisar de um NextAuth completo).
 */

vi.mock("@/auth", () => ({
  auth: (handler: (req: unknown) => unknown) => handler,
}));

function fakeReq(pathname: string, session: unknown) {
  return {
    nextUrl: { pathname },
    url: `http://localhost${pathname}`,
    auth: session,
  } as any;
}

describe("middleware — autenticação de rotas /api/*", () => {
  it("retorna 401 JSON (não redirect) para /api/analise sem sessão", async () => {
    const middleware = (await import("@/middleware")).default;
    const res = middleware(fakeReq("/api/analise", null));

    expect(res.status).toBe(401);
    expect(res.headers.get("location")).toBeNull();
    const body = await res.json();
    expect(body).toEqual({ error: "Não autenticado" });
  });

  it("retorna 401 JSON para qualquer /api/* nova não listada manualmente (ex.: /api/stripe/checkout)", async () => {
    const middleware = (await import("@/middleware")).default;
    const res = middleware(fakeReq("/api/stripe/checkout", null));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Não autenticado" });
  });

  it("libera /api/health sem exigir sessão", async () => {
    const middleware = (await import("@/middleware")).default;
    const res = middleware(fakeReq("/api/health", null));

    expect(res.status).toBe(200);
  });

  it("libera /api/stripe/webhook sem exigir sessão (validado por HMAC, não por cookie)", async () => {
    const middleware = (await import("@/middleware")).default;
    const res = middleware(fakeReq("/api/stripe/webhook", null));

    expect(res.status).toBe(200);
  });

  it("redireciona (não 401 JSON) uma página normal protegida sem sessão", async () => {
    const middleware = (await import("@/middleware")).default;
    const res = middleware(fakeReq("/perfil", null));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth/login");
  });

  it("libera a rota protegida quando há sessão", async () => {
    const middleware = (await import("@/middleware")).default;
    const res = middleware(fakeReq("/api/analise", { user: { id: "user-1" } }));

    expect(res.status).toBe(200);
  });
});
