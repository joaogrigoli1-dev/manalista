import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Singleton para evitar múltiplas conexões em dev (HMR)
declare global {
  // eslint-disable-next-line no-var
  var _pgClient: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  return postgres(url, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

const client = globalThis._pgClient ?? createClient();
if (process.env.NODE_ENV !== "production") globalThis._pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
