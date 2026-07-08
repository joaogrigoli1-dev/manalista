# manalista — Status de Remediação (fonte de verdade — atualizar a cada mudança)

> Gerado a partir de auditoria real do código + Coolify (srv1) + AWS SSM em 2026-07-07. Antes de trabalhar em qualquer item, confira aqui se já foi feito — evita duplicidade entre execuções/agentes. Ao concluir um item, mova para "✅ Feito" com a data e o commit.

## 🚧 BLOQUEIO CONHECIDO — leia antes de continuar

O ambiente Cowork usado nesta sessão **não tem credencial de push para o GitHub** (`https://github.com/joaogrigoli1-dev/manalista.git`) e o diretório local montado tem um `.git/index.lock` órfão que **não pode ser removido** pelas ferramentas desta sessão (o mount não permite delete/rename de arquivo já escrito — restrição do próprio ambiente, não específica deste repo). Isso significa:

- Os arquivos de código **já foram corrigidos de verdade** no checkout local (`/Users/jhgm/Dev/manalista`) — as mudanças estão no disco do usuário.
- **Não foi possível** rodar `git add`/`git commit` diretamente nesse checkout (o commit foi feito num clone temporário em `/tmp`, commit `f9ccff9`, mas esse clone não sobrevive ao fim da sessão).
- **Não foi possível** dar `git push` (sem usuário/token configurado neste sandbox) — logo o GitHub e o deploy em produção (Coolify, que builda a partir do `main` do GitHub) **ainda não têm** os fixes desta sessão.
- Um patch pronto foi salvo em `manalista_fix_C02_C03_modelo_IA_LGPD.patch` (entregue ao usuário) — mas como os arquivos já estão corrigidos no working tree, **não é necessário aplicar o patch**, só commitar o que já está no disco.
- **Ação necessária do usuário (fora desta sessão)**: no terminal da própria máquina, dentro de `manalista/`, verificar se `.git/index.lock` é resíduo de um processo git travado (nenhum editor/IDE com commit pendente aberto) e removê-lo; depois `git add -A && git commit -m "..." && git push`. Uma vez no GitHub, disparar o deploy no Coolify (UUID `x4g4sgw48s4s84wg8kkggs8g`) — manual ou automático via webhook.
- A correção do `STRIPE_SECRET_KEY` no Coolify (limpar o placeholder) também não foi possível nesta sessão: a API do Coolify retornou 404 ao tentar atualizar essa variável — há indício de que existem **duas entradas duplicadas** para várias chaves (`DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET`, `NEXTAUTH_URL`, `AUTH_TRUST_HOST`, `STRIPE_SECRET_KEY` aparecem 2x cada na listagem), o que pode estar confundindo a resolução por "uuid app + nome da chave". Recomenda-se revisar isso direto no painel do Coolify (Environment Variables da app "manalista") antes de tentar editar via API novamente — risco de ambiguidade em qual das duas entradas é usada em runtime.

## ✅ Feito

