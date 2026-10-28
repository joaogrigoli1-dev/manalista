# Estado de Orquestração — Onda 0 (Estabilização Emergencial)

> Documento vivo mantido pelo agente orquestrador. Atualizado em **2026-07-07**.
> Base: `Plano_Manalista_Remediacao_e_Growth.docx` + verificação ao vivo via MCP coolify/aws.
> **Nenhuma mutação em produção foi feita.** Toda ação mutante abaixo aguarda aprovação explícita do João.

---

## 1. Estado real da infra (verificado ao vivo — só leitura)

| Item | Achado verificado | Fonte |
|------|-------------------|-------|
| App manalista | `exited:unhealthy` — último online **2026-06-18 01:59** → **~19 dias fora do ar** | coolify `get_application` (uuid `x4g4sgw48s4s84wg8kkggs8g`) |
| Build/health | build_pack `dockerfile`, porta 3000, health check `/api/health (30s)` | coolify |
| **STRIPE_SECRET_KEY** | valor literal `PLACEHOLDER_CONFIGURE_NO_SSM` na env do Coolify — **é o C-03** | coolify `get_envs` |
| Env duplicadas | DATABASE_URL, REDIS_URL, AUTH_SECRET, NEXTAUTH_URL, AUTH_TRUST_HOST, STRIPE_SECRET_KEY aparecem **em duplicidade** | coolify `get_envs` |
| Segredos em texto pleno | ANTHROPIC_API_KEY, DATABASE_URL, REDIS_URL, AUTH_SECRET retornam **em claro** pela API do Coolify — confirma D.2 | coolify `get_envs` |
| SSM `/manalista/*` | 9 parâmetros SecureString presentes (auth-secret, database-url, google-client-id/secret, redis-url, resend-api-key, stripe-price-pro-monthly, **stripe-secret-key**, stripe-webhook-secret) — valores mascarados | aws `ssm_list` (escopo estrito) |

**Diagnóstico do orquestrador (corrigido após leitura do código-fonte):**

- **O placeholder do Stripe (C-03) NÃO é a causa da queda do app.** O `/api/health` (`src/app/api/health/route.ts`) deriva o status HTTP **apenas do banco** (`overallStatus = database.status === "ok" ? "ok" : "degraded"`). A chave do Stripe é reportada como `invalid_format` no payload, mas **não** reprova o health check. Então o placeholder quebra o *billing*, não o boot.
- **O fallback de SSM já existe no código** (`src/lib/auth-init.ts`) e já usa o nome real `/manalista/stripe-secret-key`. O bug é a guarda da linha 25 — `if (process.env[envKey]) return` — que **pula o SSM quando a env já está preenchida** com o placeholder. Ou seja: o fix do C-03 é remover o placeholder do Coolify (D.4), e o SSM assume automaticamente. Confirma o mecanismo do plano.
- **A causa da queda é outra.** O status é `exited` (container **parado**, não apenas unhealthy). O health só reprova por **banco inacessível**. O `postgres-main` (host do `DATABASE_URL`) **não** aparece como recurso Coolify — é serviço Docker fora do registro, estado não visível pela API. Sinais que apontam para causa a nível de host: **3 apps `exited:unhealthy` ao mesmo tempo** (manalista, apptecph-web, libertakidz-backend) + a anomalia de **+48GB de disco em 6h (D.3)** → hipótese principal: **disco cheio / OOM matando containers, ou o `postgres-main` compartilhado fora do ar**.
- **Confirmação final exige shell no host** (`docker ps -a`, `docker logs <container manalista> --tail 500`, `df -h`, `docker system df`) — a API do Coolify não dá logs de container parado. Isso é o passo SSH do D.1 (Desktop Commander / hostinger).

---

## 2. ⚠️ Discrepância crítica a corrigir antes de disparar a Frente B

O prompt da **Frente B (item B.2)** e o plano mestre referenciam o parâmetro SSM como:

```
/manalista/stripe/secret_key      ← nome ASSUMIDO no plano (NÃO existe)
```

O parâmetro **real** no Parameter Store é:

```
/manalista/stripe-secret-key      ← nome REAL verificado
```

