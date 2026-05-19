"use client"

import { useState } from "react"
import QuotaBadge from "@/components/ui/QuotaBadge"

interface ProfileClientProps {
  name: string | null
  email: string
  image: string | null
  plan: "free" | "pro" | "enterprise"
  analysesUsed: number
  analysesLimit: number
}

export default function ProfileClient({
  name,
  email,
  image,
  plan,
  analysesUsed,
  analysesLimit,
}: ProfileClientProps) {
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [loadingPortal, setLoadingPortal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoadingCheckout(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Erro ao iniciar checkout")
      }
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado")
      setLoadingCheckout(false)
    }
  }

  async function handlePortal() {
    setLoadingPortal(true)
    setError(null)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = (await res.json()) as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Erro ao abrir portal")
      }
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado")
      setLoadingPortal(false)
    }
  }

  const planColor =
    plan === "pro" ? "#a78bfa" : plan === "enterprise" ? "#f59e0b" : "#6b7280"
  const planLabel =
    plan === "pro" ? "Pro" : plan === "enterprise" ? "Enterprise" : "Free"

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page, #0a0a0f)",
        color: "var(--text-primary, #e2e8f0)",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            marginBottom: "2rem",
          }}
        >
          Meu Perfil
        </h1>

        {/* User info card */}
        <div
          style={{
            background: "var(--bg-card, rgba(255,255,255,0.05))",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            borderRadius: 16,
            padding: "1.5rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
          }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name ?? "Avatar"}
              width={64}
              height={64}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(124,58,237,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#a78bfa",
              }}
            >
              {(name ?? email).charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.2rem" }}>
              {name ?? "Usuário"}
            </p>
            <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.875rem" }}>
              {email}
            </p>
          </div>

          <span
            style={{
              padding: "0.3rem 0.85rem",
              borderRadius: 9999,
              background: `${planColor}22`,
              color: planColor,
              fontWeight: 700,
              fontSize: "0.82rem",
              border: `1px solid ${planColor}44`,
              whiteSpace: "nowrap",
            }}
          >
            {planLabel}
          </span>
        </div>

        {/* Quota badge */}
        <div style={{ marginBottom: "1.25rem" }}>
          <QuotaBadge used={analysesUsed} limit={analysesLimit} plan={plan} />
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 8,
              color: "#ef4444",
              marginBottom: "1rem",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        {/* Upgrade card (free only) */}
        {plan === "free" && (
          <div
            style={{
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: 16,
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
                color: "#a78bfa",
              }}
            >
              Desbloqueie o plano Pro
            </h2>
            <ul
              style={{
                color: "var(--text-secondary, #94a3b8)",
                fontSize: "0.875rem",
                marginBottom: "1.25rem",
                paddingLeft: "1.25rem",
                lineHeight: 1.8,
              }}
            >
              <li>100 análises por mês</li>
              <li>Histórico ilimitado</li>
              <li>Suporte prioritário</li>
            </ul>
            <button
              onClick={() => void handleUpgrade()}
              disabled={loadingCheckout}
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: 10,
                background: loadingCheckout
                  ? "rgba(124,58,237,0.4)"
                  : "var(--accent-brand, #7c3aed)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.95rem",
                border: "none",
                cursor: loadingCheckout ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {loadingCheckout ? "Aguarde..." : "Upgrade para Pro — R$49/mês"}
            </button>
          </div>
        )}

        {/* Manage subscription (pro/enterprise) */}
        {plan !== "free" && (
          <div
            style={{
              background: "var(--bg-card, rgba(255,255,255,0.05))",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              borderRadius: 16,
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                marginBottom: "0.75rem",
              }}
            >
              Assinatura
            </h2>
            <p
              style={{
                color: "var(--text-secondary, #94a3b8)",
                fontSize: "0.875rem",
                marginBottom: "1rem",
              }}
            >
              Gerencie seu método de pagamento, histórico de faturas ou cancele a assinatura.
            </p>
            <button
              onClick={() => void handlePortal()}
              disabled={loadingPortal}
              style={{
                width: "100%",
                padding: "0.65rem",
                borderRadius: 10,
                background: "transparent",
                color: "#a78bfa",
                fontWeight: 600,
                fontSize: "0.9rem",
                border: "1px solid rgba(167,139,250,0.4)",
                cursor: loadingPortal ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                opacity: loadingPortal ? 0.6 : 1,
              }}
            >
              {loadingPortal ? "Aguarde..." : "Gerenciar assinatura"}
            </button>
          </div>
        )}

        {/* Sign out */}
        <div style={{ textAlign: "center" }}>
          <a
            href="/auth/signout"
            style={{
              display: "inline-block",
              padding: "0.5rem 1.5rem",
              borderRadius: 8,
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              fontWeight: 600,
              fontSize: "0.875rem",
              border: "1px solid rgba(239,68,68,0.2)",
              textDecoration: "none",
            }}
          >
            Sair
          </a>
        </div>
      </div>
    </div>
  )
}
