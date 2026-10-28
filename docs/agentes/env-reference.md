# Referência de Variáveis de Ambiente — MAnalista
**Fonte da verdade para todos os agentes**

---

## REGRA ABSOLUTA

> Nenhum segredo vai para o código-fonte, `.env` commitado, ou log.
> Todos os valores sensíveis vivem no **AWS SSM Parameter Store** (`/manalista/`).
> Em runtime, o app lê via `src/lib/ssm.ts` com cache de 5 min.

---

## VARIÁVEIS POR BLOCO

### BLOCO 0 — Já existem ou criar agora

| Variável | SSM Path | Tipo | Criado por |
|---|---|---|---|
| Claude API Key | `/IA_Equipe_P/claude-api-key` | SecureString | Já existe |
| Sentry DSN | `/manalista/sentry-dsn` | SecureString | security-agent |
| NextAuth Secret | `/manalista/nextauth-secret` | SecureString | backend-agent |

### BLOCO 4 — Criar durante execução

| Variável | SSM Path | Tipo | Criado por |
|---|---|---|---|
| Postgres Password | `/manalista/postgres-password` | SecureString | infra-agent |
| Database URL | `/manalista/database-url` | SecureString | infra-agent |
| Redis Password | `/manalista/redis-password` | SecureString | infra-agent |
| Redis URL | `/manalista/redis-url` | SecureString | infra-agent |
| Google Client ID | `/manalista/google-client-id` | String | backend-agent |
| Google Client Secret | `/manalista/google-client-secret` | SecureString | backend-agent |
| Resend API Key | `/manalista/resend-api-key` | SecureString | backend-agent |
| Stripe Secret Key | `/manalista/stripe-secret-key` | SecureString | backend-agent |
| Stripe Webhook Secret | `/manalista/stripe-webhook-secret` | SecureString | backend-agent |
| VAPID Public Key | `/manalista/vapid-public-key` | String | pwa-agent |
| VAPID Private Key | `/manalista/vapid-private-key` | SecureString | pwa-agent |
| Backup Encryption Key | `/manalista/backup-encryption-key` | SecureString | infra-agent |

### BLOCO 5 — Criar quando features forem ligadas

| Variável | SSM Path | Tipo | Criado por |
|---|---|---|---|
| ElevenLabs API Key | `/manalista/elevenlabs-api-key` | SecureString | backend-agent |

---

## VARIÁVEIS NÃO-SENSÍVEIS (Coolify env, podem ser String)

```ini
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://manalista.com.br
NEXT_PUBLIC_BUILD_ID=${COMMIT_SHA}
NEXTAUTH_URL=https://manalista.com.br
RESEND_FROM_EMAIL=no-reply@manalista.com.br
VAPID_SUBJECT=mailto:contato@manalista.com.br
FEATURE_TTS_ELEVENLABS=false
FEATURE_HISTORY=false         # true após Bloco 4
FEATURE_PAYMENTS=false        # true após Bloco 4E pronto
AWS_REGION=us-east-1
SSM_CLAUDE_KEY_NAME=/IA_Equipe_P/claude-api-key
```

---

## COMO LER SSM EM RUNTIME

```typescript
// src/lib/ssm.ts (JÁ EXISTE — usar este módulo, não criar outro)
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const client = new SSMClient({ region: process.env.AWS_REGION ?? "us-east-1" });
const cache = new Map<string, { value: string; expiresAt: number }>();
const TTL = 5 * 60 * 1000; // 5 minutos

export async function getParameter(name: string): Promise<string> {
  const cached = cache.get(name);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const resp = await client.send(
    new GetParameterCommand({ Name: name, WithDecryption: true })
  );
  const value = resp.Parameter?.Value ?? "";
  cache.set(name, { value, expiresAt: Date.now() + TTL });
  return value;
}
```

---

## COMO CRIAR PARÂMETROS VIA DESKTOP COMMANDER

```bash
# Leitura (verificar se existe)
aws ssm get-parameter \
  --name /manalista/NOME \
  --with-decryption \
  --query Parameter.Value \
  --output text

# Criação
aws ssm put-parameter \
  --name /manalista/NOME \
  --value "VALOR" \
  --type SecureString \
  --overwrite

# Listar todos do namespace
aws ssm get-parameters-by-path \
  --path /manalista \
  --with-decryption \
  --query "Parameters[*].{Name:Name,Value:Value}"
```

---

## COOLIFY ENV CONFIGURAÇÃO

Variáveis que precisam estar no Coolify (UI: app → Environment Variables):

```
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://manalista.com.br
NEXTAUTH_URL=https://manalista.com.br
NEXTAUTH_SECRET=<ler do SSM /manalista/nextauth-secret>
DATABASE_URL=<ler do SSM /manalista/database-url>
REDIS_URL=<ler do SSM /manalista/redis-url>
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<IAM key com acesso ao SSM>
AWS_SECRET_ACCESS_KEY=<IAM secret>
SENTRY_DSN=<ler do SSM /manalista/sentry-dsn>
RESEND_FROM_EMAIL=no-reply@manalista.com.br
VAPID_SUBJECT=mailto:contato@manalista.com.br
FEATURE_HISTORY=false
FEATURE_PAYMENTS=false
FEATURE_TTS_ELEVENLABS=false
```

Os outros segredos (Stripe, Google, Resend API key, VAPID private) são lidos do SSM em runtime pelo app.

---

## VAPID KEYS — COMO GERAR

```bash
# Instalar web-push uma vez
npm install -g web-push

# Gerar par de chaves
web-push generate-vapid-keys
# Output:
# Public Key: BE_xxx...
# Private Key: _xxx...

# Salvar no SSM
aws ssm put-parameter --name /manalista/vapid-public-key \
  --value "BE_xxx..." --type String --overwrite

aws ssm put-parameter --name /manalista/vapid-private-key \
  --value "_xxx..." --type SecureString --overwrite

# Adicionar public key no Coolify como VAPID_PUBLIC_KEY (não sensível)
```

---

## IAM POLICY MÍNIMA (para o container Coolify)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SSMReadManalista",
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParametersByPath"],
      "Resource": [
        "arn:aws:ssm:us-east-1:*:parameter/manalista/*",
        "arn:aws:ssm:us-east-1:*:parameter/IA_Equipe_P/*"
      ]
    }
  ]
}
```