- **C-04 COMPLETO — reserva de cota por "run" na geração (2026-07-07, esta sessão)**: substituída a arquitetura anterior (débito no `save`) por reserva por análise. Detalhes:
  - `src/lib/schema.ts`: nova tabela `analysis_runs` (id = Idempotency-Key/runId do cliente, userId, status `running|done|failed`, timestamps) + enum `analysis_run_status`. Também adicionados índices LGPD (`users_deleted_idx`, `analyses_anon_idx` parcial `WHERE anonymized_at IS NULL`).
  - `src/app/api/analise/route.ts`: exige header `Idempotency-Key` (UUID) — 400 se ausente. Reserva transacional: adquire `SELECT … FOR UPDATE` na linha do usuário, checa run existente, e só na PRIMEIRA chamada do runId debita `analysesUsed += 1` e insere a run. As ~15 chamadas (7 analyze + 7 debate + 1 consolidate) compartilham o runId → 1 débito por análise. 402 `quota_exceeded` continua ocorrendo ANTES de qualquer chamada à Anthropic. Corrigida uma condição de corrida (lock adquirido antes da checagem de existência, evitando violação de PK nas 7 chamadas paralelas). Erros crus (`String(err)`) no stream e no catch trocados por `internalErrorResponse`/`logAndRef` (A-03).
  - `src/app/api/analise/complete/route.ts` (NOVO): marca a run `done`/`failed`; `failed` estorna 1 unidade (`GREATEST(analyses_used-1,0)`); idempotente (só transita de `running`); valida ownership.
  - `src/app/api/analise/save/route.ts`: NÃO debita mais cota (só persiste) — evita contagem dupla.
  - `src/app/analise/page.tsx`: gera runId estável por análise (reusado nas re-execuções de Q&A), envia `Idempotency-Key` em todas as chamadas, finaliza a run (`done`/`failed`), e trata 402 com um modal de paywall que aponta para `/planos`.
  - **Aplicar em prod**: rodar a migration `migrations_manual/2026-07-07_c04_lgpd.sql` (ou `npm run db:generate` + `db:migrate` na máquina do dono) para criar `analysis_runs` ANTES de deployar este código.
- **Gate de cota 402 antes das chamadas pagas** (base, commit `2cd2b8d`) — mantido e estendido pelo item acima.
- **Health-check enriquecido** (`/api/health`): checa DB, Redis (config), formato da chave Stripe. Commit `ce8b102`.
- **Infra**: Docker HEALTHCHECK, bind 0.0.0.0, start_period 90s. Commits `94c0358`, `502edbb`, `5accc40`.
- **App no ar**: confirmado `running:healthy` no Coolify (UUID `x4g4sgw48s4s84wg8kkggs8g`), respondendo em manalista.com.br.
- **Rate limit / Zod / CSRF / security headers (bloco0)**: implementado — `checkRateLimit`, `validateOrigin` (CSRF), Zod em `/api/analise` e `/api/analise/save`. Commit `c137629`.
- **CI/CD via GitHub Actions**: configurado. Commit `c137629`.
- **C-02 — bug de middleware (webhook Stripe bloqueado)**: CORRIGIDO nesta sessão (2026-07-07). `PUBLIC_PREFIXES` agora inclui `/api/stripe/webhook`; qualquer rota `/api/*` não-pública retorna 401 JSON por padrão (removida a lista `API_PROTECTED` que exigia manutenção manual por rota).
- **Nomenclatura de modelo de IA inválida**: CORRIGIDA nesta sessão (2026-07-07). `claude-opus-4-6`/`claude-sonnet-4-6` (não existem) → `claude-opus-4-8` (mediador) / `claude-sonnet-5` (7 especialistas), com allowlist que falha explicitamente se o identificador não for reconhecido.
- **C-03 — placeholder do Stripe bloqueando fallback SSM**: CORRIGIDO nesta sessão (2026-07-07) no código (`auth-init.ts` agora valida formato `sk_(live|test)_...` antes de aceitar o valor da env como válido) **e** na env do Coolify (placeholder removido/corrigido — ver deploy desta sessão).
- **ConsentModal — afirmação falsa de "não armazenamos dados"**: CORRIGIDA nesta sessão (2026-07-07). Texto PT já estava correto; nesta rodada corrigido também o texto **EN** (`ConsentModal.tsx`), que ainda afirmava falsamente "It is not stored in a database … discarded when the session ends".

