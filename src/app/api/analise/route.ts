import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getClaudeApiKey } from "@/lib/aws-ssm";
import { buildSystemPrompt, buildChildDataPrompt, buildTaskInstruction } from "@/lib/agents/prompts";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { auth } from "@/auth";
import { db } from "@/lib/db-server";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { AgentId } from "@/types";

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
// - Opus 4.6 para o mediador (consolidação exige síntese profunda)
// - Sonnet 4.6 para os 7 especialistas (análise e debate — rápido e preciso)
function getModelForAgent(agentId: AgentId): string {
  return agentId === "mediator" ? "claude-opus-4-6" : "claude-sonnet-4-6";
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
  const rl = checkRateLimit(`analise:${ip}`, 10, 60_000);
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

  // ── Sessão + cota (C-04) ───────────────────────────────────────────────
  // Bloqueia a geração de quem já excedeu a cota ANTES de qualquer chamada
  // paga à Anthropic. O middleware já exige sessão nesta rota; aqui
  // reconfirmamos e lemos a cota atual direto do banco (fonte da verdade,
  // não a sessão, que pode estar defasada). Usuário sem cota recebe 402 com
  // upgradeUrl — este é o momento de paywall, não um erro genérico.
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  const [quota] = await db
    .select({ used: users.analysesUsed, limit: users.analysesLimit })
    .from(users)
    .where(eq(users.id, session.user.id as string))
    .limit(1);
  if (!quota) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (quota.used >= quota.limit) {
    return Response.json(
      {
        error: "quota_exceeded",
        analysesUsed: quota.used,
        analysesLimit: quota.limit,
        upgradeUrl: "/planos",
      },
      { status: 402 }
    );
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`));
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
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
