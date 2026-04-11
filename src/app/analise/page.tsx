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
import { CentralPanel } from "@/components/results/CentralPanel";
import { AGENT_PROFILES, SPECIALISTS } from "@/lib/agents/profiles";
import { AGENT_BACKSTORIES } from "@/lib/agents/backstories";
import type { ChildData, DebateMessage, DiagnosticSuggestion, Lang, AgentId } from "@/types";
import type { DetectedPathology, SpecialistRecommendation } from "@/components/results/CentralPanel";
import { v4 as uuid } from "uuid";

type Phase = "form" | "consent" | "analyzing" | "debating" | "consolidating" | "complete";
type AgentStatus = "idle" | "analyzing" | "ready" | "debating";

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

export default function AnalisePage() {
  const [lang, setLang] = useState<Lang>("pt");
  const [phase, setPhase] = useState<Phase>("form");
  const [childData, setChildData] = useState<ChildData | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<AgentId, AgentStatus>>({
    mediator: "idle", "psi-infantil": "idle", "psi-parentalidade": "idle",
    neuropsico: "idle", neuropediatra: "idle", bcba: "idle",
  });
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [streamingId, setStreamingId] = useState<string | undefined>();
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [results, setResults] = useState<DiagnosticSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [agentDialogTexts, setAgentDialogTexts] = useState<Record<AgentId, string>>({} as Record<AgentId, string>);
  const [selectedCharacter, setSelectedCharacter] = useState<AgentId | null>(null);
  const [detectedPathologies, setDetectedPathologies] = useState<DetectedPathology[]>([]);
  const [specialistRecs, setSpecialistRecs] = useState<SpecialistRecommendation[]>([]);
  const [qualityScore, setQualityScore] = useState(0);
  const [needsMoreInfo, setNeedsMoreInfo] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([]);
  const pt = lang === "pt";

  const addMessage = useCallback((agentId: AgentId, content: string, type: DebateMessage["type"]) => {
    setMessages(prev => [...prev, { id: uuid(), agentId, content, timestamp: new Date(), type }]);
  }, []);

  const setStatus = useCallback((id: AgentId, status: AgentStatus) => {
    setAgentStatuses(prev => ({ ...prev, [id]: status }));
  }, []);

  const updateAgentDialogText = useCallback((agentId: AgentId, text: string | ((prev: string) => string)) => {
    setAgentDialogTexts(prev => ({
      ...prev,
      [agentId]: typeof text === 'function' ? text(prev[agentId] || '') : text,
    }));
  }, []);

  const runAnalysis = useCallback(async (data: ChildData) => {
    setPhase("analyzing");
    setError(null);

    const history: Array<{ role: "user" | "assistant"; content: string }> = [];

    // 1 — Each specialist analyzes independently
    for (const agent of SPECIALISTS) {
      setStatus(agent.id, "analyzing");
      setStreamingId(agent.id);
      setStreamingContent("");
      updateAgentDialogText(agent.id, "");
      try {
        const result = await streamAgent(agent.id, data, "analyze", lang, [], (chunk) => {
          setStreamingContent(prev => prev + chunk);
          updateAgentDialogText(agent.id, prev => prev + chunk);
        });
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

    // 2 — Debate phase: each agent debates once
    setPhase("debating");
    SPECIALISTS.forEach(a => setStatus(a.id, "debating"));

    for (const agent of SPECIALISTS) {
      setStreamingId(agent.id);
      setStreamingContent("");
      updateAgentDialogText(agent.id, "");
      try {
        const result = await streamAgent(agent.id, data, "debate", lang, history, (chunk) => {
          setStreamingContent(prev => prev + chunk);
          updateAgentDialogText(agent.id, prev => prev + chunk);
        });
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
      const consolidation = await streamAgent("mediator", data, "consolidate", lang, history, (chunk) => {
        setStreamingContent(prev => prev + chunk);
        updateAgentDialogText("mediator", prev => prev + chunk);
      });
      addMessage("mediator", consolidation, "summary");

      // Parse consolidation into structured result (best-effort)
      // Try to extract pathologies and recommendations from consolidation text
      let parsedPathologies: DetectedPathology[] = [];
      let parsedRecs: SpecialistRecommendation[] = [];
      let parsedQuality = 75;

      try {
        // Attempt to find JSON in consolidation text
        const jsonMatch = consolidation.match(/\{[\s\S]*"pathologies"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.pathologies && Array.isArray(parsed.pathologies)) {
            parsedPathologies = parsed.pathologies;
          }
          if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
            parsedRecs = parsed.recommendations;
          }
          if (parsed.qualityScore) {
            parsedQuality = parsed.qualityScore;
          }
        }
      } catch {
        // Best-effort parsing failed, use defaults
      }

      // Set defaults if parsing didn't yield results
      if (parsedPathologies.length === 0) {
        parsedPathologies = [
          {
            name: pt ? "Necessita Avaliação Multiprofissional" : "Requires Multiprofessional Evaluation",
            percentage: 85,
            color: "#8B5CF6",
            evidence: [pt ? "Sintomas complexos identificados" : "Complex symptoms identified"],
          },
        ];
      }

      if (parsedRecs.length === 0) {
        parsedRecs = [
          {
            specialty: "Psicologia Infantil",
            reason: pt ? "Avaliação comportamental e desenvolvimento" : "Behavioral and developmental assessment",
            urgency: "normal",
          },
        ];
      }

      setDetectedPathologies(parsedPathologies);
      setSpecialistRecs(parsedRecs);
      setQualityScore(parsedQuality);
      setNeedsMoreInfo(parsedQuality < 70);

      const mockResult: DiagnosticSuggestion = {
        primaryPathology: pt ? "Ver análise completa do mediador acima" : "See full mediator analysis above",
        icd11Code: "Ver relatório",
        dsm5Code: "Ver relatório",
        confidence: "moderada",
        supportingAgents: SPECIALISTS.map(a => a.id),
        treatmentSuggestions: [
          {
            modality: pt ? "Avaliação Multiprofissional Presencial" : "In-Person Multiprofessional Evaluation",
            description: pt
              ? "Consultar os profissionais especializados indicados pela equipe para avaliação formal."
              : "Consult the specialized professionals indicated by the team for formal evaluation.",
            evidenceLevel: "A",
            references: ["APA, DSM-5 (2013)", "WHO, ICD-11 (2022)"],
          },
        ],
        scientificRefs: [
          { authors: "American Psychiatric Association", title: "Diagnostic and Statistical Manual of Mental Disorders (DSM-5)", journal: "APA Publishing", year: 2013 },
          { authors: "World Health Organization", title: "International Classification of Diseases, 11th Revision (ICD-11)", journal: "WHO", year: 2022 },
        ],
        disclaimer: pt ? "Sugestão em modo demonstração. Não constitui diagnóstico real." : "Suggestion in demo mode. Does not constitute real diagnosis.",
      };
      setResults([mockResult]);
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
            <ChildForm lang={lang} onSubmit={handleFormSubmit} />
          </div>
        )}

        {/* ── ANALYSIS / DEBATE / CONSOLIDATING PHASE (NEW ETHEREAL GLASS LAYOUT) ── */}
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

            {/* Agent mini cards grid (3x2) */}
            {(phase === "analyzing" || phase === "debating" || phase === "consolidating" || phase === "complete") && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1rem",
                marginBottom: "1.5rem",
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
              </div>
            )}

            {/* Central KPI Panel */}
            {(phase === "analyzing" || phase === "debating" || phase === "consolidating" || phase === "complete") && (
              <CentralPanel
                lang={lang}
                pathologies={detectedPathologies}
                recommendations={specialistRecs}
                isAnalyzing={phase === "analyzing" || phase === "debating" || phase === "consolidating"}
                qualityScore={qualityScore}
                needsMoreInfo={needsMoreInfo}
                pendingQuestions={pendingQuestions}
              />
            )}

            {/* Error display */}
            {error && (
              <div style={{ padding: "0.85rem", borderRadius: "0.65rem", background: "rgba(229,114,92,0.1)", border: "1px solid rgba(229,114,92,0.2)" }}>
                <p style={{ fontSize: "0.78rem", color: "#E5725C" }}>⚠️ {error}</p>
              </div>
            )}

            {/* Debate room */}
            <div className="card" style={{ padding: "0.375rem" }}>
              <div style={{ borderRadius: "calc(var(--radius-card) - 0.375rem)", background: "var(--bg-card)", overflow: "hidden" }}>
                {/* Header */}
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
                {/* DebateRoom owns its own scroll */}
                <DebateRoom
                  messages={messages}
                  lang={lang}
                  isStreaming={!!streamingId}
                  streamingAgentId={streamingId}
                  streamingContent={streamingContent}
                />
              </div>
            </div>

            {/* Diagnostic report */}
            {phase === "complete" && results.length > 0 && (
              <DiagnosticReport results={results} lang={lang} childName={childData.name} messages={messages} />
            )}

            {/* Restart button */}
            {phase === "complete" && (
              <div style={{ textAlign: "center", paddingTop: "1rem" }}>
                <button
                  onClick={() => { setPhase("form"); setMessages([]); setResults([]); setChildData(null); setAgentStatuses({ mediator:"idle","psi-infantil":"idle","psi-parentalidade":"idle",neuropsico:"idle",neuropediatra:"idle",bcba:"idle" }); setAgentDialogTexts({} as Record<AgentId, string>); setDetectedPathologies([]); setSpecialistRecs([]); setQualityScore(0); setNeedsMoreInfo(false); setPendingQuestions([]); }}
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
