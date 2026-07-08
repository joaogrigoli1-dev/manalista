/**
 * Rate limiter em memória por chave (IP + rota).
 *
 * A-04: `rateLimit` (assíncrona, abaixo) adiciona um backend Redis com
 * fallback gracioso para esta mesma store em memória quando o Redis não
 * está configurado ou está indisponível. `checkRateLimit` (síncrona) é
 * preservada sem alterações de assinatura/comportamento — outros callers
 * dependem dela.
 */

import Redis from "ioredis";

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

// Limpar entradas expiradas a cada 10 minutos
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 10 * 60 * 1_000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * @param key    Chave única (ex: "analise:127.0.0.1")
 * @param limit  Número máximo de requisições na janela
 * @param windowMs Duração da janela em ms
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1_000),
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
    retryAfterSeconds: 0,
  };
}

// ── A-04: backend Redis com fallback gracioso ─────────────────────────────

let _redisClient: Redis | null | undefined; // undefined = ainda não inicializado; null = indisponível/desabilitado

/**
 * Retorna um client ioredis lazy, ou `null` se REDIS_URL não estiver
 * configurada ou se a conexão falhar. Nunca lança.
 */
function getRedisClient(): Redis | null {
  if (_redisClient !== undefined) return _redisClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    _redisClient = null;
    return _redisClient;
  }

  try {
    const client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // não fica tentando reconectar indefinidamente
      enableOfflineQueue: false,
    });
    client.on("error", (err) => {
      // Evita crash do processo por erro de conexão não tratado do ioredis.
      console.error("[rate-limit] Erro de conexão Redis (fallback em memória ativo):", err.message);
    });
    _redisClient = client;
  } catch (err) {
    console.error("[rate-limit] Falha ao inicializar client Redis:", err);
    _redisClient = null;
  }

  return _redisClient;
}

/**
 * Rate limiter assíncrono baseado em Redis (INCR + EXPIRE por janela fixa),
 * com fallback gracioso para a store em memória (`checkRateLimit`) quando
 * `REDIS_URL` não está configurada ou a conexão/operação falha.
 *
 * Prefira esta função para rotas que rodam em múltiplas instâncias (ex.:
 * atrás de um load balancer), onde a store em memória por processo não é
 * suficiente para aplicar um limite global.
 *
 * @param key    Chave única (ex: "lgpd:export:127.0.0.1")
 * @param limit  Número máximo de requisições na janela
 * @param windowMs Duração da janela em ms
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const client = getRedisClient();

  if (!client) {
    return checkRateLimit(key, limit, windowMs);
  }

  try {
    if (client.status !== "ready" && client.status !== "connecting") {
      await client.connect();
    }

    const redisKey = `ratelimit:${key}`;
    const windowSeconds = Math.max(1, Math.ceil(windowMs / 1_000));

    const count = await client.incr(redisKey);
    if (count === 1) {
      await client.expire(redisKey, windowSeconds);
    }

    const ttl = await client.ttl(redisKey);
    const resetAt = Date.now() + Math.max(ttl, 0) * 1_000;

    if (count > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfterSeconds: Math.max(ttl, 0),
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      resetAt,
      retryAfterSeconds: 0,
    };
  } catch (err) {
    console.error("[rate-limit] Falha ao usar Redis, aplicando fallback em memória:", err);
    return checkRateLimit(key, limit, windowMs);
  }
}
