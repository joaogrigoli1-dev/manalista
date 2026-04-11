import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getClaudeApiKey } from "@/lib/aws-ssm";
import { buildSystemPrompt, buildChildDataPrompt } from "@/lib/agents/prompts";
import type { AgentId, ChildData } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 120;

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

    // Monta o histórico de mensagens para o debate
    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: dataContext },
    ];

    if (body.debateHistory && body.debateHistory.length > 0) {
      for (const msg of body.debateHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Instrução específica por tarefa
    const taskInstruction: Record<string, string> = {
      analyze: body.lang === "pt"
        ? "Com base nos dados acima, realize sua análise clínica completa sob a perspectiva da sua especialidade. Identifique indicadores relevantes, formule hipóteses diagnósticas específicas com códigos DSM-5/CID-11 e indique seu grau de confiança (alto/moderado/baixo)."
        : "Based on the data above, perform your complete clinical analysis from your specialty's perspective. Identify relevant indicators, formulate specific diagnostic hypotheses with DSM-5/ICD-11 codes and indicate your confidence level (high/moderate/low).",
      debate: body.lang === "pt"
        ? "Debata com a equipe. Defenda sua hipótese, questione ou apoie colegas com argumentos clínicos específicos. Seja direto e baseie-se nos dados."
        : "Debate with the team. Defend your hypothesis, question or support colleagues with specific clinical arguments. Be direct and base yourself on the data.",
      consolidate: body.lang === "pt"
        ? "Como mediador, consolide todas as análises acima em: (1) Lista de patologias sugeridas com CID-11/DSM-5, (2) Nível de consenso da equipe, (3) Plano terapêutico sugerido com base em evidências, (4) Referências científicas."
        : "As mediator, consolidate all analyses above into: (1) List of suggested pathologies with ICD-11/DSM-5, (2) Team consensus level, (3) Evidence-based suggested therapeutic plan, (4) Scientific references.",
    };

    messages.push({ role: "user", content: taskInstruction[body.task] ?? taskInstruction.analyze });

    // Stream SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await client.messages.stream({
            model: "claude-opus-4-6",
            max_tokens: 2048,
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
