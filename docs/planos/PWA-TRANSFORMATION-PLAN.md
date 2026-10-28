# MAnalista → PWA Profissional · Plano de Transformação

**Versão:** 1.0 · **Data:** 2026-05-18 · **Autor:** João Henrique + Claude
**Escopo:** Auditoria + plano de transformação completa para PWA enterprise-grade
**Alvos:** `manalista.com.br` · srv1 (62.72.63.18) · Coolify · Cloudflare

---

## CONTEXTO E DECISÕES JÁ TOMADAS

| Pergunta | Resposta do João |
|---|---|
| Público | Saúde infantil acessível — pais/cuidadores |
| Stack | "Você decide" — recomendação fundamentada no audit |
| Prioridades | PWA offline-first, TTS (voz), visual premium |
| Infra | Reusar Coolify existente no srv1 |

---

# PHASE 1 — CODE AUDIT

<audit_report>

## 1.1 Stack atual e dependências

**Framework:** Next.js **15.3.2** (App Router) com **React 19** e **TypeScript 5.9** em modo `strict`.
**Build:** Turbopack em dev, `output: "standalone"` em prod, Tailwind **3.4.17**.
**Runtime:** Node 20 Alpine + Python 3 + ReportLab 4.4.10 (gera o PDF do laudo).

**Dependências principais:** `@anthropic-ai/sdk ^0.36.3`, `@aws-sdk/client-ssm ^3.700.0`, `framer-motion ^11.18.0`, `react-hook-form` + `zod` + `@hookform/resolvers`, `lucide-react`, `uuid`.

**Repositório:** `github.com/joaogrigoli1-dev/manalista` (branch `main`).
**Coolify:** app `manalista` (UUID `x4g4sgw48s4s84wg8kkggs8g`), build pack `dockerfile`, porta 3000, **health check disabled**, restart_count 0, FQDNs `https://manalista.com.br, https://www.manalista.com.br`.

## 1.2 Arquitetura e estrutura

```
src/
├── app/
│   ├── page.tsx                  ← landing (1016 LOC — todo o marketing em 1 arquivo)
│   ├── layout.tsx                ← root (dark theme hard-coded)
│   ├── globals.css + ../styles/themes.css
│   ├── analise/page.tsx          ← orquestrador completo (~1073 LOC)
│   └── api/
│       ├── analise/route.ts      ← SSE streaming dos agentes (Anthropic)
│       ├── relatorio/route.ts    ← spawn python3 → PDF
│       └── health/route.ts
├── components/
│   ├── forms/   ChildForm, ConsentModal, InfoScoreGauge
│   ├── agents/  AgentCard, AgentMiniCard, CharacterModal, DebateRoom
│   └── results/ KPIGauge, CentralPanel, DiagnosticReport
├── hooks/       useInfoScore, useTheme
├── lib/
│   ├── aws-ssm.ts                ← cache 5min da chave
│   └── agents/  profiles.ts (443), prompts.ts (387), backstories.ts
└── types/index.ts
data/
├── coord-manalista-profile.json
└── simulations/   5 casos JSON (sementes/demo)
public/avatars/    9 SVGs (1 por agente + mediator + extra)
scripts/generate_pdf.py            ← gerador do laudo light (ReportLab)
server.js                          ← Express stub legado (NÃO usado em prod — confuso)
```

**Total:** ~6.118 LOC TypeScript + 1 script Python. O `server.js` na raiz é resto de uma versão SPA estática anterior — deve ser removido.

## 1.3 Features existentes

1. Landing bilíngue (PT/EN) com hero, problema, fluxo, equipe, features, pricing, FAQ.
2. Wizard de coleta (`ChildForm`) com 3 steps + gauge "InfoScore" gamificado.
3. Modal de consentimento LGPD explícito.
4. Pipeline multi-agente (7 especialistas + 1 mediador): analyze → Q&A mid-flow → debate → consolidate.
5. Streaming SSE linha-a-linha com indicador "fulano escrevendo".
6. KPI Panel com gauges de TEA/TDAH/Ansiedade/Atraso revelados progressivamente.
7. Geração de PDF light, print-friendly, WCAG AAA (11 seções), via Python+ReportLab.
8. Re-roteamento quando `needsMoreInfo` → novas perguntas → re-análise.
9. i18n manual por estado.
10. Tema dark único (`Ethereal Glass`).

## 1.4 Qualidade de código e débito técnico

| Item | Gravidade | Detalhe |
|---|---|---|
| `src/app/page.tsx` 1016 LOC com **CSS inline** maciço | Alta | Inviável manter ou trocar tema |
| `src/app/analise/page.tsx` 1073 LOC | Alta | Precisa quebrar em hook `useAnalysis` + componentes |
| Mistura Tailwind + CSS-in-JS inline | Alta | Decidir: Tailwind v4 OKLCH + tokens é o caminho |
| Parsing JSON do stream por regex frágil | Média | Streamar `{type: "delta" \| "final-json"}` no SSE |
| `server.js` legado na raiz | Baixa | Deletar |
| `prompts.ts.bak` versionado | Baixa | Remover do repo |
| Sem testes (zero arquivos `.test.ts`) | Alta | Vitest + Testing Library + Playwright |
| 4 commits-fix consecutivos por erros TS no build | Média | CI obrigatório com `tsc --noEmit` |
| `tsconfig.tsbuildinfo` (212 KB) commitado | Baixa | ✅ Resolvido em 2026-10-17: já estava em `.gitignore`, foi removido do índice e movido para `lixo/2026-10-17/` |

## 1.5 Vulnerabilidades de segurança

| Vuln | Severidade | Correção |
|---|---|---|
| `script-src 'unsafe-eval' 'unsafe-inline'` no CSP | **Alta** | Nonce-based CSP, restringir a dev |
| Sem rate limiting em `/api/analise` | **Crítica** | Upstash Redis ou Cloudflare WAF rate-limit |
| Sem auth — qualquer um chama Claude pelo backend | **Crítica** | Signed token + assinatura mensal |
| Sem header HSTS / X-Content-Type-Options / Referrer-Policy | Média | Adicionar via next.config headers |
| Sem proteção CSRF nas APIs POST | Média | Verificar `Origin` header |
| Sem validação de input com zod no backend | **Alta** | `zod.parse()` no body de `/api/*` |
| Spawn de processo Python por request | **Alta** | DoS trivial — substituir por `@react-pdf/renderer` (Node) |
| Logs com PII (nome da criança) | Baixa | Filtrar no `console.error` em prod |
| `tmpdir()` sem cleanup garantido | Baixa | `try/finally` |
| LGPD: não persiste hoje (bom) | n/a | Quando persistir: DPO + crypto at-rest + direito apagamento |

## 1.6 Performance bottlenecks

| Bottleneck | Impacto | Solução |
|---|---|---|
| 7 chamadas Claude `analyze` serializadas + 7 `debate` + 1 `consolidate` | **Crítico** (2-5 min) | Paralelizar `analyze` (cada especialista é independente). ~2-3× mais rápido. |
| Landing carrega Plus Jakarta com 5 pesos (400-800) | Médio (~80KB) | Cortar para 400/700 variable font, self-host |
| **Sem PWA** — nenhum SW, manifest, cache offline | **Crítico para o objetivo** | Phase 5 |
| Spawn Python por PDF | Alto | `@react-pdf/renderer` |
| Sem CDN — Coolify serve direto | Médio | Cloudflare proxied (Phase 8) |
| Re-renders pesados no streaming (cada chunk `setState`) | Médio | `useDeferredValue` + agrupar chunks por 50ms |
| Bundle todo na home (Framer Motion + profiles + backstories) | Médio | `dynamic()` para `/analise` |

## 1.7 Observações de produto

- **TTS não existe ainda** — requisito crítico desta transformação. Web Speech API cobre iOS 16+/Android.
- **Offline não existe** — crítico para o objetivo "primeira análise em minutos para famílias".
- **Sem persistência** — toda análise é perdida; incompatível com pricing "Pro com histórico".
- **`docs/planos/AUDITORIA-MELHORIAS.md`** (22KB) já mapeia parte destes pontos e propõe o InfoScore — já implementado.

</audit_report>

---

# PHASE 2 — PLANO TÉCNICO

<scratchpad>
Manter Next.js 15 + React 19 + TS. Reescrever em React Native / Capacitor para ter app nativo agora é exagero — PWA cobre iOS 16+ e Android e custa metade.

Tailwind v4 com OKLCH + CSS vars (alinha com ds-healthcare + high-end-visual-design). Substitui o CSS-in-JS inline progressivamente.

Persistência: PostgreSQL no mesmo srv1 via Coolify. Drizzle ORM (mesmo do MyClinicSoft). Auth via Auth.js Magic Link + Google.

PDF: trocar Python → @react-pdf/renderer. Mata spawn, reduz container ~30MB.

Coolify: app manalista já existe. Manter build, só atualizar Dockerfile e healthcheck. Postgres como service Coolify separado.

Cloudflare: domínio aponta direto para srv1 hoje. Migrar para proxied (laranja) — SSL edge, DDoS, cache, rate-limit.
</scratchpad>

<technical_plan>

## 2.1 Stack recomendado

