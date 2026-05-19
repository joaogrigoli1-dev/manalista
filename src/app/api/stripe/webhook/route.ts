import { initAuth } from "@/lib/auth-init"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db-server"
import { users } from "@/lib/schema"
import { eq } from "drizzle-orm"
import type Stripe from "stripe"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  await initAuth()

  const body = await req.text()
  const sig = req.headers.get("stripe-signature") ?? ""
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET não configurada")
    return Response.json({ error: "Webhook secret não configurado" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assinatura inválida"
    console.error("[webhook] Erro ao verificar assinatura:", message)
    return Response.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription?.id ?? null)

        await db
          .update(users)
          .set({
            plan: "pro",
            analysesLimit: 100,
            stripeSubscriptionId: subscriptionId,
          })
          .where(eq(users.id, userId))

        console.log(`[webhook] checkout.session.completed — userId=${userId} → pro`)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!userId) break

        const isActive = subscription.status === "active"
        await db
          .update(users)
          .set(
            isActive
              ? { plan: "pro", analysesLimit: 100 }
              : { plan: "free", analysesLimit: 5 }
          )
          .where(eq(users.id, userId))

        console.log(
          `[webhook] customer.subscription.updated — userId=${userId} → ${isActive ? "pro" : "free"}`
        )
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!userId) break

        await db
          .update(users)
          .set({
            plan: "free",
            analysesLimit: 5,
            stripeSubscriptionId: null,
          })
          .where(eq(users.id, userId))

        console.log(`[webhook] customer.subscription.deleted — userId=${userId} → free`)
        break
      }

      default:
        // Ignorar eventos não tratados
        break
    }
  } catch (err) {
    console.error("[webhook] Erro ao processar evento:", err)
    return Response.json({ error: "Erro interno ao processar evento" }, { status: 500 })
  }

  return Response.json({ received: true })
}
