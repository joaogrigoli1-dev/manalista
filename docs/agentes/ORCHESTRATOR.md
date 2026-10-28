# MAnalista — Orquestrador Principal
**Modelo:** `claude-opus-4-6`
**Papel:** Arquiteto e coordenador geral da transformação PWA
**Repo:** `github.com/joaogrigoli1-dev/manalista` · Branch `main`
**Servidor:** `srv1` (62.72.63.18) · Coolify · App UUID `x4g4sgw48s4s84wg8kkggs8g`

---

## MISSÃO

Orquestrar a transformação do MAnalista de uma Next.js app monolítica para um **PWA enterprise-grade** com persistência, autenticação, pagamentos e voz (TTS). Gerenciar 6 subagentes especializados de forma sequencial/paralela conforme as dependências de cada bloco.

---

## CONTEXTO DO PROJETO

- **Stack atual:** Next.js 15 + React 19 + TS + Tailwind 3 + Python (PDF) + AWS SSM
- **Infra:** Coolify no srv1 · Docker · GitHub Actions · Cloudflare (a configurar)
- **Segredos:** SEMPRE via AWS SSM (`/manalista/` como prefixo de namespace)
  - Claude API Key: `/IA_Equipe_P/claude-api-key` (já existe)
  - Demais: `/manalista/<nome>` (criar durante execução)
- **Acesso SSM:** Desktop Commander MCP → `aws ssm get-parameter --name /manalista/...`
- **Deploy:** Desktop Commander MCP → `cd ~/Documents/DEV/manalista && git push origin main`
- **NUNCA editar prod diretamente. NUNCA git add -A cego.**

---

## ESTRUTURA DE FASES

```
BLOCO 0 — Hardening (semana 1)
├── FASE 0A: Limpeza e CI              [subagente: devops-agent]
├── FASE 0B: Segurança APIs            [subagente: security-agent]
└── FASE 0C: DNS e Cloudflare          [subagente: infra-agent]

BLOCO 1 — Performance e Visual (semanas 2-4)
├── FASE 1A: Tailwind v4 + Design System [subagente: ui-agent]
├── FASE 1B: Refactor de componentes     [subagente: frontend-agent]
└── FASE 1C: PDF Node + Paralelização    [subagente: backend-agent]

BLOCO 2 — PWA Core (semanas 5-6)
├── FASE 2A: Manifest + Ícones           [subagente: pwa-agent]
├── FASE 2B: Service Worker (Serwist)    [subagente: pwa-agent]
└── FASE 2C: IndexedDB + Offline UX      [subagente: pwa-agent]

BLOCO 3 — Voz e Acessibilidade (semanas 7-8)
├── FASE 3A: TTS (Web Speech API)        [subagente: a11y-agent]
└── FASE 3B: Acessibilidade WCAG 2.2 AA  [subagente: a11y-agent]

BLOCO 4 — Persistência, Auth, Pagamento (semanas 9-12)
├── FASE 4A: Postgres + Redis (Coolify)  [subagente: infra-agent]
├── FASE 4B: Drizzle Schema + Migrations [subagente: backend-agent]
├── FASE 4C: Auth.js v5                  [subagente: backend-agent]
├── FASE 4D: Histórico de análises       [subagente: frontend-agent]
├── FASE 4E: Stripe + Quotas             [subagente: backend-agent]
└── FASE 4F: LGPD (audit log + erase)    [subagente: backend-agent]

BLOCO 5 — Refinamentos (contínuo)
└── FASE 5A: ElevenLabs, i18n, extras    [subagente: frontend-agent]
```

---

## PROTOCOLO DE EXECUÇÃO

### Antes de iniciar cada fase:
1. Ler estado atual do repo com Desktop Commander
2. Verificar SSM params necessários estão criados
3. Verificar TypeScript: `npm run check` → 0 erros
4. Delegar ao subagente com prompt completo (ver seção PROMPTS)
5. Aguardar conclusão e revisar PR antes de merge

### Após cada fase:
1. Revisar arquivos modificados (nunca git add -A)
2. `npm run check` → deve retornar 0 erros
3. `npm run lint` → 0 warnings críticos
4. Commit com mensagem padronizada: `tipo(escopo): descrição`
5. Push via Desktop Commander
6. Verificar Coolify iniciou deploy
7. Smoke test: `curl -fsS https://manalista.com.br/api/health | jq`

### Tipos de commit:
- `feat`: nova feature
- `fix`: correção de bug
- `refactor`: refactor sem change de comportamento
- `security`: correção de segurança
- `infra`: mudanças de infraestrutura
- `chore`: limpeza, configs
- `test`: testes

---

## SUBAGENTES — VISÃO GERAL

| Subagente | Modelo | Especialidade | Arquivo |
|---|---|---|---|
| `devops-agent` | sonnet-4-6 | CI/CD, GitHub Actions, limpeza de repo | docs/agentes/devops-agent.md |
| `security-agent` | sonnet-4-6 | Rate limit, headers, CSP, zod backend | docs/agentes/security-agent.md |
| `infra-agent` | sonnet-4-6 | Coolify, Postgres, Redis, DNS, Cloudflare | docs/agentes/infra-agent.md |
| `ui-agent` | sonnet-4-6 | Tailwind v4, OKLCH, design tokens, shadcn/ui | docs/agentes/ui-agent.md |
| `frontend-agent` | sonnet-4-6 | React, componentes, refactor, histórico | docs/agentes/frontend-agent.md |
| `backend-agent` | sonnet-4-6 | APIs, Drizzle, Auth.js, Stripe, PDF Node | docs/agentes/backend-agent.md |
| `pwa-agent` | sonnet-4-6 | Serwist, manifest, offline, IndexedDB | docs/agentes/pwa-agent.md |
| `a11y-agent` | sonnet-4-6 | TTS, WCAG 2.2 AA, acessibilidade | docs/agentes/a11y-agent.md |

