import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getClaudeApiKey } from "@/lib/aws-ssm";
import { buildSystemPrompt, buildChildDataPrompt, buildTaskInstruction } from "@/lib/agents/prompts";
import type { AgentId, ChildData } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

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
  try {
    const body = await req.json() as {
      agentId: AgentId;
      childData: ChildData;
      debateHistory?: Array<{ role: "user" | "assistant"; content: string }>;
      lang: "pt" | "en";
      task: "analyze" | "debate" | "consolidate";
    };

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
