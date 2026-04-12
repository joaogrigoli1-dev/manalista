"use client";
import { useState, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ChildForm } from "@/components/forms/ChildForm";
import { ConsentModal } from "@/components/forms/ConsentModal";
import { AgentMiniCard } from "@/components/agents/AgentMiniCard";
import { CharacterModal, type AgentBackstory } from "@/components/agents/CharacterModal";
import { DebateRoom } from "@/components/agents/DebateRoom";
import { DiagnosticReport } from "@/components/results/DiagnosticReport";
import { KPIGauge } from "@/components/results/KPIGauge";
import { AGENT_PROFILES, SPECIALISTS } from "@/lib/agents/profiles";
import { AGENT_BACKSTORIES } from "@/lib/agents/backstories";
import type { ChildData, DebateMessage, DiagnosticSuggestion, Lang, AgentId } from "@/types";
import type { DetectedPathology } from "@/components/results/CentralPanel";
import { v4 as uuid } from "uuid";

const CLINICAL_SEPARATOR = "---DADOS-CLINICOS---";

type Phase = "form" | "consent" | "analyzing" | "debating" | "consolidating" | "complete";
type AgentStatus = "idle" | "analyzing" | "ready" | "debating";

function extractFriendlyText(fullText: string): string {
  const sepIdx = fullText.indexOf(CLINICAL_SEPARATOR);
  if (sepIdx >= 0) return fullText.substring(0, sepIdx).trim();
  try {
    const parsed = JSON.parse(fullText.trim());
    if (parsed.parentFriendlyText) return parsed.parentFriendlyText;
  } catch { /* not JSON */ }
  return fullText;
}

function extractTechnicalJSON(fullText: string): Record<string, unknown> | null {
  const sepIdx = fullText.indexOf(CLINICAL_SEPARATOR);
  if (sepIdx >= 0) {
    const jsonPart = fullText.substring(sepIdx + CLINICAL_SEPARATOR.length).trim();
    try { return JSON.parse(jsonPart); } catch { return null; }
  }
  try { return JSON.parse(fullText.trim()); } catch { return null; }
}

async function streamAgent(
  agentId: AgentId,
  childData: ChildData,
  task: "analyze" | "debate" | "consolidate",
  lang: Lang,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  onChunk: (text: string) => void,
): Promise<string> {
  const res = await fetch("/api/analise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agentId, childData, task, lang, debateHistory: history }),
  });
  if (!res.body) throw new Error("No stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      try {
        const json = JSON.parse(line.slice(5).trim());
        if (json.text) { full += json.text; onChunk(json.text); }
        if (json.done || json.error) break;
      } catch { /* partial */ }
    }
  }
  return full;
}

// ── Scientific ref type ────────────────────────────────────────
interface ScientificRef {
  authors: string;
  title: string;
  journal: string;
  year: number;
  doi?: string;
}

// ── KPI panel: sequential reveal during debate, full view on complete ──
const KPI_SLOTS_PT = [
  { label: "TEA",         color: "#7C6FE8" },
  { label: "TDAH",        color: "#4A9EFF" },
  { label: "Ansiedade",   color: "#F59E0B" },
  { label: "Atraso Dev.", color: "#10B981" },
];
const KPI_SLOTS_EN = [
  { label: "ASD",         color: "#7C6FE8" },
  { label: "ADHD",        color: "#4A9EFF" },
  { label: "Anxiety",     color: "#F59E0B" },
  { label: "Dev. Delay",  color: "#10B981" },
];
const REVEAL_AT = [1, 3, 5, 7];

const CONFIDENCE_CONFIG = {
  alta:     { color: "#10B981", labelPt: "Alta",     labelEn: "High",     bar: 90 },
  moderada: { color: "#F59E0B", labelPt: "Moderada", labelEn: "Moderate", bar: 60 },
  baixa:    { color: "#E5725C", labelPt: "Baixa",    labelEn: "Low",      bar: 35 },
};

