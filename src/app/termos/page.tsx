import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — MAnalista",
  description: "Termos de Uso do MAnalista — condições de utilização, assinatura e direitos do usuário.",
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
 * A-05: página estática de Termos de Uso.
 *
 * O conteúdo jurídico substantivo de cada seção é PLACEHOLDER — não deve
 * ser tratado como cláusula contratual válida até revisão por assessoria
 * jurídica com fonte normativa atualizada (LGPD, CDC, ECA, jurisprudência
 * aplicável a plataformas de saúde/triagem pediátrica).
 */
export default function TermosPage() {
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
          Termos de Uso
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "2.5rem" }}>
          Última atualização: {PENDING}
        </p>

        <Section title="1. Objeto e Natureza do Serviço">
          <p style={{ marginBottom: "0.75rem" }}>
            O MAnalista é uma ferramenta de sugestão em modo demonstração, com equipe
            multiprofissional simulada por inteligência artificial. Os resultados gerados
            são hipotéticos e NÃO constituem diagnóstico médico real, não substituindo
            avaliação presencial por profissional de saúde habilitado.
          </p>
          <Pending />
        </Section>

        <Section title="2. LGPD — Lei Geral de Proteção de Dados (Lei 13.709/2018)">
          <p style={{ marginBottom: "0.75rem" }}>
            Tratamos dados pessoais, incluindo dados sensíveis de saúde de crianças,
            conforme as bases legais e princípios da LGPD. O usuário (responsável legal
            pela criança) pode solicitar acesso, correção, exportação (portabilidade) e
            eliminação dos dados a qualquer momento pelas ferramentas disponíveis na
            conta ou pelo suporte.
          </p>
          <Pending />
        </Section>

        <Section title="3. Direito de Arrependimento — CDC art. 49">
          <p style={{ marginBottom: "0.75rem" }}>
            Nos termos do artigo 49 do Código de Defesa do Consumidor, contratações
            realizadas fora do estabelecimento comercial (ex.: internet) podem ser
            desistidas em até 7 (sete) dias corridos a contar da assinatura ou do
            recebimento do serviço, com devolução dos valores eventualmente pagos,
            devidamente atualizados.
          </p>
          <Pending />
        </Section>

        <Section title="4. Assinatura Recorrente e Cancelamento">
          <p style={{ marginBottom: "0.75rem" }}>
            Planos pagos são cobrados de forma recorrente (mensal) até o cancelamento
            pelo usuário. O cancelamento pode ser feito a qualquer momento pelo portal
            de assinatura, com efeito ao final do ciclo vigente, sem cobrança de multa.
          </p>
          <Pending />
        </Section>

        <Section title="5. Dados de Menores — ECA (Lei 8.069/1990)">
          <p style={{ marginBottom: "0.75rem" }}>
            O uso da plataforma para inserir dados de uma criança pressupõe que o
            usuário é seu responsável legal e que os dados fornecidos são verídicos.
            O tratamento de dados de crianças observa o interesse superior da criança e
            as salvaguardas adicionais previstas na LGPD para dados de menores.
          </p>
          <Pending />
        </Section>

        <Section title="6. Limitação de Responsabilidade">
          <Pending />
        </Section>

        <Section title="7. Controlador de Dados — Contato">
          <p style={{ marginBottom: "0.75rem" }}>
            Para exercer direitos de titular de dados ou tirar dúvidas sobre o
            tratamento de dados pessoais, entre em contato com o Controlador/Encarregado
            (DPO) pelos canais informados na página de{" "}
            <a href="/privacidade" style={{ color: "var(--accent-brand)" }}>
              Política de Privacidade
            </a>
            .
          </p>
          <Pending />
        </Section>
      </div>
    </main>
  );
}
