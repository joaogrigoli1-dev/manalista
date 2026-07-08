// @ts-nocheck — `@playwright/test` não está instalado neste ambiente sandbox
// (dependências pesadas de teste não são instaladas aqui de propósito; ver
// docs/UPGRADE_PLAN.md). Resolve normalmente após `npm install` na máquina
// do usuário. Evita que a ausência do pacote quebre o typecheck do app.
import { defineConfig, devices } from "@playwright/test";

// A-01: scaffold E2E (Frente C). baseURL configurável via env para rodar
// tanto contra um `next dev`/`next start` local quanto contra um ambiente de
// preview/staging. Specs ficam em tests/e2e/**.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  // Em CI, quem sobe o servidor (`npm run build && npm run start`) é um passo
  // dedicado do workflow — não deixamos o Playwright gerenciar o processo
  // aqui para não acoplar a suíte E2E a um `next build` completo por run.
});
