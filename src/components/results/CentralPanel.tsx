"use client";
import { KPIGauge } from "./KPIGauge";
import type { Lang } from "@/types";

export interface DetectedPathology {
  name: string;
  percentage: number;
  color: string;
  evidence: string[];
}

export interface SpecialistRecommendation {
  specialty: string;
  reason: string;
  urgency: "normal" | "prioritario" | "urgente";
}

interface CentralPanelProps {
  lang: Lang;
  pathologies: DetectedPathology[];
  recommendations: SpecialistRecommendation[];
  isAnalyzing: boolean;
  qualityScore: number; // 0-100 average confidence
  needsMoreInfo?: boolean;
  pendingQuestions?: string[];
}

export function CentralPanel({
  lang, pathologies, recommendations, isAnalyzing, qualityScore, needsMoreInfo, pendingQuestions,
}: CentralPanelProps) {
  const pt = lang === "pt";
  const URGENCY_COLORS = {
    normal: { bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", text: "#10B981", label: pt ? "Normal" : "Normal" },
    prioritario: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", text: "#F59E0B", label: pt ? "Prioritário" : "Priority" },
    urgente: { bg: "rgba(229,114,92,0.1)", border: "rgba(229,114,92,0.2)", text: "#E5725C", label: pt ? "Urgente" : "Urgent" },
  };

  return (
    // Double-Bezel outer shell
    <div style={{
      padding: "0.5rem", borderRadius: "1.75rem",
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    }}>
      {/* Inner core */}
      <div style={{
        borderRadius: "calc(1.75rem - 0.5rem)", padding: "1.5rem",
        background: "rgba(10,10,14,0.9)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
        minHeight: 400,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <div>
            <p style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--accent-brand)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "0.25rem" }}>
              {pt ? "PAINEL DE RESULTADOS" : "RESULTS PANEL"}
            </p>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {isAnalyzing ? (pt ? "Análise em andamento..." : "Analysis in progress...") : (pt ? "Resultado da Análise" : "Analysis Result")}
            </h3>
          </div>
          {/* Quality score */}
          {qualityScore > 0 && (
            <div style={{
              padding: "0.3rem 0.75rem", borderRadius: "9999px",
              background: qualityScore >= 70 ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
              border: `1px solid ${qualityScore >= 70 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
            }}>
              <span style={{
                fontSize: "0.68rem", fontWeight: 700,
                color: qualityScore >= 70 ? "#10B981" : "#F59E0B",
              }}>
                {pt ? "Confiança" : "Confidence"}: {qualityScore}%
              </span>
            </div>
          )}
        </div>

        {/* Needs more info gate */}
        {needsMoreInfo && pendingQuestions && pendingQuestions.length > 0 && (
          <div style={{
            padding: "1.25rem", borderRadius: "1rem", marginBottom: "1.25rem",
            background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)",
          }}>
            <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#F59E0B", marginBottom: "0.75rem" }}>
              ⚠️ {pt ? "Precisamos de mais informações para uma análise segura" : "We need more information for a safe analysis"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {pendingQuestions.map((q, i) => (
                <div key={i} style={{
                  padding: "0.55rem 0.75rem", borderRadius: "0.5rem",
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    <span style={{ color: "#F59E0B", fontWeight: 700, marginRight: "0.4rem" }}>{i + 1}.</span> {q}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Gauges */}
        {pathologies.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.85rem" }}>
              {pt ? "INDICADORES DETECTADOS" : "DETECTED INDICATORS"}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}>
              {pathologies.filter(p => p.percentage > 30).map((p, i) => (
                <KPIGauge key={i} label={p.name} value={p.percentage} color={p.color} />
              ))}
            </div>
          </div>
        )}

        {/* Evidence bullets */}
        {pathologies.length > 0 && pathologies.some(p => p.evidence.length > 0) && (
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.6rem" }}>
              {pt ? "FATOS QUE SUSTENTAM A CONCLUSÃO" : "SUPPORTING FACTS"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {pathologies.flatMap(p => p.evidence.map((e, i) => (
                <div key={`${p.name}-${i}`} style={{
                  padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                  background: "rgba(255,255,255,0.02)", borderLeft: `2px solid ${p.color}55`,
                }}>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    <span style={{ color: p.color, fontWeight: 700, marginRight: "0.3rem" }}>•</span> {e}
                  </p>
                </div>
              )))}
            </div>
          </div>
        )}

        {/* Specialist recommendations */}
        {recommendations.length > 0 && (
          <div>
            <p style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.6rem" }}>
              {pt ? "PROFISSIONAL RECOMENDADO" : "RECOMMENDED SPECIALIST"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {recommendations.map((rec, i) => {
                const u = URGENCY_COLORS[rec.urgency];
                return (
                  <div key={i} style={{
                    padding: "0.85rem 1rem", borderRadius: "0.75rem",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", gap: "0.75rem", alignItems: "flex-start",
                  }}>
                    <div style={{
                      padding: "0.15rem 0.5rem", borderRadius: "9999px", flexShrink: 0,
                      background: u.bg, border: `1px solid ${u.border}`, marginTop: "0.15rem",
                    }}>
                      <span style={{ fontSize: "0.55rem", fontWeight: 700, color: u.text, textTransform: "uppercase", letterSpacing: "0.1em" }}>{u.label}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.2rem" }}>{rec.specialty}</p>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{rec.reason}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state while analyzing */}
        {isAnalyzing && pathologies.length === 0 && (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "3rem 1rem", gap: "0.75rem",
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: "1rem",
              background: "var(--accent-brand-soft)", border: "1px solid rgba(124,92,252,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem",
            }}>📊</div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", textAlign: "center" }}>
              {pt ? "Os resultados aparecerão aqui conforme a análise avança." : "Results will appear here as the analysis progresses."}
            </p>
            <div style={{ display: "flex", gap: "0.3rem" }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-brand)", opacity: 0.5, animation: `typing-bounce 1.4s ease-in-out ${i*0.25}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}