import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getClaudeApiKey } from "@/lib/aws-ssm";
import { buildSystemPrompt, buildChildDataPrompt, buildTaskInstruction } from "@/lib/agents/prompts";
import { rateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { auth } from "@/auth";
import { db } from "@/lib/db-server";
import { users, analysisRuns } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { internalErrorResponse, logAndRef } from "@/lib/api-error";
import type { AgentId } from "@/types";

// Valida o formato do Idempotency-Key (runId) enviado pelo cliente.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const runtime = "nodejs";
export const maxDuration = 120;

// ── Schema de validação (zod) ──────────────────────────────────────────────
const DebateMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(20_000),
});

const ChildDataSchema = z.object({
  name: z.string().min(1).max(100),
  birthdate: z.string().max(20),
  ageYears: z.number().int().min(0).max(18),
  ageMonths: z.number().int().min(0).max(216),
  sex: z.enum(["M", "F", "outro"]),
  mainComplaints: z.string().max(5_000),
  complaintDuration: z.string().max(500),
  gestationalAge: z.string().max(200),
  birthComplications: z.string().max(2_000),
  motorMilestones: z.string().max(2_000),
  languageMilestones: z.string().max(2_000),
  socialMilestones: z.string().max(2_000),
  behaviorHome: z.string().max(2_000),
  behaviorSchool: z.string().max(2_000),
  sleepPattern: z.string().max(1_000),
  feedingPattern: z.string().max(1_000),
  familyHistory: z.string().max(2_000),
  previousDiagnoses: z.string().max(2_000),
  currentMedications: z.string().max(1_000),
  therapiesInProgress: z.string().max(1_000),
  familyStructure: z.string().max(1_000),
  parentingChallenges: z.string().max(2_000),
});

const BodySchema = z.object({
  agentId: z.enum([
    "mediator", "psi-infantil", "psi-parentalidade",
    "neuropediatra", "bcba", "fonoaudiologia",
    "terapeuta-ocupacional", "psiquiatra-infantil",
  ]),
  childData: ChildDataSchema,
  debateHistory: z.array(DebateMessageSchema).max(50).optional(),
  lang: z.enum(["pt", "en"]),
  task: z.enum(["analyze", "debate", "consolidate"]),
});

// Estratégia híbrida de modelos:
// - Opus 4.8 para o mediador (consolidação exige síntese profunda)
// - Sonnet 5 para os 7 especialistas (análise e debate — rápido e preciso)
// C.5 fix: os identificadores anteriores ("claude-opus-4-6" / "claude-sonnet-4-6")
// não correspondem a nenhum modelo Anthropic válido — toda chamada a este
// endpoint estava falhando na API da Anthropic (erro de "model not found"),
// silenciosamente devolvido como {error} dentro do stream SSE. Identificadores
// corretos e atualmente disponíveis: "claude-opus-4-8" e "claude-sonnet-5".
const KNOWN_MODELS = new Set(["claude-opus-4-8", "claude-sonnet-5"]);

function getModelForAgent(agentId: AgentId): string {
  const model = agentId === "mediator" ? "claude-opus-4-8" : "claude-sonnet-5";
  if (!KNOWN_MODELS.has(model)) {
    // Nunca cair em fallback silencioso para um modelo diferente do
    // pretendido — em contexto de saúde, isso pode degradar a qualidade do
    // raciocínio clínico simulado sem que ninguém perceba.
    throw new Error(`Modelo de IA desconhecido/não permitido: ${model}`);
  }
  return model;
}

// Tokens por fase:
// - analyze / debate: 2048 (especialistas, respostas focadas)
// - consolidate: 3500 (mediador precisa sintetizar 7 análises)
function getMaxTokens(task: string): number {
  return task === "consolidate" ? 3500 : 2048;
}

