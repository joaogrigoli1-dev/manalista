import {
  pgTable, text, integer, boolean, timestamp,
  uuid, jsonb, pgEnum, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ── Enums ────────────────────────────────────────────────────────
export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);
export const langEnum = pgEnum("lang", ["pt", "en"]);
export const analysisStatusEnum = pgEnum("analysis_status", ["pending", "complete", "error"]);
// C-04: estados de uma "run" de análise (reserva de cota).
export const analysisRunStatusEnum = pgEnum("analysis_run_status", ["running", "done", "failed"]);

// ── Users ────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id:            uuid("id").primaryKey().defaultRandom(),
  name:          text("name"),
  email:         text("email").notNull(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image:         text("image"),
  plan:          planEnum("plan").default("free").notNull(),
  // Cotas mensais
  analysesUsed:  integer("analyses_used").default(0).notNull(),
  analysesLimit: integer("analyses_limit").default(5).notNull(),
  quotaResetAt:  timestamp("quota_reset_at", { withTimezone: true }),
  // Stripe
  stripeCustomerId:     text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  // LGPD
  consentedAt:   timestamp("consented_at", { withTimezone: true }),
  deletedAt:     timestamp("deleted_at", { withTimezone: true }),
  createdAt:     timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("users_email_idx").on(t.email),
  index("users_stripe_customer_idx").on(t.stripeCustomerId),
  // LGPD (Frente A): acelera o worker de anonimização que varre contas excluídas.
  index("users_deleted_idx").on(t.deletedAt),
]);

// ── Auth.js tables (required by DrizzleAdapter) ──────────────────
export const accounts = pgTable("accounts", {
  id:                text("id").primaryKey(),
  userId:            uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:              text("type").notNull(),
  provider:          text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken:      text("refresh_token"),
  accessToken:       text("access_token"),
  expiresAt:         integer("expires_at"),
  tokenType:         text("token_type"),
  scope:             text("scope"),
  idToken:           text("id_token"),
  sessionState:      text("session_state"),
}, (t) => [
  uniqueIndex("accounts_provider_idx").on(t.provider, t.providerAccountId),
  index("accounts_user_idx").on(t.userId),
]);

export const sessions = pgTable("sessions", {
  id:           text("id").primaryKey(),
  sessionToken: text("session_token").notNull(),
  userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires:      timestamp("expires", { withTimezone: true }).notNull(),
}, (t) => [
  uniqueIndex("sessions_token_idx").on(t.sessionToken),
  index("sessions_user_idx").on(t.userId),
]);

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token:      text("token").notNull(),
  expires:    timestamp("expires", { withTimezone: true }).notNull(),
}, (t) => [
  uniqueIndex("verification_tokens_idx").on(t.identifier, t.token),
]);

// ── Analyses ─────────────────────────────────────────────────────
export const analyses = pgTable("analyses", {
  id:                  uuid("id").primaryKey().defaultRandom(),
  userId:              uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  childName:           text("child_name").notNull(),
  childAge:            text("child_age").notNull(),
  lang:                langEnum("lang").default("pt").notNull(),
  qualityScore:        integer("quality_score").default(0).notNull(),
  detectedPathologies: text("detected_pathologies").array().default([]).notNull(),
  status:              analysisStatusEnum("status").default("pending").notNull(),
  // JSON completo
  childDataJson:       jsonb("child_data_json"),
  resultsJson:         jsonb("results_json"),
  debateMessagesJson:  jsonb("debate_messages_json"),
  // LGPD — dados anonimizados após 90 dias
  anonymizedAt:        timestamp("anonymized_at", { withTimezone: true }),
  createdAt:           timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("analyses_user_idx").on(t.userId),
  index("analyses_created_idx").on(t.createdAt),
  index("analyses_status_idx").on(t.status),
  // LGPD (Frente A): índice parcial para o worker de anonimização —
  // só indexa linhas ainda NÃO anonimizadas, mantendo a varredura barata.
  index("analyses_anon_idx").on(t.createdAt).where(sql`anonymized_at IS NULL`),
]);

// ── Analysis Runs (C-04: reserva de cota por geração) ────────────
// Cada "run" reserva 1 unidade de cota no INÍCIO da sequência de ~15
// chamadas pagas à Anthropic (7 analyze + 7 debate + 1 consolidate).
// O id é fornecido pelo cliente (Idempotency-Key/runId), de modo que as
// 15 chamadas da mesma análise compartilham a mesma reserva e debitam a
// cota UMA única vez. Estorno em caso de falha do pipeline.
export const analysisRuns = pgTable("analysis_runs", {
  id:          uuid("id").primaryKey(), // = Idempotency-Key enviado pelo cliente
  userId:      uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status:      analysisRunStatusEnum("status").default("running").notNull(),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [
  index("analysis_runs_user_idx").on(t.userId),
  index("analysis_runs_status_idx").on(t.status),
]);

// ── Audit Log (LGPD) ─────────────────────────────────────────────
export const auditLogs = pgTable("audit_logs", {
  id:         uuid("id").primaryKey().defaultRandom(),
  userId:     uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action:     text("action").notNull(), // "analysis.created", "user.deleted", etc.
  resourceId: text("resource_id"),
  metadata:   jsonb("metadata"),
  ip:         text("ip"),
  createdAt:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("audit_logs_user_idx").on(t.userId),
  index("audit_logs_action_idx").on(t.action),
  index("audit_logs_created_idx").on(t.createdAt),
]);

// ── Relations ────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  accounts:      many(accounts),
  sessions:      many(sessions),
  analyses:      many(analyses),
  analysisRuns:  many(analysisRuns),
  auditLogs:     many(auditLogs),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  user: one(users, { fields: [analyses.userId], references: [users.id] }),
}));

export const analysisRunsRelations = relations(analysisRuns, ({ one }) => ({
  user: one(users, { fields: [analysisRuns.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
