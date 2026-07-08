/**
 * Pré-carrega segredos do AWS SSM em process.env antes de inicializar Auth.js.
 * Idempotente — pode ser chamado múltiplas vezes sem efeito duplo.
 */
import { getSsmParam } from "@/lib/aws-ssm"

let initialized = false

// C-03 fix: um valor "presente" na env não significa um valor VÁLIDO. O
// Coolify tinha STRIPE_SECRET_KEY="PLACEHOLDER_CONFIGURE_NO_SSM" — uma string
// não-vazia, então o antigo `if (process.env[envKey]) return` a aceitava como
// "já configurada" e nunca buscava a chave real no SSM. Validadores por
// chave garantem que só um valor com o formato esperado é aceito sem
// consultar o SSM; qualquer outra coisa (placeholder, vazio, string
// corrompida) é tratada como "não configurada" e sobrescrita pelo valor real.
const VALIDATORS: Record<string, (v: string) => boolean> = {
  STRIPE_SECRET_KEY: (v) => /^sk_(live|test)_/.test(v),
  STRIPE_WEBHOOK_SECRET: (v) => /^whsec_/.test(v),
}

function isValidEnvValue(envKey: string, value: string | undefined): boolean {
  if (!value) return false
  const validate = VALIDATORS[envKey]
  return validate ? validate(value) : true
}

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
      if (isValidEnvValue(envKey, process.env[envKey])) return
      try {
        const value = await getSsmParam(ssmPath)
        process.env[envKey] = value
      } catch (e) {
        console.warn(`[auth-init] Não foi possível carregar ${ssmPath} do SSM:`, e)
      }
    })
  )
}
