# Backend Agent
**Modelo:** `claude-sonnet-4-6`
**Fases:** BLOCO 1 FASE 1C · BLOCO 4 FASES 4B/4C/4E/4F
**Especialidade:** APIs Next.js, Drizzle ORM, Auth.js v5, Stripe, PDF Node, LGPD

---

## CONTEXTO RECEBIDO DO ORQUESTRADOR

- **Repo:** `~/Documents/DEV/manalista`
- **DB:** PostgreSQL 16 · Drizzle ORM (mesma stack do MyClinicSoft — João já domina)
- **Auth:** Auth.js v5 com Magic Link (Resend) + Google OAuth
- **Pagamento:** Stripe (boleto + Pix via Stripe BR)
- **PDF:** migrar de Python/ReportLab → `@react-pdf/renderer` (Node puro)
- **SSM namespace:** `/manalista/`
- **Desktop Commander:** para git e comandos locais

---

## FASE 1C — PDF Node + Streaming melhorado

### 1C.1 — Migrar PDF para @react-pdf/renderer (1 semana)

**Instalar:**
```bash
cd ~/Documents/DEV/manalista
npm install @react-pdf/renderer
```

**Criar componente do laudo:**

```typescript
// src/components/pdf/DiagnosticPdfDocument.tsx
import {
  Document, Page, Text, View, StyleSheet,
  Font, Image
} from "@react-pdf/renderer";

// Registrar fonte
Font.register({
  family: "Plus Jakarta Sans",
  fonts: [
    { src: "/fonts/PlusJakartaSans-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/PlusJakartaSans-Bold.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Plus Jakarta Sans",
    padding: 48,
    fontSize: 11,
    lineHeight: 1.6,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  h1: { fontSize: 22, fontWeight: 700, color: "#0F172A" },
  h2: { fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8 },
  h3: { fontSize: 13, fontWeight: 700, marginTop: 16, marginBottom: 4 },
  body: { fontSize: 11, lineHeight: 1.6, marginBottom: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 700,
  },
  section: { marginBottom: 20 },
  disclaimer: {
    marginTop: 32,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    fontSize: 9,
    color: "#92400E",
  },
});

interface PdfProps {
  result: DiagnosticResult;
  childData: ChildData;
  language: "pt-BR" | "en-US";
}

export function DiagnosticPdfDocument({ result, childData, language }: PdfProps) {
  const t = language === "pt-BR" ? pdfTextsPtBr : pdfTextsEnUs;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.h1}>MAnalista</Text>
            <Text style={[styles.body, { color: "#64748B" }]}>
              {t.subtitle}
            </Text>
          </View>
          <View>
            <Text style={[styles.body, { textAlign: "right" }]}>
              {new Date().toLocaleDateString(language)}
            </Text>
          </View>
        </View>

        {/* Seção 1: Criança */}
        <View style={styles.section}>
          <Text style={styles.h2}>{t.childSection}</Text>
          <Text style={styles.body}>{t.name}: {childData.name}</Text>
          <Text style={styles.body}>{t.age}: {childData.ageYears} {t.years} {t.ageMonths} {t.months}</Text>
        </View>

        {/* Seção 2: Diagnósticos */}
        <View style={styles.section}>
          <Text style={styles.h2}>{t.diagnosticsSection}</Text>
          {result.diagnoses?.map((diag, i) => (
            <View key={i} style={{ marginBottom: 12 }}>
              <Text style={styles.h3}>{diag.condition}</Text>
              <Text style={styles.body}>{diag.description}</Text>
            </View>
          ))}
        </View>

        {/* Demais seções: recomendações, plano, referências... */}
        {/* Portar as 11 seções do generate_pdf.py */}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>{t.disclaimer}</Text>
        </View>

        {/* Página 2+ para debug do debate (opcional, apenas em planos Pro+) */}
      </Page>
    </Document>
  );
}
```

**Substituir route.ts do relatorio:**

