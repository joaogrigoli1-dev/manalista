"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { AgentProfile, Lang } from "@/types";

// Simple backstory type for now
export interface AgentBackstory {
  originName: string;
  originDescription: string;
  whyChosen: string;
  fictionalBio: string;
  expertiseRefs: Array<{ type: "book" | "paper"; author: string; year: number; title: string }>;
  clinicalApproach: string;
}

interface CharacterModalProps {
  agent: AgentProfile;
  backstory: AgentBackstory;
  lang: Lang;
  onClose: () => void;
}

export function CharacterModal({ agent, backstory, lang, onClose }: CharacterModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const pt = lang === "pt";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1.5rem",
        animation: "fade-in-up 0.3s cubic-bezier(0.32,0.72,0,1) both",
      }}
    >
      {/* Double-Bezel modal */}
      <div style={{
        maxWidth: 520, width: "100%", maxHeight: "85vh", overflowY: "auto",
        padding: "0.5rem", borderRadius: "2rem",
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{
          borderRadius: "calc(2rem - 0.5rem)", padding: "2rem",
          background: "rgba(10,10,14,0.95)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.08)",
        }}>
          {/* Close */}
          <button onClick={onClose} style={{
            float: "right", width: 28, height: 28, borderRadius: "50%",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-muted)", fontSize: "0.75rem", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
            (e.target as HTMLButtonElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            (e.target as HTMLButtonElement).style.color = "var(--text-muted)";
          }}
          >✕</button>

          {/* Avatar + Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", clear: "both" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "1rem", overflow: "hidden",
              background: agent.colorLight, border: `2px solid ${agent.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {!imgError ? (
                <Image src={`/avatars/${agent.id}.png`} alt="" width={72} height={72} style={{ objectFit: "cover" }} onError={() => setImgError(true)} />
              ) : (
                <span style={{ fontSize: "2rem" }}>{agent.emoji}</span>
              )}
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>{pt ? agent.namePt : agent.nameEn}</h3>
              <p style={{ fontSize: "0.78rem", color: agent.color, fontWeight: 600 }}>{pt ? agent.rolePt : agent.roleEn}</p>
            </div>
          </div>

          {/* Origin */}
          <Section title={pt ? "Por que este nome?" : "Why this name?"} color={agent.color}>
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>{backstory.originName}</p>
            <p style={bodyStyle}>{backstory.originDescription}</p>
          </Section>

          {/* Why chosen */}
          <Section title={pt ? "Por que está na equipe?" : "Why is in the team?"} color={agent.color}>
            <p style={bodyStyle}>{backstory.whyChosen}</p>
          </Section>

          {/* Bio */}
          <Section title={pt ? "Formação" : "Background"} color={agent.color}>
            <p style={bodyStyle}>{backstory.fictionalBio}</p>
          </Section>

          {/* References */}
          <Section title={pt ? "Referências que domina" : "References mastered"} color={agent.color}>
            {backstory.expertiseRefs.map((ref, i) => (
              <p key={i} style={{ fontSize: "0.73rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem", borderRadius: "0.25rem", background: ref.type === "book" ? "rgba(124,92,252,0.1)" : "rgba(59,155,245,0.1)", color: ref.type === "book" ? "#7C5CFC" : "#3B9BF5", fontWeight: 700, marginRight: "0.4rem" }}>
                  {ref.type === "book" ? "📚" : "📄"}
                </span>
                {ref.author} ({ref.year}). <em>{ref.title}</em>
              </p>
            ))}
          </Section>

          {/* Clinical approach */}
          <Section title={pt ? "Abordagem clínica" : "Clinical approach"} color={agent.color}>
            <p style={bodyStyle}>{backstory.clinicalApproach}</p>
          </Section>

          {/* Disclaimer */}
          <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "1rem", textAlign: "center" }}>
            ⚠️ {pt ? "Personagem fictício criado para demonstração." : "Fictional character for demonstration."}
          </p>
        </div>
      </div>
    </div>
  );
}

const bodyStyle = { fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.7 };

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <p style={{ fontSize: "0.6rem", fontWeight: 700, color: color, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "0.4rem" }}>{title}</p>
      {children}
    </div>
  );
}
