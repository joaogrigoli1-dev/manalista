# Plano de Upgrade — Next.js / next-auth / dependências (A-02)

Documento gerado pela Frente C (Qualidade, Testes & Dependências) em 2026-07-07.
**Nenhum upgrade foi executado.** Este ambiente (sandbox Linux com node_modules
instalado no macOS do dono do projeto) não consegue rodar `next build`,
`vitest run` ou os fluxos E2E reais (login Google, magic link, checkout
Stripe, middleware) — validar um upgrade de major sem essa rede de segurança
seria arriscado. O upgrade deve ser feito pelo dono do projeto, na máquina
dele, seguindo o passo-a-passo abaixo.

## 1. Estado atual (confirmado em `package.json` + `npm view` ao vivo em 2026-07-07)

| Pacote | Instalado (range) | Resolvido hoje | Última estável (registry) | Notas |
|---|---|---|---|---|
| `next` | `^15.3.2` | `15.5.15` | `15.5.20` (tag `next-15-3`) · `16.2.10` (tag `latest`) | Major 16 já existe; patch 15.5.20 corrige as CVEs abertas sem sair do range atual. |
| `next-auth` | `^5.0.0-beta.31` | `5.0.0-beta.31` | **ainda é a beta mais recente** (`5.0.0-beta.31`, tag `beta`); estável é a série 4 (`4.24.14`, tag `latest`) | Não há v5 GA no registry ainda — "migrar para estável" hoje significaria **downgrade** para v4, o que é uma migração de API maior, não recomendada só por causa disso. Ver §4. |
| `drizzle-kit` | `^0.31.10` | — | — | Efeito colateral: traz `esbuild`/`@esbuild-kit/*` vulneráveis (ver tabela de CVEs). |

Fonte: `npm view next dist-tags --json` e `npm view next-auth dist-tags --json`
rodados neste ambiente em 2026-07-07. Nenhum número acima é estimado.

## 2. `npm audit` — resumo (rodado em 2026-07-07, apenas leitura)

```
12 vulnerabilities (9 moderate, 3 high, 0 critical)
prod deps: 170 · dev deps: 564 · optional: 135 · total: 769
```

Achados relevantes:

- **`next` (high, 3 advisories, range afetado `9.3.4-canary.0 - 16.3.0-canary.5`)**
  — inclui GHSA-3g8h-86w9-wvmq (cache poisoning via redirects de
  Middleware/Proxy), GHSA-267c-6grr-h53f e GHSA-492v-c6pp-mqqv (bypass de
  Middleware/Proxy — **relevante aqui porque `src/middleware.ts` é a única
  barreira de autenticação para `/api/*`**), GHSA-ffhc-5mcf-pf4q (XSS via CSP
  nonce), GHSA-h64f-5h5j-jqjh (DoS na Image Optimization API), entre outras.
  `npm audit fix` (não-force) resolve isso subindo `next` de `15.5.15` →
  `15.5.20` — **dentro do range `^15.3.2` já declarado**, sem mudança de
  major. Prioridade alta: aplicar assim que a suíte de testes estiver verde.
- **`postcss` (moderate)** — vulnerável via `next/node_modules/postcss`
  (dependência transitiva do próprio Next); resolvido junto com o patch acima.
- **`drizzle-kit` → `@esbuild-kit/*` → `esbuild` (moderate)** — dev-only
  (não entra no bundle de produção). Corrigido apenas com um downgrade de
  major do `drizzle-kit` (`0.18.1`, segundo `npm audit fix --force`) — **não
  recomendo** isso agora; ficaria abaixo da versão que sustenta o
  `drizzle.config.ts`/schema atual sem revalidação. Reavaliar quando o
  drizzle-kit publicar uma versão 0.31.x/0.32.x que já traga o esbuild corrigido.
- **`form-data` (high, CRLF injection)**, **`js-yaml` (moderate)**, **`uuid`
  (moderate)**, **`@aws-sdk/xml-builder`/`fast-xml-parser` (moderate)** — todas
  dependências transitivas; `npm audit fix` (não-force) resolve sem quebra.

Ação imediata recomendada (baixo risco, sem mudança de major): rodar
`npm audit fix` (sem `--force`) na máquina do usuário, rodar a suíte de testes
(`npm run test` + `npm run type-check` + `npm run build`) e, se tudo verde,
commitar o lockfile atualizado. Isso por si só já elimina a maior parte das
vulnerabilidades altas sem entrar em território de breaking change.

## 3. Passo-a-passo seguro para o upgrade de `next` (major, 15 → 16) — **não executar ainda**

Só iniciar depois que a rede de testes deste PR estiver instalada e rodando
verde na máquina do usuário (`npm install && npm run test`).

1. **Baseline verde**: `npm run type-check && npm run lint && npm run test &&
   npm run build` — todos passando na branch atual, antes de tocar em
   qualquer dependência.