| Camada | Decisão | Por quê |
|---|---|---|
| **Framework** | Next.js 15 App Router (manter) | SSR + SSE streaming já funciona; trocar custaria meses |
| **UI** | Tailwind **v4** + CVA + CSS variables OKLCH | Substitui CSS-in-JS; alinha com `ds-healthcare` + `high-end-visual-design` |
| **Componentes** | shadcn/ui (Radix sob o capô) | A11y AAA fundamental para pais/cuidadores |
| **Forms** | manter `react-hook-form` + `zod` | Padrão; adicionar zod no backend também |
| **Estado servidor** | TanStack Query | Cache, retry — substitui fetch+useState espalhados |
| **Streaming** | Vercel AI SDK (`ai` package) | Substitui parsing manual de SSE |
| **PWA** | Serwist (sucessor mantido do next-pwa) | Suporta App Router corretamente |
| **Voz (TTS)** | Web Speech API + fallback ElevenLabs | Web Speech grátis e offline; ElevenLabs só Pro+ |
| **DB** | **PostgreSQL 16** (Coolify) + **Drizzle ORM** | Mesma stack do MyClinicSoft (já dominada) |
| **Cache/Queue** | Redis (Coolify-managed) | Rate-limit, sessões, fila do PDF |
| **Auth** | Auth.js v5 com Magic Link + Google | Magic link reduz fricção para pais |
| **PDF** | `@react-pdf/renderer` | Mata Python, container 30MB menor |
| **Observabilidade** | Sentry + Coolify logs (OpenTelemetry) | LGPD-safe: scrub PII no beforeSend |
| **Email transacional** | Resend (5K/mês grátis) | Magic links, recibo, lembrete |
| **Pagamento** | Stripe (PT-BR via boleto/Pix) | Internacional; Asaas se Pix for crítico |
| **DNS/CDN/WAF** | Cloudflare (proxied) | SSL edge, rate-limit, Argo opcional |

**Sem reescrita.** Refactor incremental em PRs sequenciais.

## 2.2 Arquitetura

```
┌───────────────────────────────────────────────────────────────┐
│                       CLOUDFLARE (edge)                       │
│  · SSL edge · WAF · rate-limit · cache estáticos · DNS proxied│
└───────────────┬───────────────────────────────────────────────┘
                │ HTTPS
                ▼
┌───────────────────────────────────────────────────────────────┐
│        srv1 (62.72.63.18) · Coolify · Docker network          │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │  manalista (Next.js standalone, port 3000)               │  │
│ │  · App Router + Serwist SW                                │  │
│ │  · /api/* com rate-limit por IP/sessão                    │  │
│ │  · streaming SSE de Claude                                │  │
│ │  · @react-pdf/renderer (sem Python)                       │  │
│ └────────────┬──────────────────────┬──────────────────────┘  │
│              │                      │                          │
│              ▼                      ▼                          │
│ ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│ │ postgres-manalista  │  │ redis-manalista                  │ │
│ │ (Coolify service)   │  │ · rate-limit · sessões · fila    │ │
│ └─────────────────────┘  └──────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
                │ outbound
                ▼
  AWS SSM (Claude key) · Anthropic API · Resend · Stripe

PWA client:
  · Service Worker (Serwist) com estratégias:
      - precache: shell HTML/CSS/JS, fontes, avatars
      - runtime: API JSON stale-while-revalidate (1 dia)
      - laudos PDF: cache-first com expiry 90 dias
  · IndexedDB para análises salvas (Dexie.js)
  · Web Speech API para TTS
```

## 2.3 Escalabilidade

- **Vertical primeiro:** subir RAM do Hostinger quando p95 do Claude TTFB passar de 800ms.
- **Horizontal a partir de ~200 assinaturas:** réplicas no Coolify; Postgres + Redis devem sair do mesmo container.
- **Cache LLM:** hash de inputs idênticos retorna do Redis em <100ms (~$0.20 economizado por re-análise).
- **Filas:** PDF e e-mail saem do request síncrono → BullMQ no Redis.
- **Edge ready:** landing e /api/health podem ir para Cloudflare Workers quando fizer sentido.

## 2.4 Deploy

- **GitFlow simples:** `main` é a única branch que entra em prod.
- **CI:** GitHub Actions roda `tsc --noEmit` + `lint` + `test` antes de mergear.
- **CD:** Coolify webhook já existe — auto-deploy em push para main. Habilitar health check em `/api/health`.
- **Rollback:** Coolify nativo + tag de release no Git.
- **Zero downtime:** Coolify compose com healthcheck + tag `image: manalista:${COMMIT_SHA}` para hot-swap.

## 2.5 Decisão sobre Coolify/Docker existente

**Manter Coolify. Refatorar Dockerfile.**
1. Já apontado e funcionando, com domínio e webhook.
2. João já domina o stack via MyClinicSoft.
3. Mudanças necessárias são pontuais.

**Mudanças no Dockerfile:**
- Remover Python + reportlab (PDF passa para Node).
- Adicionar stage de `migrate` (Drizzle migrate antes do start).
- Final em `node:20-alpine` slim — meta: container <120MB.
- `HEALTHCHECK CMD wget --spider -q http://localhost:3000/api/health || exit 1`.

</technical_plan>

---

# PHASE 3 — DATABASE DESIGN

<database_design>

## 3.1 Tecnologia

**PostgreSQL 16** rodando como service do Coolify no mesmo srv1, com **Drizzle ORM**.

Por quê SQL e não NoSQL:
- Dados são relacionais (usuário → assinaturas → análises → laudos → mensagens do debate).
- LGPD exige rastreabilidade transacional — Postgres com `pg_audit` resolve.
- João já tem expertise em Drizzle (MyClinicSoft).
- Postgres tem `pgvector` se um dia o produto precisar de busca semântica em laudos.

## 3.2 Schema completo

```ts
// drizzle/schema.ts (resumido)

users (
  id            uuid PK default uuid_generate_v7()
  email         citext UNIQUE NOT NULL
  name          text
  email_verified_at  timestamptz
  locale        text default 'pt-BR'         -- pt-BR | en-US
  tts_voice     text default 'pt-BR-female'  -- preferência de voz salva
  marketing_opt_in boolean default false
  created_at    timestamptz default now()
  deleted_at    timestamptz                   -- soft delete LGPD
  -- indexes: email, deleted_at
)

accounts (                                    -- OAuth + magic link (Auth.js v5)
  user_id       uuid FK → users.id ON DELETE CASCADE
  provider      text   -- 'google' | 'email'
  provider_account_id text
  ...
  PRIMARY KEY (provider, provider_account_id)
)

sessions (                                    -- web sessions
  session_token text PK
  user_id       uuid FK → users.id ON DELETE CASCADE
  expires_at    timestamptz
)

subscriptions (
  id             uuid PK
  user_id        uuid FK → users.id
  plan           text   -- 'basic' | 'pro' | 'clinic'
  status         text   -- 'trialing' | 'active' | 'past_due' | 'canceled'
  stripe_customer_id text
  stripe_subscription_id text
  current_period_start  timestamptz
  current_period_end    timestamptz
  trial_ends_at  timestamptz
  analyses_remaining int                       -- contador denormalizado
  created_at     timestamptz default now()
  -- indexes: user_id, status, stripe_subscription_id
)

children (                                    -- crianças cadastradas (LGPD: criptografia em colunas sensíveis)
  id            uuid PK
  user_id       uuid FK → users.id ON DELETE CASCADE  -- guardião
  -- PII criptografada com pgcrypto + chave do KMS via SSM
  name_encrypted     bytea     -- pgp_sym_encrypt
  birthdate_encrypted bytea
  sex           text   -- M | F | outro (não sensível isoladamente)
  age_years_cached  int  -- redundante, atualizado por trigger
  age_months_cached int
  created_at    timestamptz default now()
  deleted_at    timestamptz
  -- indexes: user_id, deleted_at
)

analyses (
  id              uuid PK
  user_id         uuid FK → users.id ON DELETE CASCADE
  child_id        uuid FK → children.id ON DELETE SET NULL
  status          text   -- 'draft' | 'analyzing' | 'debating' | 'consolidating' | 'complete' | 'failed'
  language        text default 'pt-BR'
  input_jsonb     jsonb NOT NULL                     -- ChildData completo (com PII criptografada nos campos free-text)
  input_hash      text                                -- sha256(canonical(input)) para cache
  result_jsonb    jsonb                               -- DiagnosticSuggestion[] + pathologies + qualityScore
  pdf_url         text                                -- presigned URL do PDF gerado (R2 ou disk local)
  quality_score   int                                 -- 0-100
  confidence_level text                                -- 'alta' | 'moderada' | 'baixa'
  started_at      timestamptz default now()
  completed_at    timestamptz
  error_message   text
  llm_cost_cents  int                                 -- tracking de custo Claude
  created_at      timestamptz default now()
  -- indexes: user_id, child_id, status, input_hash, created_at desc
)

debate_messages (                              -- histórico do debate (auditoria + replay)
  id          uuid PK
  analysis_id uuid FK → analyses.id ON DELETE CASCADE
  agent_id    text NOT NULL                  -- 'mediator' | 'psi-infantil' | ...
  type        text NOT NULL                  -- 'analysis' | 'debate' | 'consensus' | 'summary'
  content     text NOT NULL
  technical_json jsonb
  tokens_input  int
  tokens_output int
  model       text                             -- 'claude-opus-4-6' | 'claude-sonnet-4-6'
  created_at  timestamptz default now()
  -- indexes: analysis_id + created_at, model
)

qa_followups (                                 -- perguntas mid-flow e respostas dos pais
  id            uuid PK
  analysis_id   uuid FK → analyses.id ON DELETE CASCADE
  agent_id      text                           -- quem perguntou
  question      text NOT NULL
  answer        text                           -- nullable se pais skipped
  asked_at      timestamptz default now()
  answered_at   timestamptz
)

audit_log (                                    -- exigência LGPD
  id          bigserial PK
  user_id     uuid                             -- pode ser null (eventos do sistema)
  action      text NOT NULL                    -- 'analysis.create' | 'analysis.delete' | 'data.export' | 'data.erase' | ...
  entity_type text                             -- 'analysis' | 'child' | 'user'
  entity_id   uuid
  ip_address  inet
  user_agent  text
  metadata    jsonb
  created_at  timestamptz default now()
  -- index: user_id + created_at desc, action + created_at desc
  -- particionado por mês a partir de 10M linhas
)

consents (                                     -- versionamento de aceite LGPD
  id          uuid PK
  user_id     uuid FK → users.id
  consent_version text NOT NULL                -- 'v1.0' | 'v1.1' …
  document_url text                            -- snapshot do termo aceito
  accepted_at timestamptz default now()
  ip_address  inet
)

usage_quotas (                                 -- contadores por user/mês
  user_id        uuid FK → users.id
  period_start   date
  analyses_count int default 0
  pdf_downloads_count int default 0
  PRIMARY KEY (user_id, period_start)
)

idempotency_keys (                             -- previne double-submit
  key         text PK
  user_id     uuid
  response_status int
  response_body jsonb
  created_at  timestamptz default now()
  -- TTL: 24h via pg_partman ou cron job
)

push_subscriptions (                           -- Web Push API
  id          uuid PK
  user_id     uuid FK → users.id
  endpoint    text NOT NULL
  p256dh      text
  auth        text
  user_agent  text
  created_at  timestamptz default now()
  last_seen_at timestamptz
  -- index: user_id
)
```

