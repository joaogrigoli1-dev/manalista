export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db-server";
import { users, sessions } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { internalErrorResponse } from "@/lib/api-error";
import { validateOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export const runtime = "nodejs";

const DeleteAccountSchema = z.object({
  confirmEmail: z.string().email(),
});

/** Gera um endereço de e-mail desidentificado e determinístico a partir do userId. */
function anonymizedEmailFor(userId: string): string {
  const hash = createHash("sha256").update(userId).digest("hex").slice(0, 24);
  return `deleted+${hash}@manalista.invalid`;
}

/**
 * A-01/C-01 (LGPD art. 18, VI — eliminação dos dados).
 * Exclusão lógica da conta: marca `deletedAt`, desidentifica o e-mail,
 * revoga todas as sessões ativas do NextAuth. As análises do usuário são
 * anonimizadas assincronamente pelo worker `/api/lgpd/anonymize`, que
 * varre contas com `deletedAt` não nulo.
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

  const rl = await rateLimit(`lgpd:delete-account:${userId}`, 3, 60 * 60_000);
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

  const parsed = DeleteAccountSchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const sessionEmail = session.user.email;
  if (!sessionEmail || sessionEmail.toLowerCase() !== parsed.data.confirmEmail.toLowerCase()) {
    return Response.json({ error: "E-mail de confirmação não confere" }, { status: 400 });
  }

  try {
    const anonymizedEmail = anonymizedEmailFor(userId);

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          deletedAt: new Date(),
          email: anonymizedEmail,
          name: null,
          image: null,
        })
        .where(eq(users.id, userId as any));

      // Revoga todas as sessões ativas do NextAuth para este usuário.
      await tx.delete(sessions).where(eq(sessions.userId, userId as any));
    });

    await writeAuditLog({
      userId,
      action: "user.deleted",
      metadata: { anonymizedEmail },
      ip,
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    return internalErrorResponse(err, "lgpd:delete-account");
  }
}
