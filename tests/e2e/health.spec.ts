import { test, expect } from "@playwright/test";

/**
 * A-01: scaffold E2E mínimo. Roda contra um servidor real (`next start` ou
 * um ambiente de preview) apontado por PLAYWRIGHT_BASE_URL — não é
 * executado neste ambiente de sandbox (sem binário nativo/servidor vivo).
 * Serve como smoke test de que o Playwright está corretamente configurado;
 * amplie com specs de fluxo (login, geração de análise, checkout) conforme
 * o ambiente de CI/staging for capaz de rodar `next build && next start`.
 */
test("GET /api/health responde 200 (ou 503 documentando degradação) com um payload de status", async ({
  request,
  baseURL,
}) => {
  const res = await request.get(`${baseURL}/api/health`);
  expect([200, 503]).toContain(res.status());

  const body = await res.json();
  expect(body).toHaveProperty("status");
  expect(body).toHaveProperty("dependencies.database");
});
