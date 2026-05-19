import Dexie, { type EntityTable } from "dexie";

// ── Tipos para o banco local ─────────────────────────────────────

export interface SavedAnalysis {
  id?: number; // auto-increment PK
  uuid: string; // UUID único para deduplication
  createdAt: Date;
  childName: string;
  childAge: string; // ex: "3 anos e 2 meses"
  lang: "pt" | "en";
  qualityScore: number;
  detectedPathologies: string[];
  // JSON serializado dos dados completos
  childDataJson: string; // ChildData serializada
  resultsJson: string; // DiagnosticSuggestion[] serializada
  debateMessagesJson: string; // DebateMessage[] serializada
  // Status da análise
  status: "complete" | "partial" | "error";
}

export interface AppSettings {
  id?: number;
  key: string;
  value: string;
}

// ── Database class ───────────────────────────────────────────────

class MAnalistaDB extends Dexie {
  analyses!: EntityTable<SavedAnalysis, "id">;
  settings!: EntityTable<AppSettings, "id">;

  constructor() {
    super("manalista-v1");
    this.version(1).stores({
      analyses: "++id, uuid, createdAt, childName, status",
      settings: "++id, &key",
    });
  }
}

export const db = new MAnalistaDB();
