"use client";
import { useState } from "react";
import Link from "next/link";

// Página de planos / upgrade (destino do paywall do C-04).
//
// ⚠️ COPY PÚBLICA PENDENTE DE VALIDAÇÃO (Portão de Validação — Frente E):
//   - [CONFIRMAR-FONTE] CDC art. 49 (direito de arrependimento em compra web)
//     e transparência de assinatura recorrente devem constar nesta página
//     antes de qualquer campanha paga. Ver /termos e /privacidade.
//   - [CONFIRMAR-FONTE] Preço, limites e benefícios reais do plano Pro.
//   - Nunca prometer diagnóstico — o produto é orientação, não laudo.
// Esta página é estrutural: liga o paywall ao checkout do Stripe. O texto de
// marketing definitivo deve ser revisado antes de ir a público.

export default function PlanosPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/auth/login?callbackUrl=/planos";
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Não foi possível iniciar o checkout.");
      }
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao iniciar o checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", padding: "5rem 1.5rem" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "none" }}>
          ← Voltar
        </Link>
        <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", fontWeight: 800, color: "var(--text-primary)", margin: "1rem 0 0.5rem" }}>
          Planos
        </h1>
        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "2rem" }}>
          {/* [COPY PENDENTE DE VALIDAÇÃO] descrição honesta do serviço de orientação. */}
          Continue acompanhando o desenvolvimento da criança com a equipe multiprofissional de
          personas de IA. O material gerado é de orientação e não constitui diagnóstico.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
          {/* Plano Free */}
          <div className="card" style={{ padding: "0.375rem" }}>
            <div style={{ borderRadius: "calc(var(--radius-card) - 0.375rem)", background: "var(--bg-card)", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Free</h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                {/* [CONFIRMAR-FONTE] limite real */}
                Análises limitadas para conhecer a plataforma.
              </p>
            </div>
          </div>

          {/* Plano Pro */}
          <div className="card" style={{ padding: "0.375rem" }}>
            <div style={{ borderRadius: "calc(var(--radius-card) - 0.375rem)", background: "var(--bg-card)", padding: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--accent-brand)" }}>Pro</h2>
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0.5rem 0 1rem" }}>
                {/* [CONFIRMAR-FONTE] preço, benefícios e periodicidade da assinatura recorrente (CDC). */}
                Mais análises e acompanhamento contínuo. Assinatura recorrente —
                <strong> [detalhes de preço, renovação e direito de arrependimento (CDC art. 49) pendentes de revisão]</strong>.
              </p>
              <button
                onClick={handleUpgrade}
                disabled={loading}
                style={{
                  width: "100%", padding: "0.75rem", borderRadius: "9999px", border: "none",
                  background: "var(--accent-brand)", color: "#fff", fontFamily: "inherit",
                  fontWeight: 700, fontSize: "0.85rem", cursor: loading ? "wait" : "pointer",
                  boxShadow: "var(--shadow-button)",
                }}
              >
                {loading ? "Redirecionando..." : "Assinar Pro →"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#E5725C" }}>⚠️ {error}</p>
        )}

        <p style={{ marginTop: "2rem", fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          Ao assinar, você concorda com os <Link href="/termos" style={{ color: "var(--accent-brand)" }}>Termos de Uso</Link>{" "}
          e a <Link href="/privacidade" style={{ color: "var(--accent-brand)" }}>Política de Privacidade</Link>.
        </p>
      </div>
    </div>
  );
}
