import Link from "next/link"

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Erro ao iniciar autenticação com Google.",
  OAuthCallback: "Erro ao processar resposta do Google.",
  OAuthCreateAccount: "Não foi possível criar sua conta. Tente novamente.",
  EmailCreateAccount: "Não foi possível criar sua conta via e-mail.",
  Callback: "Erro inesperado no processo de autenticação.",
  OAuthAccountNotLinked: "Este e-mail já está vinculado a outro provedor.",
  EmailSignin: "O link de acesso expirou ou é inválido. Solicite um novo.",
  CredentialsSignin: "Credenciais inválidas.",
  SessionRequired: "Você precisa estar autenticado para acessar esta página.",
  Default: "Ocorreu um erro durante a autenticação.",
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // Em Next.js 15 searchParams é uma Promise — use como param async
  return (
    <AuthErrorContent searchParamsPromise={searchParams} />
  )
}

async function AuthErrorContent({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ error?: string }>
}) {
  const params = await searchParamsPromise
  const message = ERROR_MESSAGES[params.error ?? "Default"] ?? ERROR_MESSAGES.Default

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-md p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold text-white mb-2">Erro de autenticação</h1>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <Link
          href="/auth/login"
          className="inline-block rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium py-2 px-6 transition text-sm"
        >
          Tentar novamente
        </Link>
      </div>
    </main>
  )
}