export async function POST(req: NextRequest) {
  // ── CSRF ───────────────────────────────────────────────────────────────
  if (!validateOrigin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Rate limit: 10 req/min por IP ──────────────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  // A-04: rate limit em Redis (com fallback gracioso em memória se REDIS_URL ausente).
  const rl = await rateLimit(`analise:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSeconds),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rl.resetAt),
        },
      }
    );
  }

  // ── Validação zod ─────────────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const body = parsed.data;

  // ── Sessão + reserva de cota por "run" (C-04 completo) ─────────────────
  // O débito de cota acontece UMA vez por análise completa, no INÍCIO da
  // sequência de ~15 chamadas pagas (7 analyze + 7 debate + 1 consolidate),
  // não no /save. O cliente envia um `Idempotency-Key` (runId estável) em
  // TODAS as 15 chamadas da mesma análise; a primeira chamada cria a "run" e
  // debita 1 unidade sob lock (SELECT … FOR UPDATE na linha do usuário); as
  // demais reconhecem a run existente e prosseguem sem novo débito. Assim:
  //  - quem excedeu a cota recebe 402 ANTES de qualquer chamada à Anthropic;
  //  - uma geração bem-sucedida incrementa analysesUsed em exatamente 1;
  //  - um retry com o mesmo Idempotency-Key não debita de novo (idempotência);
  //  - a falha do pipeline é estornada via POST /api/analise/complete.
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  const userId = session.user.id as string;

  const runId = req.headers.get("Idempotency-Key")?.trim();
  if (!runId || !UUID_RE.test(runId)) {
    return Response.json(
      { error: "missing_idempotency_key", detail: "Header 'Idempotency-Key' (UUID) obrigatório." },
      { status: 400 }
    );
  }

  // Reserva atômica. O FOR UPDATE na linha do usuário serializa as ~7
  // chamadas concorrentes da fase "analyze" que compartilham o mesmo runId:
  // a primeira a obter o lock cria a run e debita; as demais veem a run já
  // existente e não debitam de novo (sem corrida, sem contagem dupla).
  const reservation = await db.transaction(async (tx) => {
    // IMPORTANTE: adquire o lock da linha do usuário ANTES de checar a run.
    // As ~7 chamadas concorrentes da fase "analyze" compartilham o runId; se a
    // checagem de existência fosse feita antes do lock, duas transações
    // poderiam ler "não existe", serializar no lock e ambas tentarem inserir o
    // mesmo runId (violação de PK). Sob o lock, apenas uma transação avalia a
    // existência por vez, então a 2ª já enxerga a run criada pela 1ª.
    const [u] = await tx
      .select({ used: users.analysesUsed, limit: users.analysesLimit })
      .from(users)
      .where(eq(users.id, userId))
      .for("update")
      .limit(1);

    if (!u) return { status: 401 as const };

    const [existingRun] = await tx
      .select({ id: analysisRuns.id })
      .from(analysisRuns)
      .where(eq(analysisRuns.id, runId))
      .limit(1);

    // Run já reservada (chamada subsequente da mesma análise) → segue sem débito.
    if (existingRun) return { status: 200 as const };

    // Primeira chamada desta run: só reserva se houver cota.
    if (u.used >= u.limit) {
      return {
        status: 402 as const,
        body: {
          error: "quota_exceeded",
          analysesUsed: u.used,
          analysesLimit: u.limit,
          upgradeUrl: "/planos",
        },
      };
    }

    await tx.insert(analysisRuns).values({ id: runId, userId, status: "running" });
    await tx
      .update(users)
      .set({ analysesUsed: sql`analyses_used + 1` })
      .where(eq(users.id, userId));

    return { status: 200 as const };
  });

  if (reservation.status === 401) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (reservation.status === 402) {
    return Response.json(reservation.body, { status: 402 });
  }

  try {
    const apiKey = await getClaudeApiKey();
    const client = new Anthropic({ apiKey });
    const systemPrompt = buildSystemPrompt(body.agentId, body.lang);
    const dataContext   = buildChildDataPrompt(body.childData, body.lang);
    const model = getModelForAgent(body.agentId);
    const maxTokens = getMaxTokens(body.task);

    // Monta o histórico de mensagens para o debate
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: dataContext },
    ];

    if (body.debateHistory && body.debateHistory.length > 0) {
      for (const msg of body.debateHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Instrução específica por agente e tarefa
    const taskInstruction = buildTaskInstruction(body.agentId, body.task, body.lang);
    messages.push({ role: "user", content: taskInstruction });

    // Stream SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model,
            max_tokens: maxTokens,
            system: systemPrompt,
            messages,
          });
          for await (const chunk of response) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const data = JSON.stringify({ text: chunk.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        } catch (err) {
          // A-03: não vazar o erro cru no stream — loga no servidor e envia só um ref.
          const ref = logAndRef(err, "analise:stream");
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "internal_error", ref })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    return internalErrorResponse(err, "analise:setup");
  }
}
