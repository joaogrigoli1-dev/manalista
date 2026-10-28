# Security Agent
**Modelo:** `claude-sonnet-4-6`
**Fase:** BLOCO 0 — FASE 0B
**Especialidade:** Rate limiting, headers de segurança, CSP, validação backend (zod)

---

## CONTEXTO RECEBIDO DO ORQUESTRADOR

- **Repo:** `~/Documents/DEV/manalista`
- **APIs críticas:** `/api/analise` (POST, chama Claude — risco de DoS + custo)
- **APIs secundárias:** `/api/relatorio` (POST, gera PDF)
- **SSM:** segredos via `aws ssm` CLI com Desktop Commander
- **Pré-requisito:** DevOps Agent concluído (CI rodando)

---

## TAREFAS — FASE 0B

### 0B.1 — Validação zod no backend (2h)

**Em `/api/analise/route.ts`**, adicionar no início do handler POST:

```typescript
import { z } from "zod";

const ChildDataSchema = z.object({
  // Adaptar ao schema atual do ChildForm
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(216), // meses, 0-18 anos
  sex: z.enum(["M", "F", "outro"]),
  language: z.enum(["pt-BR", "en-US"]).default("pt-BR"),
  // ... demais campos do ChildData type
}).strict();

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ChildDataSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const childData = parsed.data;
  // ... resto do handler com childData validado
}
```

**Ler `src/types/index.ts`** para entender o shape atual do `ChildData` e criar o schema zod correspondente.

**Em `/api/relatorio/route.ts`**, validar o payload de forma similar.

**Commit:**
```
security(api): adicionar validação zod em /api/analise e /api/relatorio
```

### 0B.2 — Rate limiting em /api/analise (4h)

**Opção A — Redis (preferido, mas Redis só existe no Bloco 4):**
Implementar rate limit em memória por enquanto, com comentário `TODO: migrar para Redis quando disponível`.

**Opção B — Rate limit em memória por IP (implementar agora):**

```typescript
// src/lib/rate-limit.ts
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// Limpar entradas expiradas a cada 10 minutos
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 10 * 60 * 1000);
}
```

**Aplicar em `/api/analise/route.ts`:**

```typescript
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed, remaining, resetAt } = checkRateLimit(
    `analise:${ip}`,
    10,        // 10 requisições
    60 * 1000  // por minuto
  );

  if (!allowed) {
    return Response.json(
      { error: "Rate limit exceeded. Try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // ... resto do handler
}
```

**Commit:**
```
security(api): adicionar rate limiting em /api/analise (10 req/min por IP)
```

### 0B.3 — Headers de segurança no next.config.ts (1h)

**Ler o `next.config.ts` atual** e adicionar/substituir a seção `headers`:

```typescript
// next.config.ts
const nextConfig = {
  // ... configuração existente

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
          },
          // CSP provisório (remover unsafe-eval em Bloco 1 quando CSS-in-JS for removido)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // TODO: nonce em Bloco 1
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self' https://api.anthropic.com https://*.sentry.io",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};
```

**Commit:**
```
security(headers): adicionar HSTS, CSP, X-Frame-Options e demais headers
```

### 0B.4 — Sentry integração (3h)

**Instalar:**
```bash
cd ~/Documents/DEV/manalista
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs --skip-connect
```

**Criar DSN no sentry.io** (conta grátis) e salvar no SSM:
```bash
aws ssm put-parameter \
  --name /manalista/sentry-dsn \
  --value "https://xxx@yyy.ingest.sentry.io/zzz" \
  --type SecureString \
  --overwrite
```

**Configurar `sentry.client.config.ts`:**
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    // Scrub PII — nunca enviar nome ou dados da criança
    if (event.extra) {
      delete event.extra.childName;
      delete event.extra.name;
    }
    if (event.request?.data) {
      try {
        const body = typeof event.request.data === "string"
          ? JSON.parse(event.request.data)
          : event.request.data;
        delete body.name;
        delete body.childName;
        event.request.data = JSON.stringify(body);
      } catch {}
    }
    return event;
  },
});
```

**Adicionar ao `.env.local` (não commitar):**
```
SENTRY_DSN=https://...
```

**Adicionar ao Coolify env** via `mcp__coolify-mcp__coolify_update_env` ou UI.

**Commit:**
```
security(monitoring): integrar Sentry com PII scrubbing
```

### 0B.5 — CSRF básico (1h)

**Em todas as rotas POST**, verificar `Origin` header:

```typescript
// src/lib/csrf.ts
export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL ?? "https://manalista.com.br",
    "http://localhost:3000",
  ];
  if (!origin) return false; // rejeitar sem origin em produção
  return allowedOrigins.some((allowed) => origin.startsWith(allowed));
}
```

**Commit:**
```
security(csrf): adicionar validação de Origin em rotas POST
```

---

## VERIFICAÇÕES FINAIS

```bash
cd ~/Documents/DEV/manalista
npm run check
npm run lint
npm run build

# Testar headers em dev (após npm run dev)
curl -I http://localhost:3000/api/health

# Testar rate limit
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/analise \
    -H "Content-Type: application/json" -d '{"test":true}'
done
# Esperar 429 a partir da 11ª requisição
```

---

## REPORTAR AO ORQUESTRADOR

- [ ] zod validando corretamente (testar com payload inválido → 422)
- [ ] Rate limit funcionando (testar com loop → 429 na 11ª req)
- [ ] Headers presentes (curl -I → ver HSTS, X-Frame-Options etc)
- [ ] Sentry capturando erros de teste
- [ ] SSM param `/manalista/sentry-dsn` criado