function DebateKPIPanel({
  lang, messages, pathologies, phase, confidence, scientificRefs,
}: {
  lang: Lang;
  messages: DebateMessage[];
  pathologies: DetectedPathology[];
  phase: Phase;
  confidence?: "alta" | "moderada" | "baixa";
  scientificRefs?: ScientificRef[];
}) {
  const pt = lang === "pt";
  const slots = pt ? KPI_SLOTS_PT : KPI_SLOTS_EN;
  const msgCount = messages.length;
  const isComplete = phase === "complete";

  const gauges = slots.map((slot, i) => {
    const visible = isComplete || msgCount >= REVEAL_AT[i];
    const match = pathologies.find(p =>
      p.name.toLowerCase().includes(slot.label.toLowerCase().split(" ")[0])
    );
    return {
      ...slot,
      value: match ? match.percentage : visible ? Math.min(28 + i * 14, 68) : 0,
      color: match?.color ?? slot.color,
      visible,
    };
  });

  const anyVisible = gauges.some(g => g.visible);
  const confCfg = confidence ? CONFIDENCE_CONFIG[confidence] : CONFIDENCE_CONFIG.moderada;

  return (
    <div style={{
      padding: "0.5rem",
      borderRadius: "1.75rem",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{
        borderRadius: "calc(1.75rem - 0.5rem)",
        padding: "1.25rem",
        background: "rgba(10,10,14,0.9)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.06)",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.3rem" }}>
            {pt ? "Padrões Diagnósticos" : "Diagnostic Patterns"}
          </p>
          <div style={{ width: 24, height: 2, background: "var(--accent-brand)", borderRadius: 1 }} />
        </div>

        {!anyVisible ? (
          <div style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem", opacity: 0.3 }}>🔬</div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              {pt ? "Aguardando identificação de padrões diagnósticos..." : "Waiting for diagnostic pattern identification..."}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", justifyItems: "center" }}>
            {gauges.map((g, i) => (
              <div key={i} style={{
                opacity: g.visible ? 1 : 0,
                transform: g.visible ? "scale(1) translateY(0)" : "scale(0.85) translateY(10px)",
                transition: `opacity 0.7s ease ${i * 0.1}s, transform 0.7s cubic-bezier(0.32,0.72,0,1) ${i * 0.1}s`,
                pointerEvents: g.visible ? "auto" : "none",
              }}>
                <KPIGauge label={g.label} value={g.value} color={g.color} size={72} />
              </div>
            ))}
          </div>
        )}

        {/* Progress / Complete indicator */}
        {anyVisible && (
          <div style={{ marginTop: "1.1rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-subtle)" }}>
            {isComplete ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                <p style={{ fontSize: "0.65rem", color: "#10B981", fontWeight: 600 }}>
                  {pt ? "Análise concluída ✓" : "Analysis complete ✓"}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--accent-brand)", display: "inline-block", animation: "pulse-slow 2s ease-in-out infinite" }} />
                <p style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                  {pt ? "Análise em progresso..." : "Analysis in progress..."}
                </p>
              </div>
            )}
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.25rem" }}>
              {gauges.map((g, i) => (
                <div key={i} style={{
                  flex: 1, height: 2, borderRadius: 1,
                  background: g.visible ? g.color : "var(--border-subtle)",
                  transition: "background 0.5s ease",
                  opacity: g.visible ? 0.8 : 0.3,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Confiança gauge (complete only) ── */}
        {isComplete && confidence && (
          <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>
              {pt ? "Confiança Diagnóstica" : "Diagnostic Confidence"}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--border-subtle)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${confCfg.bar}%`,
                  background: confCfg.color, borderRadius: 3,
                  transition: "width 1s cubic-bezier(0.32,0.72,0,1)",
                }} />
              </div>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: confCfg.color, flexShrink: 0 }}>
                {pt ? confCfg.labelPt : confCfg.labelEn} ({confCfg.bar}%)
              </span>
            </div>
          </div>
        )}

        {/* ── Scientific refs (complete only) ── */}
        {isComplete && scientificRefs && scientificRefs.length > 0 && (
          <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
            <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-label)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>
              {pt ? "Referências" : "References"}
            </p>
            {scientificRefs.map((ref, i) => (
              <div key={i} style={{ marginBottom: "0.5rem", padding: "0.4rem 0.5rem", borderRadius: "0.45rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontSize: "0.62rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  <span style={{ color: "var(--accent-brand)", fontWeight: 700 }}>[{i + 1}]</span>{" "}
                  {ref.authors} ({ref.year}). <em>{ref.title}</em>.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Q&A parent answer modal ────────────────────────────────────
function QAModal({
  questions, lang, onSubmit, onSkip,
}: {
  questions: string[];
  lang: Lang;
  onSubmit: (answers: string[]) => void;
  onSkip: () => void;
}) {
  const pt = lang === "pt";
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1.5rem",
    }}>
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
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
              <span style={{ fontSize: "1.2rem" }}>💬</span>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                {pt ? "Os especialistas precisam de mais informações" : "Specialists need more information"}
              </h3>
            </div>
            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>
              {pt
                ? "Por favor, responda às perguntas abaixo para enriquecer a análise."
                : "Please answer the questions below to enrich the analysis."}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {questions.map((q, i) => (
              <div key={i}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-brand)", marginBottom: "0.4rem" }}>
                  {i + 1}. {q}
                </label>
                <textarea
                  value={answers[i]}
                  onChange={e => setAnswers(prev => prev.map((a, j) => j === i ? e.target.value : a))}
                  rows={3}
                  style={{
                    width: "100%", background: "var(--bg-input)",
                    border: "1px solid var(--border-input)", borderRadius: "0.75rem",
                    color: "var(--text-primary)", padding: "0.6rem 0.75rem",
                    fontFamily: "inherit", fontSize: "0.85rem", resize: "vertical",
                    outline: "none",
                  }}
                  placeholder={pt ? "Sua resposta..." : "Your answer..."}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.65rem", marginTop: "1.5rem" }}>
            <button
              onClick={() => onSubmit(answers)}
              style={{
                flex: 1, padding: "0.7rem 1.25rem", borderRadius: "9999px",
                border: "none", background: "var(--accent-brand)",
                color: "#fff", fontFamily: "inherit", fontWeight: 700,
                fontSize: "0.85rem", cursor: "pointer",
                boxShadow: "var(--shadow-button)",
              }}
            >
              {pt ? "Enviar Respostas" : "Send Answers"}
            </button>
            <button
              onClick={onSkip}
              style={{
                padding: "0.7rem 1.25rem", borderRadius: "9999px",
                border: "1px solid var(--border-input)", background: "var(--bg-glass)",
                color: "var(--text-secondary)", fontFamily: "inherit", fontWeight: 600,
                fontSize: "0.85rem", cursor: "pointer",
              }}
            >
              {pt ? "Pular" : "Skip"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalisePage() {
  const [lang, setLang] = useState<Lang>("pt");
  const [phase, setPhase] = useState<Phase>("form");
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentId, AgentStatus>>({
    mediator: "idle", "psi-infantil": "idle", "psi-parentalidade": "idle",
    neuropediatra: "idle", bcba: "idle",
  });
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [streamingId, setStreamingId] = useState<string | undefined>();
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [results, setResults] = useState<DiagnosticSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [agentDialogTexts, setAgentDialogTexts] = useState<Record<AgentId, string>>({} as Record<AgentId, string>);
  const [selectedCharacter, setSelectedCharacter] = useState<AgentId | null>(null);
  const [detectedPathologies, setDetectedPathologies] = useState<DetectedPathology[]>([]);
  const [qualityScore, setQualityScore] = useState(0);
  const [confidence, setConfidence] = useState<"alta" | "moderada" | "baixa">("moderada");
  const [needsMoreInfo, setNeedsMoreInfo] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const [showQAModal, setShowQAModal] = useState(false);
  const [qaCallback, setQaCallback] = useState<((answers: string[]) => void) | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const pt = lang === "pt";

  // ── Lifted PDF download ──────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!childData || !results.length) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch("/api/relatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childData: { name: childData.name }, messages, results, lang }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error ?? "Falha ao gerar PDF");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MAnalista_${childData.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setDownloadError(e instanceof Error ? e.message : String(e));
    } finally {
      setDownloading(false);
    }
  }, [childData, messages, results, lang]);

  const addMessage = useCallback((agentId: AgentId, content: string, type: DebateMessage["type"]) => {
    setMessages(prev => [...prev, { id: uuid(), agentId, content, timestamp: new Date(), type }]);
  }, []);

  const setStatus = useCallback((id: AgentId, status: AgentStatus) => {
    setAgentStatuses(prev => ({ ...prev, [id]: status }));
  }, []);

  const updateAgentDialogText = useCallback((agentId: AgentId, text: string | ((prev: string) => string)) => {
    setAgentDialogTexts(prev => ({
      ...prev,
      [agentId]: typeof text === "function" ? text(prev[agentId] || "") : text,
    }));
  }, []);

  const runAnalysis = useCallback(async (data: ChildData, extraContext = "") => {
    setPhase("analyzing");
    setError(null);

    const childWithContext: ChildData = extraContext
      ? { ...data, mainComplaints: data.mainComplaints + "\n\n[Informações adicionais dos pais]\n" + extraContext }
      : data;

    const history: Array<{ role: "user" | "assistant"; content: string }> = [];

    // 1 — Each specialist analyzes independently
    for (const agent of SPECIALISTS) {
      setStatus(agent.id, "analyzing");
      setStreamingId(agent.id);
      setStreamingContent("");
      updateAgentDialogText(agent.id, "");
      try {
        const result = await streamAgent(agent.id, childWithContext, "analyze", lang, [], (chunk) => {
          setStreamingContent(prev => prev + chunk);
          updateAgentDialogText(agent.id, prev => {
            const full = prev + chunk;
            const sepIdx = full.indexOf(CLINICAL_SEPARATOR);
            return sepIdx >= 0 ? full.substring(0, sepIdx).trim() : full;
          });
        });
        const displayText = extractFriendlyText(result);
        updateAgentDialogText(agent.id, displayText);
        addMessage(agent.id, result, "analysis");
        history.push({ role: "assistant", content: `[${agent.id}] ${result}` });
        setStatus(agent.id, "ready");
      } catch (e) {
        setError(String(e));
        setStatus(agent.id, "idle");
      }
      setStreamingId(undefined);
      setStreamingContent("");
    }

    // 2 — Debate phase
    setPhase("debating");
    SPECIALISTS.forEach(a => setStatus(a.id, "debating"));

    for (const agent of SPECIALISTS) {
      setStreamingId(agent.id);
      setStreamingContent("");
      updateAgentDialogText(agent.id, "");
      try {
        const result = await streamAgent(agent.id, childWithContext, "debate", lang, history, (chunk) => {
          setStreamingContent(prev => prev + chunk);
          updateAgentDialogText(agent.id, prev => {
            const full = prev + chunk;
            const sepIdx = full.indexOf(CLINICAL_SEPARATOR);
            return sepIdx >= 0 ? full.substring(0, sepIdx).trim() : full;
          });
        });
        const displayText = extractFriendlyText(result);
        updateAgentDialogText(agent.id, displayText);
        addMessage(agent.id, result, "debate");
        history.push({ role: "assistant", content: `[${agent.id}-debate] ${result}` });
      } catch (e) {
        setError(String(e));
      }
      setStreamingId(undefined);
      setStreamingContent("");
    }

    // 3 — Mediator consolidates
    setPhase("consolidating");
    setStatus("mediator", "analyzing");
    setStreamingId("mediator");
    setStreamingContent("");
    try {
      const consolidation = await streamAgent("mediator", childWithContext, "consolidate", lang, history, (chunk) => {
        setStreamingContent(prev => prev + chunk);
        updateAgentDialogText("mediator", prev => {
          const full = prev + chunk;
          const sepIdx = full.indexOf(CLINICAL_SEPARATOR);
          return sepIdx >= 0 ? full.substring(0, sepIdx).trim() : full;
        });
      });
      const displayText = extractFriendlyText(consolidation);
      updateAgentDialogText("mediator", displayText);
      addMessage("mediator", consolidation, "summary");

      let parsedPathologies: DetectedPathology[] = [];
      let parsedQuality = 75;
      let parsedNeedsMore = false;
      let parsedQuestions: string[] = [];

      try {
        const jsonMatch = consolidation.match(/\{[\s\S]*"pathologies"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.pathologies && Array.isArray(parsed.pathologies)) parsedPathologies = parsed.pathologies;
          if (parsed.qualityScore) parsedQuality = parsed.qualityScore;
          if (parsed.needsMoreInfo) parsedNeedsMore = true;
          if (parsed.questions && Array.isArray(parsed.questions)) parsedQuestions = parsed.questions;
        }
      } catch { /* best-effort */ }

      // Also try to extract from technical JSON part
      const techJson = extractTechnicalJSON(consolidation);
      if (techJson) {
        if (techJson.needsMoreInfo && !parsedNeedsMore) parsedNeedsMore = true;
        if (techJson.questions && Array.isArray(techJson.questions) && parsedQuestions.length === 0) {
          parsedQuestions = techJson.questions as string[];
        }
        if (typeof techJson.confidence === "number" && !parsedQuality) {
          parsedQuality = techJson.confidence as number;
        }
      }

      if (parsedPathologies.length === 0) {
        parsedPathologies = [{
          name: pt ? "Necessita Avaliação Multiprofissional" : "Requires Multiprofessional Evaluation",
          percentage: 85,
          color: "#8B5CF6",
          evidence: [pt ? "Sintomas complexos identificados" : "Complex symptoms identified"],
        }];
      }

      setDetectedPathologies(parsedPathologies);
      setQualityScore(parsedQuality);
      setNeedsMoreInfo(parsedNeedsMore);
      setPendingQuestions(parsedQuestions);

      // Derive confidence level from quality score
      const confLevel: "alta" | "moderada" | "baixa" =
        parsedQuality >= 80 ? "alta" : parsedQuality >= 60 ? "moderada" : "baixa";
      setConfidence(confLevel);

      const scientificRefs = [
        { authors: "American Psychiatric Association", title: "Diagnostic and Statistical Manual of Mental Disorders (DSM-5)", journal: "APA Publishing", year: 2013 },
        { authors: "World Health Organization", title: "International Classification of Diseases, 11th Revision (ICD-11)", journal: "WHO", year: 2022 },
      ];

      const mockResult: DiagnosticSuggestion = {
        primaryPathology: pt ? "Avaliação Multiprofissional Recomendada" : "Multiprofessional Evaluation Recommended",
        icd11Code: "",
        dsm5Code: "",
        confidence: confLevel,
        supportingAgents: SPECIALISTS.map(a => a.id),
        treatmentSuggestions: [{
          modality: pt ? "Avaliação Multiprofissional Presencial" : "In-Person Multiprofessional Evaluation",
          description: pt
            ? "Consultar os profissionais especializados indicados pela equipe para avaliação formal."
            : "Consult the specialized professionals indicated by the team for formal evaluation.",
          evidenceLevel: "A",
          references: ["APA, DSM-5 (2013)", "WHO, ICD-11 (2022)"],
        }],
        scientificRefs,
        disclaimer: pt ? "Sugestão em modo demonstração. Não constitui diagnóstico real." : "Suggestion in demo mode. Does not constitute real diagnosis.",
      };
      setResults([mockResult]);

      // ── Q&A: open modal if specialists need more info ──
      if (parsedNeedsMore && parsedQuestions.length > 0) {
        setPhase("complete"); // mark complete first so UI updates
        setShowQAModal(true);
        setQaCallback(() => (answers: string[]) => {
          const answerText = parsedQuestions.map((q, i) => `${q}\nResposta: ${answers[i] || "(sem resposta)"}`).join("\n\n");
          setShowQAModal(false);
          setQaCallback(null);
          // Re-run analysis with extra context
          runAnalysis(data, answerText);
        });
        return; // don't proceed to setPhase("complete") again
      }
    } catch (e) {
      setError(String(e));
    }

    setStreamingId(undefined);
    setStreamingContent("");
    setStatus("mediator", "ready");
    setPhase("complete");
  }, [lang, addMessage, setStatus, updateAgentDialogText, pt]);

  const handleFormSubmit = (data: ChildData) => {
    setChildData(data);
    setPhase("consent");
  };

  const handleConsentAccept = () => {
    if (childData) runAnalysis(childData);
  };

  const currentScientificRefs = results[0]?.scientificRefs;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)" }}>
      <div className="bg-mesh" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />
      <Navbar lang={lang} onLangChange={setLang} />

      {phase === "consent" && childData && (
        <ConsentModal lang={lang} onAccept={handleConsentAccept} onDecline={() => setPhase("form")} />
      )}

      {selectedCharacter && (
        <CharacterModal
          agent={AGENT_PROFILES.find(a => a.id === selectedCharacter)!}
          backstory={AGENT_BACKSTORIES[selectedCharacter] as AgentBackstory}
          lang={lang}
          onClose={() => setSelectedCharacter(null)}
        />
      )}

      {/* ── Q&A Modal ── */}
      {showQAModal && pendingQuestions.length > 0 && (
        <QAModal
          questions={pendingQuestions}
          lang={lang}
          onSubmit={(answers) => qaCallback?.(answers)}
          onSkip={() => { setShowQAModal(false); setQaCallback(null); setPhase("complete"); }}
        />
      )}

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "7rem 1.5rem 4rem", position: "relative", zIndex: 1 }}>

        {/* ── FORM PHASE ── */}
        {phase === "form" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <Link href="/" style={{ fontSize: "0.78rem", color: "var(--text-muted)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem" }}>
                ← {pt ? "Voltar" : "Back"}
              </Link>
              <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                {pt ? "Dados da Criança" : "Child Data"}
              </h1>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                {pt ? "Preencha as informações para iniciar a análise multiprofissional." : "Fill in the information to start the multiprofessional analysis."}
              </p>
            </div>
            {/* Form with viewport overflow fix */}
            <div style={{ maxHeight: "calc(100dvh - 9rem)", overflowY: "auto", paddingBottom: "2rem" }}>
              <ChildForm lang={lang} onSubmit={handleFormSubmit} />
            </div>
          </div>
        )}

        {/* ── ANALYSIS / DEBATE / CONSOLIDATING / COMPLETE ── */}
        {(phase === "analyzing" || phase === "debating" || phase === "consolidating" || phase === "complete") && childData && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>

            {/* Phase status badge */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              {(["analyzing","debating","consolidating","complete"] as const).map((p, i) => {
                const active = phase === p;
                const done = ["analyzing","debating","consolidating","complete"].indexOf(phase) > i;
                return (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: done ? "#10B981" : active ? "var(--accent-brand)" : "var(--border-subtle)",
                      ...(active ? { boxShadow: "0 0 0 4px var(--accent-brand-soft)" } : {}),
                    }} />
                    <span style={{ fontSize: "0.68rem", fontWeight: 600, color: active ? "var(--text-primary)" : done ? "#10B981" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                      {pt
                        ? ["Análise","Debate","Consolidação","Completo"][i]
                        : ["Analysis","Debate","Consolidation","Complete"][i]}
                    </span>
                    {i < 3 && <span style={{ color: "var(--border-subtle)", fontSize: "0.7rem" }}>›</span>}
                  </div>
                );
              })}
            </div>

            {/* ── 3-column layout ── */}
            <div className="analise-grid-3col" style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr 280px",
              gap: "1rem",
              alignItems: "start",
            }}>
              {/* LEFT: Specialist sidebar */}
              <div style={{
                display: "flex", flexDirection: "column", gap: "0.65rem",
                position: "sticky", top: "5.5rem",
              }}>
                {AGENT_PROFILES.map(agent => (
                  <AgentMiniCard
                    key={agent.id}
                    agent={agent}
                    lang={lang}
                    status={agentStatuses[agent.id]}
                    dialogText={agentDialogTexts[agent.id]}
                    isStreaming={streamingId === agent.id}
                    onInfoClick={() => setSelectedCharacter(agent.id)}
                  />
                ))}

                {/* PDF download button — bottom of sidebar */}
                {phase === "complete" && results.length > 0 && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      style={{
                        width: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
                        padding: "0.65rem 1rem", borderRadius: "9999px",
                        border: "none", cursor: downloading ? "wait" : "pointer",
                        background: downloading ? "rgba(124,92,252,0.4)" : "var(--accent-brand)",
                        color: "#fff", fontFamily: "inherit", fontWeight: 700,
                        fontSize: "0.8rem",
                        boxShadow: downloading ? "none" : "var(--shadow-button)",
                        transition: "all 0.3s ease",
                        opacity: downloading ? 0.7 : 1,
                      }}
                    >
                      {downloading ? (
                        <>
                          <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                          {pt ? "Gerando..." : "Generating..."}
                        </>
                      ) : (
                        <>⬇ {pt ? "Baixar PDF" : "Download PDF"}</>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* CENTER: Error banner + Debate Room */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {error && (
                  <div style={{ padding: "0.85rem", borderRadius: "0.65rem", background: "rgba(229,114,92,0.1)", border: "1px solid rgba(229,114,92,0.2)" }}>
                    <p style={{ fontSize: "0.78rem", color: "#E5725C" }}>⚠️ {error}</p>
                  </div>
                )}
                <div className="card" style={{ padding: "0.375rem" }}>
                  <div style={{ borderRadius: "calc(var(--radius-card) - 0.375rem)", background: "var(--bg-card)", overflow: "hidden" }}>
                    <div style={{ padding: "0.85rem 1.25rem", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.9rem" }}>💬</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {pt ? "Sala de Debate Multiprofissional" : "Multiprofessional Debate Room"}
                      </span>
                      {streamingId && (() => {
                        const a = AGENT_PROFILES.find(p => p.id === streamingId);
                        return a ? (
                          <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: a.color, fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: a.color, display: "inline-block", animation: "pulse-slow 1.5s ease-in-out infinite" }} />
                            {pt ? `${a.namePt} escrevendo...` : `${a.nameEn} writing...`}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <DebateRoom
                      messages={messages}
                      lang={lang}
                      isStreaming={!!streamingId}
                      streamingAgentId={streamingId}
                      streamingContent={streamingContent}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT: KPI panel — always visible, even post-debate */}
              <div style={{ position: "sticky", top: "5.5rem" }}>
                <DebateKPIPanel
                  lang={lang}
                  messages={messages}
                  pathologies={detectedPathologies}
                  phase={phase}
                  confidence={phase === "complete" ? confidence : undefined}
                  scientificRefs={phase === "complete" ? currentScientificRefs : undefined}
                />
              </div>
            </div>

            {/* Diagnostic report below the 3-column grid */}
            {phase === "complete" && results.length > 0 && (
              <DiagnosticReport
                results={results}
                lang={lang}
                childName={childData.name}
                messages={messages}
                downloadError={downloadError}
              />
            )}

            {/* Restart */}
            {phase === "complete" && (
              <div style={{ textAlign: "center", paddingTop: "1rem" }}>
                <button
                  onClick={() => {
                    setPhase("form"); setMessages([]); setResults([]); setChildData(null);
                    setAgentStatuses({ mediator:"idle","psi-infantil":"idle","psi-parentalidade":"idle",neuropediatra:"idle",bcba:"idle" });
                    setAgentDialogTexts({} as Record<AgentId, string>);
                    setDetectedPathologies([]); setQualityScore(0);
                    setNeedsMoreInfo(false); setPendingQuestions([]);
                    setDownloadError(null); setConfidence("moderada");
                  }}
                  style={{
                    padding: "0.7rem 1.5rem", borderRadius: "9999px",
                    border: "1px solid var(--border-input)", background: "var(--bg-glass)",
                    color: "var(--text-secondary)", fontFamily: "inherit", fontWeight: 600,
                    fontSize: "0.85rem", cursor: "pointer",
                  }}
                >
                  ← {pt ? "Nova Análise" : "New Analysis"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
