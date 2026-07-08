export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db-server";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { internalErrorResponse } from "@/lib/api-error";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export const runtime = "nodejs";

const ConsentSchema = z.object({
  consentVersion: z.string().min(1).max(50),
});

/**
 * A-01/C-01 (LGPD art. 8º — consentimento). Registra que o titular (ou seu
 * responsável legal, no caso de dado de criança — ver ECA) aceitou os
 * termos vigentes, com a versão do texto de consentimento aceito.
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

  const rl = await rateLimit(`lgpd:consent:${userId}`, 20, 60 * 60_000);
  if (!rl.allowed) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ConsentSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  try {
    await db
      .update(users)
      .set({ consentedAt: new Date() })
      .where(eq(users.id, userId as any));

    await writeAuditLog({
      userId,
      action: "user.consent_given",
      metadata: { consentVersion: parsed.data.consentVersion },
      ip,
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    return internalErrorResponse(err, "lgpd:consent");
  }
}