2. **Patch primeiro, major depois**: `npm audit fix` (não-force) → revalida
   baseline → commit isolado ("chore: patch next 15.5.15→15.5.20 + deps
   transitivas, corrige CVEs altas"). Isso já é um ganho de segurança
   independente do major.
3. **Ler o changelog/upgrade guide oficial do Next 16** antes de tocar no
   `package.json` — confirmar breaking changes em: Middleware (o app depende
   dele para TODA a autenticação de API — `src/middleware.ts`), Route
   Handlers/`NextRequest`, `next/server`, comportamento de cache do App
   Router, e a API de Image Optimization (health check já monitora
   `dependencies.database`, mas não a Image API). `[CONFIRMAR-FONTE]`: o
   changelog completo do Next 16 não foi lido nesta sessão — apenas os
   dist-tags do registry foram consultados; antes do upgrade, ler
   https://nextjs.org/docs/app/guides/upgrading (ou o guia equivalente da
   versão-alvo) na máquina do usuário.
4. `npm install next@16.2.10 eslint-config-next@16.2.10` (alinhar as duas
   juntas) em uma branch dedicada.
5. Rodar `npm run type-check` — o Next gera/ajusta `.next/types`; corrigir
   qualquer erro de tipo antes de seguir.
6. Rodar `npm run build` local e `npm run start` — testar manualmente os 5
   fluxos críticos citados no pedido original:
   - login via Google OAuth;
   - login via magic link (Resend);
   - middleware bloqueando `/api/*` sem sessão (401 JSON) e liberando
     `/api/health` + `/api/stripe/webhook`;
   - checkout Stripe (sessão de checkout → webhook → upgrade de plano);
   - geração de análise ponta-a-ponta (reserva de cota → stream SSE →
     `/api/analise/complete`).
7. Rodar `npm run test` (Vitest) — a suíte criada nesta sessão cobre C-04
   (cota), ownership e o contrato do middleware; qualquer regressão nesses
   contratos aparece aqui antes de ir para os fluxos manuais do passo 6.
8. Rodar `npm audit --audit-level=high` novamente — confirmar que o major
   não introduziu novas vulnerabilidades altas/críticas.
9. Só então: merge, deploy em staging (Coolify), smoke test
   (`/api/health` retornando `status:"ok"`), e só depois produção.

## 4. `next-auth` beta → estável

Achado importante desta sessão: **não existe hoje uma v5 GA no npm** — a tag
`latest` do pacote `next-auth` ainda aponta para a série 4
(`4.24.14`), e a tag `beta` (`5.0.0-beta.31`) é exatamente a versão já
instalada no projeto (não há beta mais nova disponível agora).

Isso muda a recomendação do pedido original ("migrar next-auth beta→estável"):
não há uma "v5 estável" para migrar ainda. Duas opções reais, nenhuma trivial:

- **(a) Ficar na v5 beta.31** (situação atual) e monitorar o changelog do
  next-auth (`npm view next-auth dist-tags`) periodicamente até a v5 GA sair —
  então seguir o mesmo processo do passo-a-passo acima (baseline verde → ler
  guia de migração oficial → branch dedicada → suíte de testes → os 5 fluxos
  manuais → merge).
- **(b) Downgrade para v4 estável** — API bem diferente da v5 (adapter,
  callbacks, `auth()` unificado da v5 não existe na v4), reescrita não
  trivial de `src/auth.ts` e `src/middleware.ts`; **não recomendado** só para
  "sair de beta", já que a v5 beta.31 está em produção sem incidentes
  reportados relacionados a ela nesta auditoria.

Recomendação: manter (a). Reavaliar a cada poucas semanas rodando
`npm view next-auth dist-tags --json` — no dia em que a tag `latest` passar a
apontar para uma versão `5.x.x`, seguir o passo-a-passo da seção 3 adaptado
para next-auth (com foco extra nos 2 fluxos de login).

## 5. Checklist resumido (ordem correta, para copiar em um board/issue)

1. [ ] `npm install` na máquina do usuário (materializa `vitest`,
   `@playwright/test` registrados nesta sessão em `package.json`).
2. [ ] `npm run test` verde (Vitest — quota/ownership/auth/billing).
3. [ ] `npm audit fix` (sem `--force`) + baseline verde de novo.
4. [ ] Commit isolado do patch de segurança.
5. [ ] `[CONFIRMAR-FONTE]` Ler upgrade guide oficial do Next 16.
6. [ ] Branch dedicada: bump `next`/`eslint-config-next` para 16.2.10.
7. [ ] `type-check` → `build` → os 5 fluxos manuais → `test` → `audit --audit-level=high`.
8. [ ] Merge, deploy staging, smoke test, deploy produção.
9. [ ] Monitorar `next-auth` dist-tags até existir uma v5 GA; só então repetir
   o processo para next-auth.
