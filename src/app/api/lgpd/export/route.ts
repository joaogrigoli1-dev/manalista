export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db-server";
import { users, analyses } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { internalErrorResponse } from "@/lib/api-error";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * A-01/C-01 (LGPD art. 18, V — portabilidade/acesso aos dados).
 * Exporta todos os dados pessoais do usuário autenticado em JSON.
 * Não inclui campos técnicos de autenticação (tokens de conta, etc.).
 */
export async function POST(req: NextRequest) {
  if (!validateOrigin(req)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const ip = getClientIp(req);

  const rl = await rateLimit(`lgpd:export:${userId}`, 5, 60 * 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const userRow = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        plan: users.plan,
        analysesUsed: users.analysesUsed,
        analysesLimit: users.analysesLimit,
        consentedAt: users.consentedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId as any))
      .limit(1)
      .then((r) => r[0]);

    if (!userRow) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const userAnalyses = await db
      .select({
        id: analyses.id,
        childName: analyses.childName,
        childAge: analyses.childAge,
        lang: analyses.lang,
        qualityScore: analyses.qualityScore,
        detectedPathologies: analyses.detectedPathologies,
        status: analyses.status,
        childDataJson: analyses.childDataJson,
        resultsJson: analyses.resultsJson,
        debateMessagesJson: analyses.debateMessagesJson,
        anonymizedAt: analyses.anonymizedAt,
        createdAt: analyses.createdAt,
      })
      .from(analyses)
      .where(eq(analyses.userId, userId as any));

    await writeAuditLog({
      userId,
      action: "user.data_exported",
      metadata: { analysesCount: userAnalyses.length },
      ip,
    });

    return Response.json({
      exportedAt: new Date().toISOString(),
      user: userRow,
      analyses: userAnalyses,
    });
  } catch (err) {
    return internalErrorResponse(err, "lgpd:export");
  }
}
