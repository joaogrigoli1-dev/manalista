/**
 * Pré-carrega segredos do AWS SSM em process.env antes de inicializar Auth.js.
 * Idempotente — pode ser chamado múltiplas vezes sem efeito duplo.
 */
import { getSsmParam } from "@/lib/aws-ssm"

let initialized = false

export async function initAuth(): Promise<void> {
  if (initialized) return
  initialized = true

  const secrets: [string, string][] = [
    ["GOOGLE_CLIENT_ID", "/manalista/google-client-id"],
    ["GOOGLE_CLIENT_SECRET", "/manalista/google-client-secret"],
    ["RESEND_API_KEY", "/manalista/resend-api-key"],
    ["AUTH_SECRET", "/manalista/auth-secret"],
    ["STRIPE_SECRET_KEY", "/manalista/stripe-secret-key"],
    ["STRIPE_WEBHOOK_SECRET", "/manalista/stripe-webhook-secret"],
    ["STRIPE_PRICE_PRO_MONTHLY", "/manalista/stripe-price-pro-monthly"],
  ]

  await Promise.allSettled(
    secrets.map(async ([envKey, ssmPath]) => {
      if (process.env[envKey]) return
      try {
        const value = await getSsmParam(ssmPath)
        process.env[envKey] = value
      } catch (e) {
        console.warn(`[auth-init] Não foi possível carregar ${ssmPath} do SSM:`, e)
      }
    })
  )
}
