/**
 * A-05 — Protocolo de Red Flag.
 *
 * Detector heurístico de sinais de risco grave (regressão de marcos de
 * desenvolvimento, indícios de maus-tratos/risco à integridade física ou
 * psicológica, autolesão) a partir dos campos textuais livres do
 * formulário de triagem (`ChildData`).
 *
 * IMPORTANTE — este é um gancho TÉCNICO de encaminhamento, não um
 * instrumento clínico validado. As listas de palavras-chave abaixo são uma
 * heurística inicial baseada em senso comum linguístico (PT/EN) e DEVEM ser
 * revisadas/validadas por um profissional de saúde antes de qualquer uso em
 * produção real. `[CONFIRMAR-FONTE clínica]`
 *
 * O bloco de encaminhamento gerado por `buildRedFlagBlock` referencia
 * serviços de atendimento de emergência (CVV, SAMU, Conselho Tutelar) cujos
 * números/nomes devem ser validados antes de publicação —
 * `[CONFIRMAR-FONTE]`.
 *
 * REGRA DE NEGÓCIO CRÍTICA: o bloco de red flag NUNCA pode ficar atrás de
 * paywall / gating por plano. Sempre que `detectRedFlags` retornar pelo
 * menos um item, ele deve ser exibido ao usuário independentemente do seu
 * plano (free/pro/enterprise). Isso é relevante para a futura Frente E
 * (monetização) — qualquer lógica de gating de conteúdo deve
 * explicitamente excluir este bloco.
 */

import type { ChildData, Lang } from "@/types";

export type RedFlagSeverity = "urgent" | "attention";

export interface RedFlag {
  severity: RedFlagSeverity;
  code: string;
  message: string;
}

/** Remove acentos e normaliza para minúsculas, para comparação tolerante. */
const COMBINING_DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_RE, "");
}

function containsAny(haystack: string, keywords: string[]): boolean {
  const normalizedHaystack = normalize(haystack);
  return keywords.some((kw) => normalizedHaystack.includes(normalize(kw)));
}

// ── Listas de palavras-chave (heurística inicial) ──────────────────────
// [CONFIRMAR-FONTE clínica] — validar terminologia com profissional de saúde.

const REGRESSION_KEYWORDS_PT = [
  "regrediu", "regressao", "regressão", "perdeu a fala", "perdeu o contato visual",
  "parou de falar", "parou de andar", "parou de fazer", "perda de habilidade",
  "involucao", "involução", "deixou de", "esqueceu como", "nao faz mais", "não faz mais",
];
const REGRESSION_KEYWORDS_EN = [
  "regressed", "regression", "lost skill", "lost skills", "lost language",
  "stopped talking", "stopped walking", "stopped speaking", "loss of skill",
  "no longer able to", "used to but stopped",
];

const SAFETY_RISK_KEYWORDS_PT = [
  "machucado", "machucados", "hematoma", "hematomas", "roxo", "roxos", "marca de violencia",
  "marca de violência", "violencia", "violência", "abuso", "abuso sexual", "abusada", "abusado",
  "negligencia", "negligência", "automutilacao", "automutilação", "autolesao", "autolesão",
  "se machuca", "se machucando", "tentativa de suicidio", "tentativa de suicídio",
  "suicidio", "suicídio", "quer morrer", "quer se matar", "maus-tratos", "maus tratos",
];
const SAFETY_RISK_KEYWORDS_EN = [
  "bruise", "bruises", "abuse", "sexual abuse", "abused", "neglect", "neglected",
  "self-harm", "self harm", "self-injury", "hurting himself", "hurting herself",
  "suicide", "suicidal", "wants to die", "wants to hurt", "maltreatment",
];

/** Campos de `ChildData` varridos para sinais de regressão de marcos. */
const REGRESSION_FIELDS: Array<keyof ChildData> = [
  "mainComplaints",
  "motorMilestones",
  "languageMilestones",
  "socialMilestones",
];

