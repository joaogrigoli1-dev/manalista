"use client";
import { useState } from "react";
import type { AgentProfile, Lang } from "@/types";

interface AgentCardProps {
  agent: AgentProfile;
  lang: Lang;
  status?: "idle" | "analyzing" | "ready" | "debating";
  highlight?: boolean;
}

const STATUS_CONFIG = {
  idle:      { color: "var(--text-muted)",      label: { pt: "Aguardando", en: "Waiting" } },
  analyzing: { color: "#F59E0B",                label: { pt: "Analisando...", en: "Analyzing..." } },
  ready:     { color: "#10B981",                label: { pt: "Pronto", en: "Ready" } },
  debating:  { color: "var(--accent-brand)",    label: { pt: "Debatendo", en: "Debating" } },
};

export function AgentCard({ agent, lang, status = "idle", highlight }: AgentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[status];

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="card card-agent"
      style={{
        padding: "0.375rem", cursor: "pointer",
        transition: "all 0.25s ease",
        ...(highlight ? { boxShadow: `0 0 0 2px ${agent.color}55, var(--shadow-card)`, borderColor: `${agent.color}44` } : {}),
      }}
    >
      <div style={{
        borderRadius: "calc(var(--radius-card) - 0.375rem)",
        padding: "1.25rem",
        background: "var(--bg-card)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "0.85rem", flexShrink: 0,
            background: agent.colorLight,
            border: `1px solid ${agent.color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.4rem",
          }}>{agent.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
              {lang === "pt" ? agent.namePt : agent.nameEn}
            </div>
            <div style={{ fontSize: "0.75rem", color: agent.color, fontWeight: 600, marginTop: 2 }}>
              {lang === "pt" ? agent.rolePt : agent.roleEn}
            </div>
          </div>
          {/* Status badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: sc.color,
              ...(status === "analyzing" ? { animation: "pulse-slow 2s ease-in-out infinite" } : {}),
            }} />
            <span style={{ fontSize: "0.65rem", color: sc.color, fontWeight: 600 }}>
              {sc.label[lang]}
            </span>
          </div>
        </div>

        {/* Short bio (always visible) */}
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.75rem", lineHeight: 1.6 }}>
          {lang === "pt" ? agent.bioShortPt : agent.bioShortEn}
        </p>

        {/* Expanded details */}
        {expanded && (
          <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-label)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.4rem" }}>
              {lang === "pt" ? "Credenciais" : "Credentials"}
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.85rem", fontStyle: "italic" }}>
              {lang === "pt" ? agent.credentialsPt : agent.credentialsEn}
            </p>

            <div style={{ fontSize: "0.7rem", color: "var(--text-label)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.4rem" }}>
              {lang === "pt" ? "Ferramentas Clínicas" : "Clinical Tools"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.85rem" }}>
              {agent.tools.map((tool) => (
                <span key={tool} style={{
                  padding: "0.2rem 0.55rem", borderRadius: "0.45rem", fontSize: "0.7rem",
                  background: agent.colorLight, color: agent.color,
                  border: `1px solid ${agent.color}22`, fontWeight: 500,
                }}>{tool}</span>
              ))}
            </div>

            <div style={{ fontSize: "0.7rem", color: "var(--text-label)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.4rem" }}>
              {lang === "pt" ? "Abordagem" : "Approach"}
            </div>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
              {lang === "pt" ? agent.approachPt : agent.approachEn}
            </p>

            <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "0.75rem", fontStyle: "italic" }}>
              {lang === "pt"
                ? "⚠️ Personagem fictício criado para demonstração. Não representa profissional real."
                : "⚠️ Fictional character created for demonstration. Does not represent a real professional."}
            </p>
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: "0.5rem", fontSize: "0.65rem", color: "var(--text-muted)" }}>
          {expanded ? "▲" : "▼"}
        </div>
      </div>
    </div>
  );
}
