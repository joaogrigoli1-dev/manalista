import Stripe from "stripe"

// Lazy singleton — só cria a instância em runtime, nunca durante next build
declare global {
  // eslint-disable-next-line no-var
  var _stripe: Stripe | undefined
}

function getStripeInstance(): Stripe {
  if (globalThis._stripe) return globalThis._stripe

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY não configurada")

  // apiVersion precisa bater exatamente com o literal aceito pelos types da
  // versão instalada do SDK "stripe" (^22.1.1 resolve para 22.3.0 no lock
  // atual, que só aceita "2026-06-24.dahlia" — usar uma string desatualizada
  // quebra o build do Next.js em "npm run build" com erro de tipo).
  const instance = new Stripe(key, { apiVersion: "2026-06-24.dahlia" })
  if (process.env.NODE_ENV !== "production") globalThis._stripe = instance
  return instance
}

// Proxy lazy — não executa nada durante o import/build
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripeInstance() as any)[prop]
  },
})
