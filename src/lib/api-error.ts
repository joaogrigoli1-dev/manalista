/**
 * Tratamento central de erro para rotas de API (A-03).
 *
 * Nunca devolve `String(err)` / stack trace ao cliente — em contexto de dado
 * sensível de saúde, um vazamento de erro cru pode expor detalhes de
 * infraestrutura, SQL ou PII. Padrão: gerar um `ref` (uuid), logar o erro
 * completo no servidor associado a esse `ref`, e devolver ao cliente apenas
 * `{ error: "internal_error", ref }`. O usuário informa o `ref` ao suporte e a
 * equipe correlaciona com o log do servidor.
 */

/** Loga o erro completo no servidor e retorna um `ref` opaco para o cliente. */
export function logAndRef(err: unknown, context?: string): string {
  const ref = crypto.randomUUID();
  // Log estruturado no servidor (nunca enviado ao cliente).
  console.error(
    `[api-error] ref=${ref}${context ? ` ctx=${context}` : ""}`,
    err instanceof Error ? { message: err.message, stack: err.stack } : err
  );
  return ref;
}

/** Resposta 500 padronizada, sem vazar detalhes do erro. */
export function internalErrorResponse(err: unknown, context?: string): Response {
  const ref = logAndRef(err, context);
  return Response.json({ error: "internal_error", ref }, { status: 500 });
}
