"use client"

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center"
         style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}>
      <div style={{ fontSize: "4rem" }}>📡</div>
      <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        Sem conexão
      </h1>
      <p style={{ color: "var(--text-secondary)", maxWidth: "360px" }}>
        Verifique sua conexão com a internet. Suas análises salvas continuam disponíveis offline.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-xl font-semibold text-white"
        style={{ background: "var(--accent-brand)" }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
