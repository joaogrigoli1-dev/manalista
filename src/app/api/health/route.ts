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
    // A-03: não vazar a mensagem crua do driver (pode conter host/credenciais
    // parciais) no payload público — reporta apenas uma categoria segura.
    const category =
      err instanceof Error && err.message.startsWith("timeout") ? "timeout" : "connection_error";
    return { status: "unreachable", error: category };
  }
}

// REDIS_URL é consumida pelo rate limiter (src/lib/rate-limit.ts, função
// `rateLimit`) com fallback em memória; aqui reportamos apenas se está
// configurada, sem abrir conexão adicional só para o healthcheck.
function checkRedisConfig(): { status: string } {
  return { status: process.env.REDIS_URL ? "configured" : "not_configured" };
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