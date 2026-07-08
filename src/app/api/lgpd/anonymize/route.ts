export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { db } from "@/lib/db-server";
import { analyses, users } from "@/lib/schema";
import { and, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { internalErrorResponse } from "@/lib/api-error";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

// [CONFIRMAR-FONTE] prazo real exigido/recomendado pela LGPD para retenção
// de dados de saúde de criança após o encerramento da relação com o
// titular. 90 dias é um valor PROVISÓRIO adotado como período de graça
// (permite ao usuário reverter uma exclusão acidental / recuperar
// histórico) e deve ser validado por assessoria jurídica antes de produção.
const ANONYMIZATION_GRACE_DAYS = 90; // [CONFIRMAR-FONTE] prazo real exigido pela LGPD

const ANONYMIZED_CHILD_NAME = "[REMOVIDO — LGPD]";

/**
 * A-01/C-01 (LGPD art. 16 — eliminação após término do tratamento).
 * Worker invocável por cron externo (ex.: cron job da infraestrutura),
 * autenticado por um segredo compartilhado simples via header
 * `x-cron-secret`. Anonimiza analyses de:
 *   (a) usuários que solicitaram exclusão de conta (`users.deletedAt` != null); ou
 *   (b) analyses mais antigas que o período de graça `ANONYMIZATION_GRACE_DAYS`,
 *       independentemente de exclusão de conta (retenção mínima necessária).
 *
 * NUNCA deve ficar acessível sem `CRON_SECRET` configurado — se a env var
 * não existir, a rota responde 503 em vez de abrir a operação.
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json(
      {
        error: "CRON_SECRET não configurado — endpoint de anonimização desabilitado por segurança.",
      },
      { status: 503 }
    );
  }

  const providedSecret = req.headers.get("x-cron-secret");
  if (!providedSecret || providedSecret !== cronSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cutoff = new Date(Date.now() - ANONYMIZATION_GRACE_DAYS * 24 * 60 * 60_000);

    const targets = await db
      .select({ id: analyses.id, userId: analyses.userId })
      .from(analyses)
      .leftJoin(users, eq(analyses.userId, users.id))
      .where(
        and(
          isNull(analyses.anonymizedAt),
          or(isNotNull(users.deletedAt), lt(analyses.createdAt, cutoff))
        )
      )
      .limit(500); // processa em lotes — o cron pode ser reinvocado até esvaziar a fila

    if (targets.length === 0) {
      return Response.json({ anonymized: 0 }, { status: 200 });
    }

    const ids = targets.map((t) => t.id);

    await db
      .update(analyses)
      .set({
        childName: ANONYMIZED_CHILD_NAME,
        childDataJson: null,
        resultsJson: null,
        debateMessagesJson: null,
        detectedPathologies: [],
        anonymizedAt: new Date(),
      })
      .where(inArray(analyses.id, ids));

    for (const t of targets) {
      await writeAuditLog({
        userId: t.userId,
        action: "analysis.anonymized",
        resourceId: t.id,
        metadata: { graceDays: ANONYMIZATION_GRACE_DAYS },
      });
    }

    return Response.json({ anonymized: ids.length }, { status: 200 });
  } catch (err) {
    return internalErrorResponse(err, "lgpd:anonymize");
  }
}
