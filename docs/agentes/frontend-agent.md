# Frontend Agent
**Modelo:** `claude-sonnet-4-6`
**Fases:** BLOCO 1 FASE 1B · BLOCO 4 FASE 4D · BLOCO 5
**Especialidade:** React, refactor de componentes, histórico de análises, performance UI

---

## CONTEXTO RECEBIDO DO ORQUESTRADOR

- **Repo:** `~/Documents/DEV/manalista`
- **Problemas críticos:** `page.tsx` 1016 LOC, `analise/page.tsx` 1073 LOC, CSS inline maciço
- **Pré-requisito Fase 1B:** UI Agent concluído (Tailwind v4 + shadcn instalados)
- **Pré-requisito Fase 4D:** Backend Agent Fase 4C concluído (Auth.js rodando)

---

## FASE 1B — Refactor de componentes

### 1B.1 — Extrair landing em componentes (3 dias)

**Meta:** `src/app/page.tsx` com < 200 LOC (apenas composição).

**Estrutura de componentes a criar:**

```
src/components/landing/
├── HeroSection.tsx         ← hero + CTA principal
├── ProblemSection.tsx      ← seção do problema
├── HowItWorksSection.tsx   ← fluxo/steps
├── TeamSection.tsx         ← equipe de especialistas
├── FeaturesSection.tsx     ← features do produto
├── PricingSection.tsx      ← planos e preços
├── FaqSection.tsx          ← FAQ
├── CtaBanner.tsx           ← CTA final
└── Footer.tsx              ← rodapé
```

**Estratégia de migração:**
1. Ler o `page.tsx` atual inteiro
2. Identificar seções por heading/comentário
3. Extrair uma por vez, testando visualmente no localhost
4. Substituir CSS inline por classes Tailwind v4 + tokens OKLCH
5. Usar componentes shadcn (Button, Card, Badge) onde aplicável

**Meta de qualidade por componente:**
- Zero CSS inline (usar tokens via CSS vars)
- Props tipadas com TypeScript strict
- Aria labels em todos os elementos interativos
- Testável com Vitest + Testing Library

### 1B.2 — Extrair hook useAnalysis de analise/page.tsx (2 dias)

**`src/app/analise/page.tsx`** tem 1073 LOC misturando UI + lógica. Extrair:

```typescript
// src/hooks/useAnalysis.ts
// Responsabilidade: gerenciar estado do fluxo de análise

export function useAnalysis() {
  // Estado
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [qaQuestions, setQaQuestions] = useState<QAQuestion[]>([]);

  // Ações
  const startAnalysis = useCallback(async (childData: ChildData) => { ... }, []);
  const submitQAAnswers = useCallback(async (answers: QAAnswer[]) => { ... }, []);
  const reset = useCallback(() => { ... }, []);

  return { status, messages, result, qaQuestions, startAnalysis, submitQAAnswers, reset };
}
```

**`analise/page.tsx` resultante:** < 200 LOC, apenas composição de componentes.

### 1B.3 — useDeferredValue no streaming (2h)

**Problema atual:** cada chunk do SSE chama `setState` → re-render pesado.

```typescript
// Em useAnalysis.ts
import { useDeferredValue, useRef } from "react";

// Buffer de chunks — agrupar em 50ms
const bufferRef = useRef<string>("");
const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

function appendChunk(chunk: string) {
  bufferRef.current += chunk;
  if (flushTimer.current) clearTimeout(flushTimer.current);
  flushTimer.current = setTimeout(() => {
    setMessages(prev => /* aplicar bufferRef.current */);
    bufferRef.current = "";
  }, 50);
}

// No componente que renderiza as mensagens
const deferredMessages = useDeferredValue(messages);
```

### 1B.4 — Paralelizar análise dos 7 especialistas (4h)

**Localizar em `/api/analise/route.ts`** onde os agentes são chamados sequencialmente.

**Substituir por `Promise.all`:**

```typescript
// ANTES (sequencial ~2-5 min):
for (const agent of agents) {
  const result = await callAgent(agent, childData);
  // ...
}

// DEPOIS (paralelo ~40-90s):
const agentResults = await Promise.all(
  agents.map(agent => callAgent(agent, childData))
);
```

**Nota:** os agentes de `analyze` são independentes entre si — apenas `debate` e `consolidate` dependem do `analyze`. Paralelizar APENAS o `analyze`.

**SSE durante paralelo:** transmitir chunks de cada agente conforme chegam, não esperar todos terminarem:

