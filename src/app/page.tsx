"use client";
import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { AgentCard } from "@/components/agents/AgentCard";
import { AGENT_PROFILES, SPECIALISTS } from "@/lib/agents/profiles";
import type { Lang } from "@/types";

// Custom hook for IntersectionObserver scroll reveal
function useInView(ref: React.RefObject<HTMLDivElement | null>, threshold = 0.1) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(entry.target);
      }
    }, { threshold });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return isInView;
}

// Expandable FAQ component
function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "1.25rem",
        borderRadius: "var(--radius-card)",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
      }}
      className="card"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.95rem" }}>
          {question}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "var(--accent-brand-soft)",
            color: "var(--accent-brand)",
            transition: "transform 0.3s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </div>
      {isOpen && (
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            fontSize: "0.9rem",
          }}
        >
          {answer}
        </div>
      )}
    </button>
  );
}

// Pricing card component
function PricingCard({
  title,
  price,
  currency,
  analyses,
  features,
  highlighted,
  lang,
}: {
  title: string;
  price: number;
  currency: string;
  analyses: string;
  features: string[];
  highlighted: boolean;
  lang: Lang;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "0.15rem",
        position: "relative",
        border: highlighted ? "1px solid var(--accent-brand)" : undefined,
        transform: highlighted ? "scale(1.03)" : undefined,
      }}
    >
      {highlighted && (
        <div
          style={{
            position: "absolute",
            top: "-0.75rem",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--accent-brand)",
            color: "#fff",
            padding: "0.25rem 0.75rem",
            borderRadius: "999px",
            fontSize: "0.65rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {lang === "pt" ? "Mais Popular" : "Most Popular"}
        </div>
      )}
      <div style={{ padding: "2rem", background: "var(--bg-card)", borderRadius: "var(--radius-card)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          {title}
        </h3>
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--accent-brand)" }}>
            {currency}
            {price}
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>/ {lang === "pt" ? "mês" : "month"}</p>
        </div>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            marginBottom: "1.5rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          {analyses}
        </p>
        <ul style={{ listStyle: "none", marginBottom: "1.5rem" }}>
          {features.map((feature, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: "0.6rem",
              }}
            >
              <span style={{ color: "var(--accent-brand)", fontWeight: 700, marginTop: "0.15rem" }}>✓</span>
              {feature}
            </li>
          ))}
        </ul>
        <Link
          href="/analise"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.85rem 1.75rem",
            borderRadius: "9999px",
            background: highlighted ? "var(--accent-brand)" : "var(--bg-glass)",
            color: highlighted ? "#fff" : "var(--text-secondary)",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "0.9rem",
            transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
            border: "1px solid transparent",
          }}
          className="cta-btn"
        >
          {lang === "pt" ? "Começar" : "Get Started"}
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

