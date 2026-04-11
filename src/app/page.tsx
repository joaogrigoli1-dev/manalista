"use client";
import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AgentCard } from "@/components/agents/AgentCard";
import { AGENT_PROFILES, SPECIALISTS } from "@/lib/agents/profiles";
import type { Lang } from "@/types";

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("pt");
  const pt = lang === "pt";

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", position: "relative", overflowX: "hidden" }}>
      <div className="bg-mesh" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
      <Navbar lang={lang} onLangChange={setLang} />

      {/* ── HERO ───────────────────────────────────── */}
      <section style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "7rem 1.5rem 5rem", position: "relative", zIndex: 1,
      }}>
        <span style={{
          display: "inline-block", padding: "0.25rem 0.9rem", borderRadius: "9999px",
          background: "rgba(245,158,11,0.12)", color: "#F59E0B",
          border: "1px solid rgba(245,158,11,0.2)",
          fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase",
          marginBottom: "1.5rem",
        }}>
          ⚠️ {pt ? "MODO DEMONSTRAÇÃO — NÃO É DIAGNÓSTICO REAL" : "DEMO MODE — NOT A REAL DIAGNOSIS"}
        </span>

        <h1 style={{
          fontSize: "clamp(2.8rem, 8vw, 5.5rem)", fontWeight: 800, lineHeight: 1.0,
          background: "linear-gradient(135deg, var(--text-primary) 20%, var(--accent-brand) 55%, #3B9BF5 85%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          marginBottom: "1.5rem", fontFamily: "inherit",
        }}>
          MAnalista
        </h1>

        <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.3rem)", color: "var(--text-secondary)", maxWidth: 620, lineHeight: 1.65, marginBottom: "0.85rem" }}>
          {pt
            ? "Plataforma de análise pediátrica com equipe multiprofissional de IA — Psicóloga Infantil, Neuropsicopediatra, Neuropediatra, Especialista em Parentalidade e Analista BCBA."
            : "Pediatric analysis platform with AI multidisciplinary team — Child Psychologist, Neuropsychopediatrician, Neuropediatrician, Parenting Specialist and BCBA Analyst."}
        </p>

        <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", maxWidth: 520, lineHeight: 1.7, marginBottom: "2.5rem" }}>
          {pt
            ? "Insira os dados da criança, a equipe analisa, debate entre si e sugere possíveis diagnósticos com base em evidências científicas."
            : "Enter child data, the team analyzes, debates among themselves and suggests possible diagnoses based on scientific evidence."}
        </p>

        <Link href="/analise" className="cta-btn" style={{
          display: "inline-flex", alignItems: "center", gap: "0.75rem",
          padding: "0.9rem 2rem", borderRadius: "9999px", border: "none",
          background: "var(--accent-brand)", color: "#fff", textDecoration: "none",
          fontWeight: 700, fontSize: "1rem",
          boxShadow: "var(--shadow-button)",
          transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
        }}>
          {pt ? "Iniciar Análise" : "Start Analysis"}
          <span style={{
            width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem",
          }}>→</span>
        </Link>
      </section>

      {/* ── TEAM SECTION ───────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{
            display: "inline-block", padding: "0.2rem 0.8rem", borderRadius: "9999px",
            background: "var(--accent-brand-soft)", color: "var(--accent-brand)",
            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1rem",
          }}>
            {pt ? "EQUIPE" : "TEAM"}
          </span>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
            {pt ? "Conheça os Especialistas" : "Meet the Specialists"}
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.65 }}>
            {pt
              ? "Personagens fictícios que representam especialidades reais. Clique em cada card para ver currículo e ferramentas clínicas."
              : "Fictional characters representing real specialties. Click each card to see credentials and clinical tools."}
          </p>
        </div>

        {/* Mediator highlight */}
        {AGENT_PROFILES.filter(a => a.isMediator).map(agent => (
          <div key={agent.id} style={{ marginBottom: "1rem" }}>
            <AgentCard agent={agent} lang={lang} status="idle" />
          </div>
        ))}

        {/* Specialists grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0.85rem" }}>
          {SPECIALISTS.map((agent) => (
            <AgentCard key={agent.id} agent={agent} lang={lang} status="idle" />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{
            display: "inline-block", padding: "0.2rem 0.8rem", borderRadius: "9999px",
            background: "rgba(59,155,245,0.12)", color: "#3B9BF5",
            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "1rem",
          }}>{pt ? "FLUXO" : "FLOW"}</span>
          <h2 style={{ fontSize: "clamp(1.6rem, 4vw, 2.5rem)", fontWeight: 800, color: "var(--text-primary)" }}>
            {pt ? "Como Funciona" : "How It Works"}
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
          {[
            { n:"01", emoji:"📝", pt:"Preencha o formulário com dados da criança", en:"Fill in the form with child data" },
            { n:"02", emoji:"🔒", pt:"Aceite os termos LGPD e proteção ao menor", en:"Accept LGPD and child protection terms" },
            { n:"03", emoji:"🧠", pt:"Cada agente analisa sob sua especialidade", en:"Each agent analyzes from their specialty" },
            { n:"04", emoji:"💬", pt:"Debate automático entre todos os agentes", en:"Automatic debate between all agents" },
            { n:"05", emoji:"📋", pt:"Relatório de sugestão diagnóstica unificado", en:"Unified diagnostic suggestion report" },
          ].map((s) => (
            <div key={s.n} className="card" style={{ padding: "0.3rem" }}>
              <div style={{ padding: "1.25rem", borderRadius: "calc(var(--radius-card) - 0.3rem)", background: "var(--bg-card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.65rem" }}>
                  <span style={{
                    fontSize: "0.7rem", fontWeight: 800, color: "var(--accent-brand)",
                    background: "var(--accent-brand-soft)", padding: "0.2rem 0.5rem",
                    borderRadius: "0.4rem", fontFamily: "monospace",
                  }}>{s.n}</span>
                  <span style={{ fontSize: "1.2rem" }}>{s.emoji}</span>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {pt ? s.pt : s.en}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link href="/analise" style={{
            display: "inline-flex", alignItems: "center", gap: "0.65rem",
            padding: "0.85rem 1.75rem", borderRadius: "9999px",
            background: "var(--accent-brand)", color: "#fff", textDecoration: "none",
            fontWeight: 700, fontSize: "0.9rem", boxShadow: "var(--shadow-button)",
          }}>
            {pt ? "Começar agora" : "Start now"} →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ textAlign: "center", padding: "2.5rem 1.5rem", borderTop: "1px solid var(--border-subtle)", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          MAnalista v0.1.0 — {pt ? "Modo Demonstração" : "Demo Mode"} · {pt ? "Não substitui diagnóstico médico real" : "Does not replace real medical diagnosis"}
        </p>
      </footer>
    </div>
  );
}
