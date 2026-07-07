export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db-server";
import { analyses, users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
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

  // Persiste a análise e debita a cota em UMA ÚNICA transação (B.5):
  // - SELECT ... FOR UPDATE na linha do usuário evita corrida/contagem dupla.
  // - A cota é lida do banco (fonte da verdade), não da sessão (defasada).
  // - Se estourou a cota, aborta sem inserir e retorna 402 (paywall).
  const result = await db.transaction(async (tx) => {
    const [u] = await tx
      .select({ used: users.analysesUsed, limit: users.analysesLimit })
      .from(users)
      .where(eq(users.id, userId as any))
      .for("update")
      .limit(1);

    if (!u) {
      return { status: 401 as const };
    }
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

    const [inserted] = await tx
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

    await tx
      .update(users)
      .set({ analysesUsed: sql`analyses_used + 1` })
      .where(eq(users.id, userId as any));

    return { status: 201 as const, body: { id: inserted.id } };
  });

  if (result.status === 401) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (result.status === 402) {
    return Response.json(result.body, { status: 402 });
  }
  return Response.json(result.body, { status: 201 });
}
