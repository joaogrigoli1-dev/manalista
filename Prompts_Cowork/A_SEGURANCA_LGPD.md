# PROMPT — Sub-agente Frente A: Segurança & Compliance LGPD (usar modelo Sonnet 5 [alto esforço])

> Cole este prompt em uma sessão nova do Claude Desktop Cowork, com a pasta do projeto **manalista** conectada. Selecione o modelo **Sonnet 5** e esforço **[alto]** na interface. Esta sessão não tem memória de nenhuma conversa anterior.

## Contexto do projeto

manalista é um SaaS Next.js 15 (App Router) + TypeScript + Drizzle ORM/PostgreSQL + NextAuth v5 (beta) que oferece triagem/orientação pediátrica multiprofissional via 8 personas de IA (API Anthropic). Processa **dados de saúde de crianças** — o quadrante de risco jurídico mais sensível que existe (saúde + dado de menor). Uma auditoria anterior encontrou que as proteções de LGPD "anunciadas" no produto (consentimento, anonimização em 90 dias, exclusão de conta) existem apenas como colunas de banco (`consentedAt`, `deletedAt`, `anonymizedAt` na tabela `users`, já existentes no schema — não crie de novo) **sem nenhuma lógica de aplicação**, e o `ConsentModal` afirma **falsamente** que os dados "não são armazenados".

## Seu escopo — Frente A

### A.1 — C-01 (crítico): Exclusão, anonimização e export de dados

Implemente, usando as colunas já existentes no schema (`consentedAt`, `deletedAt`, `anonymizedAt` em `users`; equivalente em `analises`):

1. **Migration** (coordenar com a Frente C, que está adotando migrations versionadas via `drizzle-kit generate`/`migrate` em vez de `drizzle-kit push` direto): adicionar um índice parcial para a query do worker de anonimização, por exemplo `CREATE INDEX idx_analises_anon ON analises (deletedAt, createdAt) WHERE anonymizedAt IS NULL;` e um índice em `users(deletedAt)`.
2. **Endpoints novos**:
   - `POST /api/lgpd/export` (sessão obrigatória) → retorna ou envia por e-mail todos os dados do usuário.
   - `POST /api/lgpd/delete-account` (sessão + CSRF + confirmação de e-mail no corpo) → marca `deletedAt`, desidentifica o e-mail (`deleted+hash(userId)@manalista.invalid`), revoga sessões/tokens do NextAuth, marca análises para anonimização.
   - `POST /api/lgpd/consent` (sessão) → grava `consentedAt` + versão do texto de consentimento aceito.
3. **Worker de anonimização** (job agendado ou rota invocável): busca análises com `deletedAt` mais antigo que o período de graça (ex.: 90 dias — **marque este número como [CONFIRMAR-FONTE] até o usuário confirmar o prazo real exigido pela LGPD para este caso**), remove/anonimiza campos de PII (`childName`, conteúdo bruto do formulário, payload do relatório) e seta `anonymizedAt`.
4. **Toda operação acima grava em `auditLogs`** (tabela hoje órfã, nunca populada) — essa é a trilha de auditoria exigida em contexto de dado sensível.
5. **Reescreva o texto do `ConsentModal.tsx`** removendo a afirmação falsa de que dados não são armazenados. Sugestão de texto (ajuste ao componente real, mas preserve o sentido): consentimento honesto informando que os dados são armazenados de forma segura, associados à conta, com opção de exportar/excluir a qualquer momento nas configurações; que as análises são geradas por personas de IA (não profissionais reais) e não substituem avaliação presencial; e que quem preenche declara ser responsável legal pela criança ou ter autorização para fornecer os dados.

**Critérios de aceite**: exclusão marca `deletedAt`, desidentifica e-mail e invalida sessão; export retorna todos os dados do usuário; worker anonimiza após o período de graça sem deixar PII; toda operação grava em `auditLogs`; `ConsentModal` não contém mais a string "não são armazenados"; endpoints cobertos por teste.

### A.2 — A-05: Páginas /termos e /privacidade

