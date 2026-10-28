# MAnalista — Roadmap de Execução por Subagentes
**Orquestrador:** `claude-opus-4-6` · **Subagentes:** `claude-sonnet-4-6`

---

## VISÃO GERAL DO SISTEMA DE AGENTES

```
┌──────────────────────────────────────────────────────────────────────┐
│                    ORQUESTRADOR (opus-4-6)                           │
│                    docs/agentes/ORCHESTRATOR.md                      │
│                                                                      │
│  · Define ordem de execução e dependências                           │
│  · Faz handoff de contexto para cada subagente                       │
│  · Revisa PRs antes de merge                                         │
│  · Resolve bloqueios críticos                                        │
│  · Garante deploy após cada bloco                                    │
└──────────────┬───────────────────────────────────────────────────────┘
               │
       ┌───────┼───────────────────────────────────────┐
       │       │           │           │               │
       ▼       ▼           ▼           ▼               ▼
  devops    security     infra        ui           frontend
  agent      agent       agent       agent          agent
  (sonnet)  (sonnet)   (sonnet)    (sonnet)       (sonnet)
  B0-0A      B0-0B     B0-0C/B4    B1-1A          B1/B4/B5

       │       │           │           │               │
       └───────┴─────┬─────┴───────────┴───────────────┘
                     │
              ┌──────┼──────────┐
              ▼                 ▼
           backend             pwa          a11y
            agent             agent         agent
           (sonnet)          (sonnet)      (sonnet)
           B1/B4            B2-2A/B/C     B3-3A/3B
```

---

## SEQUÊNCIA DE EXECUÇÃO — DETALHADA

### ═══ SEMANA 1 — BLOCO 0: HARDENING ═══

```
DIA 1-2: DevOps Agent + Security Agent (paralelo)
│
├── DevOps Agent (0A)
│   ├── Limpar repo (server.js, prompts.ts.bak, tsbuildinfo)
│   ├── Criar /api/health
│   ├── Ativar healthcheck no Coolify
│   ├── GitHub Actions CI (tsc + lint + build + deploy)
│   └── Instruir João: UptimeRobot
│
└── Security Agent (0B) — PODE RODAR EM PARALELO COM 0A
    ├── Zod validação em /api/analise e /api/relatorio
    ├── Rate limiting em memória (10 req/min por IP)
    ├── Headers de segurança (HSTS, CSP, X-Frame-Options)
    ├── Sentry integração + PII scrubbing
    └── CSRF: validar Origin header

DIA 3-5: Infra Agent (0C) — após DevOps terminar
│
└── Infra Agent (0C)
    ├── Verificar DNS atual (dig)
    ├── Configurar zona Cloudflare
    ├── Migrar nameservers do Hostinger → Cloudflare
    ├── SSL Full Strict
    ├── WAF + Rate Limit no edge
    └── Cache rules para /_next/static/

MARCO SEMANA 1: App seguro, CI verde, DNS Cloudflare ✓
```

---

### ═══ SEMANAS 2-4 — BLOCO 1: PERFORMANCE E VISUAL ═══

```
SEMANA 2: UI Agent (1A)
│
└── UI Agent
    ├── Migrar Tailwind v3 → v4
    ├── Definir tokens OKLCH (healthcare + premium)
    ├── Configurar shadcn/ui com tema healthcare
    ├── Componentes base (Button, Card, Dialog, Sheet, Form...)
    ├── Light mode como default + toggle dark
    └── prefers-reduced-motion global

SEMANA 3: Frontend Agent (1B) + Backend Agent (1C) (PARALELO)
│
├── Frontend Agent (1B)
│   ├── Extrair landing em componentes (<200 LOC em page.tsx)
│   ├── Extrair useAnalysis hook de analise/page.tsx
│   ├── useDeferredValue + chunk buffering 50ms
│   ├── Promise.all nos 7 especialistas (≈2-3x speedup)
│   └── Lighthouse CI no PR
│
└── Backend Agent (1C)
    ├── @react-pdf/renderer (substituir Python)
    ├── DiagnosticPdfDocument component
    ├── SSE com eventos tipados (sem regex frágil)
    └── Remover Python do Dockerfile

SEMANA 4: Refactor visual completo + build final
└── Frontend Agent conclui migração CSS inline → tokens

MARCO SEMANA 4: Análise 2-3× mais rápida, container <120MB, CSS organizado ✓
```

---

### ═══ SEMANAS 5-6 — BLOCO 2: PWA CORE ═══

