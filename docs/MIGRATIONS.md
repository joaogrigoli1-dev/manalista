# Migrations versionadas (C-03)

`src/lib/schema.ts` é a fonte de verdade do schema (Drizzle ORM). Este
documento descreve o fluxo alvo de migrations versionadas que substitui o uso
direto de `npm run db:push` em produção.

## Estado confirmado nesta sessão

- `drizzle.config.ts` já aponta corretamente para `schema: "./src/lib/schema.ts"`
  e `out: "./drizzle"` (confirmado por leitura — **não editado**, é de outra
  frente). Nenhuma mudança necessária aí.
- Já existe uma migration manual aplicável em
  `migrations_manual/2026-07-07_c04_lgpd.sql` (C-04 + índices LGPD),
  criada porque `drizzle-kit generate` não pôde rodar neste ambiente sandbox
  (binário nativo esbuild instalado para macOS, ambiente de execução Linux).
  Esse arquivo **não foi editado** por esta frente.

## Por que sair de `db:push` direto

`drizzle-kit push` compara o schema TypeScript com o banco ao vivo e aplica a
diferença sem gerar um artefato de migration versionado, revisável em code
review ou re-executável de forma determinística em outro ambiente. Isso é
conveniente em desenvolvimento local, mas em produção significa:

- nenhum histórico de "o que mudou entre a v1 e a v2 do schema";
- nenhuma janela de revisão humana do SQL antes de rodar contra dados reais;
- nenhuma forma simples de reproduzir o mesmo estado de schema em staging vs.
  produção de forma auditável.

## Fluxo alvo (a partir de agora, para toda mudança de schema)

1. Editar `src/lib/schema.ts` (fonte de verdade).
2. Rodar `npm run db:generate` (script já existe em `package.json`, executa
   `drizzle-kit generate`) — **na máquina do desenvolvedor**, onde o
   `node_modules` tem os binários nativos corretos para a plataforma. Isso
   gera um novo arquivo SQL versionado em `./drizzle/` + entrada no journal
   do Drizzle (`drizzle/meta/_journal.json`).
3. **Revisão humana obrigatória do SQL gerado** antes de commitar — checar
   especialmente: `DROP COLUMN`/`DROP TABLE` (perda de dados), mudanças de
   tipo de coluna que exigem `USING` explícito, novas colunas `NOT NULL` sem
   `DEFAULT` em tabelas já populadas (precisam de backfill em duas etapas:
   adicionar nullable → backfill → `ALTER COLUMN SET NOT NULL`).
4. Commit do schema + do SQL gerado + do journal juntos, no mesmo PR.
5. Deploy: `npm run db:migrate` (`drizzle-kit migrate`) roda os arquivos do
   journal ainda não aplicados no banco-alvo, de forma idempotente e
   ordenada — em vez de `db:push`. Recomendado como um passo explícito do
   pipeline de deploy (Coolify), antes de subir a nova versão da aplicação,
   não durante o boot dela.
6. Manter `db:push` disponível apenas para uso local/manual em ambiente de
   desenvolvimento (prototipagem rápida de schema antes de gerar a migration
   "de verdade" no passo 2) — nunca apontado para produção.

## Pendência explícita para o dono do projeto

A geração formal do journal Drizzle (passo 2 acima) para o estado atual do
schema (incluindo as tabelas `analysisRuns`/C-04 e os índices LGPD já
presentes em `migrations_manual/2026-07-07_c04_lgpd.sql`) precisa ser feita
na máquina do usuário, rodando `npm run db:generate` com o `node_modules`
válido, para que o journal do Drizzle (`./drizzle/meta/_journal.json`) passe
a refletir esse estado e todo `ALTER` futuro seja incremental a partir dele.
Até lá, `migrations_manual/2026-07-07_c04_lgpd.sql` continua sendo a forma
válida (idempotente) de aplicar esse estado a um banco existente.
