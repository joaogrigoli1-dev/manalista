"use client";
import { useState } from "react";
import type { DiagnosticSuggestion, Lang, DebateMessage } from "@/types";
import { AGENT_PROFILES } from "@/lib/agents/profiles";

interface DiagnosticReportProps {
  results: DiagnosticSuggestion[];
  lang: Lang;
  childName: string;
  messages?: DebateMessage[];
}

const CONFIDENCE_CONFIG = {
  alta:     { color: "#10B981", labelPt: "Alta",     labelEn: "High",     bar: 90 },
  moderada: { color: "#F59E0B", labelPt: "Moderada", labelEn: "Moderate", bar: 60 },
  baixa:    { color: "#E5725C", labelPt: "Baixa",    labelEn: "Low",      bar: 35 },
};

const EVIDENCE_CONFIG = {
  A: { color: "#10B981", desc: "Forte evidência (RCTs, meta-análises)" },
  B: { color: "#F59E0B", desc: "Evidência moderada (estudos coorte)" },
  C: { color: "#E5725C", desc: "Evidência limitada (consenso expert)" },
};

export function DiagnosticReport({ results, lang, childName, messages = [] }: DiagnosticReportProps) {
  const pt = lang === "pt";
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch("/api/relatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childData: { name: childName }, messages, results, lang }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error ?? "Falha ao gerar PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MAnalista_${childName.replace(/[^a-zA-Z0-9]/g,"_")}_${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setDownloadError(e instanceof Error ? e.message : String(e));
    } finally {
      setDownloading(false);
    }
  }

  if (!results.length) return null;

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Header + Download ───────────────────────────── */}
      <div style={{
        padding: "1.5rem", borderRadius: "1.25rem",
        background: "linear-gradient(135deg, rgba(124,92,252,0.08), rgba(59,155,245,0.06))",
        border: "1px solid rgba(124,92,252,0.18)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{
              width: 48, height: 48, borderRadius: "0.85rem", flexShrink: 0,
              background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem",
            }}>📋</div>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.2rem" }}>
                {pt ? "Relatório de Sugestão Diagnóstica" : "Diagnostic Suggestion Report"}
              </h2>
              <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                {pt ? `Análise de: ${childName}` : `Analysis for: ${childName}`}
                {" · "}{new Date().toLocaleDateString(pt ? "pt-BR" : "en-US")}
              </p>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.7rem 1.4rem", borderRadius: "9999px",
              border: "none", cursor: downloading ? "wait" : "pointer",
              background: downloading ? "rgba(124,92,252,0.4)" : "var(--accent-brand)",
              color: "#fff", fontFamily: "inherit", fontWeight: 700,
              fontSize: "0.85rem", flexShrink: 0,
              boxShadow: downloading ? "none" : "var(--shadow-button)",
              transition: "all 0.3s ease",
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloading ? (
              <>
                <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                {pt ? "Gerando PDF..." : "Generating PDF..."}
              </>
            ) : (
              <>
                ⬇ {pt ? "Baixar Relatório PDF" : "Download PDF Report"}
              </>
            )}
          </button>
        </div>

        {/* Error */}
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
      {results.map((result, idx) => {
        const conf = CONFIDENCE_CONFIG[result.confidence];
        const supportingAgents = result.supportingAgents
          .map(id => AGENT_PROFILES.find(a => a.id === id))
          .filter(Boolean);

        return (
          <div key={idx} className="card" style={{ padding: "0.375rem" }}>
            <div style={{
              borderRadius: "calc(var(--radius-card) - 0.375rem)", padding: "1.5rem",
              background: "var(--bg-card)", boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
            }}>
              {/* Pathology + codes + confidence */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <span style={{ width: 28, height: 28, borderRadius: "0.5rem", background: "var(--accent-brand-soft)", color: "var(--accent-brand)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 800, flexShrink: 0 }}>{idx + 1}</span>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>{result.primaryPathology}</h3>
                  </div>
                  <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "0.45rem", fontSize: "0.68rem", fontWeight: 700, background: "rgba(59,155,245,0.1)", color: "#3B9BF5", border: "1px solid rgba(59,155,245,0.2)" }}>CID-11: {result.icd11Code}</span>
                    <span style={{ padding: "0.2rem 0.6rem", borderRadius: "0.45rem", fontSize: "0.68rem", fontWeight: 700, background: "rgba(124,92,252,0.1)", color: "#7C5CFC", border: "1px solid rgba(124,92,252,0.2)" }}>DSM-5: {result.dsm5Code}</span>
                  </div>
                </div>
                <div style={{ minWidth: 130 }}>
                  <p style={{ fontSize: "0.6rem", color: "var(--text-label)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.3rem" }}>{pt ? "Confiança" : "Confidence"}</p>
                  <div style={{ height: 6, borderRadius: 3, background: "var(--border-subtle)", overflow: "hidden", marginBottom: "0.3rem" }}>
                    <div style={{ height: "100%", width: `${conf.bar}%`, background: conf.color, borderRadius: 3 }} />
                  </div>
                  <p style={{ fontSize: "0.72rem", color: conf.color, fontWeight: 700 }}>{pt ? conf.labelPt : conf.labelEn} ({conf.bar}%)</p>
                </div>
              </div>

              {/* Supporting agents */}
              <div style={{ marginBottom: "1.25rem" }}>
                <p style={{ fontSize: "0.62rem", color: "var(--text-label)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.5rem" }}>{pt ? "Especialistas em Consenso" : "Specialists in Consensus"}</p>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  {supportingAgents.map((agent) => agent && (
                    <span key={agent.id} style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.22rem 0.6rem", borderRadius: "9999px", fontSize: "0.7rem", background: agent.colorLight, color: agent.color, border: `1px solid ${agent.color}22`, fontWeight: 600 }}>
                      {agent.emoji} {pt ? agent.namePt.split(" ").slice(-1)[0] : agent.nameEn.split(" ").slice(-1)[0]}
                    </span>
                  ))}
                </div>
              </div>

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
        );
      })}

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