```typescript
// Usar Promise.allSettled para não falhar tudo se um agente falhar
const results = await Promise.allSettled(
  agents.map(async (agent) => {
    const result = await callAgent(agent, childData);
    // Emitir SSE evento imediatamente quando cada agente termina
    controller.enqueue(encode(`data: ${JSON.stringify({ agent: agent.id, content: result })}\n\n`));
    return result;
  })
);
```

**Commit:**
```
perf(analysis): paralelizar analyze dos 7 especialistas com Promise.all
```

### 1B.5 — Lighthouse CI no PR (4h)

**Instalar:**
```bash
npm install -D @lhci/cli
```

**`.lighthouserc.json`:**
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", {"minScore": 0.85}],
        "categories:accessibility": ["error", {"minScore": 1.0}],
        "categories:best-practices": ["warn", {"minScore": 0.95}],
        "categories:seo": ["error", {"minScore": 1.0}]
      }
    }
  }
}
```

**Adicionar step no `.github/workflows/ci.yml`:**
```yaml
- name: Lighthouse CI
  run: npx lhci autorun
  env:
    LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

---

## FASE 4D — Histórico de análises

**Pré-requisito:** Auth.js rodando + tabelas `analyses` e `children` no Postgres.

### 4D.1 — Página /conta/historico (4 dias)

```
src/app/(auth)/conta/
├── layout.tsx          ← layout autenticado (redireciona se não logado)
├── historico/
│   ├── page.tsx        ← listagem paginada de análises
│   └── [id]/
│       └── page.tsx    ← detalhe de uma análise
└── perfil/
    └── page.tsx        ← configurações, preferências TTS, exclusão de conta
```

**Componentes para o histórico:**

```typescript
// src/components/historico/AnalysisCard.tsx
// Card com: data, nome da criança (descriptografado no server), score geral, status, ações (ver, baixar PDF, excluir)

// src/components/historico/AnalysisList.tsx
// Lista com paginação (10 por página), search, filtros por data

// src/components/historico/EmptyState.tsx
// Estado vazio quando não há análises — CTA para iniciar primeira análise
```

**Server Component (App Router):**
```typescript
// src/app/(auth)/conta/historico/page.tsx
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { analyses, children } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";

export default async function HistoricoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userAnalyses = await db
    .select()
    .from(analyses)
    .where(eq(analyses.userId, session.user.id))
    .orderBy(desc(analyses.createdAt))
    .limit(10);

  return <AnalysisList analyses={userAnalyses} />;
}
```

### 4D.2 — Download PDF do histórico

A rota `/api/relatorio` deve aceitar `analysisId` e re-gerar o PDF a partir dos dados salvos:

```typescript
// POST /api/relatorio { analysisId: uuid }
// Ler análise do DB → gerar PDF → retornar
```

Ou se o PDF foi salvo em disco/R2, servir diretamente.

---

## FASE 5 — Refinamentos (após Bloco 4)

### 5A.1 — i18n com next-intl

```bash
npm install next-intl
```

Migrar o estado `language: "pt-BR" | "en-US"` atual para `next-intl` com:
- `messages/pt-BR.json` e `messages/en-US.json`
- Remoção do estado manual de i18n em cada componente
- URL-based locale: `/pt-BR/...` e `/en-US/...`

### 5A.2 — Background Sync Android

```typescript
// No Service Worker (pwa-agent já implementou base)
// Registrar sync event quando análise falhar offline
self.addEventListener("sync", (event) => {
  if (event.tag === "retry-analysis") {
    event.waitUntil(retryPendingAnalyses());
  }
});
```

---

## VERIFICAÇÕES FINAIS POR FASE

### Fase 1B:
```bash
npm run check          # 0 erros
npm run lint           # 0 critical warnings
npm run build          # build funciona
# Verificar visualmente:
# - Landing renderiza corretamente
# - Analise page funciona end-to-end
# - Análise em paralelo: medir tempo (deve ser 2-3x mais rápido)
```

### Fase 4D:
```bash
# Testar fluxo:
# 1. Login → /conta/historico
# 2. Ver lista de análises
# 3. Clicar em análise → ver detalhe
# 4. Baixar PDF
# 5. Excluir análise (soft delete)
```

---

## REPORTAR AO ORQUESTRADOR

### Fase 1B:
- [ ] page.tsx com < 200 LOC
- [ ] analise/page.tsx com < 200 LOC
- [ ] useAnalysis hook extraído
- [ ] Promise.all nos specialists (medir speedup)
- [ ] useDeferredValue no streaming
- [ ] Lighthouse CI no PR

### Fase 4D:
- [ ] /conta/historico funcionando
- [ ] Paginação implementada
- [ ] Download de PDF do histórico
- [ ] Exclusão de análise (LGPD)
