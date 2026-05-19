import {
  pgTable, text, integer, boolean, timestamp,
  uuid, jsonb, pgEnum, index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Enums ────────────────────────────────────────────────────────
export const planEnum = pgEnum("plan", ["free", "pro", "enterprise"]);
export const langEnum = pgEnum("lang", ["pt", "en"]);
export const analysisStatusEnum = pgEnum("analysis_status", ["pending", "complete", "error"]);

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
  accounts:   many(accounts),
  sessions:   many(sessions),
  analyses:   many(analyses),
  auditLogs:  many(auditLogs),
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

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