## 3.3 Estratégia de índices

| Tabela | Índice | Motivo |
|---|---|---|
| `users` | `(email)` UNIQUE; `(deleted_at) WHERE deleted_at IS NULL` partial | login lookup; queries de usuários ativos |
| `analyses` | `(user_id, created_at DESC)` | listagem do histórico do usuário |
| `analyses` | `(input_hash)` | cache de re-análises idênticas |
| `analyses` | `(status) WHERE status NOT IN ('complete','failed')` partial | dashboard de análises em andamento |
| `debate_messages` | `(analysis_id, created_at)` composto | replay do debate em ordem |
| `audit_log` | `(user_id, created_at DESC)`; `(action, created_at DESC)` | export LGPD; monitoramento |
| `subscriptions` | `(stripe_subscription_id)` UNIQUE; `(user_id, status)` | webhook Stripe; bilhetagem |
| `usage_quotas` | PK composto (`user_id`, `period_start`) já cobre | contagem mensal |
| `children` | `(user_id, deleted_at) WHERE deleted_at IS NULL` partial | listagem das crianças do tutor |

## 3.4 Backup e recuperação

- **Coolify backups automáticos** do volume Postgres → diário às 03:00 UTC, retenção 14 dias localmente.
- **Off-site:** `pg_dump` semanal cifrado (AES-256) → bucket Cloudflare R2 (não AWS — mais barato, mesmo cliente S3-compatible). Retenção 90 dias.
- **PITR opcional** com `wal-g` + R2 quando começar a faturar — RPO < 5 min.
- **Testes de restore** trimestrais em ambiente staging — backup que não foi testado não conta.
- **Runbook documentado** em `docs/runbooks/postgres-restore.md`.

## 3.5 Otimizações de performance

- `pgcrypto` para criptografia simétrica das colunas PII (chave via SSM, rotação anual).
- `pg_stat_statements` habilitado desde dia 1 (Coolify suporta).
- `auto_explain` para queries > 200ms.
- Connection pooler: **PgBouncer** em modo transaction (Drizzle suporta). Reduz overhead de conexão do Node.
- VACUUM/ANALYZE com autovacuum tunado: `autovacuum_vacuum_scale_factor = 0.02` para tabelas grandes (audit_log).
- Particionamento de `audit_log` por mês via `pg_partman` quando passar de 10M linhas (provavelmente nunca, mas é trivial habilitar).
- `JSONB GIN index` em `analyses.result_jsonb` se houver query por chave aninhada.

## 3.6 Migração do estado atual

**Hoje não há banco.** A migração é uma *introdução*, não conversão:

1. **PR-DB-1:** criar schemas iniciais (`users`, `accounts`, `sessions`, `consents`).
2. **PR-DB-2:** introduzir `analyses` + `debate_messages` em **shadow mode** — o app continua funcionando stateless, mas grava em background sem bloquear o stream.
3. **PR-DB-3:** habilitar histórico no UI (página `/conta/historico`) — só visível para usuários logados.
4. **PR-DB-4:** seedar os 5 casos de `data/simulations/` como `analyses` demo (apenas em staging).

Cada PR vem com migration Drizzle + rollback script + smoke test.

</database_design>

---

# PHASE 4 — VISUAL DESIGN STRATEGY

<visual_design_strategy>

## 4.1 Filosofia: healthcare como fundação, premium como camada

**Base obrigatória (`ds-healthcare`):**
- Identidade clínica calma, contraste WCAG **AAA** (≥7:1) para textos críticos.
- Cores acessíveis ao público fragilizado emocionalmente (pais ansiosos).
- Tipografia generosa: corpo 17-18px no mobile (não 14px), line-height ≥ 1.6.
- Touch targets ≥ 48×48px (orientação Material/HIG).
- Foco visível com 2px solid (não só outline browser).

**Camada premium (`high-end-visual-design`):**
- Aplicada *sobre* a base — nunca sacrifica acessibilidade.
- Tipografia editorial nos hero/headings (Plus Jakarta variable, tracking apertado).
- Cards "Double-Bezel" (borda externa de 1px sutil + padding interno + borda interna translúcida) — já presente no código atual de forma manual; padronizar via componente.
- Motion choreography: stagger fade-up em 80ms entre cards (já implementado), parallax leve no hero.
- Sombras em duas camadas (key light + fill light) — `0 0 0 1px` interno + `0 24px 48px` externo.
- Glass morphism só em **overlays e modais**, nunca no body — vidro no fundo confunde leitores de tela e cria contraste ruim.

## 4.2 Paleta — healthcare-first com toque premium

**Modo claro (default — adicionar agora):**

| Token | OKLCH | Hex aprox. | Uso |
|---|---|---|---|
| `--bg-base` | `oklch(98% 0.005 240)` | `#F7F9FB` | fundo geral |
| `--bg-card` | `oklch(100% 0 0)` | `#FFFFFF` | cards |
| `--bg-tinted` | `oklch(96% 0.012 200)` | `#EEF4F7` | zebra/alternado |
| `--ink-primary` | `oklch(22% 0.04 250)` | `#0F172A` | texto principal (contraste 14.8:1) |
| `--ink-secondary` | `oklch(40% 0.03 240)` | `#334155` | texto secundário (7.5:1) |
| `--ink-muted` | `oklch(55% 0.02 240)` | `#64748B` | labels (4.6:1 — só ≥16px) |
| `--brand-primary` | `oklch(58% 0.13 195)` | `#0F8B8D` (teal médico) | CTA, identidade |
| `--brand-soft` | `oklch(58% 0.13 195 / 0.10)` | rgba teal 10% | hover/badge |
| `--brand-glow` | `oklch(58% 0.13 195 / 0.32)` | rgba teal 32% | shadow do CTA |
| `--success` | `oklch(58% 0.14 155)` | `#047857` emerald-700 | confirmações |
| `--warn` | `oklch(60% 0.15 60)` | `#B45309` amber-700 | atenção |
| `--danger` | `oklch(55% 0.20 25)` | `#B91C1C` red-700 | erro/risco |
| `--info` | `oklch(55% 0.15 250)` | `#1D4ED8` blue-700 | aviso neutro |

**Modo escuro (atual — manter como opcional):**
- Já existe em `themes.css`. Refinar contraste do `--text-muted` (hoje 30% de branco, contraste 3.1:1 falha em texto < 18pt). Subir para 42% (4.6:1).

**Cores semânticas dos diagnósticos** (KPI gauges) mantidas mas em versões `-700` para impressão e dark mode unificado:
- TEA: violet-700 `#6D28D9`
- TDAH: blue-700 `#1D4ED8`
- Ansiedade: amber-700 `#B45309`
- Atraso: emerald-700 `#047857`

## 4.3 Tipografia

| Elemento | Família | Peso | Tamanho | Line-height |
|---|---|---|---|---|
| Display (hero h1) | Plus Jakarta Sans variable | 800 | clamp(2.5rem, 7vw, 5rem) | 1.0 |
| H2 seção | Plus Jakarta variable | 700 | clamp(1.6rem, 4vw, 2.5rem) | 1.15 |
| H3 card | Plus Jakarta variable | 700 | 1.125rem | 1.3 |
| Body | Plus Jakarta variable | 400 | 1.0625rem (17px) | 1.65 |
| Body small | Plus Jakarta variable | 400 | 0.9375rem (15px) | 1.6 |
| Label/eyebrow | Plus Jakarta variable | 700 | 0.7rem letter-spacing 0.18em uppercase | 1.4 |
| Mono (códigos CID/DSM) | Geist Mono | 500 | 0.875rem | 1.5 |

**Self-host** das fontes (já feito pelo `next/font`) com `display: swap` e `preload: true` nas críticas.

## 4.4 Biblioteca de componentes

