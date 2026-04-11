"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { AgentProfile, Lang } from "@/types";

// Mini markdown renderer for parent-friendly text (simplified)
function MiniText({ text }: { text: string }) {
  // Simple: just render paragraphs with bold support
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p style={{ fontSize: "0.8rem", lineHeight: 1.65, color: "var(--text-secondary)" }}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} style={{ color: "var(--text-primary)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </p>
  );
}

interface AgentMiniCardProps {
  agent: AgentProfile;
  lang: Lang;
  status: "idle" | "analyzing" | "ready" | "debating";
  dialogText?: string;
  isStreaming?: boolean;
  onInfoClick?: () => void;
}

export function AgentMiniCard({ agent, lang, status, dialogText, isStreaming, onInfoClick }: AgentMiniCardProps) {
  const [imgError, setImgError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const pt = lang === "pt";
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll dialog when streaming
  useEffect(() => {
    if (scrollRef.current && isStreaming) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [dialogText, isStreaming]);

  const STATUS_DOT: Record<string, { bg: string; animate: boolean }> = {
    idle: { bg: "rgba(255,255,255,0.2)", animate: false },
    analyzing: { bg: "#F59E0B", animate: true },
    ready: { bg: "#10B981", animate: false },
    debating: { bg: "#7C5CFC", animate: true },
  };
  const dot = STATUS_DOT[status];

  // Truncate for parent-friendly preview
  const truncated = dialogText && dialogText.length > 200 && !expanded
    ? dialogText.slice(0, 200) + "..."
    : dialogText;

  return (
    // Outer shell (Double-Bezel)
    <div style={{
      padding: "0.25rem",
      borderRadius: "1rem",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderLeft: `3px solid ${agent.color}88`,
      transition: "all 0.5s cubic-bezier(0.32,0.72,0,1)",
      ...(isStreaming ? {
        borderColor: `${agent.color}44`,
        boxShadow: `0 0 20px ${agent.color}15`,
      } : {}),
    }}>
      {/* Inner core */}
      <div style={{
        borderRadius: "calc(1rem - 0.25rem)",
        padding: "0.65rem",
        background: "rgba(10,10,14,0.85)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
        position: "relative",
      }}>
        {/* Profile button */}
        {onInfoClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
            style={{
              position: "absolute", top: "0.5rem", right: "0.5rem",
              padding: "0.15rem 0.45rem",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "var(--text-muted)",
              fontSize: "0.55rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
              (e.target as HTMLButtonElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              (e.target as HTMLButtonElement).style.color = "var(--text-muted)";
            }}
          >{pt ? "PERFIL" : "PROFILE"}</button>
        )}

        {/* Avatar + Name row */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: "0.6rem", overflow: "hidden", flexShrink: 0,
            background: agent.colorLight, border: `1px solid ${agent.color}33`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {!imgError ? (
              <Image
                src={`/avatars/${agent.id}.svg`}
                alt={pt ? agent.namePt : agent.nameEn}
                width={32} height={32}
                style={{ objectFit: "cover" }}
                onError={() => setImgError(true)}
              />
            ) : (
              <span style={{ fontSize: "1rem" }}>{agent.emoji}</span>
            )}
          </div>
          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {pt ? agent.namePt : agent.nameEn}
            </div>
            <div style={{ fontSize: "0.6rem", color: agent.color, fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: dot.bg, flexShrink: 0,
                ...(dot.animate ? { animation: "pulse-slow 1.5s ease-in-out infinite" } : {}),
              }} />
              {pt ? agent.rolePt : agent.roleEn}
            </div>
          </div>
        </div>

        {/* Dialog box */}
        <div
          ref={scrollRef}
          style={{
            maxHeight: 180, overflowY: "auto",
            padding: dialogText ? "0.55rem 0.7rem" : "0.35rem 0.5rem",
            borderRadius: "0.6rem",
            background: dialogText ? "rgba(255,255,255,0.03)" : "transparent",
            border: dialogText ? "1px solid rgba(255,255,255,0.05)" : "1px dashed rgba(255,255,255,0.08)",
            borderLeft: dialogText ? `2px solid ${agent.color}55` : undefined,
            transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          {dialogText ? (
            <>
              <MiniText text={truncated ?? ""} />
              {dialogText.length > 200 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  style={{
                    marginTop: "0.3rem", fontSize: "0.62rem", color: agent.color,
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: "inherit", fontWeight: 600,
                  }}
                >
                  {expanded ? (pt ? "▲ Menos" : "▲ Less") : (pt ? "▼ Ver mais" : "▼ See more")}
                </button>
              )}
              {isStreaming && (
                <span style={{
                  display: "inline-block", width: 2, height: "0.85em",
                  background: agent.color, marginLeft: 3, verticalAlign: "text-bottom",
                  animation: "blink-cursor 0.8s step-end infinite",
                }} />
              )}
            </>
          ) : (
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "center", padding: "0.4rem 0" }}>
              {status === "idle" ? (pt ? "Aguardando..." : "Waiting...") : (pt ? "Analisando..." : "Analyzing...")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
