/**
 * useInfoScore — Calcula em tempo real o "Score de Qualidade da Análise"
 * conforme o pai/responsável preenche os campos do formulário.
 *
 * O score (0-100) reflete o quanto a equipe de IA terá de informação útil para
 * o diagnóstico. Cada campo tem um peso baseado no seu valor clínico real.
 *
 * Total: 100 pontos distribuídos por bloco:
 *   - Identificação básica (obrigatória): 25 pts
 *   - Marcos do desenvolvimento (alta relevância): 30 pts
 *   - Comportamento + histórico familiar (média relevância): 25 pts
 *   - Histórico clínico + observações livres (diagnóstica): 20 pts
 */
import { useMemo } from "react";

export interface InfoScoreInput {
  // Step 0 — Identificação
  name: string;
  birthdate: string;
  concerns: string[];
  complaintDuration: string;
  // Step 1 — Desenvolvimento
  walked: string;
  firstWords: string;
  firstSentences: string;
  eyeContact: string;
  gestation: string;
  schoolBehavior: string[];
  homeBehavior: string[];
  familyHistory: string[];
  // Step 2 — Histórico clínico
  previousDiagnoses: string[];
  therapies: string[];
  useMedication: string;
  freeText: string;
}

interface ScoreBreakdown {
  total: number;
  byBlock: {
    identification: number;
    development: number;
    behavior: number;
    clinical: number;
  };
  filledFields: string[];
  nextSuggestion: string | null;
  tier: "empty" | "starter" | "good" | "great" | "excellent";
  tierMessage: string;
  tierMessageEn: string;
}

const WEIGHTS = {
  // ── Identificação básica (25 pts) ──
  name: 3,
  birthdate: 3,
  concerns: 15, // proporcional ao nº de concerns marcadas (até 15)
  complaintDuration: 4,

  // ── Desenvolvimento (30 pts) ──
  walked: 5,
  firstWords: 5,
  firstSentences: 5,
  eyeContact: 7, // mais peso — sinal-chave de TEA
  gestation: 4,
  // (birthComplications é bônus condicional)

  // ── Comportamento + Histórico familiar (25 pts) ──
  schoolBehavior: 8, // proporcional (até 8)
  homeBehavior: 8,
  familyHistory: 9, // genética é diagnóstica

  // ── Histórico clínico + Observações (20 pts) ──
  previousDiagnoses: 5,
  therapies: 4,
  useMedication: 3,
  freeText: 8, // texto livre tem MUITO valor diagnóstico
} as const;

/**
 * Calcula score de 0-100 baseado no preenchimento.
 * Listas com múltiplas opções dão score proporcional (até o peso máximo).
 */