```typescript
// src/app/api/relatorio/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { DiagnosticPdfDocument } from "@/components/pdf/DiagnosticPdfDocument";
import React from "react";

export async function POST(req: Request) {
  const { result, childData, language } = await req.json();

  const buffer = await renderToBuffer(
    React.createElement(DiagnosticPdfDocument, { result, childData, language })
  );

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="laudo-manalista-${Date.now()}.pdf"`,
    },
  });
}
```

**Remover Python do Dockerfile (Infra Agent já cuida, mas confirmar que `scripts/generate_pdf.py` não é mais chamado).**

**Commit:**
```
feat(pdf): migrar gerador de laudo de Python/ReportLab para @react-pdf/renderer
```

### 1C.2 — Melhorar SSE streaming (2h)

**Problema atual:** parsing manual por regex frágil.

**Novo formato de evento SSE padronizado:**

```typescript
// src/lib/sse.ts
export type SseEvent =
  | { type: "agent_start"; agentId: string; agentName: string }
  | { type: "delta"; agentId: string; content: string }
  | { type: "agent_done"; agentId: string }
  | { type: "qa_questions"; questions: QAQuestion[] }
  | { type: "debate_start" }
  | { type: "debate_delta"; agentId: string; content: string }
  | { type: "consolidating" }
  | { type: "complete"; result: DiagnosticResult }
  | { type: "error"; message: string };

export function encodeEvent(event: SseEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
```

**Atualizar cliente em `useAnalysis.ts`:**
```typescript
// Parsear eventos tipados em vez de regex
const event: SseEvent = JSON.parse(line.replace("data: ", ""));
switch (event.type) {
  case "delta": appendChunk(event.agentId, event.content); break;
  case "complete": setResult(event.result); break;
  // ...
}
```

---

## FASE 4B — Drizzle Schema + Migrations

### 4B.1 — Setup Drizzle (2 dias)

```bash
npm install drizzle-orm pg
npm install -D drizzle-kit @types/pg
```

**`drizzle.config.ts`:**
```typescript
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**`src/drizzle/schema.ts`** — implementar o schema completo da Fase 3 do plano:
- `users`, `accounts`, `sessions`, `children`, `analyses`, `debate_messages`, `qa_followups`, `audit_log`, `consents`, `usage_quotas`, `idempotency_keys`, `push_subscriptions`, `subscriptions`

**Cada coluna deve ter tipagem TS estrita via `InferSelectModel` e `InferInsertModel` do Drizzle.**

**`src/lib/db.ts`:**
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/drizzle/schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool, { schema });
```

### 4B.2 — Migrations e seed (1 dia)

```bash
# Gerar primeira migration
npx drizzle-kit generate

# Aplicar em dev
npx drizzle-kit migrate

