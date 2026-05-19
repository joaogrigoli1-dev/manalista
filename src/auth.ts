import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Resend from "next-auth/providers/resend"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db } from "@/lib/db-server"
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/schema"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users as any,
    accountsTable: accounts as any,
    sessionsTable: sessions as any,
    verificationTokensTable: verificationTokens as any,
  }),
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
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
        try {
          const dbUser = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, user.id as any),
            columns: { plan: true, analysesUsed: true, analysesLimit: true },
          })
          if (dbUser) {
            ;(session.user as any).plan = dbUser.plan
            ;(session.user as any).analysesUsed = dbUser.analysesUsed
            ;(session.user as any).analysesLimit = dbUser.analysesLimit
          }
        } catch (e) {
          console.error("[auth] Erro ao buscar dados do usuário:", e)
        }
      }
      return session
    },
  },
})
