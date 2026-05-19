import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db-server";
import { analyses } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export const metadata = {
  title: "Laudo Completo — MAnalista",
};

function formatDate(dt: Date | string): string {
  const d = typeof dt === "string" ? new Date(dt) : dt;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function qualityColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

export default async function HistoricoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=/historico");

  const { id } = await params;

  const rows = await db
    .select()
    .from(analyses)
    .where(eq(analyses.id, id))
    .limit(1);

  if (rows.length === 0) notFound();

  const analysis = rows[0];

  if (analysis.userId !== session.user.id) {
    notFound();
  }

  const color = qualityColor(analysis.qualityScore);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-page, #0a0a0f)",
        color: "var(--text-primary, #e2e8f0)",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Back link */}
        <Link
          href="/historico"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            color: "var(--text-secondary, #94a3b8)",
            textDecoration: "none",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
            fontWeight: 500,
          }}
        >
          ← Voltar para histórico
        </Link>

        {/* Header card */}
        <div
          style={{
            background: "var(--bg-card, rgba(255,255,255,0.05))",
            border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
            borderRadius: 16,
            padding: "1.5rem",
            marginBottom: "1.25rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                {analysis.childName}
              </h1>
              <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.875rem" }}>
                Idade: {analysis.childAge} · Idioma: {analysis.lang === "pt" ? "Português" : "English"}
              </p>
              <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                Criado em {formatDate(analysis.createdAt)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 900,
                  color,
                  lineHeight: 1,
                }}
              >
                {analysis.qualityScore}%
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary, #94a3b8)", marginTop: "0.25rem" }}>
                Score de qualidade
              </div>
            </div>
          </div>

          {/* Pathologies */}
          {analysis.detectedPathologies.length > 0 && (
            <div style={{ marginTop: "1rem" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary, #94a3b8)", marginBottom: "0.5rem", fontWeight: 600 }}>
                Patologias detectadas
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                {analysis.detectedPathologies.map((p, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "0.2rem 0.65rem",
                      borderRadius: 9999,
                      background: "rgba(124,58,237,0.15)",
                      color: "#a78bfa",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      border: "1px solid rgba(124,58,237,0.25)",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results JSON */}
        {!!analysis.resultsJson && (
          <div
            style={{
              background: "var(--bg-card, rgba(255,255,255,0.05))",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              borderRadius: 16,
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
              Resultado da análise
            </h2>
            <pre
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 8,
                padding: "1rem",
                overflowX: "auto",
                fontSize: "0.78rem",
                lineHeight: 1.6,
                color: "var(--text-secondary, #94a3b8)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(analysis.resultsJson, null, 2)}
            </pre>
          </div>
        )}

        {/* Debate messages */}
        {!!analysis.debateMessagesJson && (
          <div
            style={{
              background: "var(--bg-card, rgba(255,255,255,0.05))",
              border: "1px solid var(--border-subtle, rgba(255,255,255,0.08))",
              borderRadius: 16,
              padding: "1.5rem",
              marginBottom: "1.25rem",
            }}
          >
            <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem" }}>
              Debate dos especialistas
            </h2>
            <pre
              style={{
                background: "rgba(0,0,0,0.3)",
                borderRadius: 8,
                padding: "1rem",
                overflowX: "auto",
                fontSize: "0.78rem",
                lineHeight: 1.6,
                color: "var(--text-secondary, #94a3b8)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {JSON.stringify(analysis.debateMessagesJson, null, 2)}
            </pre>
          </div>
        )}

        {/* Back button */}
        <div style={{ marginTop: "1rem" }}>
          <Link
            href="/historico"
            style={{
              display: "inline-block",
              padding: "0.625rem 1.5rem",
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              color: "var(--text-primary, #e2e8f0)",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            ← Voltar para histórico
          </Link>
        </div>
      </div>
    </div>
  );
}