```
SEMANA 5: PWA Agent (2A + 2B)
│
└── PWA Agent
    ├── [2A] Gerar ícones (pwa-asset-generator)
    ├── [2A] manifest.webmanifest completo
    ├── [2A] Apple PWA tags no layout.tsx
    ├── [2B] Instalar Serwist + configurar next.config.ts
    └── [2B] Service Worker com estratégias por rota

SEMANA 6: PWA Agent (2C) + testes cross-platform
│
└── PWA Agent
    ├── [2C] IndexedDB (Dexie) para análises offline
    ├── [2C] Página /offline
    ├── [2C] NetworkBadge online/offline
    ├── [2C] InstallPrompt (Android + iOS tutorial)
    └── TESTES em BrowserStack (iOS 16.4+ e Android Chrome)

MARCO SEMANA 6: PWA instalável, offline funcional ✓
```

---

### ═══ SEMANAS 7-8 — BLOCO 3: VOZ E ACESSIBILIDADE ═══

```
SEMANA 7: A11y Agent (3A) — TTS
│
└── A11y Agent
    ├── lib/tts.ts (TtsPlayer class)
    ├── hooks/useTts.ts
    ├── components/TtsPlayer.tsx (mini + full)
    ├── HighlightedText com onboundary
    ├── Integrar: debate messages + laudo + hero landing
    ├── Selector de voz + velocidade
    └── Persistência via users.tts_voice (SSM → DB no Bloco 4)

SEMANA 8: A11y Agent (3B) — WCAG
│
└── A11y Agent
    ├── axe-core testes e2e
    ├── Corrigir violações de contraste
    ├── Skip-to-content
    ├── Aria-live correto no streaming
    ├── Focus trap em modais
    ├── Navegação 100% por teclado
    ├── Toggles de leitura facilitada
    └── Audit VoiceOver + TalkBack

MARCO SEMANA 8: TTS funcional em iOS/Android, WCAG 2.2 AA+, Lighthouse A11y 100 ✓
```

---

### ═══ SEMANAS 9-12 — BLOCO 4: DB, AUTH, PAGAMENTO ═══

```
SEMANA 9: Infra Agent (4A) + Backend Agent (4B) (PARALELO)
│
├── Infra Agent (4A)
│   ├── Postgres 16 service no Coolify
│   ├── Redis 7 service no Coolify
│   ├── SSM: database-url, redis-url, postgres-password, redis-password
│   ├── Coolify env vars: DATABASE_URL, REDIS_URL
│   └── Backup script + teste de restore
│
└── Backend Agent (4B)
    ├── Drizzle ORM setup (schema + config)
    ├── Schema completo: users, children, analyses, etc.
    ├── Primeira migration gerada + aplicada
    └── Seed dos 5 casos demo

SEMANA 10: Backend Agent (4C) — Auth.js
│
└── Backend Agent (4C)
    ├── Auth.js v5 com DrizzleAdapter
    ├── Magic Link via Resend
    ├── Google OAuth
    ├── Páginas /login e /login/verify
    └── SSM: nextauth-secret, google-client-*, resend-api-key

SEMANA 11: Frontend Agent (4D) + Backend Agent (4E) (PARALELO)
│
├── Frontend Agent (4D)
│   ├── Layout autenticado (/conta)
│   ├── Página /conta/historico (listagem + paginação)
│   ├── Detalhe /conta/historico/[id]
│   ├── Download PDF do histórico
│   └── Exclusão de análise (LGPD soft delete)
│
└── Backend Agent (4E)
    ├── Stripe checkout + webhooks
    ├── Planos Basic/Pro/Clínica
    ├── Sistema de quotas mensais
    └── SSM: stripe-secret-key, stripe-webhook-secret

SEMANA 12: Backend Agent (4F) — LGPD
│
└── Backend Agent (4F)
    ├── Audit log (todas as ações relevantes)
    ├── /api/lgpd/export (JSON com todos os dados)
    ├── /api/lgpd/erase (soft delete + cancelar Stripe)
    └── Testes de conformidade LGPD

MARCO SEMANA 12: SaaS com receita, LGPD conforme ✓
```

---

### ═══ BLOCO 5 — REFINAMENTOS (CONTÍNUO) ═══

```
Ordem de prioridade:
1. PWA Agent: Background Sync Android (retransmitir análises offline→online)
2. Backend Agent: ElevenLabs TTS para planos Pro+
3. Frontend Agent: i18n com next-intl (PT/EN por URL)
4. Frontend Agent: Search/filter no histórico
5. Frontend Agent: Share Target (compartilhar laudo)
6. Backend Agent: Cache LLM (Redis hash de inputs idênticos)
7. Backend Agent: BullMQ para filas de PDF e e-mail
```

