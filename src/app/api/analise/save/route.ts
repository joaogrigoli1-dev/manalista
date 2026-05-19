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
  const analysesUsed: number = (session.user as any).analysesUsed ?? 0;
  const analysesLimit: number = (session.user as any).analysesLimit ?? 5;

  // Verifica quota
  if (analysesUsed >= analysesLimit) {
    return Response.json(
      { error: "Quota atingida", upgrade: true },
      { status: 429 }
    );
  }

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

  // Incrementa analyses_used na tabela users
  await db
    .update(users)
    .set({ analysesUsed: sql`analyses_used + 1` })
    .where(eq(users.id, userId as any));

  return Response.json({ id: inserted.id }, { status: 201 });
}
