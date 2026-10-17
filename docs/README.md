# Documentação do manalista

Índice da pasta `docs/`, reorganizada em 2026-10-17. Antes dessa data os
documentos estavam soltos na raiz do repositório (`PLAN.md`,
`PWA-TRANSFORMATION-PLAN.md`, `agents/`, `_docs-antigos/`, …); nada foi
reescrito, só movido para a pasta do tema, e as referências internas entre os
documentos foram corrigidas para os caminhos novos.

## Onde está cada coisa

| Pasta | Conteúdo | Estado |
|---|---|---|
| `docs/planos/` | Planejamento e auditorias de código em Markdown: `PLAN.md` (plano técnico original), `AUDITORIA-MELHORIAS.md`, `PWA-TRANSFORMATION-PLAN.md`, `REMEDIATION_STATUS.md` | Todos com itens em aberto — são planos vivos, não histórico |
| `docs/estrategia/` | Mercado e go-to-market: `ESTRATEGIA-LANCAMENTO.md`, `CONCORRENTES-GLOBAIS.md`, `SEO-CONTENT-STRATEGY.md` | Planos não executados |
| `docs/auditorias/` | As duas auditorias entregues em `.docx` (código/banco e infra/Coolify/NOC) | Fonte citada pelos prompts de `Prompts_Cowork/` como "Documento 1" e "Documento 2" |
| `docs/agentes/` | Especificação do time de subagentes que fez a transformação PWA: `ORCHESTRATOR.md` indexa os 9 agentes + `EXECUTION-ROADMAP.md` + `env-reference.md` | Entrega PWA já no ar; as ondas seguintes do `PWA-TRANSFORMATION-PLAN.md` continuam abertas |
| `docs/historico/` | Registro do que já foi entregue: `RELATORIO-FINAL-v7.md` e os dois `.docx` de abril de 2026 | Histórico — é a fonte que documenta `public/mesa-debate-v7.html` e `data/simulations/*` |
| `docs/historico/mockups/` | Iterações do mockup da Mesa de Debate, `mockup-mesa-debate.html` até `-v6.html` | Histórico de design. A versão final vive em `public/mesa-debate-v7.html` e é servida em produção |
| `docs/MIGRATIONS.md` | Fluxo alvo de migrations versionadas (C-03) | Não movido: citado por `docs/planos/REMEDIATION_STATUS.md` |
| `docs/UPGRADE_PLAN.md` | Plano de upgrade de Next/next-auth (A-02), não executado | **Não movido de propósito:** é citado em comentário de código, em `vitest.config.ts:3` e `playwright.config.ts:3` |

## O que ficou fora de `docs/` e por quê

- **`Prompts_Cowork/`** continua na raiz. É trabalho em andamento: os cinco
  prompts das Frentes A–E alimentam as Ondas 1 e 2, que `ESTADO_ORQUESTRACAO_ONDA0.md`
  deixa explicitamente abertas. Renomear a pasta quebraria os caminhos que uma
  sessão Cowork em curso usa para colar os prompts.
- **`migrations_manual/2026-07-07_c04_lgpd.sql`** continua onde está: a migration
  ainda não foi aplicada em produção e `docs/MIGRATIONS.md` aponta para esse caminho.
- **`lixo/`** é a lixeira da limpeza, não documentação. Ver `lixo/MANIFESTO.md`.

## Nota sobre versionamento

Dos documentos acima, só `docs/planos/PLAN.md`,
`docs/planos/AUDITORIA-MELHORIAS.md`, `docs/planos/REMEDIATION_STATUS.md`,
`docs/MIGRATIONS.md` e `docs/UPGRADE_PLAN.md` estão no git. Os outros (as
estratégias, os `.docx`, `docs/agentes/`, `docs/historico/` e o
`PWA-TRANSFORMATION-PLAN.md`) **nunca foram versionados** e a limpeza de
2026-10-17 não mudou isso — só os moveu de pasta, preservando o conteúdo. Há um
backup deles em `lixo/2026-10-17/backup-nao-versionados-2026-10-17.tar.gz`. Se
quiser que passem a viver no repositório, é um `git add` dessas pastas — decisão
que ficou em aberto de propósito.
