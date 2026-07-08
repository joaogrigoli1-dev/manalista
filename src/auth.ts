import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/schema"

// Lazy import do getDb — evita execução no topo do módulo durante next build.
// A função só é chamada quando um método do adapter realmente é invocado
// (em runtime), nunca durante a fase de análise estática do build.
async function lazyGetDb() {
  const { getDb } = await import("@/lib/db-server")
  return getDb()
}

// Adapter com lazy DB — todos os métodos delegam para a instância real em runtime
const lazyAdapter = {
  createUser: async (...args: any[]) => (await lazyGetDb() as any).createUser?.(...args),
  getUser: async (...args: any[]) => (await lazyGetDb() as any).getUser?.(...args),
  getUserByEmail: async (...args: any[]) => (await lazyGetDb() as any).getUserByEmail?.(...args),
  getUserByAccount: async (...args: any[]) => (await lazyGetDb() as any).getUserByAccount?.(...args),
  updateUser: async (...args: any[]) => (await lazyGetDb() as any).updateUser?.(...args),
  deleteUser: async (...args: any[]) => (await lazyGetDb() as any).deleteUser?.(...args),
  linkAccount: async (...args: any[]) => (await lazyGetDb() as any).linkAccount?.(...args),
  unlinkAccount: async (...args: any[]) => (await lazyGetDb() as any).unlinkAccount?.(...args),
  createSession: async (...args: any[]) => (await lazyGetDb() as any).createSession?.(...args),
  getSessionAndUser: async (...args: any[]) => (await lazyGetDb() as any).getSessionAndUser?.(...args),
  updateSession: async (...args: any[]) => (await lazyGetDb() as any).updateSession?.(...args),
  deleteSession: async (...args: any[]) => (await lazyGetDb() as any).deleteSession?.(...args),
  createVerificationToken: async (...args: any[]) => (await lazyGetDb() as any).createVerificationToken?.(...args),
  useVerificationToken: async (...args: any[]) => (await lazyGetDb() as any).useVerificationToken?.(...args),
}

// Cache do adapter real para evitar recriação a cada chamada
let _resolvedAdapter: ReturnType<typeof DrizzleAdapter> | null = null
async function getAdapter() {
  if (_resolvedAdapter) return _resolvedAdapter
  const { getDb } = await import("@/lib/db-server")
  _resolvedAdapter = DrizzleAdapter(getDb(), {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
  })
  return _resolvedAdapter
}

// Proxy do adapter — delega cada método para o adapter real (lazy)
const adapterProxy = new Proxy(lazyAdapter, {
  get(target, prop: string) {
    return async (...args: any[]) => {
      const adapter = await getAdapter()
      const method = (adapter as any)[prop]
      if (typeof method === "function") return method(...args)
      return undefined
    }
  },
}) as any

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: adapterProxy,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Resend({
      apiKey: process.env.RESEND_API_KEY ?? "",
      from: "MAnalista <noreply@manalista.com.br>",
    }),
  ],
  session: { strategy: "database" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  callbacks: {
    // LGPD (C-01): bloqueia login em contas excluídas (soft-delete). Sem isto,
    // uma conta com `deletedAt` setado poderia ser reacessada via Google/magic
    // link (a linha em `accounts` continua existinde durante o período de
    // graça), reidentificando dados que deveriam estar em processo de exclusão.
    async signIn({ user }) {
      const userId = (user as { id?: string })?.id;
      if (!userId) return true; // primeiro login (createUser) — ainda não há registro para checar
      try {
        const { getDb } = await import("@/lib/db-server");
        const dbUser = await getDb().query.users.findFirst({
          where: (u, { eq }) => eq(u.id, userId as any),
          columns: { deletedAt: true },
        });
        if (dbUser?.deletedAt) return false; // conta excluída → nega login
      } catch (e) {
        // Fail-open em erro de consulta para não derrubar TODO o login numa
        // instabilidade transitória do banco (disponibilidade). O risco
        // residual é pequeno: a conta excluída já teve sessões revogadas e
        // dados em anonimização. Loga para investigação.
        console.error("[auth] Falha ao verificar deletedAt no signIn:", e);
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
        try {
          const { getDb } = await import("@/lib/db-server")
          const dbUser = await getDb().query.users.findFirst({
            where: (u, { eq }) => eq(u.id, user.id as any),
            columns: { plan: true, analysesUsed: true, analysesLimit: true },
          })
          if (dbUser) {
            ;(session.user as any).plan = dbUser.plan
            ;(session.user as any).analysesUsed = dbUser.analysesUsed
            ;(session.user as any).analysesLimit = dbUser.analysesLimit
          }
        } catch (e) {
          // A-06: NUNCA rebaixar um usuário pago para "free" por falha de
          // consulta. Não definimos plan="free" como fallback; sinalizamos o
          // erro para a UI tratar (ex.: pedir refresh) e o enforcement real de
          // cota continua sendo feito direto do banco em /api/analise, não a
          // partir deste campo de sessão (que é apenas informativo para a UI).
          ;(session.user as any).planError = true
          console.error("[auth] Erro ao buscar dados do usuário:", e)
        }
      }
      return session
    },
  },
})
