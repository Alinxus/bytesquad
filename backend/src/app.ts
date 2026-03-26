import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { AppEnv } from "./bindings";
import { buildOpenApiSpec } from "./lib/openapi";
import {
  applyRateLimit,
  getAllowedOrigins,
  getClientIp,
  isOriginAllowed,
  isSensitiveRoute,
  validateEnv,
} from "./lib/runtime";
import { createServices, HttpError } from "./services";

const authHeader = (header: string | undefined) => header?.replace(/^Bearer\s+/i, "") ?? "";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  businessName: z.string().min(2),
  countryCode: z.string().min(2).max(2),
  baseCurrency: z.string().min(3).max(3),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const profileSchema = z.object({
  businessName: z.string().min(2).optional(),
  countryCode: z.string().min(2).max(2).optional(),
  baseCurrency: z.string().min(3).max(3).optional(),
});

const settlementSchema = z.object({
  payoutMode: z.enum(["HOLD_BALANCE", "AUTO_SETTLE"]),
  autoSettleEnabled: z.boolean(),
});

const kycDocumentSchema = z.object({
  documentType: z.string().min(2),
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  contentBase64: z.string().min(8),
  legalName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  bvn: z.string().optional(),
  nin: z.string().optional(),
});

const payoutAccountSchema = z.object({
  countryCode: z.string().min(2).max(2),
  currency: z.string().min(3).max(3),
  bankCode: z.string().min(2),
  bankName: z.string().min(2),
  accountName: z.string().min(2),
  accountNumber: z.string().min(6),
  isDefault: z.boolean().optional(),
});

const customerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  companyName: z.string().optional().nullable(),
  countryCode: z.string().min(2).max(2).optional().nullable(),
  metadata: z.record(z.unknown()).optional(),
});

const invoiceSchema = z.object({
  customerId: z.string().optional().nullable(),
  currency: z.string().min(3).max(3),
  amountMinor: z.number().int().positive(),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  allowedMethods: z.array(z.string()).optional(),
  providerPreference: z.enum(["INTERSWITCH", "FLUTTERWAVE"]).optional().nullable(),
});

const withdrawalSchema = z.object({
  amountMinor: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  payoutAccountId: z.string().optional(),
});

const workspaceMemberSchema = z.object({
  userId: z.string().min(2),
  role: z.string().min(2),
});

const splitRuleSchema = z.object({
  targetId: z.string().min(2),
  targetType: z.string().optional(),
  ruleType: z.enum(["PERCENTAGE", "FIXED_MINOR"]),
  valueBps: z.number().int().positive(),
});

const fxQuoteSchema = z.object({
  sourceCurrency: z.string().min(3).max(3),
  amountMinor: z.number().int().positive(),
  preferredProvider: z.enum(["INTERSWITCH", "FLUTTERWAVE"]).optional(),
});

const opsReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional().nullable(),
});

