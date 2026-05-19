export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { initAuth } from "@/lib/auth-init"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db-server"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"

export async function POST() {
  await initAuth()
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: "Não autenticado" }, { status: 401 })
  }

  const userId = session.user.id
  if (!userId) {
    return Response.json({ error: "ID do usuário não encontrado" }, { status: 400 })
  }

  const dbUser = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId as string))
    .limit(1)
    .then((r) => r[0])

  if (!dbUser?.stripeCustomerId) {
    return Response.json(
      { error: "Nenhuma assinatura encontrada. Faça upgrade primeiro." },
      { status: 400 }
    )
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? ""

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: dbUser.stripeCustomerId,
    return_url: `${baseUrl}/perfil`,
  })

  return Response.json({ url: portalSession.url })
}