**shadcn/ui customizado** com os tokens acima. Componentes adicionados:
- `Button` (variants: `primary`, `secondary`, `ghost`, `destructive`, `quiet`)
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Dialog` (substitui os modais inline atuais — Q&A, consent, character)
- `Sheet` (mobile drawer para o sidebar de especialistas)
- `Form` + `Field` + `FieldDescription` + `FieldError` (já compatível com react-hook-form + zod)
- `Toast` (substitui o `console.error`)
- `Avatar` (para os SVGs dos agentes — com fallback)
- `Progress` (substitui o InfoScoreGauge custom)
- `Tooltip` (para os instrumentos clínicos)
- `Badge`, `Tag`
- `Tabs` (no relatório, para Visão geral / Diagnósticos / Plano / Referências)

**Componentes próprios do MAnalista** (em cima do shadcn):
- `<AgentCard variant="full|mini" status="idle|analyzing|ready|debating" />`
- `<DebateMessage agent={…} content={…} streaming={bool} />`
- `<KPIGauge label value color size />` (manter API atual, internals usam SVG estável)
- `<TtsPlayer text={…} voice={…} />` — botão de "ouvir" reaproveitável em qualquer texto longo
- `<DiagnosticReport result={…} />`
- `<InstallPwaPrompt />` — componente de prompt nativo

## 4.5 Camada premium sobre healthcare

Como casar acessibilidade clínica com visual premium sem sacrificar nenhum:

1. **Cards Double-Bezel:** padding externo 4-6px com background levemente diferente + radius maior, dentro um card de bg principal com radius menor. Cria profundidade visual sem usar sombras pesadas que falham em modo claro.
2. **CTA "soft glow":** `box-shadow: 0 1px 0 inset rgba(255,255,255,0.2), 0 4px 24px var(--brand-glow)` — luz suave, não néon.
3. **Motion:** apenas `opacity` e `transform` (GPU). Stagger de 80ms entre filhos. Reduzir/desabilitar com `@media (prefers-reduced-motion: reduce)`.
4. **Editorial typography:** apenas no marketing (`/`). Em `/analise` (uso clínico) tipografia mais sóbria, sem clamps muito grandes.
5. **Imagens dos agentes:** SVGs atuais (estilo flat clínico) — manter. Não introduzir fotos AI generated (alucinação de credibilidade).
6. **Dark mode editorial** opcional via toggle (usuários adultos pais que preferem). Healthcare default = light.

## 4.6 Responsivo

Mobile-first com 4 breakpoints (Tailwind defaults):
- `<sm` (≤640): formulário em 1 coluna, sidebar do debate vira drawer (`Sheet`), KPI panel embaixo
- `sm-md` (641-1024): 2 colunas no debate (sidebar compacta + debate), KPI flutua acima
- `lg+` (1025+): 3 colunas (sidebar | debate | KPI), layout atual
- `xl+` (1280+): max-width 1400 com mais respiro

**Touch:** todos os controls ≥ 48px no mobile, gestures simples (sem swipe-to-delete sem feedback óbvio).
**iOS Safe Area:** já implementado via `env(safe-area-inset-*)`. Manter e estender para o drawer.
**Orientação landscape no tablet:** verificar sticky positions.

## 4.7 Acessibilidade WCAG 2.2 AA (alvo: AAA onde possível)

| Critério | Status atual | Plano |
|---|---|---|
| Contraste texto AAA (≥7:1 para <18pt) | falha em vários `text-muted` | Subir mínimo para 4.6:1; AAA nos parágrafos do laudo |
| Foco visível | falha (default browser) | `--ring` 2px solid teal + offset 2px |
| Tab order lógica | ok na maior parte | revisar modais (focus trap via Radix Dialog) |
| Aria labels nos botões só com ícone | falha (lang toggle EN/PT é só texto, ok; mas ícone "→" sem label) | adicionar `aria-label` |
| Hierarquia de heading | h1 → h2 → h3 mas pula h4 em alguns lugares | revisar |
| Form errors associados | parcial | usar `aria-describedby` via shadcn `<FormMessage />` |
| Reduced motion | não respeita hoje | `@media (prefers-reduced-motion)` em todas animações |
| Screen reader do debate streaming | quebrado (cada chunk re-anuncia) | `aria-live="polite"` apenas no container final, não a cada delta |
| Skip-to-content | ausente | adicionar |
| TTS button (nosso) | n/a | será criado |
| Lang attribute correto | ok (`lang="pt-BR"`) | manter, alternar via JS no toggle |

</visual_design_strategy>

---

# PHASE 5 — PWA IMPLEMENTATION PLAN

<pwa_implementation>

## 5.1 Service Worker

**Biblioteca:** **Serwist** (`@serwist/next`). Por quê:
- next-pwa não suporta App Router 100% (último update há > 1 ano).
- Serwist é o sucessor mantido, focado em App Router, com tipos TS.

**Estratégias por rota:**

```ts
// app/sw.ts
import { defaultCache } from "@serwist/next/worker";
import { installSerwist } from "@serwist/sw";

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // App shell — precache (HTML do /, /analise, /sobre)
    { matcher: ({request}) => request.mode === "navigate",
      handler: "NetworkFirst", options: { cacheName: "shell", networkTimeoutSeconds: 3 } },

    // CSS/JS chunks do Next — cache-first (hash no nome garante invalidação)
    { matcher: /\/_next\/static\//,
      handler: "CacheFirst", options: { cacheName: "static",
        expiration: { maxEntries: 200, maxAgeSeconds: 60*60*24*30 } } },

    // Fontes — cache-first com expiração longa
    { matcher: /\.(woff2|woff|ttf)$/,
      handler: "CacheFirst", options: { cacheName: "fonts",
        expiration: { maxEntries: 30, maxAgeSeconds: 60*60*24*365 } } },

    // Avatars + ícones — cache-first
    { matcher: /\/(avatars|icons)\//,
      handler: "CacheFirst", options: { cacheName: "assets",
        expiration: { maxEntries: 50, maxAgeSeconds: 60*60*24*180 } } },

    // API JSON (read) — SWR com timeout
    { matcher: ({url}) => url.pathname.startsWith("/api/") && url.pathname !== "/api/analise" && url.pathname !== "/api/relatorio",
      handler: "StaleWhileRevalidate", options: { cacheName: "api",
        expiration: { maxAgeSeconds: 60*60*24 } } },

    // Análise (POST stream) — NEVER cache, sempre network
    { matcher: ({url}) => url.pathname === "/api/analise",
      handler: "NetworkOnly" },

    // PDF baixado — cache-first, 90 dias
    { matcher: /\.pdf$/,
      handler: "CacheFirst", options: { cacheName: "pdfs",
        expiration: { maxEntries: 50, maxAgeSeconds: 60*60*24*90 } } },
  ],
  fallbacks: { entries: [{ url: "/offline", matcher: ({ request }) => request.destination === "document" }] },
});
```

## 5.2 Funcionalidade offline

**O que funciona offline:**
1. Landing (`/`) e páginas estáticas — pré-cache.
2. Última análise visualizada — salva no IndexedDB via **Dexie.js**.
3. PDFs baixados — cache 90 dias.
4. Página `/conta/historico` — lê do IndexedDB se sem rede.
5. Página `/offline` dedicada com mensagem amigável + botão "tentar reconectar".

**O que não funciona offline (e a UI avisa):**
1. Iniciar nova análise — depende do Claude.
2. Pagamento.
3. Login (magic link precisa de e-mail).

**Indicador online/offline:** componente `<NetworkBadge />` no header — verde online, âmbar offline. Usa `navigator.onLine` + ping periódico (HEAD `/api/health` a cada 30s quando aba ativa).

**Sync em background:** quando voltar online, re-enviar análises rascunho (status='draft') via Background Sync API (Android). iOS não suporta — fallback é re-tentar no próximo open.

## 5.3 Caching strategy resumida

| Tipo | Estratégia | TTL | Storage |
|---|---|---|---|
| App shell | NetworkFirst (3s timeout) | sempre | Cache Storage |
| Static JS/CSS | CacheFirst | 30 dias | Cache Storage |
| Fontes | CacheFirst | 1 ano | Cache Storage |
| Avatars | CacheFirst | 180 dias | Cache Storage |
| API JSON | SWR | 24h | Cache Storage |
| Análises do usuário | Manual | 30 dias | IndexedDB (Dexie) |
| PDFs | CacheFirst | 90 dias | Cache Storage |
| `/api/analise` (POST stream) | NetworkOnly | — | — |

## 5.4 Push notifications

**Caso de uso real:**
1. "Sua análise terminou" — quando rodar análise em background e voltar para outra aba.
2. "Lembrete: marque a avaliação presencial com o especialista X" — opt-in.
3. Não usar para marketing — viola o público sensível.

**Stack:**
- Web Push API + VAPID keys (geradas via `npx web-push generate-vapid-keys` e guardadas no SSM).
- Tabela `push_subscriptions` (já no schema da Phase 3).
- Server: `web-push` npm para enviar.
- Permissão **só pedida após** a primeira análise completa (não no first visit — viola best-practice).

**iOS 16.4+:** suporta Web Push só se o usuário **instalou** o PWA na tela inicial. Comunicar isso no flow.

## 5.5 App manifest

```json
// public/manifest.webmanifest
{
  "name": "MAnalista — Análise pediátrica multiprofissional",
  "short_name": "MAnalista",
  "description": "Análise multiprofissional de desenvolvimento infantil com IA",
  "id": "/?source=pwa",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui"],
  "orientation": "any",
  "background_color": "#F7F9FB",
  "theme_color": "#0F8B8D",
  "lang": "pt-BR",
  "dir": "ltr",
  "categories": ["health", "medical", "education"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/landing-mobile.png", "sizes": "1170x2532", "type": "image/png", "form_factor": "narrow", "label": "Tela inicial" },
    { "src": "/screenshots/debate-mobile.png", "sizes": "1170x2532", "type": "image/png", "form_factor": "narrow", "label": "Debate em tempo real" },
    { "src": "/screenshots/landing-desktop.png", "sizes": "1920x1080", "type": "image/png", "form_factor": "wide", "label": "Desktop" }
  ],
  "shortcuts": [
    { "name": "Nova análise", "url": "/analise", "icons": [{ "src": "/icons/new-analysis.png", "sizes": "96x96" }] },
    { "name": "Meu histórico", "url": "/conta/historico", "icons": [{ "src": "/icons/history.png", "sizes": "96x96" }] }
  ],
  "share_target": {
    "action": "/analise?via=share",
    "method": "GET",
    "params": { "title": "title", "text": "text" }
  }
}
```

**Ícones:** gerar a partir do logo "M" atual em 192, 512, e versões maskable (com safe-zone interno de 80%).

## 5.6 Install prompt e UX

- **NÃO** mostrar o prompt no first visit. Mostrar:
  1. Após a primeira análise completa, em um toast não-intrusivo: "Instale o MAnalista para acessar seus laudos offline."
  2. Após o usuário visitar 2+ vezes em 7 dias.
- **iOS:** sem `beforeinstallprompt` — instruir explicitamente "Toque em Compartilhar → Adicionar à Tela de Início" com mini-tutorial visual (já existe pattern conhecido).
- **Android:** capturar `beforeinstallprompt`, mostrar nosso prompt customizado.
- **Desktop Chrome/Edge:** mostrar ícone de install na barra de endereço (automático), e nosso prompt customizado no menu da conta.

## 5.7 Voz (TTS) — leitura em voz alta

**Implementação principal: Web Speech API (`SpeechSynthesisUtterance`).**

```ts
// lib/tts.ts
type TtsOptions = { voice?: SpeechSynthesisVoice; rate?: number; pitch?: number; lang?: string };