---

## PROTOCOLO DE HANDOFF ENTRE AGENTES

### Quando o Orquestrador delega a um Subagente:

```
HANDOFF PACKET (deve ser enviado ao subagente):
1. Fase atual e objetivos concretos
2. Estado do repo (últimos commits, arquivos relevantes)
3. SSM params disponíveis ou a criar
4. Pré-condições verificadas (tsc → 0 erros)
5. Ferramentas disponíveis (MCPs ativos)
6. Critérios de aceite (o que deve estar funcionando ao final)
7. Como fazer deploy após conclusão
```

### Quando o Subagente reporta ao Orquestrador:

```
COMPLETION REPORT:
1. Arquivos criados/modificados (lista exata)
2. SSM params criados
3. Commit hash do deploy
4. Checklist de verificação (todos os itens marcados)
5. Problemas encontrados e como foram resolvidos
6. Itens que ficaram pendentes (com justificativa)
```

---

## FERRAMENTAS DISPONÍVEIS POR AGENTE

| Ferramenta | DevOps | Security | Infra | UI | Frontend | Backend | PWA | A11y |
|---|---|---|---|---|---|---|---|---|
| Desktop Commander (git, npm) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bash (sandbox) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Read/Write/Edit (arquivos) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| MCP Coolify | — | — | ✓ | — | — | — | — | — |
| MCP Hostinger | — | — | ✓ | — | — | — | — | — |
| MCP Cloudflare | — | — | ✓ | — | — | — | — | — |
| AWS SSM (via DC) | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — |
| WebSearch | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## COMMITS PADRÃO POR AGENTE

| Agente | Prefixo típico |
|---|---|
| devops-agent | `chore(ci):`, `chore(repo):` |
| security-agent | `security(api):`, `security(headers):`, `security(csrf):` |
| infra-agent | `infra(docker):`, `infra(coolify):`, `infra(dns):` |
| ui-agent | `feat(ui):`, `chore(ui):` |
| frontend-agent | `feat(landing):`, `refactor(analise):`, `perf(analysis):` |
| backend-agent | `feat(pdf):`, `feat(db):`, `feat(auth):`, `feat(stripe):`, `feat(lgpd):` |
| pwa-agent | `feat(pwa):` |
| a11y-agent | `feat(tts):`, `feat(a11y):` |

---

## AMBIENTE LOCAL DE DESENVOLVIMENTO

```bash
# Configuração do repositório local
REPO: ~/Documents/DEV/manalista
BRANCH: main (único branch em prod)
NODE: 20 LTS
PACKAGE MANAGER: npm

# Comandos frequentes (via Desktop Commander)
npm run dev      # Next.js com Turbopack
npm run check    # tsc --noEmit (DEVE SER 0 ANTES DE QUALQUER COMMIT)
npm run lint     # ESLint
npm run build    # Build de produção
npm test         # Vitest unit tests
npm run test:e2e # Playwright e2e

# Git workflow
git add <arquivos-específicos>  # NUNCA git add -A
git commit -m "tipo(escopo): descrição"
git push origin main
# Coolify detecta o push e inicia deploy automaticamente (webhook)

# Verificar deploy
curl -fsS https://manalista.com.br/api/health | jq '.status'
# Deve retornar "ok"
```

---

## CRONOGRAMA RESUMIDO

| Semana | Agentes Ativos | Marco |
|---|---|---|
| 1 | devops + security (paralelo) + infra | CI verde, DNS Cloudflare, WAF ativo |
| 2 | ui | Tailwind v4, shadcn/ui, tokens OKLCH |
| 3-4 | frontend + backend (paralelo) | Landing refatorada, PDF Node, análise paralela |
| 5-6 | pwa | PWA instalável, offline, manifest |
| 7-8 | a11y | TTS iOS/Android, WCAG AA, Lighthouse 100 |
| 9 | infra + backend (paralelo) | Postgres, Redis, schema Drizzle |
| 10 | backend | Auth.js com Magic Link + Google |
| 11 | frontend + backend (paralelo) | Histórico, Stripe checkout |
| 12 | backend | LGPD (audit, export, erase) |
| 13+ | todos (refinamentos) | ElevenLabs, i18n, etc. |

**Total: ~12 semanas para SaaS production-ready**
**MVP pago em 6 semanas: Blocos 0 + 2 + 4 (skip refactor visual completo)**
