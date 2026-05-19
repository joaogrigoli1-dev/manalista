"use client";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

export function InstallBanner() {
  const { isInstallable, isIOS, promptInstall, dismiss } = useInstallPrompt();

  if (!isInstallable && !isIOS) return null;

  return (
    <div
      role="banner"
      aria-label="Instalar MAnalista"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe"
      style={{
        background: "linear-gradient(to top, rgba(5,5,8,0.98), rgba(10,10,14,0.95))",
        borderTop: "1px solid rgba(124,92,252,0.2)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="max-w-lg mx-auto flex items-center gap-4">
        {/* Ícone */}
        <div
          className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl"
          style={{ background: "rgba(124,92,252,0.15)", border: "1px solid rgba(124,92,252,0.3)" }}
        >
          🧠
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            Instalar MAnalista
          </p>
          {isIOS ? (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Toque em <strong>⎋ Compartilhar</strong> → "Adicionar à Tela de Início"
            </p>
          ) : (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Acesso rápido sem abrir o navegador
            </p>
          )}
        </div>

        {/* Botões */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={dismiss}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.06)" }}
            aria-label="Dispensar banner de instalação"
          >
            Agora não
          </button>
          {!isIOS && (
            <button
              onClick={() => promptInstall()}
              className="text-xs px-4 py-1.5 rounded-lg font-semibold text-white"
              style={{ background: "var(--accent-brand)" }}
              aria-label="Instalar aplicativo MAnalista"
            >
              Instalar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