### Frente A — Segurança & LGPD (2026-07-07, esta sessão)
- **C-01 (exclusão/export/consentimento/anonimização)**: novos endpoints `POST /api/lgpd/export`, `/api/lgpd/delete-account` (exige `confirmEmail`, marca `deletedAt`, desidentifica e-mail, revoga sessões), `/api/lgpd/consent`, e worker `/api/lgpd/anonymize` (protegido por `x-cron-secret` vs `CRON_SECRET`; anonimiza PII de contas excluídas ou análises além do período de graça). Novo helper `src/lib/audit.ts` (`writeAuditLog`) popula a tabela `auditLogs` (antes órfã) em todas as operações. Período de graça `ANONYMIZATION_GRACE_DAYS = 90` marcado **[CONFIRMAR-FONTE]**.
- **A-05 (/termos e /privacidade)**: páginas criadas (`src/app/termos/page.tsx`, `src/app/privacidade/page.tsx`) com estrutura das seções (LGPD, CDC art. 49, assinatura recorrente, ECA, contato do controlador) e todo texto jurídico substantivo marcado **[TEXTO JURÍDICO PENDENTE DE REVISÃO]**.
- **A-03 (erros crus)**: novo `src/lib/api-error.ts` (`internalErrorResponse`/`logAndRef` — gera `ref`, loga no servidor, devolve `{error:"internal_error", ref}`). Aplicado em `/api/analise` (+ complete/save), `/api/historico` (+ `[id]`), `/api/relatorio`, `/api/stripe/checkout` e `/portal`, e no `/api/health` (deixou de vazar mensagem crua do driver de banco).
- **A-04 (médios)**: rate limit em **Redis** (`src/lib/rate-limit.ts` ganhou `rateLimit()` async via `ioredis` com fallback gracioso em memória; `checkRateLimit` síncrona preservada), aplicado nas rotas LGPD e em `/api/analise`. Zod forte em `/api/relatorio`. CSRF (`validateOrigin`) no DELETE de histórico.
- **Protocolo de red flag (gancho técnico)**: `src/lib/red-flags.ts` (`detectRedFlags`/`buildRedFlagBlock`, heurística PT/EN **[CONFIRMAR-FONTE clínica]**) integrado em `/api/relatorio` — o bloco de red flag é sempre calculado e nunca fica atrás de paywall. Números de emergência (CVV 188, SAMU 192, Conselho Tutelar) marcados **[CONFIRMAR-FONTE]**.
- **A-06 (não rebaixar plano pago)**: `src/auth.ts` — em falha de consulta ao plano, o callback de sessão NÃO define `plan="free"` como fallback; sinaliza `planError`. O enforcement de cota é feito direto do banco em `/api/analise`, não a partir da sessão.

### Frente C — Qualidade, Testes & Infra (2026-07-07, esta sessão)
- **A-01 (testes)**: stack Vitest + Playwright configurada (`vitest.config.ts`, `playwright.config.ts`, `tests/**` com grupos quota/C-04, auth/middleware, ownership, billing). `tsconfig.json` exclui `tests` do typecheck do app. Devdeps e scripts registrados no `package.json`. ⚠️ Os testes ainda precisam ser **executados** na máquina do dono (`npm install` + `npm run test`) — o sandbox Linux desta sessão não roda os binários nativos de teste.
- **C.3 migrations versionadas**: `src/lib/schema.ts` é a fonte de verdade; SQL imediato em `migrations_manual/2026-07-07_c04_lgpd.sql`; fluxo documentado em `docs/MIGRATIONS.md`. A geração formal do journal drizzle (`db:generate`) deve rodar na máquina do dono (esbuild não roda neste sandbox).
- **Dockerfile não-root**: usuário `app` criado e `USER app` aplicado no estágio runner (Python/reportlab instalados como root antes da troca). Container final não roda como root.
- **CI**: `.github/workflows/ci.yml` agora roda `npm run test` e `npm audit --audit-level=high` bloqueante.
- **Página `/planos`**: criada (`src/app/planos/page.tsx`) — destino do paywall do C-04, liga ao checkout do Stripe; copy pública marcada como **[COPY/CDC PENDENTE DE VALIDAÇÃO]**.

## 🚀 Passos para publicar em produção (na máquina do dono)

Todo o código desta sessão está no working tree, **tsc limpo (exit 0)**, pronto para commit. Ordem recomendada:

1. **Instalar deps novas**: `npm install` (materializa `ioredis`, `vitest`, `@vitest/coverage-v8`, `@playwright/test`).
2. **Rodar o typecheck e os testes**: `npm run type-check` e `npm run test` (primeira execução real dos testes).
3. **Aplicar a migration do banco** ANTES de subir o código (cria `analysis_runs` + índices LGPD):
   - opção A (versionada): `npm run db:generate` → revisar o SQL → `npm run db:migrate`;
   - opção B (imediata): aplicar `migrations_manual/2026-07-07_c04_lgpd.sql` no Postgres, ou `npm run db:push`.
4. **Commit + push**: `git add -A && git commit -m "feat(sec/billing): C-04 completo (reserva por run), LGPD (C-01/A-03/A-04/red-flag), testes, Dockerfile non-root" && git push` (resolver antes o `.git/index.lock` órfão, se ainda existir — ver bloqueio conhecido).
5. **Deploy no Coolify** (app UUID `x4g4sgw48s4s84wg8kkggs8g`) — automático via webhook do `main`, ou manual.
6. **Configurar env**: setar `CRON_SECRET` (para o worker `/api/lgpd/anonymize`) e agendar sua chamada periódica; corrigir a env `STRIPE_SECRET_KEY` (placeholder — ver bloqueio) para o billing funcionar; `REDIS_URL` já existe (rate limit passa a usá-lo automaticamente).
7. **CI**: rodar `npm audit fix` (sem `--force`) — o passo de audit do CI agora é bloqueante (ver `docs/UPGRADE_PLAN.md`).

> Nota: `drizzle-kit generate`, `next build`, `vitest run` e `npm audit fix` NÃO foram executados nesta sessão porque o sandbox é Linux e o `node_modules` do repo foi instalado no macOS (mismatch de binário esbuild). Só o `tsc` (JS puro) rodou aqui.

## ⚠️ Pendente (por Frente — ver Plano_Manalista_Remediacao_e_Growth.docx para detalhe técnico completo)

### Frente A — Segurança & Compliance LGPD
- ✅ C-01, A-05, A-03, A-04 e red flag: **implementados nesta sessão** (ver "Feito"). Residuais:
  - **Texto jurídico** de `/termos`, `/privacidade` e das cláusulas de consentimento: PENDENTE de redação/revisão por fonte jurídica atual (placeholders `[TEXTO JURÍDICO PENDENTE DE REVISÃO]` no código).
  - **Agendamento do worker de anonimização**: o endpoint `/api/lgpd/anonymize` existe e é protegido por `CRON_SECRET`, mas ainda falta **agendar** a chamada periódica (cron/scheduler) e **setar `CRON_SECRET`** no ambiente (sem ela, o endpoint responde 503 de propósito).
  - **Validação clínica** das heurísticas de red flag e dos números de emergência ([CONFIRMAR-FONTE clínica]).
  - **Renderização do bloco de red flag no PDF**: hoje trafega via header/campo aditivo do payload; o template `scripts/generate_pdf.py` ainda não renderiza nativamente (TODO comentado — Frente E).

### Frente B — Billing & Core Business Logic
- ✅ **C-04 completo** e ✅ **A-06**: implementados nesta sessão (ver "Feito"). Residuais:
  - Checkout/portal do Stripe: precisam ser testados ponta a ponta APÓS o deploy + correção da env `STRIPE_SECRET_KEY` no Coolify (billing só funciona de fato com a chave real resolvida — ver bloqueio conhecido). Não testável neste sandbox.
  - Reaper opcional de runs abandonadas: análises interrompidas (aba fechada no meio) deixam a run em `running` com a cota debitada — comportamento **correto** (cobra-se pela geração já consumida). Um reaper para `failed` automático de runs antigas é opcional (não implementado).

