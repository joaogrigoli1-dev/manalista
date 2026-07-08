import { vi } from "vitest";

/**
 * Mock "chainable" que imita a fluent API do Drizzle
 * (`select().from().where().limit()...`, `insert().values().returning()`,
 * `update().set().where()`). Cada método encadeável é um `vi.fn()` que
 * devolve o próprio objeto (permitindo asserções tipo
 * `expect(chain.values).toHaveBeenCalledWith(...)`), e o objeto é
 * "thenable": `await` em qualquer ponto da cadeia resolve para `result`,
 * exatamente como o driver `postgres-js` do Drizzle resolve a Promise da
 * query ao final da cadeia.
 *
 * Isso nos permite testar a LÓGICA das rotas (quando cada branch é tomado,
 * quantas vezes update/insert são chamados, com quais status volta a
 * resposta) sem precisar de um Postgres real — não validamos aqui o SQL
 * gerado pelo Drizzle nem constraints do banco (isso exige um teste de
 * integração com banco real, fora do escopo possível neste ambiente).
 */
export function chainable<T = unknown>(result: T) {
  const obj: any = {};
  const chainMethods = [
    "from",
    "where",
    "limit",
    "orderBy",
    "for",
    "set",
    "values",
    "onConflictDoUpdate",
    "onConflictDoNothing",
  ] as const;

  for (const method of chainMethods) {
    obj[method] = vi.fn(() => obj);
  }

  obj.returning = vi.fn(() => Promise.resolve(result));
  obj.then = (resolve: (v: T) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(result).then(resolve, reject);
  obj.catch = (reject: (e: unknown) => unknown) => Promise.resolve(result).catch(reject);

  return obj as typeof obj & { __result: T };
}

/**
 * `vi.fn()` que devolve, em sequência, um `chainable(result)` para cada
 * chamada — usado quando uma rota faz múltiplos `select(...)` na mesma
 * transação (ex.: primeiro busca a run, depois busca o usuário sob lock) e
 * cada um precisa resolver para dados diferentes.
 */
export function selectQueue(results: unknown[]) {
  let i = 0;
  return vi.fn(() => {
    const result = i < results.length ? results[i] : [];
    i++;
    return chainable(result);
  });
}

/** Mock mínimo de `tx` (client dentro de `db.transaction(async (tx) => ...)`). */
export function makeTxMock() {
  return {
    select: vi.fn(() => chainable([])),
    insert: vi.fn(() => chainable(undefined)),
    update: vi.fn(() => chainable(undefined)),
    delete: vi.fn(() => chainable(undefined)),
  };
}

/**
 * Mock de `db` (o export de `@/lib/db-server`). `transaction` delega para o
 * `tx` passado, do mesmo jeito que o Drizzle real invoca o callback com o
 * client transacional.
 */
export function makeDbMock(tx = makeTxMock()) {
  return {
    transaction: vi.fn(async (cb: (tx: ReturnType<typeof makeTxMock>) => Promise<unknown>) => cb(tx)),
    select: vi.fn(() => chainable([])),
    insert: vi.fn(() => chainable(undefined)),
    update: vi.fn(() => chainable(undefined)),
    delete: vi.fn(() => chainable(undefined)),
    query: {} as Record<string, unknown>,
    tx,
  };
}
