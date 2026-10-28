# Infra Agent
**Modelo:** `claude-sonnet-4-6`
**Fases:** BLOCO 0 FASE 0C · BLOCO 4 FASE 4A
**Especialidade:** Coolify, Postgres, Redis, Cloudflare DNS, Dockerfile, backups

---

## CONTEXTO RECEBIDO DO ORQUESTRADOR

- **Coolify:** srv1 `62.72.63.18` · App UUID `x4g4sgw48s4s84wg8kkggs8g`
- **MCP Coolify:** `mcp__coolify-mcp__*`
- **MCP Hostinger:** `mcp__mcp-hostinger__*` ou `mcp__plugin_hostinger-api_hostinger-mcp__*`
- **Cloudflare MCP:** `mcp__c17e1cee-7966-4295-8127-adf78f5ad6a1__*`
- **Desktop Commander:** para comandos no Mac do João
- **SSM:** `/manalista/` namespace, executar via `aws ssm` no Desktop Commander

---

## FASE 0C — DNS e Cloudflare

### 0C.1 — Verificar DNS atual (15 min)

```bash
# Executar via Desktop Commander
dig +short manalista.com.br
dig +short www.manalista.com.br
whois manalista.com.br | grep -i "name server"
```

**Esperado:** registros A apontando para `62.72.63.18`.

### 0C.2 — Criar conta Cloudflare e adicionar zona

**Passo a passo (instruir João para fazer manualmente, pois requer login):**
1. Acessar cloudflare.com → "Add a Site" → digitar `manalista.com.br`
2. Escolher plano **Free**
3. Cloudflare faz scan automático dos registros DNS existentes e importa
4. Anotar os 2 nameservers fornecidos (ex: `ns1.cloudflare.com`, `ns2.cloudflare.com`)

**Via MCP Cloudflare** (se autenticado):
```
mcp__c17e1cee-7966-4295-8127-adf78f5ad6a1__accounts_list
```
Verificar se há conta Cloudflare já configurada.

### 0C.3 — Atualizar nameservers no Hostinger

Via MCP Hostinger:
```
mcp__plugin_hostinger-api_hostinger-mcp__domains_updateDomainNameserversV1
domainName: manalista.com.br
nameservers: [<ns1-cloudflare>, <ns2-cloudflare>]
```

Ou instruir João via UI do Hostinger: Domains → manalista.com.br → Nameservers.

**Aguardar propagação:** 5min–24h. Verificar com:
```bash
dig NS manalista.com.br
# Deve retornar nameservers da Cloudflare
```

### 0C.4 — Configurar Cloudflare (após propagação)

**Registros DNS na Cloudflare (verificar e ajustar):**

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `62.72.63.18` | 🟠 ON |
| A | `www` | `62.72.63.18` | 🟠 ON |
| MX | `@` | (manter Hostinger ou Resend depois) | OFF |

**SSL/TLS → Full (Strict)**

**Edge Certificates:**
- Always Use HTTPS: ON
- Min TLS Version: 1.2
- TLS 1.3: ON
- HSTS: max-age 63072000, includeSubDomains (preload depois de 6 meses)

**Cache Rules:**
- `/_next/static/*` → Edge TTL 30 dias · Browser TTL 30 dias
- `/api/*` → Bypass cache

**WAF:**
- Managed Rules: ON
- OWASP Core Rule Set: ON
- Bot Fight Mode: ON

**Rate Limiting (Free - 10K req/mês):**
- Regra: path matches `/api/analise` AND rate > 10 req/10s por IP → Block

**Speed:**
- Brotli: ON
- HTTP/3 (QUIC): ON
- 0-RTT: ON

**Validação:**
```bash
curl -I https://manalista.com.br
# Deve conter: cf-ray, server: cloudflare
```

**Commit em repo (next.config.ts):** O security-agent já adicionou os headers. Confirmar que HSTS está correto.

---

## FASE 4A — Postgres e Redis no Coolify

### 4A.1 — Criar Postgres 16 como service

**Via MCP Coolify:**
```
# Listar projetos existentes
mcp__coolify-mcp__coolify_list_projects

# Criar service Postgres no mesmo project do manalista
# Usar interface web do Coolify:
# Project manalista → Add Resource → Database → PostgreSQL 16
```