// Feature bento card
function BentoCard({ icon, title, desc, size = "normal" }: { icon: string; title: string; desc: string; size?: string }) {
  const sizeClass = size === "large" ? "grid-cols-2" : "grid-cols-1";
  return (
    <div className={`card ${sizeClass}`} style={{ padding: "0.15rem" }}>
      <div style={{ padding: "1.5rem", background: "var(--bg-card)", borderRadius: "var(--radius-card)" }}>
        <div style={{ fontSize: "1.8rem", marginBottom: "0.75rem" }}>{icon}</div>
        <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          {title}
        </h4>
        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{desc}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("pt");
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const pt = lang === "pt";

  // Refs for scroll animations
  const heroRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  const heroInView = useInView(heroRef);
  const problemInView = useInView(problemRef);
  const howItWorksInView = useInView(howItWorksRef);
  const teamInView = useInView(teamRef);
  const featuresInView = useInView(featuresRef);
  const pricingInView = useInView(pricingRef);
  const faqInView = useInView(faqRef);

  const faqItems = pt
    ? [
        {
          q: "O MAnalista substitui um diagnóstico médico real?",
          a: "Não. MAnalista é um sistema de SUGESTÃO diagnóstica baseado em IA. Sempre consulte profissionais licenciados para diagnóstico e tratamento.",
        },
        {
          q: "Como meus dados são protegidos?",
          a: "Seguimos a LGPD (Lei Geral de Proteção de Dados) e todas as normas de privacidade infantil. Os dados são criptografados e armazenados com segurança.",
        },
        {
          q: "Quanto tempo leva para receber o relatório?",
          a: "O relatório é gerado em tempo real após o debate multiprofissional (cerca de 2-5 minutos). Você receberá um PDF pronto para imprimir.",
        },
        {
          q: "Quem são os especialistas?",
          a: "São personagens fictícios que representam especialidades reais: Psicóloga Infantil, Neuropsicopediatra, Neuropediatra, Especialista em Parentalidade e Analista BCBA.",
        },
        {
          q: "Posso usar em crianças com menos de 2 anos?",
          a: "O sistema foi desenvolvido para crianças a partir de 2 anos. Para menores, consulte um pediatra diretamente.",
        },
        {
          q: "O relatório inclui orientações para pais?",
          a: "Sim, o relatório inclui recomendações práticas para pais, além de sugestões de próximos passos clínicos.",
        },
      ]
    : [
        {
          q: "Does MAnalista replace a real medical diagnosis?",
          a: "No. MAnalista is a diagnostic SUGGESTION system based on AI. Always consult licensed professionals for diagnosis and treatment.",
        },
        {
          q: "How is my data protected?",
          a: "We follow LGPD (General Data Protection Law) and all child privacy regulations. Data is encrypted and stored securely.",
        },
        {
          q: "How long does it take to get the report?",
          a: "The report is generated in real-time after the multidisciplinary debate (approximately 2-5 minutes). You'll receive a ready-to-print PDF.",
        },
        {
          q: "Who are the specialists?",
          a: "They are fictional characters representing real specialties: Child Psychologist, Neuropsychopediatrician, Neuropediatrician, Parenting Specialist and BCBA Analyst.",
        },
        {
          q: "Can I use it for children under 2 years old?",
          a: "The system was developed for children from 2 years old. For younger children, consult a pediatrician directly.",
        },
        {
          q: "Does the report include guidance for parents?",
          a: "Yes, the report includes practical recommendations for parents, plus suggestions for next clinical steps.",
        },
      ];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      <div className="bg-mesh" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />

      {/* ── Lang toggle — fixed top-right ── */}
      <button
        type="button"
        onClick={() => setLang(lang === "pt" ? "en" : "pt")}
        style={{
          position: "fixed", top: "1.25rem", right: "1.5rem", zIndex: 100,
          padding: "0.35rem 0.85rem", borderRadius: "9999px",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(10,10,14,0.75)",
          backdropFilter: "blur(16px)",
          color: "rgba(255,255,255,0.5)",
          fontSize: "0.68rem", fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit",
          letterSpacing: "0.08em",
          transition: "all 0.2s ease",
        }}
      >
        {lang === "pt" ? "EN" : "PT"}
      </button>

      {/* ══════════════════════════════════════════════
          HERO SECTION
          ══════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "5rem 1.5rem 5rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ opacity: heroInView ? 1 : 0, transform: heroInView ? "translateY(0)" : "translateY(12px)", transition: "all 0.6s cubic-bezier(0.32,0.72,0,1)" }}>
          <span
            style={{
              display: "inline-block",
              padding: "0.25rem 0.9rem",
              borderRadius: "9999px",
              background: "rgba(245,158,11,0.12)",
              color: "#F59E0B",
              border: "1px solid rgba(245,158,11,0.2)",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            ⚠️ {pt ? "MODO DEMONSTRAÇÃO" : "DEMO MODE"}
          </span>

          <h1
            style={{
              fontSize: "clamp(3rem, 8vw, 6rem)",
              fontWeight: 800,
              lineHeight: 1.0,
              background: "linear-gradient(135deg, var(--text-primary) 20%, var(--accent-brand) 55%, #3B9BF5 85%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "1.5rem",
              fontFamily: "var(--font-jakarta), inherit",
            }}
          >
            MAnalista
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.3rem)",
              color: "var(--text-secondary)",
              maxWidth: 620,
              lineHeight: 1.65,
              marginBottom: "0.85rem",
            }}
          >
            {pt
              ? "Plataforma de análise pediátrica com equipe multiprofissional de IA"
              : "Pediatric analysis platform with AI multidisciplinary team"}
          </p>

          <p
            style={{
              fontSize: "0.88rem",
              color: "var(--text-muted)",
              maxWidth: 520,
              lineHeight: 1.7,
              marginBottom: "2.5rem",
            }}
          >
            {pt
              ? "Insira os dados da criança, a equipe analisa, debate entre si e sugere possíveis diagnósticos com base em evidências científicas."
              : "Enter child data, the team analyzes, debates among themselves and suggests possible diagnoses based on scientific evidence."}
          </p>

          <Link
            href="/analise"
            className="cta-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.9rem 2rem",
              borderRadius: "9999px",
              border: "none",
              background: "var(--accent-brand)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "1rem",
              boxShadow: "var(--shadow-button)",
              transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
            }}
          >
            {pt ? "Iniciar Análise" : "Start Analysis"}
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.9rem",
              }}
            >
              →
            </span>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROBLEM STATEMENT
          ══════════════════════════════════════════════ */}
      <section
        ref={problemRef}
        style={{
          padding: "py-24",
          position: "relative",
          zIndex: 1,
          maxWidth: 800,
          margin: "0 auto",
          paddingTop: "6rem",
          paddingBottom: "6rem",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
        }}
      >
        <div
          className="card"
          style={{
            padding: "0.15rem",
            opacity: problemInView ? 1 : 0,
            transform: problemInView ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.6s cubic-bezier(0.32,0.72,0,1)",
          }}
        >
          <div style={{ padding: "3rem", background: "var(--bg-card)", borderRadius: "var(--radius-card)", textAlign: "center" }}>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 5vw, 2.5rem)",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginBottom: "1rem",
                lineHeight: 1.2,
              }}
            >
              {pt ? "Seu filho precisa de ajuda. A fila é de 6 a 18 meses." : "Your child needs help. Waiting lists are 6-18 months."}
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
              {pt
                ? "Em muitos lugares, a espera por avaliação pediátrica especializada é longa. Famílias precisam de respostas rápidas, dados estruturados e orientação imediata. MAnalista oferece uma primeira análise em minutos."
                : "In many places, waiting for specialized pediatric evaluation is long. Families need quick answers, structured data, and immediate guidance. MAnalista provides a first analysis in minutes."}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
          ══════════════════════════════════════════════ */}
      <section
        ref={howItWorksRef}
        style={{
          padding: "6rem 1.5rem",
          position: "relative",
          zIndex: 1,
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span
            style={{
              display: "inline-block",
              padding: "0.2rem 0.8rem",
              borderRadius: "9999px",
              background: "rgba(59,155,245,0.12)",
              color: "#3B9BF5",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            {pt ? "FLUXO" : "FLOW"}
          </span>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {pt ? "Como Funciona" : "How It Works"}
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
          {[
            { n: "01", emoji: "📝", pt: "Preencha o formulário com dados da criança", en: "Fill in the form with child data" },
            { n: "02", emoji: "🔒", pt: "Aceite os termos LGPD e proteção ao menor", en: "Accept LGPD and child protection terms" },
            { n: "03", emoji: "🧠", pt: "Cada agente analisa sob sua especialidade", en: "Each agent analyzes from their specialty" },
            { n: "04", emoji: "💬", pt: "Debate automático entre todos os agentes", en: "Automatic debate between all agents" },
            { n: "05", emoji: "📋", pt: "Relatório de sugestão diagnóstica unificado", en: "Unified diagnostic suggestion report" },
          ].map((s, idx) => {
            const stepInView = howItWorksInView;
            return (
              <div
                key={s.n}
                className="card"
                style={{
                  padding: "0.3rem",
                  opacity: stepInView ? 1 : 0,
                  transform: stepInView ? "translateY(0)" : "translateY(12px)",
                  transition: `all 0.6s cubic-bezier(0.32,0.72,0,1) ${idx * 0.1}s`,
                }}
              >
                <div style={{ padding: "1.25rem", borderRadius: "calc(var(--radius-card) - 0.3rem)", background: "var(--bg-card)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.65rem" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        color: "var(--accent-brand)",
                        background: "var(--accent-brand-soft)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.4rem",
                        fontFamily: "monospace",
                      }}
                    >
                      {s.n}
                    </span>
                    <span style={{ fontSize: "1.2rem" }}>{s.emoji}</span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {pt ? s.pt : s.en}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <Link
            href="/analise"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.65rem",
              padding: "0.85rem 1.75rem",
              borderRadius: "9999px",
              background: "var(--accent-brand)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              boxShadow: "var(--shadow-button)",
              transition: "all 0.3s cubic-bezier(0.32,0.72,0,1)",
            }}
            className="cta-btn"
          >
            {pt ? "Começar agora" : "Start now"} →
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          MEET THE TEAM
          ══════════════════════════════════════════════ */}
      <section
        ref={teamRef}
        style={{
          padding: "6rem 1.5rem",
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span
            style={{
              display: "inline-block",
              padding: "0.2rem 0.8rem",
              borderRadius: "9999px",
              background: "var(--accent-brand-soft)",
              color: "var(--accent-brand)",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            {pt ? "EQUIPE" : "TEAM"}
          </span>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.75rem",
            }}
          >
            {pt ? "Conheça os Especialistas" : "Meet the Specialists"}
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              maxWidth: 480,
              margin: "0 auto",
              lineHeight: 1.65,
            }}
          >
            {pt
              ? "Personagens fictícios que representam especialidades reais. Clique em cada card para ver currículo e ferramentas clínicas."
              : "Fictional characters representing real specialties. Click each card to see credentials and clinical tools."}
          </p>
        </div>

        {/* Mediator highlight */}
        {AGENT_PROFILES.filter((a) => a.isMediator).map((agent) => (
          <div
            key={agent.id}
            style={{
              marginBottom: "1rem",
              opacity: teamInView ? 1 : 0,
              transform: teamInView ? "translateY(0)" : "translateY(12px)",
              transition: "all 0.6s cubic-bezier(0.32,0.72,0,1)",
            }}
          >
            <AgentCard agent={agent} lang={lang} status="idle" />
          </div>
        ))}

        {/* Specialists grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "0.85rem" }}>
          {SPECIALISTS.map((agent, idx) => (
            <div
              key={agent.id}
              style={{
                opacity: teamInView ? 1 : 0,
                transform: teamInView ? "translateY(0)" : "translateY(12px)",
                transition: `all 0.6s cubic-bezier(0.32,0.72,0,1) ${idx * 0.1}s`,
              }}
            >
              <AgentCard agent={agent} lang={lang} status="idle" />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FEATURES (BENTO GRID)
          ══════════════════════════════════════════════ */}
      <section
        ref={featuresRef}
        style={{
          padding: "6rem 1.5rem",
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span
            style={{
              display: "inline-block",
              padding: "0.2rem 0.8rem",
              borderRadius: "9999px",
              background: "rgba(16,185,129,0.12)",
              color: "#10B981",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            {pt ? "RECURSOS" : "FEATURES"}
          </span>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {pt ? "O Que Nos Torna Diferente" : "What Makes Us Different"}
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "0.85rem",
          }}
        >
          {[
            { icon: "⚡", title: pt ? "Análise em Tempo Real" : "Real-Time Analysis", desc: pt ? "Resultado instantâneo após debate multiprofissional" : "Instant results after multidisciplinary debate" },
            { icon: "🔄", title: pt ? "Debate Multi-Agente" : "Multi-Agent Debate", desc: pt ? "5 especialistas discutem e chegam a consenso" : "5 specialists discuss and reach consensus" },
            { icon: "📚", title: pt ? "CID-11 & DSM-5" : "ICD-11 & DSM-5", desc: pt ? "Classificações internacionais de diagnóstico" : "International diagnostic classifications" },
            { icon: "📄", title: pt ? "Relatório PDF" : "PDF Report", desc: pt ? "Download completo pronto para imprimir" : "Complete download ready to print" },
            { icon: "🛡️", title: pt ? "Qualidade >70%" : "Quality >70%", desc: pt ? "Gate de qualidade em todas as análises" : "Quality gate on all analyses" },
            { icon: "🌐", title: pt ? "Bilíngue PT/EN" : "Bilingual PT/EN", desc: pt ? "Português e Inglês completos" : "Full Portuguese and English" },
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                opacity: featuresInView ? 1 : 0,
                transform: featuresInView ? "translateY(0)" : "translateY(12px)",
                transition: `all 0.6s cubic-bezier(0.32,0.72,0,1) ${idx * 0.08}s`,
              }}
            >
              <BentoCard icon={feature.icon} title={feature.title} desc={feature.desc} />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SOCIAL PROOF
          ══════════════════════════════════════════════ */}
      <section
        style={{
          padding: "6rem 1.5rem",
          position: "relative",
          zIndex: 1,
          maxWidth: 800,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <div
          className="card"
          style={{
            padding: "2rem",
            opacity: 1,
            background: "var(--bg-card)",
            borderRadius: "var(--radius-card)",
          }}
        >
          <span style={{ fontSize: "2.5rem", marginBottom: "1rem", display: "block" }}>⭐</span>
          <h3
            style={{
              fontSize: "1.3rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              marginBottom: "0.75rem",
            }}
          >
            {pt ? "Depoimentos em Breve" : "Testimonials Coming Soon"}
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {pt
              ? "Em breve, histórias reais de famílias que utilizaram MAnalista e obtiveram respostas rápidas e orientação valiosa."
              : "Soon, real stories from families who used MAnalista and got quick answers and valuable guidance."}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PRICING
          ══════════════════════════════════════════════ */}
      <section
        ref={pricingRef}
        style={{
          padding: "6rem 1.5rem",
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span
            style={{
              display: "inline-block",
              padding: "0.2rem 0.8rem",
              borderRadius: "9999px",
              background: "rgba(236,72,153,0.12)",
              color: "#EC4899",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            {pt ? "PREÇOS" : "PRICING"}
          </span>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {pt ? "Planos Simples e Transparentes" : "Simple and Transparent Plans"}
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          {pricingInView && (
            <>
              <div
                style={{
                  opacity: 1,
                  transform: "translateY(0)",
                  transition: "all 0.6s cubic-bezier(0.32,0.72,0,1)",
                }}
              >
                <PricingCard
                  title={pt ? "Básico" : "Basic"}
                  price={49}
                  currency="R$"
                  analyses={pt ? "1 análise por mês" : "1 analysis per month"}
                  features={
                    pt
                      ? ["Análise multiprofissional", "Relatório PDF", "Suporte por email", "Acesso por 30 dias"]
                      : ["Multidisciplinary analysis", "PDF report", "Email support", "30-day access"]
                  }
                  highlighted={false}
                  lang={lang}
                />
              </div>
              <div
                style={{
                  opacity: 1,
                  transform: "translateY(0)",
                  transition: "all 0.6s cubic-bezier(0.32,0.72,0,1) 0.1s",
                }}
              >
                <PricingCard
                  title={pt ? "Pro" : "Pro"}
                  price={149}
                  currency="R$"
                  analyses={pt ? "5 análises por mês" : "5 analyses per month"}
                  features={
                    pt
                      ? ["Análise multiprofissional", "Relatório PDF com histório", "Suporte prioritário", "Comparativos entre análises", "Acesso por 30 dias"]
                      : ["Multidisciplinary analysis", "PDF report with history", "Priority support", "Analysis comparisons", "30-day access"]
                  }
                  highlighted={true}
                  lang={lang}
                />
              </div>
              <div
                style={{
                  opacity: 1,
                  transform: "translateY(0)",
                  transition: "all 0.6s cubic-bezier(0.32,0.72,0,1) 0.2s",
                }}
              >
                <PricingCard
                  title={pt ? "Clínica" : "Clinic"}
                  price={499}
                  currency="R$"
                  analyses={pt ? "Análises ilimitadas" : "Unlimited analyses"}
                  features={
                    pt
                      ? ["Análises multiprofissionais ilimitadas", "Relatórios PDF com histórico completo", "Suporte 24/7", "Integração com prontuário", "Análise de tendências", "API disponível"]
                      : ["Unlimited multidisciplinary analyses", "PDF reports with full history", "24/7 support", "Medical record integration", "Trend analysis", "API available"]
                  }
                  highlighted={false}
                  lang={lang}
                />
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "3rem" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
            {pt ? "Todos os planos incluem 7 dias de teste gratuito. Sem necessidade de cartão de crédito." : "All plans include 7 days free trial. No credit card required."}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FAQ
          ══════════════════════════════════════════════ */}
      <section
        ref={faqRef}
        style={{
          padding: "6rem 1.5rem",
          position: "relative",
          zIndex: 1,
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span
            style={{
              display: "inline-block",
              padding: "0.2rem 0.8rem",
              borderRadius: "9999px",
              background: "rgba(139,92,246,0.12)",
              color: "#8B5CF6",
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            {pt ? "PERGUNTAS FREQUENTES" : "FAQ"}
          </span>
          <h2
            style={{
              fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {pt ? "Dúvidas Frequentes" : "Frequently Asked Questions"}
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                opacity: faqInView ? 1 : 0,
                transform: faqInView ? "translateY(0)" : "translateY(12px)",
                transition: `all 0.6s cubic-bezier(0.32,0.72,0,1) ${idx * 0.08}s`,
              }}
            >
              <FAQItem
                question={item.q}
                answer={item.a}
                isOpen={openFAQ === idx}
                onToggle={() => setOpenFAQ(openFAQ === idx ? null : idx)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════ */}
      <footer
        style={{
          textAlign: "center",
          padding: "3rem 1.5rem",
          borderTop: "1px solid var(--border-subtle)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.8rem", color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.5rem" }}>
            MAnalista v2.0
          </p>
          <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {pt ? "Modo Demonstração — " : "Demo Mode — "}
            <span style={{ color: "var(--text-secondary)" }}>
              {pt ? "Não substitui diagnóstico médico real" : "Does not replace real medical diagnosis"}
            </span>
          </p>
        </div>
        <p style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
          {pt ? "Desenvolvido em conformidade com LGPD (Lei Geral de Proteção de Dados)" : "Developed in compliance with LGPD (General Data Protection Law)"}
        </p>
      </footer>
    </div>
  );
}
