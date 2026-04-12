"use client";
import type { DiagnosticSuggestion, Lang, DebateMessage } from "@/types";

interface DiagnosticReportProps {
  results: DiagnosticSuggestion[];
  lang: Lang;
  childName: string;
  messages?: DebateMessage[];
  downloadError?: string | null;
}

const EVIDENCE_CONFIG = {
  A: { color: "#10B981", desc: "Forte evidência (RCTs, meta-análises)" },
  B: { color: "#F59E0B", desc: "Evidência moderada (estudos coorte)" },
  C: { color: "#E5725C", desc: "Evidência limitada (consenso expert)" },
};

export function DiagnosticReport({ results, lang, childName, downloadError }: DiagnosticReportProps) {
  const pt = lang === "pt";

  if (!results.length) return null;

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Report header ─────────────────────────────── */}
      <div style={{
        padding: "1.25rem 1.5rem", borderRadius: "1.25rem",
        background: "linear-gradient(135deg, rgba(124,92,252,0.08), rgba(59,155,245,0.06))",
        border: "1px solid rgba(124,92,252,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{
            width: 44, height: 44, borderRadius: "0.85rem", flexShrink: 0,
            background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem",
          }}>📋</div>
          <div>
            <h2 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.15rem" }}>
              {pt ? "Relatório de Sugestão Diagnóstica" : "Diagnostic Suggestion Report"}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              {pt ? `Análise de: ${childName}` : `Analysis for: ${childName}`}
              {" · "}{new Date().toLocaleDateString(pt ? "pt-BR" : "en-US")}
            </p>
          </div>
        </div>

        {/* PDF download error */}
        {downloadError && (
          <div style={{ marginTop: "0.85rem", padding: "0.65rem 0.9rem", borderRadius: "0.65rem", background: "rgba(229,114,92,0.1)", border: "1px solid rgba(229,114,92,0.2)" }}>
            <p style={{ fontSize: "0.75rem", color: "#E5725C" }}>⚠️ {downloadError}</p>
          </div>
        )}

        {/* Demo warning */}
        <div style={{ marginTop: "0.85rem", padding: "0.6rem 0.9rem", borderRadius: "0.65rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.18)" }}>
          <p style={{ fontSize: "0.72rem", color: "#F59E0B", fontWeight: 600 }}>
            ⚠️ {pt
              ? "MODO DEMONSTRAÇÃO — Sugestão hipotética sem validade diagnóstica real. Não substitui avaliação profissional."
              : "DEMO MODE — Hypothetical suggestion with no real diagnostic validity. Does not replace professional evaluation."}
          </p>
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────── */}
      {results.map((result, idx) => (
        <div key={idx} className="card" style={{ padding: "0.375rem" }}>
          <div style={{
            borderRadius: "calc(var(--radius-card) - 0.375rem)", padding: "1.5rem",
            background: "var(--bg-card)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
          }}>

            {/* Treatment suggestions */}
            {result.treatmentSuggestions.length > 0 && (
              <div style={{ marginBottom: "1.25rem" }}>
                <p style={{ fontSize: "0.62rem", color: "var(--text-label)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>{pt ? "Sugestões de Tratamento" : "Treatment Suggestions"}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                  {result.treatmentSuggestions.map((t, i) => {
                    const ev = EVIDENCE_CONFIG[t.evidenceLevel];
                    return (
                      <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.85rem 1rem", borderRadius: "0.75rem", background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
                        <span style={{ width: 26, height: 26, borderRadius: "0.4rem", flexShrink: 0, background: `${ev.color}18`, color: ev.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, border: `1px solid ${ev.color}30` }}>{t.evidenceLevel}</span>
                        <div>
                          <p style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{t.modality}</p>
                          <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{t.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Scientific refs */}
            {result.scientificRefs.length > 0 && (
              <div style={{ padding: "0.85rem 1rem", borderRadius: "0.75rem", background: "var(--bg-glass)", border: "1px solid var(--border-subtle)" }}>
                <p style={{ fontSize: "0.62rem", color: "var(--text-label)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>{pt ? "Referências Científicas" : "Scientific References"}</p>
                {result.scientificRefs.map((ref, i) => (
                  <p key={i} style={{ fontSize: "0.74rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "0.3rem" }}>
                    [{i + 1}] {ref.authors} ({ref.year}). <em>{ref.title}</em>. {ref.journal}.{ref.doi ? ` DOI: ${ref.doi}` : ""}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Final disclaimer */}
      <div style={{ padding: "1rem 1.25rem", borderRadius: "0.85rem", background: "rgba(229,114,92,0.07)", border: "1px solid rgba(229,114,92,0.15)", textAlign: "center" }}>
        <p style={{ fontSize: "0.77rem", color: "#E5725C", lineHeight: 1.7 }}>
          {pt
            ? "Este relatório foi gerado por agentes de IA em modo demonstração. Consulte profissionais de saúde habilitados para avaliação real da criança."
            : "This report was generated by AI agents in demo mode. Consult qualified health professionals for a real child evaluation."}
        </p>
      </div>

    </div>
  );
}
