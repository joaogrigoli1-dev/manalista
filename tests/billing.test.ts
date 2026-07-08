import { describe, it, expect, vi, beforeEach } from "vitest";
import { chainable } from "./helpers/db-mock";
import { sessionFor, USER_A_ID } from "./helpers/fixtures";

/**
 * Billing — smoke tests de forma/contrato das rotas Stripe (checkout,
 * portal, webhook). @/lib/stripe é mockado (nunca chamamos a API real da
 * Stripe em teste); @/lib/auth-init também é mockado (evita chamadas reais
 * ao AWS SSM feitas por `initAuth()`).
 */

const { authMock, dbMock, stripeMock } = vi.hoisted(() => {
  return {
    authMock: vi.fn(),
    dbMock: { select: vi.fn(), update: vi.fn(), insert: vi.fn(), delete: vi.fn(), transaction: vi.fn() },
    stripeMock: {
      customers: { create: vi.fn() },
      checkout: { sessions: { create: vi.fn() } },
      billingPortal: { sessions: { create: vi.fn() } },
      webhooks: { constructEvent: vi.fn() },
    },
  };
});

vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/db-server", () => ({ db: dbMock, getDb: () => dbMock }));
vi.mock("@/lib/auth-init", () => ({ initAuth: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/stripe", () => ({ stripe: stripeMock }));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_PRICE_PRO_MONTHLY = "price_test_123";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  process.env.NEXTAUTH_URL = "https://manalista.com.br";
});

describe("POST /api/stripe/checkout", () => {
  it("401 sem sessão", async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("cria checkout session reaproveitando stripeCustomerId existente", async () => {
    authMock.mockResolvedValue(sessionFor(USER_A_ID));
    dbMock.select.mockReturnValue(chainable([{ email: "a@example.com", stripeCustomerId: "cus_123" }]));
    stripeMock.checkout.sessions.create.mockResolvedValue({ url: "https://checkout.stripe.com/xyz" });

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const res = await POST();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ url: "https://checkout.stripe.com/xyz" });
    expect(stripeMock.customers.create).not.toHaveBeenCalled();
    expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_123", mode: "subscription" })
    );
  });

  it("500 quando STRIPE_PRICE_PRO_MONTHLY não está configurado", async () => {
    delete process.env.STRIPE_PRICE_PRO_MONTHLY;
    authMock.mockResolvedValue(sessionFor(USER_A_ID));
    dbMock.select.mockReturnValue(chainable([{ email: "a@example.com", stripeCustomerId: "cus_123" }]));

    const { POST } = await import("@/app/api/stripe/checkout/route");
    const res = await POST();

    expect(res.status).toBe(500);
  });
});

describe("POST /api/stripe/portal", () => {
  it("401 sem sessão", async () => {
    authMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/stripe/portal/route");
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("400 quando o usuário não tem stripeCustomerId (nunca fez upgrade)", async () => {
    authMock.mockResolvedValue(sessionFor(USER_A_ID));
    dbMock.select.mockReturnValue(chainable([{ stripeCustomerId: null }]));

    const { POST } = await import("@/app/api/stripe/portal/route");
    const res = await POST();

    expect(res.status).toBe(400);
  });

  it("200 e devolve a url do portal quando há stripeCustomerId", async () => {
    authMock.mockResolvedValue(sessionFor(USER_A_ID));
    dbMock.select.mockReturnValue(chainable([{ stripeCustomerId: "cus_123" }]));
    stripeMock.billingPortal.sessions.create.mockResolvedValue({ url: "https://billing.stripe.com/xyz" });

    const { POST } = await import("@/app/api/stripe/portal/route");
    const res = await POST();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ url: "https://billing.stripe.com/xyz" });
  });
});

describe("POST /api/stripe/webhook", () => {
  it("500 quando STRIPE_WEBHOOK_SECRET não está configurada", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const res = await POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body: "{}" }));
    expect(res.status).toBe(500);
  });

  it("400 quando a assinatura HMAC é inválida", async () => {
    stripeMock.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("invalid signature");
    });
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const res = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "bad-sig" },
        body: "{}",
      })
    );
    expect(res.status).toBe(400);
  });

  it("checkout.session.completed promove o usuário para pro (plan=pro, analysesLimit=100)", async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { metadata: { userId: USER_A_ID }, subscription: "sub_123" } },
    });
    const updateChain = chainable(undefined);
    dbMock.update.mockReturnValue(updateChain);

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const res = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "good-sig" },
        body: "{}",
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true });
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "pro", analysesLimit: 100 })
    );
  });
});
