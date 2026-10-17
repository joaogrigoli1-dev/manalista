# Lixeira — manalista

Esta pasta guarda o que saiu da árvore do projeto numa limpeza, por data.
**Nada foi apagado.** Todo arquivo aqui foi *movido*, com o caminho original
preservado dentro de `lixo/<data>/`, e pode voltar com `restaurar.py`.

O conteúdo da lixeira é ignorado pelo git (ver as regras `lixo/*` no
`.gitignore`), mas o registro — este manifesto, `movimentos.tsv` e
`restaurar.py` — é versionado de propósito, para que a limpeza fique auditável
no histórico do repositório.

---

## 2026-10-17 — limpeza + reorganização da documentação

Método: um agente negativista julgou cada arquivo partindo do princípio de que
ele fica, e só liberou o que provou não ter uso, buscando com
`rg --no-ignore` dentro do repositório e fora dele (`~/.claude`, `~/Documents`,
`~/Dev`). Resultado: **67 arquivos julgados, 4 liberados, 63 mantidos.**

### O que foi para a lixeira (4 arquivos)

| Arquivo | Por que saiu |
|---|---|
| `PREVIEW-PDF-LIGHT.pdf` | Preview local de PDF. O próprio `.gitignore:16-18` declara "Test payloads e previews locais (não vão pro repo)". Nunca foi versionado; zero referências em 4 escopos de busca. |
| `tsconfig.tsbuildinfo` | Cache de build do `tsc`, regenerado por `npm run check`. Estava **rastreado no git e ao mesmo tempo listado em `.gitignore:14`** — contradição. Saiu do índice (`git rm --cached`) e o arquivo foi para cá. |
| `Plano_Manalista_Remediacao_e_Growth - cópia.docx` | Duplicata exata (SHA-256 `3a60c5e3…`) de `Prompts_Cowork/Plano_Manalista_Remediacao_e_Growth.docx`, que fica. Nenhuma citação usa o sufixo " - cópia". |
| `_docs-antigos/mockup-mesa-debate-v7.html` | Duplicata exata (SHA-256 `ecd71fd6…`) de `public/mesa-debate-v7.html`, que fica e é servida em produção. |

### O que NÃO saiu, e por quê

- **`scripts/generate_pdf.py`** — roda em produção: `spawn("python3", …)` em
  `src/app/api/relatorio/route.ts:125`.
- **`scripts/generate_icons.py`** — zero referências, mas é o único gerador dos
  11 arquivos de `public/icons/` que o `manifest.webmanifest` serve.
- **`Prompts_Cowork/` (8 arquivos)** — trabalho em andamento.
  `ESTADO_ORQUESTRACAO_ONDA0.md:3` se declara "documento vivo" e as Ondas 1 e 2
  seguem abertas (C-02, C-03 no código, allowlist de modelo, Frente E inteira).
- **`docs/auditorias/*.docx`** — são o "Documento 1" e o "Documento 2" que
  `Prompts_Cowork/00_ORQUESTRADOR.md:9` manda anexar; prova citada.
- **Mockups v1–v6, `.docx` de abril, `RELATORIO-FINAL-v7.md`** — cópia única,
  arte/relato não reproduzível. Foram **arquivados** em `docs/historico/`, não
  descartados. `RELATORIO-FINAL-v7.md` é a fonte que documenta
  `public/mesa-debate-v7.html` e `data/simulations/*`.
- **`data/simulations/*.json` e `data/coord-manalista-profile.json`** — zero
  referências no código, mas são prova citada em
  `docs/historico/RELATORIO-FINAL-v7.md:50-56,120-126`.
- **Todos os planos em Markdown** (`PLAN.md`, `AUDITORIA-MELHORIAS.md`,
  `PWA-TRANSFORMATION-PLAN.md`, `REMEDIATION_STATUS.md`,
  `ESTRATEGIA-LANCAMENTO.md`, `CONCORRENTES-GLOBAIS.md`,
  `SEO-CONTENT-STRATEGY.md`) — todos têm itens em aberto (41 checkboxes só no
  plano de PWA, 0 fechados). São planos pendentes, não histórico.
- **`docs/UPGRADE_PLAN.md`** — citado em comentário de código
  (`vitest.config.ts:3`, `playwright.config.ts:3`).
- **`AGENTS.md`** — stub de 47 bytes, zero referências; mantido porque é arquivo
  de convenção que harness de agente lê sozinho. Ver "Riscos e decisões".

### Reorganização (28 arquivos movidos, nenhum descartado)

A raiz tinha 11 documentos soltos e duas pastas de nome ruim. Agora:

```
docs/planos/       PLAN.md, AUDITORIA-MELHORIAS.md, PWA-TRANSFORMATION-PLAN.md, REMEDIATION_STATUS.md
docs/estrategia/   ESTRATEGIA-LANCAMENTO.md, CONCORRENTES-GLOBAIS.md, SEO-CONTENT-STRATEGY.md
docs/auditorias/   Auditoria_Manalista_Codigo_Banco.docx, Auditoria_Manalista_Infra_Coolify_NOC.docx
docs/agentes/      ← era agents/ (11 arquivos)
docs/historico/    ← era _docs-antigos/ (3 arquivos) + mockups/ (6 arquivos)
```

As pastas vazias `agents/` e `_docs-antigos/` foram removidas. `Prompts_Cowork/`
e `migrations_manual/` ficaram na raiz de propósito (ver `docs/README.md`).

### Documentos atualizados por causa dos caminhos novos

24 referências corrigidas em 10 arquivos:

| Arquivo | Correções |
|---|---|
| `docs/agentes/ORCHESTRATOR.md` | 9 (tabela dos 8 subagentes + `env-reference.md`) |
| `docs/agentes/EXECUTION-ROADMAP.md` | 1 (caixa ASCII, largura de 76 bytes preservada) |
| `docs/agentes/devops-agent.md` | 1 (nota: a receita de `.gitignore` já foi aplicada) |
| `docs/estrategia/ESTRATEGIA-LANCAMENTO.md` | 4 (`PLAN.md`) |
| `docs/estrategia/SEO-CONTENT-STRATEGY.md` | 2 |
| `docs/estrategia/CONCORRENTES-GLOBAIS.md` | 1 |
| `docs/planos/PWA-TRANSFORMATION-PLAN.md` | 3 (inclui marcar o item "limpar repo" como feito) |
| `docs/planos/AUDITORIA-MELHORIAS.md` | 1 (`PLAN.md`) |
| `Prompts_Cowork/00_ORQUESTRADOR.md` | 1 (onde achar os Documentos 1, 2 e 3) |
| `Prompts_Cowork/D_INFRA_DEVOPS_NOC.md` | 1 (caminho do Documento 2) |

### Backup dos arquivos fora do git

`lixo/2026-10-17/backup-nao-versionados-2026-10-17.tar.gz` — 312 KB, 38
arquivos: **todos** os arquivos não versionados do repositório no momento da
limpeza, com os caminhos originais, movidos ou não. É a rede de segurança para o
que o git não pode restaurar.

SHA-256 do tarball:
`f5670ff7c45c6519d85e0a1345d2af4c75efcfbc758a1152f195299e501f503b`

Conferir e extrair:

```bash
shasum -a 256 lixo/2026-10-17/backup-nao-versionados-2026-10-17.tar.gz
tar -tzf lixo/2026-10-17/backup-nao-versionados-2026-10-17.tar.gz          # listar
tar -xzf lixo/2026-10-17/backup-nao-versionados-2026-10-17.tar.gz -C /tmp/restore  # extrair fora da árvore
```

### Como restaurar

`movimentos.tsv` tem 33 linhas, uma por movimento, com seis colunas:

| Coluna | Significado |
|---|---|
| `origem` | caminho de onde o arquivo saiu, relativo à raiz do repositório |
| `destino` | onde ele está agora |
| `sha256` | hash do conteúdo **no instante do movimento** |
| `tipo` | `lixo` (4 linhas) ou `organizacao` (29 linhas) |
| `git` | `versionado` ou `nao-versionado` no momento do movimento |
| `sha256_atual` | hash do conteúdo **agora**. Difere de `sha256` nos 8 documentos que foram editados depois de mover, para corrigir caminhos |

```bash
python3 lixo/2026-10-17/restaurar.py                      # simula tudo
python3 lixo/2026-10-17/restaurar.py --apply              # desfaz tudo (lixeira + reorganização)
python3 lixo/2026-10-17/restaurar.py --apply --tipo lixo  # desfaz só a lixeira
python3 lixo/2026-10-17/restaurar.py --apply --only tsconfig.tsbuildinfo   # desfaz um só
```

Sem `--apply` o script só simula. Antes de mover qualquer coisa de volta ele
exige que o SHA-256 do arquivo bata com `sha256` **ou** `sha256_atual`, e recusa
sobrescrever um caminho de origem que já esteja ocupado (a menos que você passe
`--force`). Cada linha é validada e recusada individualmente; uma linha ruim não
aborta as outras.

Verificado nesta sessão: `--apply --only PREVIEW-PDF-LIGHT` restaurou o arquivo
para a raiz com o SHA-256 intacto, e a simulação completa aceita as 33 linhas,
0 recusadas.

Para arquivos que eram versionados, restaurar resolve o disco; o índice do git
ainda precisa de `git add <caminho>`.

### Riscos e decisões que ficaram para o dono

1. **`mockup-mesa-debate-v7.html` na raiz está deletado no worktree sem commit**
   (` D` no `git status`), de uma sessão anterior. **Não toquei** — não é arquivo
   desta limpeza. Falta decidir se comita a deleção. O conteúdo sobrevive em
   `public/mesa-debate-v7.html` (mesmo SHA-256).
2. **`PREVIEW-PDF-LIGHT.pdf` pode não ser regenerável hoje.**
   `scripts/generate_pdf.py` exige um `<input.json>` e o payload de teste
   (`scripts/test_payload.json`) não existe no disco. Se esse PDF é a referência
   visual da paleta light pedida em `docs/planos/AUDITORIA-MELHORIAS.md:431`
   (item ainda aberto), tire-o da lixeira.
3. **`public/avatars/neuropsico.svg` é órfão de código.** Os avatares são
   carregados por template `/avatars/${agent.id}.svg` e não existe o `AgentId`
   `"neuropsico"` em `src/types/index.ts:5-13`. Mantido (arte única, versionada,
   previsto como "extra" no plano de PWA). É o 10º agente planejado ou lixo?
4. **`AGENTS.md` é um stub de 47 bytes** com só o cabeçalho
   "## Imported Claude Cowork project instructions". Mantido por convenção. Se
   não usa Cowork neste repositório, é descartável sem perda.
5. **A suíte de testes já estava vermelha antes da limpeza:** 6 falhas em
   `tests/quota.test.ts` (401 onde o teste espera 200), medidas antes de
   qualquer movimento. Não é efeito desta limpeza.
6. **Transcripts de sessão não foram varridos.**
   `~/.claude/projects/-Users-jhgm-Dev-manalista` tem 1,4 GB de histórico e
   ficou fora da busca de referências. É histórico, não referência viva, mas se
   você considerar transcript como citação, falta checar.
