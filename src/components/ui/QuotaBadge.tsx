"use client"

interface QuotaBadgeProps {
  used: number
  limit: number
  plan: string
}

export default function QuotaBadge({ used, limit, plan }: QuotaBadgeProps) {
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0

  const barColor =
    pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e"

  const textColor =
    pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e"

  const planColor =
    plan === "pro"
      ? "#a78bfa"
      : plan === "enterprise"
      ? "#f59e0b"
      : "#6b7280"

  const planLabel =
    plan === "pro" ? "Pro" : plan === "enterprise" ? "Enterprise" : "Free"

  return (
    <div
      style={{
        background: "var(--bg-card, rgba(255,255,255,0.05))",
        border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
        borderRadius: 12,
        padding: "1rem 1.25rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem",
        }}
      >
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary, #94a3b8)" }}>
          Quota mensal
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              padding: "0.15rem 0.5rem",
              borderRadius: 9999,
              background: `${planColor}22`,
              color: planColor,
              border: `1px solid ${planColor}44`,
            }}
          >
            {planLabel}
          </span>
          <span style={{ fontSize: "0.82rem", fontWeight: 600, color: textColor }}>
            {used} / {limit} análises
          </span>
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: 9999,
          height: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 9999,
            background: barColor,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {pct >= 90 && (
        <p
          style={{
            marginTop: "0.4rem",
            fontSize: "0.75rem",
            color: "#ef4444",
          }}
        >
          {used >= limit ? "Quota atingida." : "Quase no limite."}
        </p>
      )}
    </div>
  )
}
