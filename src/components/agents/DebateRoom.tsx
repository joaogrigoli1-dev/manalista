"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AgentProfile, DebateMessage, Lang } from "@/types";
import { getAgentById } from "@/lib/agents/profiles";

// ── Renderizador de Markdown leve (sem dependências) ───────────────────────
function renderInline(text: string): ReactNode[] {
  // Processa **bold**, *italic* e `code` inline
  const parts: ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={key++} style={{ fontWeight: 700, color: "inherit" }}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={key++} style={{ fontStyle: "italic" }}>{m[3]}</em>);
    else if (m[4]) parts.push(
      <code key={key++} style={{ fontFamily: "monospace", fontSize: "0.82em", background: "rgba(255,255,255,0.08)", padding: "0.1em 0.35em", borderRadius: "0.25em" }}>
        {m[4]}
      </code>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MdText({ text, color }: { text: string; color?: string }): ReactNode {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let listBuf: string[] = [];
  let tableBuf: string[] = [];
  let key = 0;

  function flushList() {
    if (!listBuf.length) return;
    nodes.push(
      <ul key={key++} style={{ margin: "0.4rem 0 0.6rem 0", paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {listBuf.map((item, i) => (
          <li key={i} style={{ fontSize: "0.87rem", lineHeight: 1.7, color: "var(--text-primary)" }}>
            {renderInline(item)}
          </li>
        ))}
      </ul>
    );
    listBuf = [];
  }

  function flushTable() {
    if (!tableBuf.length) return;
    const rows = tableBuf.map(r =>
      r.split("|").map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - (r.endsWith("|") ? 1 : 0))
    );
    // Detect separator row (---|---|---)
    const sepIdx = rows.findIndex(r => r.every(c => /^[-:]+$/.test(c)));
    const headerRows = sepIdx > 0 ? rows.slice(0, sepIdx) : [];
    const bodyRows = sepIdx >= 0 ? rows.slice(sepIdx + 1) : rows;

    nodes.push(
      <div key={key++} style={{ overflowX: "auto", margin: "0.5rem 0", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", lineHeight: 1.6 }}>
          {headerRows.length > 0 && (
            <thead>
              {headerRows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <th key={ci} style={{ padding: "0.4rem 0.6rem", borderBottom: `2px solid ${color ?? "var(--border-subtle)"}66`, fontWeight: 700, color: color ?? "var(--text-primary)", textAlign: "left", whiteSpace: "nowrap" }}>
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
          )}
          <tbody>
            {bodyRows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "0.35rem 0.6rem", borderBottom: "1px solid var(--border-subtle)33", color: "var(--text-primary)" }}>
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    tableBuf = [];
  }

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Table row detection (starts with |)
    if (line.trim().startsWith("|")) {
      flushList();
      tableBuf.push(line.trim());
      continue;
    } else if (tableBuf.length) {
      flushTable();
    }

    // Blank line — flush list and add spacing
    if (!line.trim()) {
      flushList();
      nodes.push(<div key={key++} style={{ height: "0.5rem" }} />);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushList();
      nodes.push(<hr key={key++} style={{ border: "none", borderTop: `1px solid ${color ?? "var(--border-subtle)"}44`, margin: "0.6rem 0" }} />);
      continue;
    }

    // H4 ####
    if (line.startsWith("#### ")) {
      flushList();
      nodes.push(
        <p key={key++} style={{ fontSize: "0.8rem", fontWeight: 800, color: color ?? "var(--accent-brand)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0.8rem 0 0.25rem" }}>
          {renderInline(line.slice(5))}
        </p>
      );
      continue;
    }

    // H3 ###
    if (line.startsWith("### ")) {
      flushList();
      nodes.push(
        <p key={key++} style={{ fontSize: "0.95rem", fontWeight: 800, color: color ?? "var(--text-primary)", margin: "1rem 0 0.35rem", borderBottom: `1px solid ${color ?? "var(--border-subtle)"}33`, paddingBottom: "0.25rem" }}>
          {renderInline(line.slice(4))}
        </p>
      );
      continue;
    }

    // H2 ##
    if (line.startsWith("## ")) {
      flushList();
      nodes.push(
        <p key={key++} style={{ fontSize: "1rem", fontWeight: 800, color: color ?? "var(--text-primary)", margin: "1rem 0 0.4rem" }}>
          {renderInline(line.slice(3))}
        </p>
      );
      continue;
    }

    // H1 #
    if (line.startsWith("# ")) {
      flushList();
      nodes.push(
        <p key={key++} style={{ fontSize: "1.1rem", fontWeight: 800, color: color ?? "var(--text-primary)", margin: "1.2rem 0 0.5rem", borderBottom: `2px solid ${color ?? "var(--border-subtle)"}44`, paddingBottom: "0.35rem" }}>
          {renderInline(line.slice(2))}
        </p>
      );
      continue;
    }

    // Numbered list item (1. 2. 3.)
    if (/^\d+\.\s/.test(line)) {
      listBuf.push(line.replace(/^\d+\.\s/, ""));
      continue;
    }

    // Bullet item
    if (/^[-•]\s/.test(line)) {
      listBuf.push(line.slice(2));
      continue;
    }

    // Regular paragraph
    flushList();
    nodes.push(
      <p key={key++} style={{ fontSize: "0.87rem", lineHeight: 1.8, color: "var(--text-primary)", margin: "0.1rem 0" }}>
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  flushTable();
  return <div style={{ display: "flex", flexDirection: "column" }}>{nodes}</div>;
}

interface DebateRoomProps {
  messages: DebateMessage[];
  lang: Lang;
  isStreaming?: boolean;
  streamingAgentId?: string;
  streamingContent?: string;
}

const TYPE_LABEL: Record<string, { pt: string; en: string; color: string }> = {
  analysis:  { pt: "Análise",  en: "Analysis",  color: "#3B9BF5" },
  debate:    { pt: "Debate",   en: "Debate",    color: "#7C5CFC" },
  question:  { pt: "Pergunta", en: "Question",  color: "#F59E0B" },
  response:  { pt: "Resposta", en: "Response",  color: "#10B981" },
  consensus: { pt: "Consenso", en: "Consensus", color: "#E5725C" },
  summary:   { pt: "Síntese",  en: "Summary",   color: "#8B5CF6" },
};

// ── Hook: revela texto palavra por palavra ─────────────────────────────────
function useWordReveal(source: string, msPerWord = 55): string {
  const [shown, setShown] = useState("");
  const targetRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Source zerado → novo agente começando, reseta tudo
    if (!source) {
      setShown("");
      targetRef.current = "";
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }

    targetRef.current = source;

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setShown(prev => {
          const t = targetRef.current;
          if (prev.length >= t.length) return prev;
          // Avança até o próximo espaço/nova linha (= próxima palavra completa)
          let end = prev.length;
          const limit = Math.min(end + 25, t.length); // max 25 chars look-ahead
          while (end < limit && t[end] !== " " && t[end] !== "\n") end++;
          if (end < t.length) end++; // inclui o separador
          return t.slice(0, end);
        });
      }, msPerWord);
    }
  }, [source, msPerWord]);

  // Cleanup ao desmontar
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return shown;
}

// ── Componente isolado para o balão de streaming ───────────────────────────
function StreamingBubble({
  agent, streamingContent, pt,
}: { agent: AgentProfile; streamingContent: string; pt: boolean }) {
  const displayed = useWordReveal(streamingContent);
  const isMediator = agent.isMediator;

  if (isMediator) {
    return (
      <div style={{
        padding: "1.1rem 1.3rem", borderRadius: "1rem",
        background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,155,245,0.06))",
        border: "1px solid rgba(139,92,246,0.25)",
        borderLeft: `3px solid ${agent.color}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
          <span>{agent.emoji}</span>
          <span style={{ fontSize: "0.82rem", fontWeight: 800, color: agent.color }}>
            {pt ? agent.namePt : agent.nameEn}
          </span>
          <StreamingDots color={agent.color} />
        </div>
        {displayed ? (
          <div style={{ position: "relative" }}>
            <MdText text={displayed} color={agent.color} />
            <BlinkCursor color={agent.color} />
          </div>
        ) : (
          <StreamingDots color={agent.color} />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem" }}>
      <div style={{
        width: 38, height: 38, borderRadius: "0.6rem", flexShrink: 0,
        background: agent.colorLight, border: `1px solid ${agent.color}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1rem", marginTop: 2,
      }}>
        {agent.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.3rem" }}>
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: agent.color }}>
            {pt ? agent.namePt : agent.nameEn}
          </span>
          <StreamingDots color={agent.color} />
        </div>
        <div style={{
          padding: "0.85rem 1rem",
          borderRadius: "0 0.85rem 0.85rem 0.85rem",
          background: "var(--bg-glass)",
          border: "1px solid var(--border-subtle)",
          borderLeft: `2px solid ${agent.color}66`,
        }}>
          {displayed ? (
            <div style={{ position: "relative" }}>
              <MdText text={displayed} color={agent.color} />
              <BlinkCursor color={agent.color} />
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.3rem", alignItems: "center", padding: "0.1rem 0" }}>
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── DebateRoom principal ───────────────────────────────────────────────────
export function DebateRoom({
  messages, lang, isStreaming, streamingAgentId, streamingContent = "",
}: DebateRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pt = lang === "pt";

  // Auto-scroll dentro do container quando chegar nova mensagem ou novo chunk
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent]);

  if (messages.length === 0 && !isStreaming) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "4rem 2rem", gap: "0.75rem",
        color: "var(--text-muted)", textAlign: "center", minHeight: 320,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "1rem",
          background: "var(--accent-brand-soft)", border: "1px solid rgba(124,92,252,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.5rem", marginBottom: "0.25rem",
        }}>💬</div>
        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)" }}>
          {pt ? "Sala de Debate" : "Debate Room"}
        </p>
        <p style={{ fontSize: "0.82rem", lineHeight: 1.65, maxWidth: 280 }}>
          {pt
            ? "Os agentes irão analisar e debater aqui em tempo real."
            : "Agents will analyze and debate here in real time."}
        </p>
        <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.25rem" }}>
          {[0,1,2].map(i => (
            <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-brand)", opacity: 0.4, animation: `typing-bounce 1.4s ease-in-out ${i*0.25}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  const streamAgent = streamingAgentId ? getAgentById(streamingAgentId as any) : null;

  return (
    <div
      ref={containerRef}
      style={{
        height: "clamp(320px, 60vh, 520px)",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        padding: "clamp(0.75rem, 2vw, 1.25rem)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      {/* Mensagens já finalizadas */}
      {messages.map((msg) => {
        const agent = getAgentById(msg.agentId);
        if (!agent) return null;
        const typeInfo = TYPE_LABEL[msg.type] ?? { pt: msg.type, en: msg.type, color: "var(--accent-brand)" };
        const typeColor = typeInfo.color;

        if (agent.isMediator) {
          return (
            <div key={msg.id} style={{
              padding: "1.1rem 1.3rem", borderRadius: "1rem",
              background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,155,245,0.06))",
              border: "1px solid rgba(139,92,246,0.25)",
              borderLeft: `3px solid ${agent.color}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <span>{agent.emoji}</span>
                <span style={{ fontSize: "0.82rem", fontWeight: 800, color: agent.color }}>
                  {pt ? agent.namePt : agent.nameEn}
                </span>
                <span style={{
                  fontSize: "0.58rem", padding: "0.15rem 0.5rem", borderRadius: "9999px",
                  background: `${typeColor}22`, color: typeColor,
                  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  {pt ? typeInfo.pt : typeInfo.en}
                </span>
                <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                  {msg.timestamp.toLocaleTimeString(pt ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <MdText text={msg.content} color={agent.color} />
            </div>
          );
        }

        return (
          <div key={msg.id} style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{
              width: 38, height: 38, borderRadius: "0.6rem", flexShrink: 0,
              background: agent.colorLight, border: `1px solid ${agent.color}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", marginTop: 2,
            }}>
              {agent.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: agent.color }}>
                  {pt ? agent.namePt : agent.nameEn}
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                  · {pt ? agent.rolePt : agent.roleEn}
                </span>
                <span style={{
                  fontSize: "0.58rem", padding: "0.12rem 0.45rem", borderRadius: "9999px",
                  background: `${typeColor}20`, color: typeColor,
                  fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  {pt ? typeInfo.pt : typeInfo.en}
                </span>
                <span style={{ marginLeft: "auto", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                  {msg.timestamp.toLocaleTimeString(pt ? "pt-BR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div style={{
                padding: "0.85rem 1rem",
                borderRadius: "0 0.85rem 0.85rem 0.85rem",
                background: "var(--bg-glass)",
                border: "1px solid var(--border-subtle)",
                borderLeft: `2px solid ${agent.color}66`,
              }}>
                <MdText text={msg.content} color={agent.color} />
              </div>
            </div>
          </div>
        );
      })}

      {/* Balão de streaming ao vivo — revela palavra por palavra */}
      {isStreaming && streamAgent && (
        <StreamingBubble
          agent={streamAgent}
          streamingContent={streamingContent}
          pt={pt}
        />
      )}

      <div style={{ height: 1, flexShrink: 0 }} />
    </div>
  );
}

// ── Helpers visuais ────────────────────────────────────────────────────────
function BlinkCursor({ color }: { color: string }) {
  return (
    <span style={{
      display: "inline-block", width: 2, height: "1em",
      background: color, marginLeft: 2, verticalAlign: "text-bottom",
      animation: "blink-cursor 0.8s step-end infinite",
    }} />
  );
}

function StreamingDots({ color }: { color: string }) {
  return (
    <span style={{ display: "inline-flex", gap: "0.2rem", alignItems: "center", marginLeft: "0.25rem" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 5, height: 5, borderRadius: "50%", background: color, opacity: 0.7,
          animation: `typing-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  );
}