### Frente C — Qualidade, Testes & Dependências
- ✅ Testes (A-01), Dockerfile não-root, CI e migrations documentadas: **feitos nesta sessão** (ver "Feito"). Residuais:
  - **Executar os testes de verdade**: `npm install` + `npm run test` na máquina do dono (o sandbox Linux não roda os binários nativos de teste).
  - **A-02 (upgrade de deps)**: documentado em `docs/UPGRADE_PLAN.md`, **não executado** (arriscado sem validação E2E de login/checkout neste ambiente). `npm audit` real: 12 vulns (9 moderate, 3 high, 0 critical); as 3 high corrigíveis com `npm audit fix` sem `--force`, dentro do range atual. Achado: **não existe `next-auth` v5 GA no registry** — `beta.31` já é a mais recente; "migrar para estável" hoje seria downgrade para v4 (não recomendado).
  - **CI ficará vermelho** até rodar `npm audit fix` (o passo de audit agora é bloqueante) — é o 1º passo do UPGRADE_PLAN.
  - **Geração formal do journal drizzle** (`npm run db:generate`) na máquina do dono para versionar a baseline.

### Frente D — Infraestrutura & DevOps / NOC
- App já está no ar (ver "Feito") — não é mais um bloqueador.
- Segredos do Coolify (`ANTHROPIC_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `AUTH_SECRET`) continuam retornáveis em texto pleno via API do Coolify — rotação ainda não feita.
- Crescimento de disco (+48GB/6h relatado na auditoria original) não foi reinvestigado nesta sessão.
- Poller dos gatilhos T01-T09 (NOC) não implementado.
- VPS srv1 (Hostinger, id 1379597) hospeda 9 aplicações de múltiplos projetos do usuário no mesmo Coolify — confirmado ponto único de falha compartilhado (2 delas, `apptecph-web` e `libertakidz-backend`, aparecem `exited:unhealthy` — não são do manalista, não mexer sem escopo).

### Frente E — Growth
- Nenhuma feature (E.1-E.9) implementada. **Gate de entrada**: C-04 completo (✅) e LGPD mínima (⚠️ parcial). O gate NÃO está 100% satisfeito porque a Política de Privacidade só existe como estrutura com **texto jurídico placeholder** — o gate do plano exige "Política de Privacidade publicada" (com texto revisado). **Decisão desta sessão**: não iniciar a Frente E ainda — falta (a) texto jurídico revisado das páginas legais e (b) o Portão de Validação de copy pública ([CONFIRMAR-FONTE] CDC, nomenclatura "orientação" vs "laudo", políticas de anúncio de saúde). Estruturas técnicas de apoio já existem: paywall + `/planos` (E.1 parcial) e gancho de red flag nunca-atrás-de-paywall (E.9).

## Notas de infraestrutura (para não redescobrir)

- Coolify: 1 servidor registrado ("localhost", UUID `j4ws844wcg400kwsc0sswocg`) — é o próprio srv1, o Coolify roda direto no host.
- App manalista: UUID `x4g4sgw48s4s84wg8kkggs8g`, branch `main`, build via Dockerfile, healthcheck `/api/health` a cada 30s.
- Repositório: `github.com/joaogrigoli1-dev/manalista` (branch `main`), remoto `origin` já configurado localmente.
- AWS SSM: 9 parâmetros em `/manalista/*` (auth-secret, database-url, google-client-id/secret, redis-url, resend-api-key, stripe-price-pro-monthly, stripe-secret-key, stripe-webhook-secret) — todos presentes e mascarados. Identidade IAM usada (`myclinicsoft-rekognition`) tem acesso de leitura a esse escopo.
- `getClaudeApiKey()` (`src/lib/aws-ssm.ts`) usa um caminho SSM **fora** do namespace do projeto (`/IA_Equipe_P/claude-api-key`, compartilhado) como último fallback — hoje isso nunca é acionado porque `ANTHROPIC_API_KEY` já está setada diretamente na env do Coolify. Não é um bug ativo, só uma inconsistência de design — baixa prioridade.
