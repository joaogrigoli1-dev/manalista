/**
 * Validação básica de CSRF via Origin header.
 * Em produção, o Cloudflare WAF adiciona uma camada extra.
 */

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL ?? "https://manalista.com.br",
  "https://www.manalista.com.br",
  "http://localhost:3000",
];

/**
 * Retorna true se o request veio de uma origem permitida.
 * Requests sem Origin header são rejeitados em produção.
 */
export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");

  // Em desenvolvimento local sem origin (ex: curl, Postman) — permitir
  if (!origin && process.env.NODE_ENV !== "production") return true;

  // Em produção, exigir origin válida
  if (!origin) return false;

  return ALLOWED_ORIGINS.some((allowed) => origin === allowed);
}