# Script de migrate para o container (CMD no Dockerfile)
# src/scripts/migrate.ts → compilar para scripts/migrate.js
```

**Seed dos 5 casos demo de `data/simulations/`:**
```bash
# src/scripts/seed.ts — rodar só em staging/dev
```

**Commit:**
```
feat(db): adicionar schema Drizzle completo + migrations iniciais
```

---

## FASE 4C — Auth.js v5

### 4C.1 — Instalar e configurar (3 dias)

```bash
npm install next-auth@beta @auth/drizzle-adapter
```

**`src/lib/auth.ts`:**
```typescript
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "next-auth/providers/resend";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { getParameter } from "@/lib/ssm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Resend({
      apiKey: await getParameter("/manalista/resend-api-key"),
      from: "no-reply@manalista.com.br",
    }),
    Google({
      clientId: await getParameter("/manalista/google-client-id"),
      clientSecret: await getParameter("/manalista/google-client-secret"),
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
```

**`src/app/api/auth/[...nextauth]/route.ts`:**
```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

**SSM params necessários:**
```bash
aws ssm put-parameter --name /manalista/nextauth-secret \
  --value "$(openssl rand -base64 32)" --type SecureString --overwrite
```

### 4C.2 — Páginas de auth (1 dia)

```
src/app/(auth-pages)/
├── login/
│   ├── page.tsx          ← form com email + botão Google
│   └── verify/
│       └── page.tsx      ← "Verifique seu e-mail"
└── logout/
    └── route.ts          ← POST → signOut()
```

**Commit:**
```
feat(auth): adicionar Auth.js v5 com Magic Link e Google OAuth
```

---

## FASE 4E — Stripe + Quotas

### 4E.1 — Stripe checkout (1 semana)

```bash
npm install stripe @stripe/stripe-js
```

**Planos:**
- Basic: R$ 29/mês · 5 análises/mês · PDF · sem histórico
- Pro: R$ 79/mês · 50 análises/mês · histórico · ElevenLabs TTS
- Clínica: R$ 299/mês · ilimitado · multi-usuário · API access

**`/api/stripe/create-checkout/route.ts`:**
```typescript
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { getParameter } from "@/lib/ssm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();
  const stripe = new Stripe(await getParameter("/manalista/stripe-secret-key"));

  const checkout = await stripe.checkout.sessions.create({
    customer_email: session.user.email!,
    payment_method_types: ["card"],
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    mode: "subscription",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/conta/historico?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
    metadata: { userId: session.user.id, plan },
  });

  return Response.json({ url: checkout.url });
}
```

**Webhook Stripe (`/api/stripe/webhook/route.ts`):**
- `customer.subscription.created` → criar subscription no DB
- `customer.subscription.updated` → atualizar status
- `customer.subscription.deleted` → cancelar, zerar quota
- `invoice.payment_succeeded` → renovar quota mensal

### 4E.2 — Sistema de quotas (2 dias)

```typescript
// src/lib/quota.ts
export async function checkAndDecrementQuota(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  plan: string;
}> {
  // Ler subscription ativa do usuário
  // Verificar usage_quotas do período atual
  // Se dentro do limite: decrementar e retornar allowed=true
  // Se excedeu: retornar allowed=false
}
```

**Verificar quota no início de `/api/analise`:**
```typescript
const quota = await checkAndDecrementQuota(session.user.id);
if (!quota.allowed) {
  return Response.json(
    { error: "Quota exceeded", plan: quota.plan, remaining: 0 },
    { status: 402 }
  );
}
```

---

## FASE 4F — LGPD

### 4F.1 — Audit log (2 dias)

```typescript
// src/lib/audit.ts
export async function logAuditEvent(params: {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(auditLog).values({
    ...params,
    createdAt: new Date(),
  });
}
```

**Eventos a logar:**
- `analysis.create` · `analysis.delete` · `analysis.export`
- `user.login` · `user.logout` · `user.delete`
- `data.export` · `data.erase`

### 4F.2 — Export e erase (2 dias)

**`/api/lgpd/export/route.ts`:**
```typescript
// Retorna JSON com todos os dados do usuário (LGPD art. 18)
// Descriptografar colunas PII antes de exportar
// Rate limit: 1 request/24h por usuário
```

**`/api/lgpd/erase/route.ts`:**
```typescript
// Soft delete: users.deletedAt = now()
// Hard delete de children (PII sensível de menor)
// Invalidar sessões ativas
// Cancelar assinatura no Stripe
// Log: audit_log action="data.erase"
```

**Commit:**
```
feat(lgpd): adicionar audit log, export de dados e erase me (LGPD art. 18)
```

---

## VERIFICAÇÕES FINAIS

```bash
npm run check    # 0 erros TypeScript
npm run lint     # 0 critical warnings

# Testar PDF geração
curl -X POST http://localhost:3000/api/relatorio \
  -H "Content-Type: application/json" \
  -d '{"result": {...}, "childData": {...}, "language": "pt-BR"}' \
  --output test.pdf
open test.pdf   # verificar visualmente

# Testar Auth
# Abrir localhost:3000/login → enviar magic link → verificar recebimento

# Testar Stripe (use test keys)
# Completar checkout → verificar subscription no DB → verificar quota
```

---

## REPORTAR AO ORQUESTRADOR

### Fase 1C:
- [ ] PDF via @react-pdf/renderer funcionando
- [ ] Python removido do Dockerfile
- [ ] SSE com eventos tipados

### Fase 4B:
- [ ] Schema Drizzle completo (todas as tabelas)
- [ ] Migration gerada e aplicada em dev
- [ ] Seed dos 5 casos demo

### Fase 4C:
- [ ] Auth.js configurado
- [ ] Magic link chegando via Resend
- [ ] Google OAuth funcionando
- [ ] SSM params criados

### Fase 4E:
- [ ] Stripe checkout em sandbox (test mode)
- [ ] Webhooks validados
- [ ] Quotas funcionando (testar: exceder quota → 402)

### Fase 4F:
- [ ] Audit log registrando eventos
- [ ] Export de dados funcionando
- [ ] Erase me funcionando (soft delete + hard delete de children)