/** Campos de `ChildData` varridos para sinais de risco à integridade/segurança. */
const SAFETY_RISK_FIELDS: Array<keyof ChildData> = [
  "mainComplaints",
  "behaviorHome",
  "behaviorSchool",
  "familyHistory",
  "parentingChallenges",
];

function fieldsContainingAny(
  childData: ChildData,
  fields: Array<keyof ChildData>,
  keywords: string[]
): Array<keyof ChildData> {
  return fields.filter((field) => {
    const value = childData[field];
    return typeof value === "string" && value.trim().length > 0 && containsAny(value, keywords);
  });
}

/**
 * Detecta sinais de risco grave nos campos textuais do formulário de
 * triagem. Heurística por palavra-chave — ver aviso no topo do arquivo.
 */
export function detectRedFlags(childData: ChildData): RedFlag[] {
  const flags: RedFlag[] = [];

  const regressionHits = fieldsContainingAny(childData, REGRESSION_FIELDS, [
    ...REGRESSION_KEYWORDS_PT,
    ...REGRESSION_KEYWORDS_EN,
  ]);
  if (regressionHits.length > 0) {
    flags.push({
      severity: "urgent",
      code: "developmental_regression",
      message:
        `Possível sinal de regressão de marcos de desenvolvimento detectado em: ${regressionHits.join(", ")}. ` +
        `[CONFIRMAR-FONTE clínica] Recomenda-se avaliação especializada prioritária.`,
    });
  }

  const safetyHits = fieldsContainingAny(childData, SAFETY_RISK_FIELDS, [
    ...SAFETY_RISK_KEYWORDS_PT,
    ...SAFETY_RISK_KEYWORDS_EN,
  ]);
  if (safetyHits.length > 0) {
    flags.push({
      severity: "urgent",
      code: "safety_risk",
      message:
        `Possível indício de risco à integridade física/psicológica da criança detectado em: ${safetyHits.join(", ")}. ` +
        `[CONFIRMAR-FONTE clínica] Encaminhamento imediato a serviço de proteção/emergência é recomendado.`,
    });
  }

  return flags;
}

/**
 * Monta o texto de encaminhamento urgente exibido quando `flags` não está
 * vazio. Números e nomes de serviços de emergência marcados como
 * `[CONFIRMAR-FONTE]` — devem ser validados antes de uso em produção.
 *
 * Este bloco NUNCA deve ser omitido/gateado por plano quando `flags` tiver
 * ao menos um item (ver aviso no topo do arquivo).
 */
export function buildRedFlagBlock(flags: RedFlag[], lang: Lang = "pt"): string {
  if (flags.length === 0) return "";

  const pt = lang === "pt";
  const header = pt
    ? "⚠️ SINAL DE ATENÇÃO — ENCAMINHAMENTO PRIORITÁRIO"
    : "⚠️ ATTENTION SIGNAL — PRIORITY REFERRAL";

  const intro = pt
    ? "Um ou mais sinais detectados neste formulário sugerem a necessidade de avaliação profissional presencial com prioridade. Este sistema não substitui atendimento de emergência."
    : "One or more signals detected in this form suggest the need for prioritized in-person professional evaluation. This system does not replace emergency care.";

  const contacts = pt
    ? [
        "CVV — Centro de Valorização da Vida: 188 (24h, gratuito) [CONFIRMAR-FONTE]",
        "SAMU — Emergência médica: 192 [CONFIRMAR-FONTE]",
        "Conselho Tutelar da sua região (busque pelo nome do município) [CONFIRMAR-FONTE]",
      ]
    : [
        "CVV — Suicide/crisis support (Brazil): 188 (24h, free) [CONFIRMAR-FONTE]",
        "SAMU — Medical emergency (Brazil): 192 [CONFIRMAR-FONTE]",
        "Local child protection services — search by your municipality [CONFIRMAR-FONTE]",
      ];

  const flagLines = flags.map((f) => `• [${f.severity.toUpperCase()}] ${f.message}`);

  return [header, "", intro, "", ...flagLines, "", ...contacts].join("\n");
}
