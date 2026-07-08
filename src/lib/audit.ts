/**
 * A-01 / C-01 (LGPD) — Helper central de auditoria.
 *
 * Toda operação sensível sobre dados pessoais (exportação, exclusão,
 * consentimento, anonimização) DEVE gravar uma entrada em `audit_logs`
 * para permitir rastreabilidade e prestação de contas perante o titular
 * dos dados e a ANPD.
 */

import { db } from "@/lib/db-server";
import { auditLogs } from "@/lib/schema";

export interface WriteAuditLogInput {
  /** ID do usuário afetado pela ação. Pode ser omitido em ações de sistema. */
  userId?: string | null;
  /** Nome da ação, ex.: "user.deleted", "user.data_exported". */
  action: string;
  /** Identificador do recurso afetado (ex.: id de uma analysis). */
  resourceId?: string | null;
  /** Metadados adicionais em formato serializável em JSON. */
  metadata?: Record<string, unknown> | null;
  /** IP de origem da requisição, quando disponível. */
  ip?: string | null;
}

/**
 * Insere uma linha em `audit_logs`. Não lança em caso de falha de escrita —
 * a auditoria não deve impedir a operação principal de completar, mas o erro
 * é logado no servidor para investigação.
 */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: (input.userId ?? null) as any,
      action: input.action,
      resourceId: input.resourceId ?? null,
      metadata: (input.metadata ?? null) as any,
      ip: input.ip ?? null,
    });
  } catch (err) {
    console.error("[audit] Falha ao gravar audit log", { action: input.action, err });
  }
}

/** Extrai o IP do cliente a partir dos headers de um Request/NextRequest. */
export function getClientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return req.headers.get("x-real-ip");
}