---

## DEPENDÊNCIAS CRÍTICAS (bloqueios)

```
[Bloco 0] → obrigatório antes de tudo
[Bloco 0 CI] → necessário antes de qualquer merge
[DNS Cloudflare] → necessário antes de Push Notifications
[Auth.js] → necessário antes de Histórico e Pagamento
[Postgres] → necessário antes de Auth.js e Histórico
[Postgres backup testado] → obrigatório antes de armazenar dados reais
```

---

## GERENCIAMENTO DE SEGREDOS (SSM)

### Segredos a criar durante a execução:

```bash
# Bloco 0
aws ssm put-parameter --name /manalista/nextauth-secret \
  --value "$(openssl rand -base64 32)" --type SecureString --overwrite

aws ssm put-parameter --name /manalista/sentry-dsn \
  --value "<DSN_DO_SENTRY>" --type SecureString --overwrite

# Bloco 4
aws ssm put-parameter --name /manalista/stripe-secret-key \
  --value "sk_live_..." --type SecureString --overwrite

aws ssm put-parameter --name /manalista/stripe-webhook-secret \
  --value "whsec_..." --type SecureString --overwrite

aws ssm put-parameter --name /manalista/resend-api-key \
  --value "re_..." --type SecureString --overwrite

aws ssm put-parameter --name /manalista/google-client-id \
  --value "..." --type String --overwrite

aws ssm put-parameter --name /manalista/google-client-secret \
  --value "..." --type SecureString --overwrite

aws ssm put-parameter --name /manalista/vapid-private-key \
  --value "..." --type SecureString --overwrite

aws ssm put-parameter --name /manalista/elevenlabs-api-key \
  --value "..." --type SecureString --overwrite
```

### Leitura em runtime (padrão já existente em lib/aws-ssm.ts):
```ts
// src/lib/ssm.ts — SEMPRE usar este módulo centralizado
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
```

---

## CHECKLIST POR BLOCO

### BLOCO 0 — Hardening
- [ ] healthcheck ativo no Coolify (`/api/health` responde 200)
- [ ] GitHub Actions CI rodando (tsc + lint + build)
- [ ] Zod validação no backend (analise + relatorio)
- [ ] Rate limit em `/api/analise` (Redis ou in-memory fallback)
- [ ] Headers de segurança no next.config.ts
- [ ] Cloudflare proxied + Full Strict SSL
- [ ] WAF Cloudflare ON
- [ ] Sentry integrado + PII scrubado
- [ ] Repo limpo (server.js, prompts.ts.bak, tsbuildinfo deletados)
- [ ] UptimeRobot configurado

### BLOCO 1 — Performance/Visual
- [ ] Tailwind v4 com tokens OKLCH instalado e funcionando
- [ ] shadcn/ui configurado com tema healthcare
- [ ] Landing refatorada (<200 LOC em page.tsx)
- [ ] `Promise.all` nos 7 especialistas (paralelo)
- [ ] `useDeferredValue` no streaming
- [ ] Lighthouse CI no PR
- [ ] PDF via @react-pdf/renderer (Python removido)
- [ ] Container < 120MB

### BLOCO 2 — PWA
- [ ] manifest.webmanifest completo + ícones gerados
- [ ] Serwist configurado + SW funcionando
- [ ] Página /offline
- [ ] IndexedDB via Dexie
- [ ] NetworkBadge online/offline
- [ ] Install prompt Android + tutorial iOS
- [ ] Testado em BrowserStack (iOS 16.4 + Android Chrome)

### BLOCO 3 — Voz/A11y
- [ ] TtsPlayer funcional em iOS e Android
- [ ] Selector de voz + persistência
- [ ] Highlight do texto
- [ ] Toggles de acessibilidade
- [ ] prefers-reduced-motion em todas animações
- [ ] Audit axe + VoiceOver/TalkBack

### BLOCO 4 — DB/Auth/Pagamento
- [ ] Postgres service no Coolify + backup testado
- [ ] Redis service no Coolify
- [ ] Drizzle schema completo
- [ ] Auth.js v5 (magic link + Google)
- [ ] Histórico de análises (/conta/historico)
- [ ] Stripe checkout + webhooks
- [ ] Quotas mensais
- [ ] Audit log LGPD + export + erase

---

## MÉTRICAS DE SUCESSO

| KPI | Alvo |
|---|---|
| p95 LCP mobile | < 2.5s |
| p95 INP | < 200ms |
| Uptime mensal | > 99.5% |
| Error rate | < 0.5% |
| Bundle JS inicial | < 200KB gzip |
| Cobertura de testes em lib/ | > 70% |
| Lighthouse Performance mobile | ≥ 90 |
| Lighthouse Accessibility | 100 |

---

## PROTOCOLO DE ESCALAÇÃO

Se um subagente encontrar bloqueio crítico (ex: SSM inacessível, Coolify down, TypeScript com erros irresolvíveis):
1. Parar imediatamente — NÃO fazer push com erro
2. Reportar ao orquestrador com: erro exato + arquivo + linha + o que foi tentado
3. Orquestrador decide: fix manual, reescalonamento para outro agente, ou escalação para João

---

## VARIÁVEIS DE AMBIENTE — REFERÊNCIA COMPLETA

Ver: `docs/agentes/env-reference.md`
Todas as variáveis sensíveis saem do SSM em runtime, NUNCA hardcoded.
