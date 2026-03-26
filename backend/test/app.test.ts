import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { MemoryStore } from "../src/store";

class FakeBucket {
  objects = new Map<string, Uint8Array>();

  async put(key: string, value: ArrayBuffer | ArrayBufferView | string) {
    if (typeof value === "string") {
      this.objects.set(key, new TextEncoder().encode(value));
      return;
    }
    if (value instanceof ArrayBuffer) {
      this.objects.set(key, new Uint8Array(value));
      return;
    }
    this.objects.set(key, new Uint8Array(value.buffer.slice(0)));
  }
}

const createTestApp = () => {
  const store = new MemoryStore();
  const env = {
    APP_URL: "http://nera.test",
    PROVIDER_MODE: "mock",
    JWT_SECRET: "test-jwt-secret",
    REFRESH_TOKEN_SECRET: "test-refresh-secret",
    FLUTTERWAVE_WEBHOOK_SECRET: "test-flw-secret",
    DEFAULT_SETTLEMENT_CURRENCY: "NGN",
    DOCUMENTS_BUCKET: new FakeBucket() as unknown as R2Bucket,
    REPORTS_BUCKET: new FakeBucket() as unknown as R2Bucket,
  };
  const app = createApp(env, { store });
  return { app, store, env };
};

const register = async (app: ReturnType<typeof createApp>) => {
  const response = await app.request("http://nera.test/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "founder@nera.so",
      password: "password123",
      fullName: "Nera Founder",
      businessName: "Nera Studio",
      countryCode: "NG",
      baseCurrency: "NGN",
    }),
  });
  expect(response.status).toBe(201);
    const data = await response.json();
    return data as {
      session: {
        user: { id: string; email: string; fullName: string; passwordHash?: string };
        workspace: { id: string };
      };
      tokens: { accessToken: string; refreshToken: string };
    };
  };

