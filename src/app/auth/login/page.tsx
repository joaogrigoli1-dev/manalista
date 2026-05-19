"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState<"google" | "email" | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogle() {
    setLoading("google")
    setError(null)
    try {
      await signIn("google", { callbackUrl })
    } catch {
      setError("Erro ao entrar com Google. Tente novamente.")
      setLoading(null)
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading("email")
    setError(null)
    try {
      const res = await signIn("resend", { email, redirect: false, callbackUrl })
      if (res?.error) {
        setError("Erro ao enviar o link. Tente novamente.")
      } else {
        setEmailSent(true)
      }
    } catch {
      setError("Erro ao enviar o link. Tente novamente.")
    } finally {
      setLoading(null)
    }
  }

  if (emailSent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="text-xl font-semibold text-white mb-2">Link enviado!</h1>
          <p className="text-gray-400 text-sm">
            Verifique sua caixa de entrada em <strong className="text-white">{email}</strong> e clique
            no link para entrar.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">MAnalista</h1>
          <p className="text-gray-400 text-sm mt-1">Análise neuropsicológica com IA</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading !== null}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 transition disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {loading === "google" ? (
            <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading === "google" ? "Entrando…" : "Entrar com Google"}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-500">
            <span className="bg-gray-950 px-2">ou via e-mail</span>
          </div>
        </div>

        {/* Magic Link */}
        <form onSubmit={handleEmail} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            className="w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <button
            type="submit"
            disabled={loading !== null || !email}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium py-3 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === "email" ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            {loading === "email" ? "Enviando…" : "Enviar link de acesso"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-6">
          Ao entrar, você concorda com nossos{" "}
          <a href="/termos" className="text-violet-400 hover:underline">termos</a> e{" "}
          <a href="/privacidade" className="text-violet-400 hover:underline">política de privacidade</a>.
        </p>
      </div>
    </main>
  )
}
