"use client";
/**
 * InfoScoreGauge — Substitui o StepBar tradicional por um indicador visual
 * que mostra em tempo real a "Qualidade da Análise" baseada no preenchimento.
 *
 * Princípio: o pai NÃO está preenchendo um formulário — está construindo
 * um diagnóstico junto com a equipe. Cada resposta é uma peça do quebra-cabeça.
 */
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/types";
import { getScoreColor } from "@/hooks/useInfoScore";

interface InfoScoreGaugeProps {
  score: number;
  tier: "empty" | "starter" | "good" | "great" | "excellent";
  tierMessage: string;
  nextSuggestion: string | null;
  step: number;
  totalSteps: number;
  lang: Lang;
}

const STEP_LABELS = {
  pt: ["Identificação", "Desenvolvimento", "Histórico"],
  en: ["Identification", "Development", "History"],
};

export function InfoScoreGauge({
  score,
  tier,
  tierMessage,
  nextSuggestion,
  step,
  totalSteps,
  lang,
}: InfoScoreGaugeProps) {
  const pt = lang === "pt";
  const color = getScoreColor(tier);
  const labels = STEP_LABELS[lang];

  // Detecta cruzamento de 75% para confetti
  const prevScoreRef = useRef(score);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  useEffect(() => {
    if (prevScoreRef.current < 75 && score >= 75) {
      setConfettiTrigger((n) => n + 1);
    }
    prevScoreRef.current = score;
  }, [score]);

  return (
    <div style={{ marginBottom: "1.75rem" }}>
      {/* ── Gauge container ── */}
      <div
        style={{
          padding: "0.875rem 1.125rem",
          borderRadius: "1rem",
          background: "var(--bg-glass, rgba(255,255,255,0.03))",
          border: "1px solid var(--border-subtle, rgba(255,255,255,0.06))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header — label + score grande */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "0.55rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              {pt ? "Qualidade da Análise" : "Analysis Quality"}
            </span>
          </div>
          <motion.span
            key={Math.floor(score / 5)} // re-anima a cada 5 pontos
            initial={{ scale: 1.15, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {Math.round(score)}%
          </motion.span>
        </div>

        {/* Barra de progresso animada */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 8,
            borderRadius: 9999,
            background: "rgba(255,255,255,0.05)",
            overflow: "hidden",
          }}
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${score}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22, mass: 0.6 }}
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${color}DD, ${color})`,
              borderRadius: 9999,
              boxShadow: `0 0 12px ${color}55`,
            }}
          />
          {/* Marker em 30% (limite "pular para análise") */}
          {score < 30 && (
            <div
              style={{
                position: "absolute",
                left: "30%",
                top: -1,
                height: 10,
                width: 1.5,
                background: "rgba(255,255,255,0.15)",
              }}
              aria-hidden
            />
          )}
        </div>

        {/* Mensagem contextual */}
        <AnimatePresence mode="wait">
          <motion.p
            key={tier}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            style={{
              fontSize: "0.72rem",
              color: "var(--text-secondary)",
              marginTop: "0.5rem",
              marginBottom: 0,
              lineHeight: 1.4,
            }}
          >
            {tierMessage}
          </motion.p>
        </AnimatePresence>

        {/* Sugestão de próximo campo (apenas se score > 0 e < 90) */}
        {nextSuggestion && score > 0 && score < 90 && (
          <AnimatePresence mode="wait">
            <motion.p
              key={nextSuggestion}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{
                fontSize: "0.65rem",
                color: color,
                opacity: 0.85,
                marginTop: "0.35rem",
                marginBottom: 0,
                fontWeight: 600,
              }}
            >
              💡 {nextSuggestion}
            </motion.p>
          </AnimatePresence>
        )}

        {/* Confetti micro ao cruzar 75% */}
        <AnimatePresence>
          {confettiTrigger > 0 && (
            <ConfettiBurst key={confettiTrigger} color={color} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Step indicator compacto (mantém referência visual de progresso) ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.45rem",
          marginTop: "0.75rem",
          paddingLeft: "0.25rem",
        }}
      >
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              flex: i < totalSteps - 1 ? 1 : undefined,
            }}
          >
            <motion.div
              animate={{
                background:
                  i < step
                    ? "#10B981"
                    : i === step
                    ? color
                    : "rgba(255,255,255,0.08)",
                scale: i === step ? 1.08 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.55rem",
                fontWeight: 800,
                color: "#fff",
                boxShadow: i === step ? `0 0 0 3px ${color}22` : "none",
              }}
            >
              {i < step ? "✓" : i + 1}
            </motion.div>
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 600,
                color:
                  i === step
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {labels[i]}
            </span>
            {i < totalSteps - 1 && (
              <motion.div
                animate={{
                  background:
                    i < step ? "#10B981" : "rgba(255,255,255,0.08)",
                }}
                transition={{ duration: 0.3 }}
                style={{
                  flex: 1,
                  height: 1,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Confetti micro effect (5 partículas, GPU-only) ─────────────────────────
function ConfettiBurst({ color }: { color: string }) {
  const particles = [
    { x: -40, y: -30, rot: -90 },
    { x: -15, y: -45, rot: 45 },
    { x: 10,  y: -50, rot: 180 },
    { x: 30,  y: -40, rot: -45 },
    { x: 50,  y: -25, rot: 90 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        right: "1.25rem",
        top: "1rem",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
          animate={{
            x: p.x,
            y: p.y,
            opacity: 0,
            rotate: p.rot,
            scale: 1,
          }}
          transition={{
            duration: 0.9,
            ease: [0.34, 1.56, 0.64, 1],
            delay: i * 0.02,
          }}
          style={{
            position: "absolute",
            width: 6,
            height: 6,
            borderRadius: i % 2 === 0 ? "50%" : "1px",
            background: i % 2 === 0 ? color : "#10B981",
          }}
        />
      ))}
    </div>
  );
}