describe("nera backend", () => {
  it("rejects sensitive requests when live mode is missing required secrets", async () => {
    const app = createApp({
      APP_URL: "http://nera.test",
      PROVIDER_MODE: "live",
    });
    const response = await app.request("http://nera.test/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "founder@nera.so",
        password: "password123",
        fullName: "Nera Founder",
        businessName: "Nera Studio",
        countryCode: "NG",
        baseCurrency: "NGN",
      }),
    });
    expect(response.status).toBe(500);
  });

  it("returns CORS headers only for allowed origins", async () => {
    const { store } = createTestApp();
    const app = createApp(
      {
        APP_URL: "http://nera.test",
        PROVIDER_MODE: "mock",
        JWT_SECRET: "test-jwt-secret",
        REFRESH_TOKEN_SECRET: "test-refresh-secret",
        FLUTTERWAVE_WEBHOOK_SECRET: "test-flw-secret",
        CORS_ALLOW_ORIGINS: "http://localhost:3000",
      },
      { store },
    );

    const allowed = await app.request("http://nera.test/health", {
      headers: { origin: "http://localhost:3000" },
    });
    expect(allowed.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");

    const denied = await app.request("http://nera.test/health", {
      headers: { origin: "http://evil.test" },
    });
    expect(denied.headers.get("access-control-allow-origin")).not.toBe("http://evil.test");
  });

  it("registers a user and exposes authenticated profile data", async () => {
    const { app } = createTestApp();
    const registration = await register(app);
    expect(registration.session.user.passwordHash).toBeUndefined();
    const meResponse = await app.request("http://nera.test/auth/me", {
      headers: {
        authorization: `Bearer ${registration.tokens.accessToken}`,
      },
    });
    expect(meResponse.status).toBe(200);
    const me = (await meResponse.json()) as {
      workspace: { businessName: string };
      kycProfile: { status: string };
    };
    expect(me.workspace.businessName).toBe("Nera Studio");
    expect(me.kycProfile.status).toBe("PENDING");
  });

  it("applies a basic rate limit to sensitive routes", async () => {
    const { store } = createTestApp();
    const env = {
      APP_URL: "http://nera.test",
      PROVIDER_MODE: "mock",
      JWT_SECRET: "test-jwt-secret",
      REFRESH_TOKEN_SECRET: "test-refresh-secret",
      FLUTTERWAVE_WEBHOOK_SECRET: "test-flw-secret",
      RATE_LIMIT_WINDOW_SECONDS: "60",
      RATE_LIMIT_MAX_REQUESTS: "1",
    };
    const app = createApp(env, { store });

    const first = await app.request("http://nera.test/health");
    expect(first.status).toBe(200);

    const second = await app.request("http://nera.test/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "10.0.0.1",
      },
      body: JSON.stringify({
        email: "first@nera.so",
        password: "password123",
        fullName: "Nera Founder",
        businessName: "Nera Studio",
        countryCode: "NG",
        baseCurrency: "NGN",
      }),
    });
    expect(second.status).toBe(201);

    const third = await app.request("http://nera.test/auth/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "10.0.0.1",
      },
      body: JSON.stringify({
        email: "second@nera.so",
        password: "password123",
        fullName: "Nera Founder 2",
        businessName: "Nera Studio 2",
        countryCode: "NG",
        baseCurrency: "NGN",
      }),
    });
    expect(third.status).toBe(429);
  });

  it("creates invoice checkout sessions with the expected providers", async () => {
    const { app } = createTestApp();
    const registration = await register(app);
    const token = registration.tokens.accessToken;

    const ngnInvoiceResponse = await app.request("http://nera.test/invoices", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        currency: "NGN",
        amountMinor: 100000,
        title: "Website redesign",
        allowedMethods: ["bank_transfer"],
      }),
    });
    const ngnInvoice = (await ngnInvoiceResponse.json()) as { id: string };
    const ngnCheckoutResponse = await app.request(`http://nera.test/invoices/${ngnInvoice.id}/checkout-session`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    const ngnCheckout = (await ngnCheckoutResponse.json()) as { provider: string };
    expect(ngnCheckout.provider).toBe("FLUTTERWAVE");

    const usdInvoiceResponse = await app.request("http://nera.test/invoices", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        currency: "USD",
        amountMinor: 250000,
        title: "Strategy sprint",
        allowedMethods: ["card"],
      }),
    });
    const usdInvoice = (await usdInvoiceResponse.json()) as { id: string };
    const usdCheckoutResponse = await app.request(`http://nera.test/invoices/${usdInvoice.id}/checkout-session`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    const usdCheckout = (await usdCheckoutResponse.json()) as { provider: string };
    expect(usdCheckout.provider).toBe("FLUTTERWAVE");
  });

  it("rejects unsupported provider corridors instead of pretending every flow is available", async () => {
    const { app } = createTestApp();
    const registration = await register(app);
    const token = registration.tokens.accessToken;

    const badInvoiceResponse = await app.request("http://nera.test/invoices", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        currency: "USD",
        amountMinor: 100000,
        title: "Unsupported transfer flow",
        providerPreference: "FLUTTERWAVE",
        allowedMethods: ["ussd"],
      }),
    });
    expect(badInvoiceResponse.status).toBe(400);

    const capabilitiesResponse = await app.request("http://nera.test/capabilities/collection");
    expect(capabilitiesResponse.status).toBe(200);
    const capabilities = (await capabilitiesResponse.json()) as {
      settlement: { countries: string[] };
      providers: {
        INTERSWITCH: { supportedCurrencies: string[] };
        FLUTTERWAVE: { supportedCurrencies: string[] };
      };
    };
    expect(capabilities.settlement.countries).toContain("NG");
    expect(capabilities.providers.INTERSWITCH.supportedCurrencies).toHaveLength(0);
    expect(capabilities.providers.FLUTTERWAVE.supportedCurrencies).toContain("NGN");
  });

  it("supports split previews, fx quotes, and tax summaries as backend-only workflows", async () => {
    const { app } = createTestApp();
    const registration = await register(app);
    const token = registration.tokens.accessToken;

    const memberResponse = await app.request("http://nera.test/team/members", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        userId: "designer@nera.so",
        role: "CONTRACTOR",
      }),
    });
    expect(memberResponse.status).toBe(201);
    const member = (await memberResponse.json()) as { id: string };

    const splitRuleResponse = await app.request("http://nera.test/split-rules", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        targetId: member.id,
        ruleType: "PERCENTAGE",
        valueBps: 2000,
      }),
    });
    expect(splitRuleResponse.status).toBe(201);

    const invoiceResponse = await app.request("http://nera.test/invoices", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        currency: "USD",
        amountMinor: 100000,
        title: "Growth sprint",
      }),
    });
    const invoice = (await invoiceResponse.json()) as { id: string };

    const splitPreviewResponse = await app.request(`http://nera.test/invoices/${invoice.id}/split-preview`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(splitPreviewResponse.status).toBe(200);
    const splitPreview = (await splitPreviewResponse.json()) as { totalAllocatedMinor: number; ownerRemainderMinor: number };
    expect(splitPreview.totalAllocatedMinor).toBe(20000);
    expect(splitPreview.ownerRemainderMinor).toBe(80000);

    const quoteResponse = await app.request("http://nera.test/fx/quote", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sourceCurrency: "USD",
        amountMinor: 100000,
      }),
    });
    expect(quoteResponse.status).toBe(200);
    const quote = (await quoteResponse.json()) as { estimatedSettlementCurrency: string; estimateOnly: boolean };
    expect(quote.estimatedSettlementCurrency).toBe("NGN");
    expect(quote.estimateOnly).toBe(true);

    const month = new Date().toISOString().slice(0, 7);
    const taxResponse = await app.request(`http://nera.test/reports/tax-summary/${month}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(taxResponse.status).toBe(200);
    const taxSummary = (await taxResponse.json()) as { estimateOnly: boolean };
    expect(taxSummary.estimateOnly).toBe(true);
  });

  it("verifies webhooks, avoids duplicate credits, and generates reports", async () => {
    const { app, env } = createTestApp();
    const registration = await register(app);
    const token = registration.tokens.accessToken;

    const invoiceResponse = await app.request("http://nera.test/invoices", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        currency: "USD",
        amountMinor: 250000,
        title: "Global design retainer",
        allowedMethods: ["card"],
      }),
    });
    const invoice = (await invoiceResponse.json()) as { id: string };
    const checkoutResponse = await app.request(`http://nera.test/invoices/${invoice.id}/checkout-session`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    const checkout = (await checkoutResponse.json()) as { providerReference: string };

    const invalidWebhook = await app.request("http://nera.test/webhooks/flutterwave", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "verif-hash": "wrong-secret",
      },
      body: JSON.stringify({
        event: "charge.completed",
        data: { tx_ref: checkout.providerReference },
      }),
    });
    expect(invalidWebhook.status).toBe(401);

    const validWebhookPayload = JSON.stringify({
      event: "charge.completed",
      data: {
        id: "evt_123",
        tx_ref: checkout.providerReference,
      },
    });

    const validWebhook = await app.request("http://nera.test/webhooks/flutterwave", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "verif-hash": env.FLUTTERWAVE_WEBHOOK_SECRET,
      },
      body: validWebhookPayload,
    });
    expect(validWebhook.status).toBe(200);

    const duplicateWebhook = await app.request("http://nera.test/webhooks/flutterwave", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "verif-hash": env.FLUTTERWAVE_WEBHOOK_SECRET,
      },
      body: validWebhookPayload,
    });
    expect(duplicateWebhook.status).toBe(200);

    const balancesResponse = await app.request("http://nera.test/balances", {
      headers: { authorization: `Bearer ${token}` },
    });
    const balances = (await balancesResponse.json()) as Array<{ currency: string; availableMinor: number }>;
    const ngnBalance = balances.find((item) => item.currency === "NGN");
    expect(ngnBalance?.availableMinor).toBe(245000);

    const yearMonth = new Date().toISOString().slice(0, 7);
    const csvResponse = await app.request(`http://nera.test/reports/transactions.csv?yearMonth=${yearMonth}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(csvResponse.status).toBe(200);
    const csv = await csvResponse.text();
    expect(csv).toContain("AVAILABILITY");

    const pdfResponse = await app.request(`http://nera.test/reports/statements/${yearMonth}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(pdfResponse.status).toBe(200);
    expect(pdfResponse.headers.get("content-type")).toContain("application/pdf");
  });
});
