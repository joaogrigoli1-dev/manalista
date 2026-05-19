"use client";

import { useState } from "react";
import Link from "next/link";
import type { Session } from "next-auth";

interface AnalysisSummary {
  id: string;
  childName: string;
  childAge: string;
  lang: "pt" | "en";
  qualityScore: number;
  detectedPathologies: string[];
  status: "pending" | "complete" | "error";
  createdAt: Date | string;
}

interface Props {
  analyses: AnalysisSummary[];
  user: Session["user"];
}

function qualityBadge(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: `${score}%`, color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
  if (score >= 60) return { label: `${score}%`, color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
  return { label: `${score}%`, color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
}

function formatDate(dt: Date | string): string {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function HistoricoClient({ analyses: initialAnalyses, user }: Props) {
  const [items, setItems] = useState<AnalysisSummary[]>(initialAnalyses);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analysesUsed: number = (user as any).analysesUsed ?? 0;
  const analysesLimit: number = (user as any).analysesLimit ?? 5;
  const plan: string = (user as any).plan ?? "free";

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir esta análise? Esta ação não pode ser desfeita.")) return;

    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/historico?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Erro ao excluir");
      }
      setItems((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir análise");
    } finally {
      setDeletingId(null);
    }
  }

  const planColor = plan === "pro" ? "#a78bfa" : plan === "enterprise" ? "#f59e0b" : "#6b7280";
  const planLabel = plan === "pro" ? "Pro" : plan === "enterprise" ? "Enterprise" : "Free";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page, #0a0a0f)",
        color: "var(--text-primary, #e2e8f0)",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.25rem" }}>
              Histórico de Análises
            </h1>
            <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.9rem" }}>
              {analysesUsed} de {analysesLimit} análises usadas este mês
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span
              style={{
                padding: "0.25rem 0.75rem",
                borderRadius: 9999,
                background: `${planColor}22`,
                color: planColor,
                fontWeight: 700,
                fontSize: "0.8rem",
                border: `1px solid ${planColor}44`,
              }}
            >
              {planLabel}
            </span>
            <Link
              href="/analise"
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: 8,
                background: "var(--accent-brand, #7c3aed)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none",
              }}
            >
              Nova análise
            </Link>
          </div>
        </div>

        {/* Quota bar */}
        <div
          style={{
            background: "var(--bg-card, rgba(255,255,255,0.05))",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            borderRadius: 12,
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              color: "var(--text-secondary, #94a3b8)",
              marginBottom: "0.5rem",
            }}
          >
            <span>Quota mensal</span>
            <span>
              {analysesUsed}/{analysesLimit}
            </span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 9999, height: 6 }}>
            <div
              style={{
                width: `${Math.min(100, (analysesUsed / analysesLimit) * 100)}%`,
                height: "100%",
                borderRadius: 9999,
                background:
                  analysesUsed >= analysesLimit
                    ? "#ef4444"
                    : analysesUsed / analysesLimit >= 0.8
                    ? "#f59e0b"
                    : "#7c3aed",
                transition: "width 0.4s ease",
              }}
            />
          </div>
          {analysesUsed >= analysesLimit && plan === "free" && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#ef4444" }}>
              Quota atingida.{" "}
              <Link href="/planos" style={{ color: "#a78bfa", textDecoration: "underline" }}>
                Faça upgrade para Pro
              </Link>{" "}
              para continuar.
            </p>
          )}
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

        {/* Empty state */}
        {items.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "4rem 2rem",
              background: "var(--bg-card, rgba(255,255,255,0.04))",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
              Nenhuma análise salva ainda
            </h2>
            <p style={{ color: "var(--text-secondary, #94a3b8)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
              Faça uma análise para ver o histórico aqui.
            </p>
            <Link
              href="/analise"
              style={{
                padding: "0.625rem 1.5rem",
                borderRadius: 8,
                background: "var(--accent-brand, #7c3aed)",
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Fazer análise
            </Link>
          </div>
        )}

        {/* Cards grid */}
        {items.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            }}
          >
            {items.map((a) => {
              const badge = qualityBadge(a.qualityScore);
              const isDeleting = deletingId === a.id;

              return (
                <div
                  key={a.id}
                  style={{
                    background: "var(--bg-card, rgba(255,255,255,0.05))",
                    border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
                    borderRadius: 14,
                    padding: "1.25rem",
                    opacity: isDeleting ? 0.5 : 1,
                    transition: "opacity 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.2rem" }}>
                        {a.childName}
                      </p>
                      <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.8rem" }}>
                        {a.childAge} · {formatDate(a.createdAt)}
                      </p>
                    </div>
                    <span
                      style={{
                        padding: "0.2rem 0.6rem",
                        borderRadius: 9999,
                        background: badge.bg,
                        color: badge.color,
                        fontWeight: 700,
                        fontSize: "0.8rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Pathologies chips */}
                  {a.detectedPathologies.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {a.detectedPathologies.slice(0, 4).map((p, i) => (
                        <span
                          key={i}
                          style={{
                            padding: "0.15rem 0.5rem",
                            borderRadius: 9999,
                            background: "rgba(124,58,237,0.15)",
                            color: "#a78bfa",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            border: "1px solid rgba(124,58,237,0.25)",
                          }}
                        >
                          {p}
                        </span>
                      ))}
                      {a.detectedPathologies.length > 4 && (
                        <span
                          style={{
                            padding: "0.15rem 0.5rem",
                            borderRadius: 9999,
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--text-secondary, #94a3b8)",
                            fontSize: "0.72rem",
                          }}
                        >
                          +{a.detectedPathologies.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.25rem" }}>
                    <Link
                      href={`/historico/${a.id}`}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "0.5rem 0.75rem",
                        borderRadius: 8,
                        background: "rgba(124,58,237,0.15)",
                        color: "#a78bfa",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        textDecoration: "none",
                        border: "1px solid rgba(124,58,237,0.25)",
                        transition: "background 0.2s",
                      }}
                    >
                      Ver laudo completo
                    </Link>
                    <button
                      onClick={() => void handleDelete(a.id)}
                      disabled={isDeleting}
                      style={{
                        padding: "0.5rem 0.75rem",
                        borderRadius: 8,
                        background: "rgba(239,68,68,0.1)",
                        color: "#ef4444",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        border: "1px solid rgba(239,68,68,0.2)",
                        cursor: isDeleting ? "not-allowed" : "pointer",
                        transition: "background 0.2s",
                      }}
                    >
                      {isDeleting ? "..." : "Excluir"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
