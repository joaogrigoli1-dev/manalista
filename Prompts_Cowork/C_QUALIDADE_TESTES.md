# PROMPT — Sub-agente Frente C: Qualidade, Testes & Dependências (usar modelo Sonnet 5 [alto esforço])

> Cole este prompt em uma sessão nova do Claude Desktop Cowork, com a pasta do projeto **manalista** conectada. Selecione o modelo **Sonnet 5** e esforço **[alto]** na interface. Esta sessão não tem memória de nenhuma conversa anterior.

## Contexto do projeto

manalista é um SaaS Next.js 15 (App Router) + TypeScript + Drizzle ORM/PostgreSQL + NextAuth v5 (beta), com zero testes automatizados hoje, CVEs conhecidas no Next.js/next-auth (incluindo um bypass de middleware de severidade alta, que é a mesma superfície de código do achado crítico C-02 sendo corrigido pela Frente B), migrations aplicadas via `drizzle-kit push` direto em produção (sem versionamento), um Dockerfile rodando como root, e uma referência de modelo de IA inválida (`getModelForAgent` aponta para nomes como "claude-opus-4-6"/"claude-sonnet-4-6", que não existem).

**Seu trabalho é o alicerce de segurança que permite às Frentes A e B mexerem em billing/quota/schema com confiança.**

## Seu escopo — Frente C

### C.1 — A-01: Stack de testes (prioridade — fazer primeiro)

Configure Vitest (unit/integração) e Playwright (E2E). **Ordem de prioridade dos testes** (não escreva cobertura genérica — escreva exatamente estes fluxos, pois são os que as Frentes A e B vão tocar):

1. **Billing** — checkout, webhook do Stripe, portal do cliente.
2. **Quota** — débito na geração (não no save), retorno 402 ao estourar, estorno em falha, idempotência via `Idempotency-Key`.
3. **Auth** — sessão obrigatória em rotas protegidas, 401 (não 302) em API, usuário Pro nunca vira Free por falha de sessão.
4. **Ownership** — usuário A não consegue acessar dado (análise, histórico) de usuário B.

Configure o CI para **bloquear merge** se algum teste falhar ou se uma vulnerabilidade crítica for detectada no scan de dependências.

### C.2 — A-02: Atualização segura de Next.js / next-auth

**Siga esta ordem exata, não pule etapas:**

1. Garanta que os testes de auth/middleware/billing (item C.1) existem e passam contra o estado atual do código.
2. Atualize o Next.js para a versão estável mais recente disponível no momento da execução (corrige o bypass de middleware CVSS ~8.1 e um SSRF ~8.6 conhecidos na versão atual) e rode a suite completa.
3. Migre `next-auth` da versão beta para a versão estável mais recente, validando explicitamente: login via Google OAuth, login via magic link, persistência de sessão, comportamento do middleware (401 vs 302), e o fluxo de checkout completo.
4. Rode um audit de dependências (`npm audit` ou equivalente) e trave o lockfile.
5. Execute manualmente (ou via Playwright) os 5 fluxos acima antes de considerar concluído.

### C.3 — Migrations versionadas (pré-requisito da Frente A)

Troque `drizzle-kit push` direto por um fluxo versionado: `drizzle-kit generate` (gera SQL de migration) → revisão humana → `drizzle-kit migrate` no pipeline de deploy. **A Frente A depende deste item** para poder criar os índices de anonimização com segurança — comunique ao orquestrador assim que este item estiver pronto.

### C.4 — Dockerfile rodando como root

Adicione um usuário não-privilegiado:

```dockerfile
RUN addgroup --system app && adduser --system --ingroup app app
USER app
```

**Critério de aceite**: o processo do container não roda como root.

### C.5 — Nomenclatura de modelo de IA inválida [CONFIRMAR-FONTE]

O código referencia identificadores de modelo Anthropic que **não existem** ("claude-opus-4-6", "claude-sonnet-4-6"). Isto é particularmente sério em contexto de saúde: se há algum fallback silencioso, os 8 agentes podem estar rodando num modelo diferente do pretendido, afetando a qualidade do raciocínio clínico simulado sem que ninguém perceba.

1. **Consulte a documentação oficial da Anthropic no momento da execução** (não confie em memória de treinamento para isto) para obter os identificadores de modelo reais e atualmente disponíveis.
2. Corrija `getModelForAgent` para usar identificadores válidos.
3. Adicione validação no boot da aplicação: se o identificador de modelo configurado não estiver em uma allowlist conhecida, a aplicação deve falhar explicitamente — nunca cair em um fallback silencioso.
4. Mapeie qual modelo é usado em qual etapa por custo: os 7 passos de "analyze" podem usar um modelo mais econômico; reserve o modelo mais capaz para a etapa de "consolidate" (a síntese final que o usuário lê).

## MCPs e ferramentas a usar

- **github** (se conectado) → para verificar se há Dependabot/CVE alerts abertos, e para abrir os PRs de upgrade.
- Se disponível, uma ferramenta de **busca na web** para consultar a documentação atual da Anthropic (identificadores de modelo) e os changelogs de segurança do Next.js/next-auth — **não confie em conhecimento de treinamento desatualizado para nomes de modelo ou números de versão**.
- **coolify** → para confirmar, após o deploy do upgrade, que o healthcheck (`/api/health`, já enriquecido para checar DB + formato da chave Stripe) continua retornando OK.

## Regras de segurança (não negociáveis)

- Nenhum upgrade de dependência crítica (Next.js, next-auth) é mesclado/deployado sem a suite de testes de auth/billing passando primeiro.
- Nenhuma migration de schema roda direto em produção — sempre gerar, revisar, então aplicar via pipeline.
- Marque explicitamente qualquer identificador de modelo de IA ou número de versão de dependência que você não conseguiu confirmar como `[CONFIRMAR-FONTE]` e avise o usuário, em vez de assumir.

## Primeiro passo

Configure Vitest e escreva os 4 grupos de teste do item C.1 contra o estado *atual* do código (antes de qualquer fix das Frentes A/B) — isso dá a todas as outras Frentes uma rede de segurança imediata. Em paralelo, comece o levantamento de migrations versionadas (C.3), pois a Frente A está bloqueada por ele.
