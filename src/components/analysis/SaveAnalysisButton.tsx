"use client";

import { useState } from "react";
import Link from "next/link";

interface SaveAnalysisButtonProps {
  childName: string;
  childAge: string;
  lang: "pt" | "en";
  qualityScore?: number;
  detectedPathologies?: string[];
  resultsJson?: unknown;
  debateMessagesJson?: unknown;
  childDataJson?: unknown;
}

type SaveState = "idle" | "loading" | "saved" | "error" | "quota" | "unauth";

export function SaveAnalysisButton({
  childName,
  childAge,
  lang,
  qualityScore,
  detectedPathologies,
  resultsJson,
  debateMessagesJson,
  childDataJson,
}: SaveAnalysisButtonProps) {
  const [state, setState] = useState<SaveState>("idle");
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleSave() {
    setState("loading");

    try {
      const res = await fetch("/api/analise/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName,
          childAge,
          lang,
          qualityScore,
          detectedPathologies,
          resultsJson,
          debateMessagesJson,
          childDataJson,
        }),
      });

      if (res.status === 401) {
        setState("unauth");
        return;
      }

      if (res.status === 429) {
        setState("quota");
        return;
      }

      if (!res.ok) {
        setState("error");
        return;
      }

      const body = (await res.json()) as { id: string };
      setSavedId(body.id);
      setState("saved");
    } catch {
      setState("error");
    }
  }

  if (state === "saved") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          borderRadius: 8,
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.3)",
          color: "#22c55e",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        <span>Análise salva!</span>
        {savedId && (
          <Link
            href={`/historico/${savedId}`}
            style={{
              color: "#4ade80",
              textDecoration: "underline",
              fontSize: "0.8rem",
            }}
          >
            Ver no histórico
          </Link>
        )}
      </div>
    );
  }

  if (state === "quota") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          borderRadius: 8,
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.25)",
          color: "#ef4444",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        Quota atingida —{" "}
        <Link href="/planos" style={{ color: "#a78bfa", textDecoration: "underline" }}>
          faça upgrade para Pro
        </Link>
      </div>
    );
  }

  if (state === "unauth") {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          borderRadius: 8,
          background: "rgba(245,158,11,0.1)",
          border: "1px solid rgba(245,158,11,0.25)",
          color: "#f59e0b",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        <Link href="/auth/login" style={{ color: "#fbbf24", textDecoration: "underline" }}>
          Faça login
        </Link>{" "}
        para salvar
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
        <span
          style={{
            padding: "0.5rem 1rem",
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#ef4444",
            fontSize: "0.875rem",
            fontWeight: 600,
          }}
        >
          Erro ao salvar
        </span>
        <button
          onClick={() => setState("idle")}
          style={{
            padding: "0.5rem 0.75rem",
            borderRadius: 8,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "var(--text-secondary, #94a3b8)",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => void handleSave()}
      disabled={state === "loading"}
      style={{
        padding: "0.5rem 1.25rem",
        borderRadius: 8,
        background:
          state === "loading"
            ? "rgba(124,58,237,0.4)"
            : "rgba(124,58,237,0.85)",
        color: "#fff",
        fontWeight: 600,
        fontSize: "0.875rem",
        border: "none",
        cursor: state === "loading" ? "not-allowed" : "pointer",
        transition: "background 0.2s",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      {state === "loading" ? (
        <>
          <span
            style={{
              width: 14,
              height: 14,
              border: "2px solid rgba(255,255,255,0.4)",
              borderTopColor: "#fff",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 0.7s linear infinite",
            }}
          />
          Salvando...
        </>
      ) : (
        "Salvar análise"
      )}
    </button>
  );
}
