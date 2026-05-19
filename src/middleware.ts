import { auth } from "@/auth"
import { NextResponse } from "next/server"

const PUBLIC_PREFIXES = [
  "/",
  "/auth",
  "/api/health",
  "/offline",
  "/_next",
  "/icons",
  "/manifest.webmanifest",
  "/sw.js",
  "/favicon",
]

const API_PROTECTED = ["/api/analise", "/api/relatorio"]

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
    // APIs retornam JSON 401
    if (API_PROTECTED.some((p) => path.startsWith(p))) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }
    // Páginas redirecionam para login
    const url = new URL("/auth/login", req.url)
    url.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|manifest|sw.js).*)"],
}
