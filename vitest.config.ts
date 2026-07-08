// @ts-nocheck — este ambiente sandbox não tem `vitest` instalado no
// node_modules (não instalamos dependências pesadas de teste aqui; ver
// docs/UPGRADE_PLAN.md e o relatório da Frente C). O módulo "vitest/config"
// só resolve após `npm install` na máquina do usuário. `tsc --noEmit` do app
// ignora `tests/**` via tsconfig.json, mas este arquivo de config vive na
// raiz do projeto — o @ts-nocheck evita que a ausência do pacote aqui quebre
// o typecheck do resto do app.
import { defineConfig } from "vitest/config";
import path from "node:path";

// A-01: stack de testes (Frente C). Ambiente "node" (não "jsdom") porque o
// alvo aqui são as rotas de API (Route Handlers) e helpers de lib — nada de
// DOM. Mantém o alias "@/*" em sincronia com tsconfig.json.
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/app/**/*.tsx", "src/components/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