export function speak(text: string, opts: TtsOptions = {}) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel(); // sempre cancela falas anteriores

  // Quebrar em ~200 caracteres por utterance (iOS Safari engasga com textos > 32k)
  const chunks = splitForTts(text, 200);
  const voices = window.speechSynthesis.getVoices();

  const chosen = opts.voice
    ?? voices.find(v => v.lang.startsWith(opts.lang ?? "pt-BR") && v.localService)
    ?? voices.find(v => v.lang.startsWith("pt"));

  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk);
    u.voice = chosen ?? null;
    u.rate = opts.rate ?? 1.0;
    u.pitch = opts.pitch ?? 1.0;
    u.lang = opts.lang ?? "pt-BR";
    window.speechSynthesis.speak(u);
  });
}

export function stop() { window.speechSynthesis.cancel(); }
export function pause() { window.speechSynthesis.pause(); }
export function resume() { window.speechSynthesis.resume(); }
```

**Componente `<TtsPlayer text={…} />`:**
- Botão play/pause/stop com ícone falante e label "Ouvir leitura"
- Selector de voz (lista de `getVoices()` filtrada por lang)
- Selector de velocidade (0.75x / 1x / 1.25x / 1.5x)
- Highlight do texto sendo lido (via `onboundary` event)
- Persiste preferência em `users.tts_voice` no DB

**Onde colocar:**
1. Em cada mensagem do debate (mini botão "ouvir")
2. No relatório final (botão grande "Ouvir laudo completo")
3. Na landing, no parágrafo principal do hero (acessibilidade)

**Fallback premium (ElevenLabs):**
- Apenas para usuários **Pro** ou **Clínica**.
- Servidor chama ElevenLabs com texto, stream-back o MP3, browser toca via `<audio>`.
- Cache do MP3 por hash do texto + voice id (Redis 7 dias).
- Rate limit: 50 minutos de áudio/usuário/mês no Pro.

**Speech-to-Text (STT):** **não na v1**. João desmarcou nas prioridades. Adicionar no roadmap futuro como "comando por voz".

## 5.8 iOS específico

- iOS 16.4+: PWA real (`display: standalone`, splash screen, badge, push se instalado).
- iOS < 16.4: PWA roda mas sem push e com restrições. Detectar e degradar gracefully.
- **Add to Home Screen:** mini tutorial visual on-demand.
- **Splash screens:** Apple não usa o manifest icon — precisa de `<link rel="apple-touch-startup-image">` para cada tamanho de device. Gerar via `pwa-asset-generator`.
- **Apple touch icon:** `<link rel="apple-touch-icon" href="/icons/apple-180.png">` 180×180.
- **Status bar:** `<meta name="apple-mobile-web-app-status-bar-style" content="default">` (preto sobre branco em light mode).
- **Voz:** vozes pt-BR do iOS (Luciana, Felipe) são excelentes. Detectar e listar primeiro.
- **`viewport-fit=cover`** já configurado. Manter o safe-area-inset padding.
- **Audio playback em background:** iOS suspende o SpeechSynthesis quando sai do app — esperado, comunicar ao usuário.

## 5.9 Android específico

- Chrome 76+: prompt nativo via `beforeinstallprompt`. Capturar.
- Trusted Web Activity (TWA): só fazemos se for publicar na Play Store. **Adiar.**
- Splash screen é gerada automaticamente do manifest.
- Voz: Google TTS é excelente em pt-BR.
- `display: standalone` funciona sem dor.
- **Background Sync** para re-enviar análises offline → online.

</pwa_implementation>

---

# PHASE 6 — SERVER CONFIGURATION

<scratchpad>
Coolify existe e tem o app manalista funcionando. Status do app: running:unknown, health_check disabled, restart_count 0. Build pack dockerfile, porta 3000. URL aponta para manalista.com.br e www.

NÃO recriar. Modificar:
1. Adicionar healthcheck em /api/health.
2. Trocar Dockerfile (remover Python).
3. Adicionar services: postgres-manalista e redis-manalista no mesmo project.
4. Configurar env vars via Coolify UI (Stripe keys, Resend, DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET, VAPID keys).
5. SSL: já existe via Let's Encrypt do Coolify; quando colocar Cloudflare em modo Full (strict), reusa o cert do Coolify.
</scratchpad>

<server_configuration>

## 6.1 Decisão sobre Coolify

**MANTER E ESTENDER o app `manalista` existente** (UUID `x4g4sgw48s4s84wg8kkggs8g`). Adicionar services adjacentes.

## 6.2 Arquitetura no Coolify

**Project:** `manalista`
**Services:**
1. **app** — Next.js standalone (existente, refatorar Dockerfile)
2. **postgres** — Postgres 16 (novo)
3. **redis** — Redis 7 (novo)
4. **pdf-worker** — opcional, Node worker para BullMQ se filas crescerem (fase 2)

**Network:** todos no mesmo Docker network do Coolify; app conversa com postgres/redis por DNS interno (`postgres-manalista`, `redis-manalista`).

## 6.3 Dockerfile refatorado

```dockerfile
# ── deps stage ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev

# ── builder stage ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN npm run check && npm run build

# ── runner stage ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# usuário non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# migrations
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.js ./scripts/migrate.js

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --spider -q http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "node scripts/migrate.js && node server.js"]
```

**Resultado esperado:** container final < 120MB (vs ~250MB hoje com Python).

## 6.4 SSL/TLS

- **Coolify** já provisiona Let's Encrypt automaticamente para `manalista.com.br` e `www.`.
- **Cloudflare** entra em modo **Full (Strict)** — valida o cert da origem. Manter o cert do Coolify ou trocar para Cloudflare Origin Certificate (validade 15 anos, recomendado).
- **HSTS:** ativar no Cloudflare e via header `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **Submeter ao HSTS preload list** (`https://hstspreload.org/`) depois de 6 meses de estabilidade.

## 6.5 Configuração de ambiente

Variáveis (todas no Coolify env, secrets em **AWS SSM** quando sensíveis):

```ini
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://manalista.com.br
NEXT_PUBLIC_BUILD_ID=${COMMIT_SHA}

# Auth
NEXTAUTH_URL=https://manalista.com.br
NEXTAUTH_SECRET=                # gerar com openssl rand -base64 32; SSM
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# DB & Cache
DATABASE_URL=postgres://manalista:****@postgres-manalista:5432/manalista?sslmode=disable
DATABASE_POOL_URL=postgres://...@pgbouncer-manalista:6432/manalista
REDIS_URL=redis://redis-manalista:6379

# AWS SSM (para a chave do Claude — já existe)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=               # IAM com policy ssm:GetParameter no /IA_Equipe_P/*
AWS_SECRET_ACCESS_KEY=
SSM_CLAUDE_KEY_NAME=/IA_Equipe_P/claude-api-key

# Stripe
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=               # SSM
STRIPE_WEBHOOK_SECRET=           # SSM

# Resend
RESEND_API_KEY=                  # SSM
RESEND_FROM_EMAIL=no-reply@manalista.com.br

# Web Push
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=               # SSM
VAPID_SUBJECT=mailto:contato@manalista.com.br

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=               # SSM (só em CI para upload de sourcemaps)

# Feature flags
FEATURE_TTS_ELEVENLABS=false     # liga quando o crédito estiver no SSM
FEATURE_HISTORY=true
FEATURE_PAYMENTS=false           # liga quando Stripe estiver pronto
```

