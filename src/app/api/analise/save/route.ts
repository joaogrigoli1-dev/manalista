export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db-server";
import { analyses } from "@/lib/schema";
import { internalErrorResponse } from "@/lib/api-error";
import { validateOrigin } from "@/lib/csrf";

export const runtime = "nodejs";

const SaveSchema = z.object({
  childName: z.string().min(1).max(100),
  childAge: z.string().min(1).max(50),
  lang: z.enum(["pt", "en"]),
  qualityScore: z.number().int().min(0).max(100).optional(),
  detectedPathologies: z.array(z.string()).optional(),
  childDataJson: z.unknown().optional(),
  resultsJson: z.unknown().optional(),
  debateMessagesJson: z.unknown().optional(),
});

export async function POST(req: NextRequest) {
  // CSRF check
  if (!validateOrigin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SaveSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const {
    childName,
    childAge,
    lang,
    qualityScore,
    detectedPathologies,
    childDataJson,
    resultsJson,
    debateMessagesJson,
  } = parsed.data;

  // C-04 completo: o /save NÃO debita mais cota. O débito já ocorreu no
  // início da geração (POST /api/analise, reserva por "run"), de modo que
  // salvar o resultado não conta uma segunda vez. Aqui apenas persistimos a
  // análise. Salvar é opcional para o usuário; a cobrança é pelo custo de
  // geração, que já aconteceu independentemente de salvar ou não.
  try {
    const [inserted] = await db
      .insert(analyses)
      .values({
        userId: userId as any,
        childName,
        childAge,
        lang,
        qualityScore: qualityScore ?? 0,
        detectedPathologies: detectedPathologies ?? [],
        status: "complete",
        childDataJson: childDataJson ?? null,
        resultsJson: resultsJson ?? null,
        debateMessagesJson: debateMessagesJson ?? null,
      })
      .returning({ id: analyses.id });

    return Response.json({ id: inserted.id }, { status: 201 });
  } catch (err) {
    return internalErrorResponse(err, "analise:save");
  }
}
