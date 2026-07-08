import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — MAnalista",
  description: "Política de Privacidade do MAnalista — como tratamos dados pessoais e de saúde de crianças.",
};

const PENDING = "[TEXTO JURÍDICO PENDENTE DE REVISÃO POR FONTE JURÍDICA ATUAL]";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
        {title}
      </h2>
      <div style={{ color: "var(--text-secondary)", lineHeight: 1.75, fontSize: "0.92rem" }}>
        {children}
      </div>
    </section>
  );
}

function Pending() {
  return (
    <p
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
        background: "rgba(245,158,11,0.08)",
        border: "1px solid rgba(245,158,11,0.25)",
        color: "#F59E0B",
        fontSize: "0.85rem",
        fontWeight: 600,
      }}
    >
      {PENDING}
    </p>
  );
}

/**
 * A-05: página estática de Política de Privacidade.
 *
 * O conteúdo jurídico substantivo de cada seção é PLACEHOLDER — não deve
 * ser tratado como texto definitivo até revisão por assessoria jurídica com
 * fonte normativa atualizada (LGPD, ANPD, ECA).
 */
export default function PrivacidadePage() {
  return (
    <main
      id="main-content"
      style={{
        minHeight: "100dvh",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        padding: "3rem 1.25rem 5rem",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Política de Privacidade
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "2.5rem" }}>
          Última atualização: {PENDING}
        </p>

        <Section title="1. Quem é o Controlador dos Dados">
          <p style={{ marginBottom: "0.75rem" }}>
            Esta seção deve identificar a pessoa jurídica controladora do tratamento de
            dados (razão social, CNPJ, endereço) e, quando aplicável, os dados de
            contato do Encarregado de Proteção de Dados (DPO), nos termos do art. 41 da
            LGPD.
          </p>
          <Pending />
        </Section>

        <Section title="2. Quais Dados Coletamos">
          <p style={{ marginBottom: "0.75rem" }}>
            Coletamos dados de cadastro (nome, e-mail) e, mediante consentimento do
            responsável legal, dados sobre a criança inseridos no formulário de
            triagem (dados de desenvolvimento, comportamento e histórico de saúde —
            categorizados como dados sensíveis nos termos do art. 5º, II da LGPD).
          </p>
          <Pending />
        </Section>

        <Section title="3. Base Legal e Finalidade do Tratamento">
          <p style={{ marginBottom: "0.75rem" }}>
            O tratamento de dados sensíveis de saúde de crianças observa as bases
            legais aplicáveis da LGPD (ex.: consentimento específico e destacado do
            responsável legal, art. 11 e 14) e é realizado com a finalidade exclusiva de
            gerar a sugestão de triagem solicitada e, se o usuário optar por salvar,
            manter o histórico de análises da conta.
          </p>
          <Pending />
        </Section>

        <Section title="4. Retenção e Eliminação dos Dados">
          <p style={{ marginBottom: "0.75rem" }}>
            Dados de análises são retidos enquanto a conta estiver ativa. Ao solicitar a
            exclusão da conta, os dados são desidentificados/anonimizados conforme
            processo automatizado, observado um período de graça técnico
            (atualmente configurado como {"90 dias — "}
            <strong>valor provisório, sujeito a confirmação jurídica</strong>).
          </p>
          <Pending />
        </Section>

        <Section title="5. Direitos do Titular (LGPD art. 18)">
          <p style={{ marginBottom: "0.75rem" }}>
            O titular (responsável legal pela criança) pode solicitar, a qualquer
            momento: confirmação da existência de tratamento, acesso aos dados,
            correção, anonimização/eliminação, portabilidade (exportação) e revogação
            do consentimento. As ferramentas de exportação e exclusão de conta ficam
            disponíveis na área logada da conta.
          </p>
          <Pending />
        </Section>

        <Section title="6. Dados de Crianças — ECA e Salvaguardas Adicionais">
          <p style={{ marginBottom: "0.75rem" }}>
            O tratamento de dados de crianças é feito no melhor interesse da criança,
            com consentimento específico do responsável legal, e com salvaguardas
            adicionais de segurança da informação.
          </p>
          <Pending />
        </Section>

        <Section title="7. Compartilhamento com Terceiros">
          <p style={{ marginBottom: "0.75rem" }}>
            Dados podem ser processados por provedores de infraestrutura (ex.:
            hospedagem, processamento de pagamento) estritamente como operadores, sob
            instrução do controlador, e nunca vendidos a terceiros.
          </p>
          <Pending />
        </Section>

        <Section title="8. Segurança da Informação">
          <Pending />
        </Section>

        <Section title="9. Contato do Encarregado (DPO)">
          <p style={{ marginBottom: "0.75rem" }}>
            Para exercer os direitos acima ou reportar um incidente de segurança,
            entre em contato pelos canais de suporte informados no aplicativo.
          </p>
          <Pending />
        </Section>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "2rem" }}>
          Consulte também os{" "}
          <a href="/termos" style={{ color: "var(--accent-brand)" }}>
            Termos de Uso
          </a>
          .
        </p>
      </div>
    </main>
  );
}