## 6.6 CI/CD pipeline

**GitHub Actions** em `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  pull_request:
  push: { branches: [main] }

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run check          # tsc --noEmit
      - run: npm run test -- --run
      - run: npm run build          # garante que builda

  e2e:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:16, env: { POSTGRES_PASSWORD: test }, ports: ["5432:5432"] }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npx playwright install --with-deps
      - run: npm run test:e2e

  deploy:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [validate]
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify webhook
        run: curl -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}" -H "Authorization: Bearer ${{ secrets.COOLIFY_TOKEN }}"
      - name: Wait for deploy
        run: ./scripts/wait-for-deploy.sh
      - name: Smoke test
        run: curl -fsS https://manalista.com.br/api/health | jq -e '.status == "ok"'
```

## 6.7 Monitoring e logging

| Aspecto | Solução |
|---|---|
| Errors (frontend + backend) | **Sentry** (free 5K events/mês), `beforeSend` filtra PII (nome da criança, e-mail) |
| Performance Web Vitals | Vercel Analytics ou Cloudflare Web Analytics (free) |
| Logs do container | `coolify logs` + opcional `Loki + Grafana` no mesmo srv1 (fase futura) |
| Uptime externo | **UptimeRobot** ou **Better Stack** (free 10 monitors) — checar `/api/health` a cada 5 min de 3 regiões |
| Alertas | Sentry → Slack/email; UptimeRobot → email + SMS |
| LLM cost tracking | Tabela `analyses.llm_cost_cents` + dashboard interno simples; alert se gastar > $50/dia |
| DB health | `pg_stat_statements` semanal; alert se conexões > 80% do pool |

## 6.8 Backups

| Item | Frequência | Retenção | Destino |
|---|---|---|---|
| Postgres dump | Diário 03:00 UTC | 14 dias local + 90 dias R2 | local + Cloudflare R2 cifrado |
| Volumes Coolify | Diário | 7 dias | Hostinger snapshot |
| Git remote | Contínuo | Infinito | GitHub |
| AWS SSM params | Mensal | 12 meses | Export para R2 cifrado |
| Sourcemaps | Por release | 6 meses | Sentry artifacts |

**Restore test:** trimestral em ambiente staging — sem isso, backup é teatro.

## 6.9 Hardening de segurança

1. **Container non-root** (já no Dockerfile acima).
2. **Read-only filesystem** com volume gravável só em `/tmp` (Docker `--read-only --tmpfs /tmp`). Coolify suporta via "Advanced".
3. **Limites de recursos:** `mem_limit: 1g`, `cpus: 1.0` por container; previne uma análise descontrolada do Claude consumir tudo.
4. **Headers de segurança** via `next.config.ts`:
   ```ts
   { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
   { key: "X-Content-Type-Options", value: "nosniff" },
   { key: "X-Frame-Options", value: "DENY" },
   { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
   { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()" },
   // microphone=(self) para STT futuro
   ```
5. **CSP com nonce** (Phase 4 remove o `unsafe-inline` ao matar o CSS-in-JS):
   ```
   default-src 'self';
   script-src 'self' 'nonce-{NONCE}' 'strict-dynamic';
   style-src 'self' 'nonce-{NONCE}' https://fonts.googleapis.com;
   font-src 'self' https://fonts.gstatic.com;
   img-src 'self' data: blob:;
   connect-src 'self' https://api.anthropic.com https://*.sentry.io;
   frame-ancestors 'none';
   form-action 'self';
   base-uri 'self';
   ```
6. **Rate-limit nas APIs:** Upstash ou Coolify Redis + `rate-limiter-flexible`. Limites:
   - `/api/analise`: 10 req/min/IP anônimo, 60 req/h/user autenticado, 5 análises/dia para basic, 50/dia pro, ilimitado clínica.
   - `/api/relatorio`: 30/h/user.
   - Auth: 5 magic links/15min/email.
7. **Secrets nunca em env literal** — sempre via SSM ou Coolify secret (criptografado at-rest).
8. **Dependabot + Renovate** ativados para alertas de vulnerabilidade.
9. **`npm audit --omit=dev` no CI**; bloquear deploy se HIGH+.
10. **Fail2ban** no srv1 (SSH) — já deve estar configurado, validar.

</server_configuration>

---

# PHASE 7 — CROSS-PLATFORM TESTING PLAN

<testing_plan>

## 7.1 Matriz de devices

| Device | OS | Browser | Prioridade |
|---|---|---|---|
| iPhone 12+ | iOS 16.4+ | Safari | P0 (PWA + push) |
| iPhone X-11 | iOS 15-16.3 | Safari | P1 (PWA sem push) |
| iPad Air 4+ | iPadOS 16+ | Safari | P1 |
| Galaxy A50+ | Android 10+ | Chrome | P0 |
| Pixel 6+ | Android 13+ | Chrome | P0 |
| Xiaomi Redmi Note | Android 11+ | Chrome | P1 |
| Mac | macOS 13+ | Safari 16+, Chrome, Firefox | P1 |
| Windows 11 | — | Edge, Chrome, Firefox | P1 |
| Linux | Ubuntu 22+ | Chrome, Firefox | P2 |

Devices físicos via **BrowserStack** (plano padrão $39/mês) — ROI alto para um app que vende para pais via mobile.

## 7.2 iOS — checklist Safari + PWA

- [ ] Landing carrega sem layout shift (CLS < 0.1)
- [ ] Form respeita safe-area-inset-top/bottom (já implementado)
- [ ] Streaming SSE funciona em conexão lenta (testar via Network Link Conditioner → 3G)
- [ ] Botão "Adicionar à Tela de Início" funciona via Share Sheet
- [ ] Após instalar, ícone aparece com cor de fundo correta (theme_color)
- [ ] Splash screen aparece no abrir (Apple-specific, gerada com `pwa-asset-generator`)
- [ ] Status bar em modo `default` (texto preto em fundo claro)
- [ ] Pull-to-refresh **desabilitado** dentro do PWA standalone
- [ ] Push notification funciona (iOS 16.4+, apenas após instalar)
- [ ] Offline: abrir o app sem rede → mostra última análise + landing cacheada
- [ ] TTS: lista vozes pt-BR (Luciana, Felipe), respeita rate e pause
- [ ] TTS continua após bloquear a tela (pode parar — esperado, comunicar)
- [ ] Form com `inputmode="numeric"` aciona teclado numérico
- [ ] Date picker nativo iOS no campo birthdate
- [ ] Tap delay 300ms eliminado (`touch-action: manipulation` ou viewport meta)
- [ ] Gestos do iOS (swipe back) funcionam em navegação
- [ ] Screen reader (VoiceOver) lê o debate corretamente sem repetições

## 7.3 Android — checklist Chrome + PWA

- [ ] Landing carrega em <2.5s no 4G (LCP)
- [ ] `beforeinstallprompt` capturado; mini banner próprio aparece após gatilho
- [ ] Após instalar, app abre fullscreen
- [ ] Push notification chega com ícone correto, vibração default
- [ ] Background sync re-envia análise pendente
- [ ] Offline page abre quando sem rede
- [ ] TTS: lista vozes Google pt-BR
- [ ] Compartilhar laudo via Share Target funciona
- [ ] Shortcuts do manifest aparecem no long-press do ícone
- [ ] Teclado virtual não cobre input em foco
- [ ] Voltar do sistema fecha modais corretamente
- [ ] TalkBack lê o debate corretamente

## 7.4 Desktop

- [ ] Chrome/Edge: ícone de install na barra de endereço aparece
- [ ] Firefox: PWA install via "Add to Apps" (extensão ou nativo Firefox)
- [ ] Safari macOS 17+: install via menu Compartilhar → Adicionar ao Dock
- [ ] Resoluções: 1280×720, 1440×900, 1920×1080, 2560×1440 — tudo certo
- [ ] Print do laudo (sem PDF): `@media print` esconde header/sidebar
- [ ] Atalhos de teclado: Tab/Shift+Tab/Enter/Esc funcionam em todos os modais
- [ ] Dark mode segue `prefers-color-scheme` quando usuário não optou manualmente

## 7.5 Testes de voz (TTS)

Roteiro manual de QA:
1. Em cada device, abrir `/analise`, completar uma análise rápida.
2. Tocar "Ouvir laudo completo" — texto começa a ser lido em <500ms.
3. Verificar voz selecionada é pt-BR (primeira da lista).
4. Mudar para EN, repetir — voz en-US.
5. Selecionar voz alternativa no dropdown — preferência persiste após reload (DB).
6. Pause/Resume/Stop funcionam corretamente.
7. Velocidade 0.75x e 1.5x se aplicam.
8. Highlight do trecho lido segue o áudio (delta ≤ 200ms).
9. Texto > 3000 chars é dividido em chunks (sem engasgo no iOS).
10. Sair da aba/app → áudio para (não fica zumbi).

**Acessibilidade dos botões TTS:**
- `aria-label="Ouvir leitura em voz alta"`
- `aria-pressed` durante reprodução
- Foco visível no botão ativo

## 7.6 "Reading features" — leitura facilitada

(Interpretação: o app deve favorecer leitura — não só TTS, mas legibilidade.)
- [ ] Toggle "Leitura confortável" no menu da conta: aumenta corpo para 19px, line-height 1.8
- [ ] Toggle "Alto contraste": força tema com contraste AAA em tudo (não só corpo)
- [ ] Toggle "Reduzir animações" (também respeita `prefers-reduced-motion`)
- [ ] Modo dyslexia-friendly opcional: fonte com `font-display: OpenDyslexic` (self-hosted)
- [ ] Espaçamento de palavras configurável (CSS `word-spacing`)