export const createApp = (env: AppEnv["Bindings"], options?: Parameters<typeof createServices>[1]) => {
  const app = new Hono<AppEnv>();
  const services = createServices(env, options);
  const envStatus = validateEnv(env);
  const allowedOrigins = getAllowedOrigins(env);

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return "";
        return isOriginAllowed(env, origin) ? origin : "";
      },
      allowHeaders: ["authorization", "content-type", "x-request-id"],
      allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
      exposeHeaders: ["content-disposition", "x-ratelimit-remaining", "x-ratelimit-reset", "x-request-id"],
      maxAge: 86400,
      credentials: true,
    }),
  );

  app.use("*", async (c, next) => {
    c.set("requestId", crypto.randomUUID());
    c.header("x-request-id", c.get("requestId"));
    c.header("x-content-type-options", "nosniff");
    c.header("x-frame-options", "DENY");
    c.header("referrer-policy", "strict-origin-when-cross-origin");
    c.header("permissions-policy", "camera=(), microphone=(), geolocation=()");
    c.header("cross-origin-resource-policy", "same-site");
    c.header(
      "content-security-policy",
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
    );
    if (isSensitiveRoute(c.req.path)) {
      if (envStatus.mode === "live" && envStatus.missing.length > 0) {
        throw new HttpError(500, "Live provider mode is missing required configuration.", {
          missing: envStatus.missing,
        });
      }
      const clientIp = getClientIp(c.req.raw.headers);
      const limiter = applyRateLimit(env, `${clientIp}:${c.req.method}:${c.req.path}`);
      c.header("x-ratelimit-remaining", String(limiter.remaining));
      c.header("x-ratelimit-reset", new Date(limiter.resetAt).toISOString());
      if (limiter.limited) {
        throw new HttpError(429, "Rate limit exceeded.");
      }
    }
    await next();
  });

  app.use("*", async (c, next) => {
    const startedAt = Date.now();
    await next();
    console.log(
      JSON.stringify({
        requestId: c.get("requestId"),
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs: Date.now() - startedAt,
        originAllowed: allowedOrigins.length === 0 ? "none-configured" : c.req.header("origin") ?? "no-origin",
      }),
    );
  });

  app.onError((error, c) => {
    if (error instanceof HttpError) {
      return c.json(
        {
          error: error.message,
          details: error.details ?? null,
          requestId: c.get("requestId"),
        },
        error.status as 400,
      );
    }
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unexpected server error.",
        requestId: c.get("requestId"),
      },
      500,
    );
  });

  const requireAuth = async (c: Context<AppEnv>) => {
    const token = authHeader(c.req.header("authorization"));
    if (!token) throw new HttpError(401, "Authorization header is required.");
    const session = await services.authenticate(token);
    c.set("auth", session);
    return session;
  };

  const requireOps = (c: Context<AppEnv>) => {
    const key = c.req.header("x-ops-api-key");
    if (!env.OPS_API_KEY || key !== env.OPS_API_KEY) {
      throw new HttpError(401, "Invalid ops API key.");
    }
  };

  app.get("/health", (c) =>
    c.json({
      ok: true,
      requestId: c.get("requestId"),
      mode: envStatus.mode,
      liveReady: envStatus.missing.length === 0,
      missingConfig: envStatus.missing,
      allowedOrigins,
    }),
  );
  app.get("/openapi.json", (c) => c.json(buildOpenApiSpec(env.APP_URL)));

  app.post("/auth/register", zValidator("json", registerSchema), async (c) => {
    const { session, tokens } = await services.register(c.req.valid("json"));
    return c.json({ session, tokens }, 201);
  });

  app.post("/auth/login", zValidator("json", loginSchema), async (c) => {
    const { email, password } = c.req.valid("json");
    const result = await services.login(email, password);
    return c.json(result);
  });

  app.post("/auth/refresh", zValidator("json", refreshSchema), async (c) => {
    const { refreshToken } = c.req.valid("json");
    const result = await services.refresh(refreshToken);
    return c.json(result);
  });

  app.get("/auth/me", async (c) => c.json(await services.getMe(await requireAuth(c))));

  app.patch("/me/profile", zValidator("json", profileSchema), async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.updateProfile(session, c.req.valid("json")));
  });

  app.patch("/me/settlement-preferences", zValidator("json", settlementSchema), async (c) => {
    const session = await requireAuth(c);
    const body = c.req.valid("json");
    return c.json(await services.updateSettlementPreferences(session, body.payoutMode, body.autoSettleEnabled));
  });

  app.get("/me/kyc", async (c) => c.json(await services.getKyc(await requireAuth(c))));

  app.post("/me/kyc/documents", zValidator("json", kycDocumentSchema), async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.submitKycDocument(session, c.req.valid("json")), 201);
  });

  app.get("/me/payout-accounts", async (c) => c.json(await services.listPayoutAccounts(await requireAuth(c))));

  app.post("/me/payout-accounts", zValidator("json", payoutAccountSchema), async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.createPayoutAccount(session, c.req.valid("json")), 201);
  });

  app.get("/customers", async (c) => c.json(await services.listCustomers(await requireAuth(c))));

  app.post("/customers", zValidator("json", customerSchema), async (c) => {
    const session = await requireAuth(c);
    const body = c.req.valid("json");
    return c.json(
      await services.createCustomer(session, {
        email: body.email,
        name: body.name,
        companyName: body.companyName ?? null,
        countryCode: body.countryCode ?? null,
        metadata: body.metadata ?? {},
      }),
      201,
    );
  });

  app.get("/invoices", async (c) => c.json(await services.listInvoices(await requireAuth(c))));

  app.post("/invoices", zValidator("json", invoiceSchema), async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.createInvoice(session, c.req.valid("json")), 201);
  });

  app.get("/invoices/:invoiceId", async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.getInvoice(session, c.req.param("invoiceId")));
  });

  app.post("/invoices/:invoiceId/checkout-session", async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.createCheckoutSession(session, c.req.param("invoiceId")), 201);
  });

  app.get("/public/pay/:token", async (c) => c.json(await services.getPublicInvoice(c.req.param("token"))));

  app.get("/capabilities/collection", async (c) => c.json(await services.getCollectionCapabilities()));

  app.get("/balances", async (c) => c.json(await services.getBalances(await requireAuth(c))));

  app.post("/withdrawals", zValidator("json", withdrawalSchema), async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.requestWithdrawal(session, c.req.valid("json")), 201);
  });

  app.post("/withdrawals/:withdrawalId/retry", async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.retryWithdrawal(session, c.req.param("withdrawalId")));
  });

  app.get("/withdrawals/:withdrawalId", async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.getWithdrawal(session, c.req.param("withdrawalId")));
  });

  app.get("/reports/statements/:yearMonth", async (c) => {
    const session = await requireAuth(c);
    const bytes = await services.generateStatement(session, c.req.param("yearMonth"));
    c.header("content-type", "application/pdf");
    c.header("content-disposition", `attachment; filename="statement-${c.req.param("yearMonth")}.pdf"`);
    return c.body(bytes);
  });

  app.get("/reports/transactions.csv", async (c) => {
    const session = await requireAuth(c);
    const yearMonth = c.req.query("yearMonth");
    if (!yearMonth) throw new HttpError(400, "yearMonth query parameter is required.");
    const csv = await services.generateTransactionsCsv(session, yearMonth);
    c.header("content-type", "text/csv; charset=utf-8");
    c.header("content-disposition", `attachment; filename="transactions-${yearMonth}.csv"`);
    return c.body(csv);
  });

  app.get("/reports/tax-summary/:yearMonth", async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.getTaxSummary(session, c.req.param("yearMonth")));
  });

  app.get("/team/members", async (c) => c.json(await services.listWorkspaceMembers(await requireAuth(c))));

  app.post("/team/members", zValidator("json", workspaceMemberSchema), async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.createWorkspaceMember(session, c.req.valid("json")), 201);
  });

  app.get("/split-rules", async (c) => c.json(await services.listSplitRules(await requireAuth(c))));

  app.post("/split-rules", zValidator("json", splitRuleSchema), async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.createSplitRule(session, c.req.valid("json")), 201);
  });

  app.get("/invoices/:invoiceId/split-preview", async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.previewInvoiceSplit(session, c.req.param("invoiceId")));
  });

  app.post("/fx/quote", zValidator("json", fxQuoteSchema), async (c) => {
    const session = await requireAuth(c);
    return c.json(await services.getSettlementQuote(session, c.req.valid("json")));
  });

  app.post("/webhooks/interswitch", async (c) => {
    const rawBody = await c.req.text();
    await services.handleWebhook("INTERSWITCH", rawBody, c.req.raw.headers);
    return c.json({ received: true });
  });

  app.post("/webhooks/flutterwave", async (c) => {
    const rawBody = await c.req.text();
    await services.handleWebhook("FLUTTERWAVE", rawBody, c.req.raw.headers);
    return c.json({ received: true });
  });

  app.get("/mock/:provider/:reference", (c) =>
    c.json({
      provider: c.req.param("provider"),
      reference: c.req.param("reference"),
      mode: "mock",
    }),
  );

  app.get("/redirect/interswitch/:reference", async (c) => {
    const { session, invoice } = await services.getInterswitchRedirectPayload(c.req.param("reference"));
    const merchantCode = env.INTERSWITCH_MERCHANT_CODE;
    const payItemId = env.INTERSWITCH_PAY_ITEM_ID;
    if (!merchantCode || !payItemId) {
      throw new HttpError(500, "Interswitch checkout is missing merchant configuration.");
    }

    const redirectUrl = "https://newwebpay.qa.interswitchng.com/collections/w/pay";
    const formFields = {
      merchant_code: merchantCode,
      pay_item_id: payItemId,
      txn_ref: session.providerReference,
      amount: String(session.amountMinor),
      currency: session.currency,
      site_redirect_url: `${env.APP_URL}/public/pay/${invoice.publicToken}`,
      cust_name: "Nera Client",
      cust_id: session.providerReference,
    };
    const formHtml = Object.entries(formFields)
      .map(
        ([key, value]) =>
          `<input type="hidden" name="${key}" value="${String(value).replaceAll('"', "&quot;")}" />`,
      )
      .join("");

    return c.html(`<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Redirecting to Interswitch</title></head>
  <body>
    <form id="isw-form" method="post" action="${redirectUrl}">
      ${formHtml}
    </form>
    <script>document.getElementById('isw-form').submit();</script>
  </body>
</html>`);
  });

  app.get("/ops/kyc/profiles", async (c) => {
    requireOps(c);
    const status = c.req.query("status");
    return c.json(
      await services.listOpsKycProfiles(
        status && ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"].includes(status)
          ? (status as "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED")
          : undefined,
      ),
    );
  });

  app.patch("/ops/kyc/profiles/:workspaceId", zValidator("json", opsReviewSchema), async (c) => {
    requireOps(c);
    return c.json(await services.reviewKycProfile(c.req.param("workspaceId"), c.req.valid("json")));
  });

  app.post("/ops/reconcile/:providerReference", async (c) => {
    requireOps(c);
    return c.json(await services.reconcileProviderReference(c.req.param("providerReference")));
  });

  return app;
};