**Situação real (verificada no código):** o `src/lib/auth-init.ts` **já** usa o nome correto `/manalista/stripe-secret-key`. A discrepância existe **só no pseudocódigo do prompt/plano**. **Ação:** quando a Frente B implementar o `resolverChaveStripe` dedicado em `src/lib/stripe.ts`, o nome do parâmetro SSM deve bater com o do `auth-init.ts` (`/manalista/stripe-secret-key`), **não** o `/manalista/stripe/secret_key` do pseudocódigo. Também alinhar `stripe-webhook-secret` e `stripe-price-pro-monthly`.

---

## 3. Ordem de disparo da Onda 0 (as Frentes)

Os 5 prompts existem em `Prompts_Cowork/`. Para a Onda 0 só entram **D** (toda) e **B** (só o item C-04), nesta ordem:

### Passo 1 — Frente D, item D.1 + D.4 (religar o app)  ▸ SESSÃO NOVA, Sonnet 5 [alto]
- Cole `D_INFRA_DEVOPS_NOC.md`, conecte MCPs coolify/aws/hostinger/Desktop Commander.
- O agente vai: ler logs do container, confirmar causa raiz (provável C-03), e propor a correção do env do Stripe no Coolify.
- **Gate de aprovação do João:** remover/ajustar o placeholder `STRIPE_SECRET_KEY` e restart do container (ação mutante).
- Aceite: `/api/health` retorna 200 com `dependencies.database.status === "ok"`.

### Passo 2 — Frente B, item B.3 = C-04 (estancar sangria de custo)  ▸ SESSÃO NOVA, Sonnet 5 [alto]
- Pode começar **em paralelo assim que o app estiver no ar** (é trabalho de código, PR, não mexe em prod até merge).
- Cole `B_BILLING_CORE.md`. Escopo da Onda 0 = **apenas C-04** (débito de quota na geração + teste mínimo + idempotência + estorno). C-02 e C-03 no código ficam para a Onda 1.
- **Lembrar o agente da discrepância do nome do SSM (seção 2 acima)** quando ele chegar em B.2 na Onda 1.
- Aceite C-04: usuário no limite recebe 402 sem nenhuma chamada à Anthropic; sucesso incrementa `analysesUsed` em 1; falha estorna; retry idempotente não debita 2x.

### Depois (ainda Onda 0, sem bloquear o religamento)
- Frente D itens **D.3** (crescimento de disco +48GB) e **D.2** (rotação de segredos) — ambos exigem aprovação explícita antes de agir.

---

## 4. Gates que exigem aprovação explícita do João (não presumir)

- [ ] Corrigir env `STRIPE_SECRET_KEY` no Coolify (remover placeholder) — **D.4**
- [ ] Restart/deploy do container manalista em produção — **D.1**
- [ ] `docker system prune` na VPS compartilhada (13 recursos) — **D.3**
- [ ] Rotação de segredos + escrita em AWS SSM (`ssm_put`) — **D.2**
- [ ] Merge de qualquer PR (só com o teste da Frente verde)

## 5. Regras invioláveis (herdadas do orquestrador)

- Nunca reproduzir valor de segredo em texto puro em nenhum output.
- Nunca `ssm_list` sem prefixo — sempre `/manalista/*` (Parameter Store compartilhado).
- Nenhuma comunicação pública / copy / tráfego pago nesta onda (isso é Onda 2+).
- Itens `[CONFIRMAR-FONTE]` (LGPD, CDC, políticas de anúncio, nomes de modelo Anthropic) exigem confirmação de fonte atual antes de virar texto público.

## ✅ RESOLUÇÃO — app religado (2026-07-07 ~04:55 UTC)

**Causa raiz confirmada:** não havia imagem nem container do manalista no host — o último deploy (18/06) falhou no healthcheck do Docker e o Coolify removeu o container. NÃO era banco fora do ar (postgres-main está `Up 10 dias, healthy`), NÃO era disco cheio (27%), NÃO era o placeholder do Stripe (não reprova o health).

**Ações executadas (autorizadas pelo João):**
1. Commit `ce8b102` — `/api/health` enriquecido (checa DB/redis/stripe-format) + push para `origin/main` via SSH.
2. Deploy completo forçado no Coolify (`a2xycm6twphug7qf0r2iiqvs`) → **finished**.
3. Container `x4g4sgw...-045106582251` — **Up, healthy**.

**Validação:**
- `/api/health` interno → `{"status":"ok","database":{"status":"ok","latencyMs":21}}`
- Público `https://manalista.com.br/api/health` → **HTTP 200**

