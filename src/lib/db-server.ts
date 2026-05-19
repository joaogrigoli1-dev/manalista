import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Lazy singleton — só cria a conexão em runtime, nunca durante next build
declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var _db: PostgresJsDatabase<typeof schema> | undefined;
}

/**
 * Retorna a instância real do Drizzle (criando conexão se necessário).
 * Use esta função em callbacks e handlers que rodam em runtime.
 * O DrizzleAdapter do Auth.js deve receber o resultado desta função,
 * não o proxy `db`.
 */
export function getDb(): PostgresJsDatabase<typeof schema> {
  if (globalThis._db) return globalThis._db;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");

  const client = globalThis._pgClient ?? postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis._pgClient = client;
  }

  const instance = drizzle(client, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalThis._db = instance;
  }

  return instance;
}

// Proxy que inicializa lazily na primeira chamada de qualquer método.
// NÃO use este proxy onde a biblioteca inspeciona o tipo da instância
// (ex: DrizzleAdapter). Para esses casos, chame getDb() diretamente.
export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export { schema };
