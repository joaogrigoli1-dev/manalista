import { NextResponse } from "next/server";
import { getDb } from "@/lib/db-server";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Timeout curto para não pendurar o healthcheck do Docker (30s de intervalo)
// caso o Postgres esteja lento/inacessível.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`timeout_${ms}ms`)), ms)
    ),
  ]);
}

async function checkDatabase(): Promise<{ status: string; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await withTimeout(getDb().execute(sql`select 1`), 3000);
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    return { status: "unreachable", error: err instanceof Error ? err.message : "unknown_error" };
  }
}

// Não há cliente Redis implementado no código-fonte hoje (achado de auditoria:
// REDIS_URL existe como env var, mas não é consumida por nenhum módulo). Reportamos
// isso honestamente em vez de simular uma checagem de conexão que não existe.
function checkRedisConfig(): { status: string } {
  return { status: process.env.REDIS_URL ? "configured_but_unused" : "not_configured" };
}

// Verifica só o FORMATO da chave Stripe (nunca o valor) — detecta o cenário de
// placeholder configurado incorretamente sem vazar o segredo no payload.
function checkStripeKeyFormat(): { status: string } {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { status: "missing" };
  const validFormat = /^sk_(live|test)_/.test(key);
  return { status: validFormat ? "ok" : "invalid_format" };
}

export async function GET() {
  const [database] = await Promise.all([checkDatabase()]);
  const redis = checkRedisConfig();
  const stripeKey = checkStripeKeyFormat();

  const overallStatus = database.status === "ok" ? "ok" : "degraded";

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_BUILD_ID ?? "dev",
      uptimeSeconds: Math.round(process.uptime()),
      dependencies: {
        database,
        redis,
        stripeKey,
      },
    },
    { status: overallStatus === "ok" ? 200 : 503 }
  );
}