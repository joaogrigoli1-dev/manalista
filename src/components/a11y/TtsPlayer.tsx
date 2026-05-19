"use client";
import { useTts } from "@/hooks/useTts";

interface TtsPlayerProps {
  text: string;
  lang?: string;
  label?: string;       // aria-label customizado
  compact?: boolean;    // modo compacto (só ícone)
  className?: string;
}

export function TtsPlayer({ text, lang = "pt-BR", label, compact = false, className }: TtsPlayerProps) {
  const { speak, pause, resume, stop, status, progress, isSupported } = useTts({ lang });

  if (!isSupported) return null;

  const handleMainAction = () => {
    if (status === "idle" || status === "error") {
      speak(text);
    } else if (status === "playing") {
      pause();
    } else if (status === "paused") {
      resume();
    }
  };

  const ariaLabel = label ?? (
    status === "idle" ? "Ouvir laudo em voz alta" :
    status === "playing" ? "Pausar leitura" :
    status === "paused" ? "Retomar leitura" : "Ouvir laudo"
  );

  const icon =
    status === "playing" ? "⏸" :
    status === "paused"  ? "▶" : "🔊";

  return (
    <div
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
      role="group"
      aria-label="Controles de leitura em voz alta"
    >
      {/* Botão principal */}
      <button
        onClick={handleMainAction}
        aria-label={ariaLabel}
        aria-pressed={status === "playing"}
        title={ariaLabel}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          padding: compact ? "0.375rem" : "0.375rem 0.75rem",
          borderRadius: "9999px",
          fontSize: "0.8rem",
          fontWeight: 600,
          cursor: "pointer",
          border: "1px solid rgba(124,92,252,0.3)",
          background: status === "playing"
            ? "rgba(124,92,252,0.2)"
            : "rgba(124,92,252,0.08)",
          color: "var(--text-primary)",
          transition: "all 0.2s ease",
        }}
      >
        <span aria-hidden="true">{icon}</span>
        {!compact && (
          <span>
            {status === "idle" || status === "error" ? "Ouvir" :
             status === "playing" ? "Pausar" : "Retomar"}
          </span>
        )}
      </button>

      {/* Botão stop — só quando ativo */}
      {(status === "playing" || status === "paused") && (
        <button
          onClick={stop}
          aria-label="Parar leitura"
          title="Parar leitura"
          style={{
            padding: "0.375rem",
            borderRadius: "9999px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "0.75rem",
          }}
        >
          <span aria-hidden="true">⏹</span>
        </button>
      )}

      {/* Barra de progresso — só quando ativo */}
      {(status === "playing" || status === "paused") && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Progresso da leitura"
          style={{
            width: "60px",
            height: "4px",
            borderRadius: "2px",
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "var(--accent-brand)",
              borderRadius: "2px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}
    </div>
  );
}
