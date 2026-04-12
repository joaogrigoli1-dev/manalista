"use client";
import { useState } from "react";
import type { Lang } from "@/types";

interface ConsentModalProps { lang: Lang; onAccept: () => void; onDecline: () => void; }

export function ConsentModal({ lang, onAccept, onDecline }: ConsentModalProps) {
  const [checked, setChecked] = useState({ lgpd: false, test: false, age: false });
  const pt = lang === "pt";
  const allChecked = Object.values(checked).every(Boolean);

  const terms = pt ? [
    {
      key: "lgpd" as const,
      title: "Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)",
      text: "Os dados inseridos são utilizados exclusivamente para gerar a sugestão diagnóstica desta sessão. Não são armazenados em banco de dados, não são compartilhados com terceiros e são descartados ao encerrar a sessão.",
    },
    {
      key: "test" as const,
      title: "Modo Demonstração — Sem Validade Clínica",
      text: "Este sistema é uma ferramenta de SUGESTÃO em modo demonstração. Todo resultado gerado é hipotético, não constitui diagnóstico médico real e NÃO substitui avaliação presencial com profissional de saúde habilitado. Profissionais representados são personagens fictícios.",
    },
    {
      key: "age" as const,
      title: "Estatuto da Criança e do Adolescente (ECA — Lei 8.069/1990)",
      text: "Confirmo ser o responsável legal pela criança. Os dados fornecidos são verdadeiros ao meu conhecimento. Estou ciente de que este sistema não tem capacidade de diagnóstico oficial e que devo buscar avaliação profissional especializada.",
    },
  ] : [
    {
      key: "lgpd" as const,
      title: "General Data Protection Law (LGPD — Law 13.709/2018)",
      text: "Data entered is used exclusively to generate the diagnostic suggestion for this session. It is not stored in a database, not shared with third parties, and is discarded when the session ends.",
    },
    {
      key: "test" as const,
      title: "Demonstration Mode — No Clinical Validity",
      text: "This system is a SUGGESTION tool in demonstration mode. All results generated are hypothetical, do not constitute a real medical diagnosis, and do NOT replace in-person evaluation by a qualified health professional. Professionals represented are fictional characters.",
    },
    {
      key: "age" as const,
      title: "Child Protection (ECA — Law 8.069/1990)",
      text: "I confirm I am the child's legal guardian. The data provided is true to my knowledge. I understand this system has no official diagnostic capacity and I should seek specialized professional evaluation.",
    },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div className="card" style={{ maxWidth: 560, width: "100%", padding: "0.375rem" }}>
        <div style={{
          borderRadius: "calc(var(--radius-card) - 0.375rem)",
          padding: "2rem", background: "var(--bg-card)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
          maxHeight: "90vh", overflowY: "auto",
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "2rem" }}>🔒</span>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "0.5rem" }}>
              {pt ? "Termos de Uso & Proteção de Dados" : "Terms of Use & Data Protection"}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.4rem", lineHeight: 1.6 }}>
              {pt ? "Leia e aceite os termos abaixo para prosseguir." : "Read and accept the terms below to proceed."}
            </p>
          </div>

          {/* Terms */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
            {terms.map((term) => (
              <label key={term.key} style={{
                display: "flex", gap: "0.85rem", alignItems: "flex-start",
                padding: "1rem", borderRadius: "0.75rem",
                background: checked[term.key] ? "var(--accent-brand-soft)" : "var(--bg-glass)",
                border: `1px solid ${checked[term.key] ? "var(--accent-brand)" : "var(--border-subtle)"}`,
                cursor: "pointer",
                transition: "all 0.3s ease",
                textTransform: "none", letterSpacing: "normal", fontWeight: "normal",
                marginBottom: 0,
              }}
              onClick={() => setChecked(c => ({ ...c, [term.key]: !c[term.key] }))}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "0.35rem", flexShrink: 0, marginTop: 2,
                  background: checked[term.key] ? "var(--accent-brand)" : "var(--bg-input)",
                  border: `2px solid ${checked[term.key] ? "var(--accent-brand)" : "var(--border-input)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.25s ease",
                }}>
                  {checked[term.key] && <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: 800 }}>✓</span>}
                </div>
                <div>
                  <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.3rem" }}>
                    {term.title}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    {term.text}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Disclaimer box */}
          <div style={{
            padding: "0.85rem", borderRadius: "0.65rem", marginBottom: "1.5rem",
            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
          }}>
            <p style={{ fontSize: "0.75rem", color: "#F59E0B", lineHeight: 1.6, textAlign: "center" }}>
              ⚠️ {pt
                ? "MODO DEMONSTRAÇÃO — Resultados são sugestões hipotéticas sem validade diagnóstica real"
                : "DEMO MODE — Results are hypothetical suggestions with no real diagnostic validity"}
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={onDecline} style={{
              flex: 1, padding: "0.75rem", borderRadius: "9999px",
              border: "1px solid var(--border-input)", background: "var(--bg-glass)",
              color: "var(--text-secondary)", fontFamily: "inherit", fontWeight: 600,
              fontSize: "0.85rem", cursor: "pointer",
            }}>
              {pt ? "Cancelar" : "Cancel"}
            </button>
            <button onClick={onAccept} disabled={!allChecked} style={{
              flex: 2, padding: "0.75rem", borderRadius: "9999px", border: "none",
              background: allChecked ? "var(--accent-brand)" : "var(--border-subtle)",
              color: allChecked ? "#fff" : "var(--text-muted)",
              fontFamily: "inherit", fontWeight: 700, fontSize: "0.85rem",
              cursor: allChecked ? "pointer" : "not-allowed",
              boxShadow: allChecked ? "var(--shadow-button)" : "none",
              transition: "all 0.4s cubic-bezier(0.32,0.72,0,1)",
            }}>
              {pt ? "Aceitar e Iniciar Análise →" : "Accept and Start Analysis →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