export function useInfoScore(input: InfoScoreInput): ScoreBreakdown {
  return useMemo(() => {
    const scores = {
      identification: 0,
      development: 0,
      behavior: 0,
      clinical: 0,
    };
    const filled: string[] = [];

    // ── Identificação (25 pts) ──
    if (input.name.trim()) { scores.identification += WEIGHTS.name; filled.push("name"); }
    if (input.birthdate) { scores.identification += WEIGHTS.birthdate; filled.push("birthdate"); }
    if (input.concerns.length > 0) {
      // Cada concern vale 3 pontos, máximo de 15 (5 concerns saturam)
      const c = Math.min(input.concerns.length * 3, WEIGHTS.concerns);
      scores.identification += c;
      filled.push("concerns");
    }
    if (input.complaintDuration) { scores.identification += WEIGHTS.complaintDuration; filled.push("complaintDuration"); }

    // ── Desenvolvimento (30 pts) ──
    if (input.walked) { scores.development += WEIGHTS.walked; filled.push("walked"); }
    if (input.firstWords) { scores.development += WEIGHTS.firstWords; filled.push("firstWords"); }
    if (input.firstSentences) { scores.development += WEIGHTS.firstSentences; filled.push("firstSentences"); }
    if (input.eyeContact) { scores.development += WEIGHTS.eyeContact; filled.push("eyeContact"); }
    if (input.gestation) { scores.development += WEIGHTS.gestation; filled.push("gestation"); }

    // ── Comportamento (25 pts) ──
    if (input.schoolBehavior.length > 0) {
      const s = Math.min(input.schoolBehavior.length * 3, WEIGHTS.schoolBehavior);
      scores.behavior += s;
      filled.push("schoolBehavior");
    }
    if (input.homeBehavior.length > 0) {
      const h = Math.min(input.homeBehavior.length * 3, WEIGHTS.homeBehavior);
      scores.behavior += h;
      filled.push("homeBehavior");
    }
    if (input.familyHistory.length > 0) {
      const f = Math.min(input.familyHistory.length * 3, WEIGHTS.familyHistory);
      scores.behavior += f;
      filled.push("familyHistory");
    }

    // ── Clínico (20 pts) ──
    if (input.previousDiagnoses.length > 0) { scores.clinical += WEIGHTS.previousDiagnoses; filled.push("previousDiagnoses"); }
    if (input.therapies.length > 0) { scores.clinical += WEIGHTS.therapies; filled.push("therapies"); }
    if (input.useMedication) { scores.clinical += WEIGHTS.useMedication; filled.push("useMedication"); }
    if (input.freeText.trim().length > 30) {
      // Texto livre só pontua se for substancial (>30 chars)
      scores.clinical += WEIGHTS.freeText;
      filled.push("freeText");
    } else if (input.freeText.trim().length > 0) {
      scores.clinical += Math.floor(WEIGHTS.freeText / 2);
      filled.push("freeText");
    }

    const total = Math.min(100, Math.round(
      scores.identification + scores.development + scores.behavior + scores.clinical
    ));

    // ── Tier + mensagem contextual ──
    let tier: ScoreBreakdown["tier"] = "empty";
    let tierMessage = "";
    let tierMessageEn = "";
    if (total === 0) {
      tier = "empty";
      tierMessage = "Vamos começar — preencha os dados básicos.";
      tierMessageEn = "Let's start — fill in the basic information.";
    } else if (total < 30) {
      tier = "starter";
      tierMessage = "Continue — quanto mais você contar, melhor o diagnóstico.";
      tierMessageEn = "Keep going — the more you share, the better the diagnosis.";
    } else if (total < 55) {
      tier = "good";
      tierMessage = "Bom! A equipe já tem material para uma primeira leitura.";
      tierMessageEn = "Good! The team already has material for a first analysis.";
    } else if (total < 75) {
      tier = "great";
      tierMessage = "Excelente! Diagnóstico vai ser bem fundamentado.";
      tierMessageEn = "Excellent! Diagnosis will be well-grounded.";
    } else {
      tier = "excellent";
      tierMessage = "Perfeito! Análise no nível clínico ideal.";
      tierMessageEn = "Perfect! Analysis at the ideal clinical level.";
    }

    // ── Sugestão de próximo campo a preencher ──
    let nextSuggestion: string | null = null;
    if (!input.concerns.length) nextSuggestion = "Marque as preocupações que você observa (+15 pontos)";
    else if (!input.eyeContact) nextSuggestion = "Conte sobre o contato visual (+7 pontos — sinal-chave)";
    else if (!input.firstWords) nextSuggestion = "Quando vieram as primeiras palavras? (+5 pontos)";
    else if (!input.familyHistory.length) nextSuggestion = "Algum histórico na família? (+9 pontos)";
    else if (!input.freeText.trim()) nextSuggestion = "Adicione observações livres no final (+8 pontos)";
    else if (!input.schoolBehavior.length) nextSuggestion = "Como é o comportamento na escola? (+8 pontos)";
    else if (!input.homeBehavior.length) nextSuggestion = "Como é em casa? (+8 pontos)";

    return {
      total,
      byBlock: scores,
      filledFields: filled,
      nextSuggestion,
      tier,
      tierMessage,
      tierMessageEn,
    };
  }, [input]);
}

/**
 * Cor do gauge baseada no tier
 */
export function getScoreColor(tier: ScoreBreakdown["tier"]): string {
  switch (tier) {
    case "empty":     return "#94A3B8"; // slate-400
    case "starter":   return "#F59E0B"; // amber-500
    case "good":      return "#3B82F6"; // blue-500
    case "great":     return "#8B5CF6"; // violet-500
    case "excellent": return "#10B981"; // emerald-500
  }
}