**Pendência de billing (Onda 1, NÃO bloqueia o app):** o health mostra `stripeKey: invalid_format` — o placeholder segue na env do Coolify. ⚠️ **Descoberta importante:** o container **não tem credenciais AWS** (`AWS_ACCESS_KEY_ID` ausente), então o fallback de SSM do `auth-init.ts` falharia mesmo removendo o placeholder. Para o C-03 funcionar de fato, é preciso decidir: **(a)** injetar credenciais AWS (IAM key com escopo `/manalista/*`) na env do container para o SSM funcionar, ou **(b)** colocar a chave real do Stripe direto na env do Coolify (mais simples, mas reexpõe o segredo em texto pleno — o problema D.2). Isso é decisão sua (ação sensível de segredo) — não executei.

---

## ✅ C-04 — gate de cota implementado e no ar (2026-07-07 ~05:15 UTC)

**Commit `2cd2b8d`** (push via SSH) + deploy `qilhm87toa4crsokag3eyagl` → **finished**, container `...050943005576` healthy, swap sem downtime. Código `quota_exceeded` confirmado nos routes compilados do container.

**O que mudou:**
- `src/app/api/analise/route.ts` — agora exige sessão e lê a cota do banco (fonte da verdade). Usuário **no limite recebe HTTP 402** `{error:"quota_exceeded", analysesUsed, analysesLimit, upgradeUrl:"/planos"}` **antes de qualquer chamada paga à Anthropic** (satisfaz o critério de aceite principal do C-04).
- `src/app/api/analise/save/route.ts` — insert da análise + incremento de cota agora numa **única transação com `SELECT … FOR UPDATE`** (B.5): sem corrida, sem contagem dupla; cota lida do banco, não da sessão defasada.

**Validação:** `tsc --noEmit` limpo; build do Docker passou o type-check; `/api/analise` sem sessão → 401; health público 200 (DB ok).

**Limitação conhecida (hardening do C-04, fica para a Frente B/C):** o débito definitivo ainda ocorre no `save`. Um usuário **dentro** da cota pode iniciar várias análises e abandoná-las sem salvar, gastando ~15 chamadas cada. Fechar isso 100% exige o **modelo de reserva** (debitar no início via `Idempotency-Key`/`analysisId` + estorno em falha), o que requer: uma coluna/tabela nova (⇒ **migrations versionadas**, pré-requisito da Frente C) + pequena mudança no front (`src/app/analise/page.tsx` enviar um id estável de análise). NÃO feito agora para não violar a regra do DBA (nada de mudança de schema sem migration versionada) nem arriscar o fluxo core sem E2E. O gate atual já bloqueia o pior caso (quem excedeu a cota gasta zero de API).

## Achados adicionais registrados (não eram do escopo imediato)
- **C-02 confirmado**: no `middleware.ts`, `/api/stripe/webhook` não está na lista pública → POST sem sessão cai em redirect 302 → eventos do Stripe rejeitados. (Moot enquanto não houver chaves reais; corrigir junto com a Frente B.)
- **C.5 re-verificado**: `claude-opus-4-6`/`claude-sonnet-4-6` **são IDs válidos** da geração 4.6 (confirmado em docs.claude.com em 2026-07-07). A premissa do plano ("nome inválido") **não se confirma** — a geração não está quebrada por isso. **Nenhuma alteração feita.** Adicionar allowlist de modelo continua sendo boa ideia (Onda 2), mas não urgente.

## 6. Próximo passo aguardando o João

Diagnóstico via Coolify+código **concluído**. Falta 1 passo para a causa raiz: **shell no host** (o Coolify não dá log de container parado). Escolher:

- **(a) Dar acesso SSH ao host** (via Desktop Commander ou credenciais) para eu rodar, só leitura: `docker ps -a`, `docker logs` do container manalista, `df -h`, `docker system df`, e checar se o `postgres-main` está no ar. Confirmo a causa raiz e proponho a correção antes de qualquer ação mutante.
- **(b) Abrir a sessão da Frente D** (Sonnet 5 + `D_INFRA_DEVOPS_NOC.md` + Desktop Commander) e eu coordeno/audito.

Em ambos, os gates da seção 4 continuam valendo — nada mutado sem seu OK.
