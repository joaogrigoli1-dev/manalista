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
    .select({ email: users.email, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, userId as string))
    .limit(1)
    .then((r) => r[0])

  if (!dbUser) {
    return Response.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  let customerId = dbUser.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: dbUser.email,
      metadata: { userId },
    })
    customerId = customer.id
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId as string))
  }

  const priceId = process.env.STRIPE_PRICE_PRO_MONTHLY
  if (!priceId) {
    return Response.json({ error: "Preço do plano Pro não configurado" }, { status: 500 })
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? ""

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/perfil?upgrade=success`,
    cancel_url: `${baseUrl}/perfil?upgrade=canceled`,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  })

  return Response.json({ url: checkoutSession.url })
}
