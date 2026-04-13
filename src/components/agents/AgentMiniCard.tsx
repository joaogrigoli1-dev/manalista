"use client";
import { useState } from "react";
import Image from "next/image";
import type { AgentProfile, Lang } from "@/types";

// ── Voice Waveform bars — green, animate when speaking ──
function VoiceWaveform({ active, color }: { active: boolean; color: string }) {
  const BARS = [3, 7, 12, 18, 14, 9, 20, 15, 11, 6, 16, 22, 13, 8, 17, 10, 5, 19, 12, 7];
  const activeColor = "#22C55E"; // green-500
  const idleColor   = "rgba(34,197,94,0.25)"; // green dim

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "2px",
      height: 40,
      padding: "0.4rem 0.6rem",
      borderRadius: "0.55rem",
      background: "rgba(34,197,94,0.05)",
      border: "1px solid rgba(34,197,94,0.1)",
    }}>
      {BARS.map((h, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: active ? h : Math.max(3, h * 0.18),
            borderRadius: 2,
            background: active ? activeColor : idleColor,
            transition: "height 0.15s ease",
            ...(active ? {
              animation: `wave-bar 0.${(5 + (i % 6))}s ease-in-out infinite alternate`,
              animationDelay: `${(i * 0.04).toFixed(2)}s`,
            } : {}),
          }}
        />
      ))}
      <style>{`
        @keyframes wave-bar {
          0%   { transform: scaleY(0.3); }
          100% { transform: scaleY(1.0); }
        }
      `}</style>
    </div>
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

export function AgentMiniCard({ agent, lang, status, isStreaming, onInfoClick }: AgentMiniCardProps) {
  const [imgError, setImgError] = useState(false);
  const pt = lang === "pt";

  const STATUS_DOT: Record<string, { bg: string; animate: boolean }> = {
    idle:      { bg: "rgba(255,255,255,0.2)", animate: false },
    analyzing: { bg: "#F59E0B", animate: true },
    ready:     { bg: "#10B981", animate: false },
    debating:  { bg: "#22C55E", animate: true },
  };
  const dot = STATUS_DOT[status] ?? STATUS_DOT.idle;

  const statusLabel = {
    idle:      { pt: "Aguardando", en: "Waiting" },
    analyzing: { pt: "Analisando…", en: "Analyzing…" },
    ready:     { pt: "Pronto", en: "Ready" },
    debating:  { pt: "Debatendo…", en: "Debating…" },
  }[status] ?? { pt: "Aguardando", en: "Waiting" };

  return (
    // Outer shell — Double-Bezel
    <div style={{
      padding: "0.25rem",
      borderRadius: "1rem",
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${isStreaming ? `${agent.color}44` : "rgba(255,255,255,0.06)"}`,
      borderLeft: `3px solid ${agent.color}88`,
      transition: "all 0.45s cubic-bezier(0.32,0.72,0,1)",
      boxShadow: isStreaming ? `0 0 24px ${agent.color}12` : "none",
    }}>
      {/* Inner core */}
      <div style={{
        borderRadius: "calc(1rem - 0.25rem)",
        padding: "0.65rem",
        background: "rgba(10,10,14,0.88)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.05)",
        position: "relative",
      }}>
        {/* PROFILE button — shows avatar thumbnail */}
        {onInfoClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
            title={pt ? "Ver perfil" : "View profile"}
            style={{
              position: "absolute", top: "0.5rem", right: "0.5rem",
              width: 28, height: 28,
              borderRadius: "50%",
              overflow: "hidden",
              border: `1.5px solid ${agent.color}55`,
              background: agent.colorLight ?? "rgba(124,92,252,0.12)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0,
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.12)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 0 2px ${agent.color}55`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            <AvatarThumb agent={agent} size={28} />
          </button>
        )}

        {/* Avatar + Name */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.55rem" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "0.75rem", overflow: "hidden", flexShrink: 0,
            background: "#111", border: `1.5px solid ${agent.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 2px 10px ${agent.color}15`,
          }}>
            {!imgError ? (
              <Image
                src={`/avatars/${agent.id}.svg`}
                alt={pt ? agent.namePt : agent.nameEn}
                width={52} height={52}
                style={{ objectFit: "cover" }}
                onError={() => setImgError(true)}
              />
            ) : (
              <span style={{ fontSize: "1.3rem" }}>{agent.emoji}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {pt ? agent.namePt : agent.nameEn}
            </div>
            <div style={{ fontSize: "0.58rem", color: agent.color, fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.12rem" }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: dot.bg, flexShrink: 0,
                ...(dot.animate ? { animation: "pulse-slow 1.5s ease-in-out infinite" } : {}),
              }} />
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {pt ? statusLabel.pt : statusLabel.en}
              </span>
            </div>
            <div style={{ fontSize: "0.56rem", color: "var(--text-muted)", marginTop: "0.08rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {pt ? agent.rolePt : agent.roleEn}
            </div>
          </div>
        </div>

        {/* Voice waveform — animates when streaming, static otherwise */}
        <VoiceWaveform active={!!isStreaming} color={agent.color} />
      </div>
    </div>
  );
}

// ── Small avatar thumbnail helper ──
function AvatarThumb({ agent, size }: { agent: AgentProfile; size: number }) {
  const [err, setErr] = useState(false);
  if (err) return <span style={{ fontSize: size * 0.45 }}>{agent.emoji}</span>;
  return (
    <Image
      src={`/avatars/${agent.id}.svg`}
      alt=""
      width={size} height={size}
      style={{ objectFit: "cover", display: "block" }}
      onError={() => setErr(true)}
    />
  );
}