Hoje retornam 404. Crie as rotas estáticas. **O conteúdo jurídico específico (LGPD, CDC art. 49 sobre direito de arrependimento em venda web, transparência de assinatura recorrente) precisa ser escrito ou revisado por alguém com conhecimento jurídico atualizado — não invente cláusulas legais.** Se não houver conteúdo aprovado disponível, crie a estrutura da página com placeholders claramente marcados `[TEXTO JURÍDICO PENDENTE DE REVISÃO]` e avise o usuário. Isso é um bloqueador para qualquer campanha de marketing paga.

### A.3 — A-03: Erros crus vazados ao cliente

Implemente um handler central de erro que nunca devolve `String(err)`/stack trace ao cliente. Padrão: gerar um `ref` (uuid), logar o erro completo no servidor com esse `ref`, e devolver ao cliente apenas `{ error: 'internal_error', ref }` com status 500. Aplique em todas as rotas de API.

### A.4 — Médios de segurança

- **Rate limiting em Redis** (o projeto já tem `REDIS_URL` provisionado, hoje não utilizado) em vez de rate limit em memória — aplicar especialmente em `/api/auth/*` e nas rotas de geração de análise.
- **Validação Zod forte**: substitua `z.unknown()`/`.passthrough()` por schemas explícitos em `/api/analise/save` e `/api/relatorio`.
- **CSRF em DELETE** de histórico: exigir token CSRF.
- **Delimitadores anti-prompt-injection**: ao montar o prompt enviado à API Anthropic com dados do formulário do usuário, envolva o conteúdo do usuário em um delimitador explícito (ex.: `<dados_do_usuario>...</dados_do_usuario>`) com instrução de que aquele bloco é dado, não comando.

### A.5 — Requisito clínico elevado pelo Conselho: Protocolo de Red Flag (feature E.9, mas comece aqui)

Adicione uma camada de detecção no pipeline de análise que, ao identificar sinais de risco grave no formulário (regressão de marcos de desenvolvimento, indícios de maus-tratos, sinais de risco à integridade da criança), injeta um bloco de encaminhamento urgente a um serviço de atendimento real — **este bloco nunca pode ficar atrás de paywall** (relevante para a Frente E depois, mas o gancho técnico deve existir desde já no pipeline).

## MCPs e ferramentas a usar

- **Leitura do código**: use as ferramentas de arquivo padrão da sessão (a pasta do projeto já deve estar conectada).
- **database** (se disponível) ou **coolify** → para inspecionar o schema real em produção antes de escrever a migration, e para confirmar que a migration rodou com sucesso após deploy (coordenar com Frente D/orquestrador antes de aplicar em produção).
- **github** (se conectado) → abrir PR com as mudanças em vez de commitar direto na branch principal.

## Regras de segurança (não negociáveis)

- Nunca reproduza valores de segredo (chaves de API, `DATABASE_URL`, tokens) em texto puro em nenhuma saída.
- Nunca rode uma listagem ampla de AWS SSM sem prefixo — este Parameter Store é compartilhado entre múltiplos projetos de clientes diferentes do usuário. Se precisar de algo em SSM, escopo estrito a `/manalista/*`.
- Nenhuma migration ou mudança de schema roda diretamente em produção sem confirmação explícita do usuário — proponha o PR/script e peça aprovação.
- Todo texto jurídico (Termos, Privacidade, texto do ConsentModal) deve ser sinalizado como "pendente de revisão por fonte jurídica atual" até confirmação explícita do usuário — não afirme que está juridicamente completo.

## Primeiro passo

Leia o schema atual (`src/lib/schema.ts` ou equivalente) e o `ConsentModal` atual para confirmar que as colunas LGPD já existem e para localizar o texto exato a corrigir. Depois proponha um plano de PRs (sugestão: 1 PR para exclusão/export/anonimização, 1 PR para páginas legais, 1 PR para tratamento de erro + médios de segurança) e execute em ordem, pedindo aprovação antes de qualquer deploy.