**Configurações:**
- Name: `postgres-manalista`
- Database: `manalista`
- Username: `manalista`
- Password: gerar com `openssl rand -base64 24` → salvar no SSM
- Port interno: 5432 (não expor externamente)

```bash
# Salvar senha no SSM
PGPASS=$(openssl rand -base64 24)
aws ssm put-parameter \
  --name /manalista/postgres-password \
  --value "$PGPASS" \
  --type SecureString \
  --overwrite

# DATABASE_URL completa
aws ssm put-parameter \
  --name /manalista/database-url \
  --value "postgresql://manalista:${PGPASS}@postgres-manalista:5432/manalista" \
  --type SecureString \
  --overwrite
```

**Verificar conectividade após criar:**
```bash
# Via Docker exec no Coolify ou Desktop Commander com psql
# O app Next.js não consegue conectar ainda — será configurado no Bloco 4B
```

### 4A.2 — Criar Redis 7 como service

**Via Coolify UI:**
- Project manalista → Add Resource → Database → Redis 7
- Name: `redis-manalista`
- Password: gerar e salvar no SSM

```bash
REDIS_PASS=$(openssl rand -base64 24)
aws ssm put-parameter \
  --name /manalista/redis-password \
  --value "$REDIS_PASS" \
  --type SecureString \
  --overwrite

aws ssm put-parameter \
  --name /manalista/redis-url \
  --value "redis://:${REDIS_PASS}@redis-manalista:6379" \
  --type SecureString \
  --overwrite
```

### 4A.3 — Configurar env vars no app Coolify

Via `mcp__coolify-mcp__coolify_update_env` ou UI:
```
DATABASE_URL = (ler de /manalista/database-url)
REDIS_URL    = (ler de /manalista/redis-url)
```

### 4A.4 — Configurar backups Postgres

**Via Coolify UI (Postgres service → Backups):**
- Daily backup: 03:00 UTC
- Retention: 14 dias locais

**Off-site para Cloudflare R2:**
```bash
# Script em ~/Documents/DEV/manalista/scripts/backup-postgres.sh
#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_URL=$(aws ssm get-parameter --name /manalista/database-url --with-decryption --query Parameter.Value --output text)
R2_BUCKET="manalista-backups"
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"

# Dump
pg_dump "$DB_URL" | gzip | \
  openssl enc -aes-256-cbc -pbkdf2 \
  -k "$(aws ssm get-parameter --name /manalista/backup-encryption-key --with-decryption --query Parameter.Value --output text)" | \
  aws s3 cp - "s3://${R2_BUCKET}/postgres/${TIMESTAMP}.sql.gz.enc" \
    --endpoint-url "$R2_ENDPOINT"

echo "Backup concluído: ${TIMESTAMP}"
```

**Agendar via cron no srv1** (via Coolify cron job ou script separado):
```
0 3 * * 0 /scripts/backup-postgres.sh >> /var/log/backup.log 2>&1
```

### 4A.5 — Refatorar Dockerfile (remover Python)

**Ler Dockerfile atual** e substituir:

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

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --spider -q http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

**Nota:** o estágio de migração (`node scripts/migrate.js`) será adicionado pelo backend-agent quando Drizzle for configurado (Fase 4B).

**Commit:**
```
infra(docker): remover Python/ReportLab, adicionar healthcheck, runner non-root
```

---

## VERIFICAÇÕES FINAIS

```bash
# Cloudflare
curl -I https://manalista.com.br | grep -E "cf-ray|server"

# Postgres (após Bloco 4B quando app conectar)
# Redis (idem)

# Dockerfile build local
cd ~/Documents/DEV/manalista
docker build -t manalista-test . --no-cache
docker images manalista-test  # verificar tamanho < 120MB
```

---

## REPORTAR AO ORQUESTRADOR

- [ ] Cloudflare proxied ativo (cf-ray header presente)
- [ ] SSL Full Strict funcionando
- [ ] WAF ON
- [ ] Postgres service rodando no Coolify
- [ ] Redis service rodando no Coolify
- [ ] SSM params criados: database-url, redis-url, postgres-password, redis-password
- [ ] Dockerfile sem Python · container < 120MB
- [ ] Backup script criado e testado