## 7.7 Performance benchmarks (Lighthouse e Web Vitals)

| Métrica | Alvo mobile | Alvo desktop |
|---|---|---|
| Performance score | ≥ 90 | ≥ 95 |
| LCP (Largest Contentful Paint) | < 2.5s | < 1.5s |
| INP (Interaction to Next Paint) | < 200ms | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 | < 0.05 |
| TTFB (Time to First Byte) | < 600ms | < 300ms |
| Accessibility score | 100 | 100 |
| Best Practices | ≥ 95 | ≥ 95 |
| SEO | 100 | 100 |
| Bundle size (initial JS) | < 200 KB gz | < 250 KB gz |

**Como medir continuamente:** Lighthouse CI no PR (`@lhci/cli`) + Cloudflare RUM em prod.

## 7.8 Acessibilidade

**Automatizado:**
- `axe-core` via Playwright em cada test e2e (sem violações sérias).
- `pa11y-ci` no CI contra todas as páginas públicas.

**Manual:**
- VoiceOver (iOS, macOS), TalkBack (Android), NVDA (Windows) em fluxos principais.
- Navegação 100% por teclado.
- Reduzir animações no SO e verificar comportamento.
- Daltonismo: verificar em modo deuteranopia/protanopia (Chrome DevTools "Rendering").
- Zoom 200% sem perda de funcionalidade.
- Texto sem perda em rotação landscape.

## 7.9 Testes automatizados

```
Unit (Vitest + Testing Library)
  · lib/agents/profiles → getAgentById, MEDIATOR
  · lib/aws-ssm → cache TTL, fallback env
  · hooks/useInfoScore → algoritmo de score
  · utils/tts → splitForTts

Integration (Vitest + msw)
  · /api/analise → valida payload, mocka Anthropic, asserta SSE format
  · /api/relatorio → mocka @react-pdf, asserta PDF bytes
  · /api/health → 200 + jsonb

E2E (Playwright)
  · happy path: landing → form → consent → análise → PDF
  · q&a mid-flow: pula → conclui mesmo assim
  · offline: vai offline, recarrega → vê landing + última análise
  · install PWA: detecta beforeinstallprompt, simula install
  · auth: magic link → login → histórico

Visual regression (Playwright + percy ou chromatic)
  · landing hero, agent cards, debate room, laudo final
```

</testing_plan>

---

# PHASE 8 — DNS E CLOUDFLARE

<scratchpad>
O Hostinger MCP retornou Unauthenticated, então não consegui ler o DNS atual programaticamente.
O Coolify confirma que o app responde em manalista.com.br e www.manalista.com.br — então hoje existem registros A apontando para 62.72.63.18 (sem proxy, ou com proxy mas resolvendo o IP).

Recomendação: usar Cloudflare como nameserver primário (move out do Hostinger).
Razões: rate-limit grátis, WAF managed rules, cache, SSL Full Strict, analytics, Workers se precisar.
</scratchpad>

<dns_configuration>

## 8.1 DNS atual (inferido)

Não consegui validar via API Hostinger (token sem permissão). O Coolify confirma que **ambos** `manalista.com.br` e `www.manalista.com.br` resolvem para o app no srv1 (`62.72.63.18`). Portanto hoje existe pelo menos:

```
manalista.com.br      A    62.72.63.18   (provavelmente sem proxy)
www.manalista.com.br  A    62.72.63.18   (ou CNAME → manalista.com.br)
```

**Validação rápida** (rodar no terminal do João):
```bash
dig +short manalista.com.br
dig +short www.manalista.com.br
whois manalista.com.br | grep -i 'name server'
```

## 8.2 Configuração recomendada

**Mover nameservers para Cloudflare** (migração grátis, ~24h propagação):

Registros DNS na Cloudflare:

| Type | Name | Content | Proxy | TTL |
|---|---|---|---|---|
| A | `@` | `62.72.63.18` | 🟠 Proxied | Auto |
| A | `www` | `62.72.63.18` | 🟠 Proxied | Auto |
| CNAME | `app` (futuro, se separar marketing de app) | `manalista.com.br` | 🟠 Proxied | Auto |
| MX | `@` | (mantém do Hostinger ou move para Resend) | — | Auto |
| TXT | `@` | `v=spf1 include:_spf.resend.com -all` (após migrar email para Resend) | — | Auto |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@manalista.com.br` | — | Auto |
| TXT | `resend._domainkey` | (chave DKIM do Resend) | — | Auto |
| CAA | `@` | `0 issue "letsencrypt.org"` | — | Auto |
| CAA | `@` | `0 issue "cloudflare.com"` | — | Auto |

## 8.3 Cloudflare — settings recomendados

| Área | Configuração |
|---|---|
| **SSL/TLS** | Full (strict) — exige cert válido na origem (Coolify Let's Encrypt OK) |
| **Edge Certificates** | Always Use HTTPS = ON; Min TLS = 1.2; TLS 1.3 = ON; HSTS habilitado (max-age 63072000, includeSubDomains, preload depois) |
| **Origin Certificate** | Gerar Origin Cert no Cloudflare (15 anos, ECC) e configurar no Coolify — mais robusto que LE para origem |
| **Cache** | "Standard"; cache static `/_next/static/*` por 30d; bypass para `/api/*` e `/_next/data/*` (App Router) |
| **Page Rules / Cache Rules** | `manalista.com.br/api/*` → Cache Level: Bypass; `/_next/static/*` → Edge TTL 30d, Browser TTL 30d |
| **WAF (Free)** | Managed Rules: ON; OWASP CRS: ON; Bot Fight Mode: ON |
| **Rate Limiting (Free 10K req/mês)** | Regra: 10 req/10s por IP em `/api/analise`; 30/10s em qualquer `/api/*` |
| **DDoS Protection** | Automático no Free; Under Attack Mode disponível se incidente |
| **Web Analytics** | ON (não exige JS no cliente — privacy-friendly, LGPD-safe) |
| **Workers** | reservado para futuro (A/B, geo-routing) |
| **Argo Smart Routing** | OFF (custa $5/mês — habilitar se latência fora do BR for crítica) |
| **Brotli** | ON (Cloudflare comprime automaticamente) |
| **Speed > Auto Minify** | OFF (Next.js já minifica; deixar Cloudflare em paz com o bundle) |
| **Security > Email Obfuscation** | ON |
| **Security > Browser Integrity Check** | ON |
| **Network > IPv6** | ON |
| **Network > HTTP/3 (QUIC)** | ON |
| **Network > 0-RTT** | ON |
| **Scrape Shield > Hotlink Protection** | OFF (queremos avatars compartilháveis se aplicável) |
| **Scrape Shield > Email Address Obfuscation** | ON |

## 8.4 CDN/Cache

**Estratégia:**
- Cloudflare Edge cache para `/_next/static/*` (chunks com hash no nome → seguro cachear 30d).
- Bypass total em `/api/*`.
- `Cache-Control` setado pelo Next.js já é honrado.
- Imagens em `public/avatars/*` → cache 30 dias edge + 7 dias browser.
- Manifest + ícones PWA → cache 7 dias.

## 8.5 Implementação via MCP

Como o Hostinger MCP retornou `Unauthenticated`, plano em duas etapas:

**Etapa 1 — Cloudflare (via MCP `c17e1cee...__*` quando autenticado):**
1. Listar accounts Cloudflare: `mcp__c17e1cee...__accounts_list`
2. (Setup manual no painel) adicionar zone `manalista.com.br` e obter os 2 nameservers Cloudflare
3. Criar zone DNS — Cloudflare detecta os registros existentes do Hostinger e importa
4. Validar registros importados

**Etapa 2 — Hostinger (re-autenticar plugin):**
1. Renovar token Hostinger no Cowork (`/connect` ou Cowork settings)
2. `mcp__plugin_hostinger-api_hostinger-mcp__domains_updateDomainNameserversV1` para apontar `manalista.com.br` para os 2 NS Cloudflare
3. Aguardar propagação (5min-24h, normalmente <1h)
4. Cloudflare detecta nameservers ativos → ativa o site
5. Confirmar `dig NS manalista.com.br` retorna Cloudflare

**Validação pós-migração:**
- `curl -I https://manalista.com.br` retorna headers `cf-ray` e `cf-cache-status`
- SSL Labs (`ssllabs.com/ssltest`) score A+
- `whatsmydns.net` mostra propagação global

</dns_configuration>

---

# IMPLEMENTATION ROADMAP

<implementation_roadmap>

## Lista priorizada (em ordem de execução)

### 🔴 BLOCO 0 — Hardening imediato (1 semana)
*Pode ser feito sem mexer em nada do produto — pura disciplina.*

1. **Habilitar healthcheck** no Coolify → `/api/health` (5 min)
2. **CI no GitHub Actions** (`tsc --noEmit`, lint, build) — bloqueia merge se quebrar (2h)
3. **Adicionar zod no backend** em `/api/analise` e `/api/relatorio` (2h)
4. **Rate-limit em `/api/analise`** com Redis local (single container Coolify, 4h)
5. **Headers de segurança** no `next.config.ts` (HSTS, nosniff, frame-ancestors) (1h)
6. **Migrar DNS para Cloudflare** + Full strict SSL (1 dia + propagação)
7. **WAF Cloudflare** + rate-limit edge (2h)
8. **Sentry** integrado, beforeSend scrubando PII (3h)
9. **Limpar repo:** ✅ parcialmente feito em 2026-10-17 — `tsconfig.tsbuildinfo` saiu do índice e foi para `lixo/2026-10-17/`, `.gitignore` atualizado; `server.js` e `prompts.ts.bak` já não existem na árvore (30 min)
10. **Health check uptime externo** (UptimeRobot) (15 min)

**Resultado:** plataforma protegida contra DoS trivial, custo Claude limitado, observabilidade básica.

### 🟠 BLOCO 1 — Performance e refactor visual (2-3 semanas)

11. **Tailwind v4 + tokens OKLCH** — substituir CSS-in-JS inline progressivamente (1 semana)
12. **shadcn/ui setup** + substituir botões/modais/forms primários (1 semana)
13. **Extrair landing** em componentes (Hero, Pricing, FAQ, etc) — `src/app/page.tsx` < 200 LOC (3 dias)
14. **Paralelizar `analyze`** dos 7 especialistas com `Promise.all` (4h — impacto enorme em UX)
15. **`useDeferredValue` no streaming** + agrupar chunks por 50ms (2h)
16. **Lighthouse CI** no PR (4h)
17. **Trocar PDF Python → @react-pdf/renderer** (1 semana — porting do `generate_pdf.py`)

**Resultado:** análise 2-3× mais rápida, container 30MB menor, código manutenível.

### 🟡 BLOCO 2 — PWA core (2 semanas)

18. **App manifest** + ícones (maskable, splash iOS via `pwa-asset-generator`) (1 dia)
19. **Serwist** configurado, estratégias por rota (2 dias)
20. **Página `/offline`** com mensagem amigável (4h)
21. **IndexedDB (Dexie)** para análises offline (2 dias)
22. **`<NetworkBadge />`** online/offline (4h)
23. **Install prompt** próprio (Android `beforeinstallprompt` + iOS tutorial) (1 dia)
24. **Testes em devices reais** (BrowserStack) (3 dias)

**Resultado:** instalável, funciona offline para leitura de laudos, primeira análise rápida em standalone.

### 🟢 BLOCO 3 — Voz e acessibilidade (1-2 semanas)

25. **`<TtsPlayer />` com Web Speech API** (2 dias)
26. **Selector de voz + persistência** (3 dias incluindo schema users.tts_voice)
27. **Highlight do texto lido** via `onboundary` (1 dia)
28. **Toggles "Leitura confortável"** / "Alto contraste" / "Reduzir animações" (2 dias)
29. **`@media (prefers-reduced-motion)`** em todas as animações (1 dia)
30. **Audit a11y completo** com axe + manual VoiceOver/TalkBack (3 dias)

**Resultado:** acessível, leitura em voz alta funcional em iOS e Android, WCAG 2.2 AA+.

### 🔵 BLOCO 4 — Persistência, auth, pagamento (3-4 semanas)

31. **Postgres + Redis** como services Coolify (1 dia)
32. **Drizzle schema** users/sessions/accounts (Auth.js base) (2 dias)
33. **Auth.js v5** com Magic Link (Resend) + Google (3 dias)
34. **Schema `analyses` + `debate_messages`** + shadow write (3 dias)
35. **Página `/conta/historico`** (lista + detalhe + download PDF) (4 dias)
36. **Stripe checkout** + webhooks + plano Basic/Pro/Clínica (1 semana)
37. **Quota mensal** + bloqueio quando esgota + upgrade modal (2 dias)
38. **Audit log + export LGPD + erase me** (4 dias — exigência legal)
39. **Push notifications** (Web Push API + tabela + opt-in pós-1ª análise) (3 dias)

**Resultado:** SaaS real, com receita, conforme LGPD.

### ⚪ BLOCO 5 — Refinos e extras (contínuo)

40. **ElevenLabs TTS premium** para Pro+ (4 dias)
41. **Background Sync Android** (1 dia)
42. **Search/filter no histórico** (2 dias)
43. **Compartilhamento social (Share Target)** (1 dia)
44. **i18n com `next-intl`** (substitui o pt/en por estado) (1 semana)
45. **STT (Speech-to-Text)** opcional no form (1 semana, fase futura)

## Timeline consolidada

| Bloco | Duração | Marco | Entregável |
|---|---|---|---|
| 0 — Hardening | 1 semana | semana 1 | App seguro, DNS Cloudflare, CI |
| 1 — Performance/Visual | 3 semanas | semana 4 | Tailwind v4, shadcn, paralelização, PDF Node |
| 2 — PWA core | 2 semanas | semana 6 | Instalável, offline, manifest |
| 3 — Voz/A11y | 2 semanas | semana 8 | TTS + a11y AA+ |
| 4 — DB/Auth/Pagamento | 4 semanas | semana 12 | SaaS com receita |
| 5 — Refinos | contínuo | — | iteração |

**Capex inicial estimado:** ~12 semanas (3 meses) para um SaaS production-ready, com 1 dev solo (~30h/sem).
Se João precisar de MVP pago em **6 semanas**: blocos 0+2+4 (omitir refactor visual completo, manter dark theme atual, sem TTS premium).

## Dependências críticas

```
Bloco 0  ─┬─→  Bloco 1  ─→  Bloco 2  ─┬─→  Bloco 3 (voz)
          │                            └─→  Bloco 4 (DB/Auth/$)
          └─→  Bloco 4 (DB/Auth pode começar em paralelo após CI estar ok)
```

Crítico: `Cloudflare DNS` precisa ser feito **antes** de habilitar push notifications (VAPID + HTTPS edge).
Crítico: `Auth` precisa estar pronto antes de `Histórico` ou `Pagamento`.
Crítico: `Postgres` precisa ter backups testados **antes** de armazenar qualquer análise real.

## Riscos e mitigações

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| Custo Claude descontrolado | Alto | Alta sem rate-limit | Rate-limit no Bloco 0 + alerta de gasto diário |
| LGPD violation | Crítico | Baixa se schemar bem | DPO consultor uma vez, audit_log + erase desde dia 1 |
| Bug em produção sem rollback | Médio | Média | Coolify rollback + healthcheck + smoke test no CD |
| Análise lenta espanta usuários | Alto | Alta hoje | Paralelizar `analyze` (semana 4) |
| iOS Safari quebra TTS em update | Médio | Baixa | Detectar feature e degradar; ElevenLabs como backup |
| Cloudflare proxied quebra SSE | Alto | Média | Testar antes de Full Strict; aumentar timeout do worker para 100s |
| Dependência Anthropic indisponível | Alto | Baixa | Status page, retry exponencial, fallback "tente novamente em X min" |
| Domínio expira | Crítico | Baixa | Auto-renew Hostinger + alerta 30d antes |
| Backup nunca testado | Crítico | Alta se ignorar | Restore quarterly mandatório, marcado no calendário |
| Refactor de landing quebra SEO | Médio | Média | Redirects 301 mantidos, sitemap.xml versionado |

## Métricas e KPIs

### Produto
- **Análises completadas/dia** (alvo crescente: 5 → 20 → 100 no primeiro semestre)
- **Time-to-first-result** (alvo: < 90s do form submit ao primeiro byte do mediador)
- **Drop-off do form** (alvo: < 30% do step 1 ao envio)
- **Taxa de instalação PWA** (alvo: 25% dos usuários que completam 1 análise)
- **Q&A respondidas** (alvo: > 70%)
- **NPS** (alvo: > 50) — pesquisa após cada análise

### Técnico
- **p95 LCP mobile** < 2.5s
- **p95 INP** < 200ms
- **Uptime mensal** > 99.5%
- **Error rate** < 0.5% das requisições
- **DB query p95** < 50ms
- **Cobertura de testes** > 70% em `lib/` e `api/`

### Negócio
- **Conversão Free → Pago** (alvo inicial: 3%)
- **MRR** (alvo 6 meses: R$ 5K)
- **Churn mensal** < 8%
- **CAC** < 1× LTV no primeiro ano
- **Custo Claude / análise** < R$ 1,00 (LLM cost tracking via tabela)

## Próximos 3 passos concretos

1. **Hoje:** ativar healthcheck no Coolify (5 min), criar repo Cloudflare e migrar DNS (1h).
2. **Esta semana:** CI no GitHub Actions + rate-limit em `/api/analise` + Sentry + limpar repo.
3. **Próximas 2 semanas:** começar refactor para Tailwind v4 + shadcn em paralelo ao bloco 0.

</implementation_roadmap>

---

## Apêndice — Decisões abertas que precisam de input do João

1. **Stripe Brasil vs Asaas:** Pix nativo é diferencial — Asaas tem melhor; Stripe é mais sólido fora do BR. Decidir conforme público.
2. **ElevenLabs orçamento:** $5/mês ($22 starter) — vale a pena no plano Pro?
3. **DPO/consultor LGPD** — antes de armazenar dados reais de crianças, recomendo consulta jurídica única (~R$ 2-5K) para validar termo de consentimento e política.
4. **Faturamento PJ ou MEI** — Stripe BR exige CNPJ; ajustar antes do bloco 4.
5. **Plano Clínica** (R$ 499/mês com integração de prontuário) — vai existir mesmo? Se sim, qual prontuário (eClinic, iClinic, MyClinicSoft)? Pode ser MyClinicSoft (oportunidade de cross-sell).

---

*Fim do plano. ~7800 palavras. Imprimir como PDF: print → save as PDF (no Chrome).*
