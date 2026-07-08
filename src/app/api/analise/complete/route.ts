export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db-server";
import { users, analysisRuns } from "@/lib/schema";
import { and, eq, sql } from "drizzle-orm";
import { internalErrorResponse } from "@/lib/api-error";
import { validateOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

// C-04: encerra uma "run" de análise. Chamado pelo cliente ao final do
// pipeline (7 analyze + 7 debate + 1 consolidate):
//   - outcome "done"   → marca a run como concluída (a cota permanece debitada).
//   - outcome "failed" → marca a run como falha E ESTORNA 1 unidade de cota,
//     para não cobrar por uma geração que não entregou resultado (ex.: API da
//     Anthropic indisponível).
// A transição só ocorre a partir de "running" (idempotente): reenviar não
// estorna duas vezes.
const BodySchema = z.object({
  runId: z.string().uuid(),
  outcome: z.enum(["done", "failed"]),
});

export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Não autenticado" }, { status: 401 });
  }
  const userId = session.user.id as string;

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
  const { runId, outcome } = parsed.data;

  try {
    const result = await db.transaction(async (tx) => {
      // Lock da linha do usuário serializa o estorno com qualquer reserva
      // concorrente da mesma conta.
      await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, userId))
        .for("update")
        .limit(1);

      const [run] = await tx
        .select({ status: analysisRuns.status, userId: analysisRuns.userId })
        .from(analysisRuns)
        .where(eq(analysisRuns.id, runId))
        .limit(1);

      // Run inexistente ou de outro usuário → não faz nada (evita cross-user).
      if (!run || run.userId !== userId) return { changed: false as const };
      // Já encerrada → idempotente, não reprocessa (não estorna 2x).
      if (run.status !== "running") return { changed: false as const };

      await tx
        .update(analysisRuns)
        .set({ status: outcome, completedAt: new Date() })
        .where(and(eq(analysisRuns.id, runId), eq(analysisRuns.status, "running")));

      if (outcome === "failed") {
        // Estorno: nunca deixa a cota negativa.
        await tx
          .update(users)
          .set({ analysesUsed: sql`GREATEST(analyses_used - 1, 0)` })
          .where(eq(users.id, userId));
      }

      return { changed: true as const };
    });

    return Response.json({ ok: true, ...result }, { status: 200 });
  } catch (err) {
    return internalErrorResponse(err, "analise:complete");
  }
}
