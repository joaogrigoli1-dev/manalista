import Stripe from "stripe"

// Singleton para evitar múltiplas instâncias em dev (HMR)
declare global {
  // eslint-disable-next-line no-var
  var _stripe: Stripe | undefined
}

function createStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada")
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia" })
}

export const stripe = globalThis._stripe ?? createStripe()
if (process.env.NODE_ENV !== "production") globalThis._stripe = stripe
