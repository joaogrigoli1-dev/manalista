-- ============================================================================
-- Migration manual — 2026-07-07
-- C-04 (reserva de cota por "run") + índices LGPD (Frente A)
--
-- Contexto: o ambiente Cowork desta sessão roda Linux e o node_modules do repo
-- foi instalado no macOS do dono do projeto, então `drizzle-kit generate`
-- (que usa esbuild com binário nativo por plataforma) não pôde ser executado
-- aqui. A fonte de verdade do schema é `src/lib/schema.ts` (já atualizado).
--
-- Como aplicar (escolha UMA opção):
--   (a) Na sua máquina (node_modules válido): `npm run db:generate` para gerar
--       a migration versionada a partir de src/lib/schema.ts e depois
--       `npm run db:migrate`; OU
--   (b) `npm run db:push` (sincroniza o schema direto — fluxo atual do projeto); OU
--   (c) aplicar este arquivo SQL diretamente no banco (psql).
--
-- Este script é IDEMPOTENTE: pode rodar mais de uma vez sem erro.
-- ============================================================================

-- ── C-04: enum de status de run ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'analysis_run_status') THEN
    CREATE TYPE analysis_run_status AS ENUM ('running', 'done', 'failed');
  END IF;
END$$;

-- ── C-04: tabela de reservas de cota por análise ────────────────────────────
CREATE TABLE IF NOT EXISTS analysis_runs (
  id            uuid PRIMARY KEY,                 -- = Idempotency-Key enviado pelo cliente
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        analysis_run_status NOT NULL DEFAULT 'running',
  created_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

CREATE INDEX IF NOT EXISTS analysis_runs_user_idx   ON analysis_runs (user_id);
CREATE INDEX IF NOT EXISTS analysis_runs_status_idx ON analysis_runs (status);

-- ── LGPD (Frente A): índices para os workers de anonimização/exclusão ───────
CREATE INDEX IF NOT EXISTS users_deleted_idx ON users (deleted_at);

-- Índice parcial: só indexa análises ainda NÃO anonimizadas (varredura barata
-- do worker de anonimização).
CREATE INDEX IF NOT EXISTS analyses_anon_idx
  ON analyses (created_at)
  WHERE anonymized_at IS NULL;
