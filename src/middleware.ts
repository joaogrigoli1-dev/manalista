import { auth } from "@/auth"
import { NextResponse } from "next/server"

// Rotas verdadeiramente públicas (não exigem sessão em hipótese alguma).
// C-02 fix: o webhook do Stripe é validado por assinatura HMAC (ver
// src/app/api/stripe/webhook/route.ts), NUNCA por sessão de usuário — se ele
// cair no branch de "não autenticado → redirect /auth/login", a Stripe recebe
// um 302 no lugar de um 200/400, o evento nunca é processado e o webhook fica
// permanentemente quebrado sem erro visível no dashboard da aplicação.
const PUBLIC_PREFIXES = [
  "/",
  "/auth",
  // Páginas legais e de planos devem ser acessíveis SEM login (exigência de
  // transparência/LGPD para Termos e Privacidade; /planos é vitrine pública).
  "/termos",
  "/privacidade",
  "/planos",
  "/api/health",
  "/api/stripe/webhook",
  "/offline",
  "/_next",
  "/icons",
  "/manifest.webmanifest",
  "/sw.js",
  "/favicon",
]

export default auth((req) => {
  const { nextUrl } = req
  const path = nextUrl.pathname
  const session = (req as any).auth

  // Rotas públicas — libera direto
  const isPublic =
    path === "/" ||
    PUBLIC_PREFIXES.some((p) => p !== "/" && path.startsWith(p))
  if (isPublic) return NextResponse.next()

  // Não autenticado
  if (!session) {
    // C-02 fix: qualquer rota de API não-pública retorna JSON 401 por padrão
    // (nunca um redirect 302 — um cliente HTTP/webhook não segue redirect
    // para uma página HTML de login). Antes, só "/api/analise" e
    // "/api/relatorio" tinham esse tratamento via uma lista manual, e
    // qualquer rota de API nova (ex.: "/api/stripe/checkout",
    // "/api/stripe/portal", "/api/lgpd/*") ficava sujeita ao mesmo bug por
    // omissão. Página normal (não-API) continua redirecionando para login.
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    const url = new URL("/auth/login", req.url)
    url.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest|sw.js).*)"],
}
