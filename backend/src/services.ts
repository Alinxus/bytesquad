import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { AppBindings } from "./bindings";
import type {
  AsyncJob,
  AuthSession,
  AuthTokens,
  CustomerRecord,
  InvoiceRecord,
  KycDocumentRecord,
  ParsedWebhook,
  PayoutAccountRecord,
  ProviderName,
  ProviderVerificationResult,
  RegisterInput,
  SplitRuleRecord,
  WorkspaceRecord,
  WorkspaceMemberRecord,
} from "./domain";
import { providerMap } from "./providers";
import { createStore, type AppStore } from "./store";
import {
  searchTransactionWithInterswitch,
  verifyBankAccountWithInterswitch,
  verifyBvnWithInterswitch,
  verifyNinWithInterswitch,
} from "./interswitch-support";
import {
  getDefaultMethodsForCurrency,
  getSettlementCapability,
  pickProviderForCurrency,
  providerCapabilities,
  validateCollectionCorridor,
} from "./lib/corridors";
import {
  decryptValue,
  encryptValue,
  hashPassword,
  makeId,
  nowIso,
  sha256Hex,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyPassword,
  verifyRefreshToken,
} from "./lib/security";

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

interface ServiceOptions {
  store?: AppStore;
}

const requireValue = <T>(value: T | null | undefined, message: string, status = 400): T => {
  if (value === null || value === undefined) {
    throw new HttpError(status, message);
  }
  return value;
};

const buildCsv = (rows: string[][]) =>
  rows
    .map((row) =>
      row
        .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");

const sanitizeSession = (session: AuthSession) => ({
  user: {
    id: session.user.id,
    email: session.user.email,
    fullName: session.user.fullName,
    createdAt: session.user.createdAt,
    updatedAt: session.user.updatedAt,
  },
  workspace: session.workspace,
  kycProfile: session.kycProfile,
});

const parseYearMonth = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map(Number);
  if (!year || !month || month < 1 || month > 12) {
    throw new HttpError(400, "yearMonth must be in YYYY-MM format.");
  }
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

const normalizeAllowedMethods = (methods: string[]) =>
  methods.map((method) => method.toLowerCase().replaceAll(" ", "_"));

const selectProvider = (invoice: InvoiceRecord): ProviderName => {
  if (invoice.providerPreference) return invoice.providerPreference;
  return pickProviderForCurrency(invoice.currency);
};

const computeSplitPreview = (
  amountMinor: number,
  rules: SplitRuleRecord[],
  members: WorkspaceMemberRecord[],
) => {
  const workspaceMembers = members.filter((member) => member.role !== "OWNER");
  const allocations = rules.map((rule) => {
    const member = workspaceMembers.find((item) => item.id === rule.targetId);
    const allocatedMinor =
      rule.ruleType === "PERCENTAGE"
        ? Math.floor((amountMinor * rule.valueBps) / 10_000)
        : rule.valueBps;
    return {
      ruleId: rule.id,
      memberId: rule.targetId,
      memberEmail: member?.userId ?? null,
      allocatedMinor,
    };
  });
  const totalAllocated = allocations.reduce((sum, allocation) => sum + allocation.allocatedMinor, 0);
  return {
    allocations,
    ownerRemainderMinor: amountMinor - totalAllocated,
    totalAllocatedMinor: totalAllocated,
  };
};

const estimateSettlementQuote = (currency: string, amountMinor: number, provider: ProviderName) => {
  const fxRate =
    currency === "USD" ? 1550 :
    currency === "GBP" ? 1980 :
    currency === "EUR" ? 1680 :
    1;
  const providerFeeBps = provider === "FLUTTERWAVE" ? 350 : 250;
  const providerFeeMinor = Math.floor((amountMinor * providerFeeBps) / 10_000);
  const estimatedNetMinor = amountMinor - providerFeeMinor;
  return {
    provider,
    sourceCurrency: currency,
    sourceAmountMinor: amountMinor,
    providerFeeMinor,
    providerFeeBps,
    estimatedFxRate: fxRate,
    estimatedSettlementCurrency: "NGN",
    estimatedSettlementMinor: currency === "NGN" ? estimatedNetMinor : estimatedNetMinor * fxRate,
    estimatedArrival: provider === "INTERSWITCH" ? "same_day" : "same_day_to_t_plus_1",
    estimateOnly: true,
  };
};

const createTokens = async (
  bindings: AppBindings,
  store: AppStore,
  session: AuthSession,
): Promise<AuthTokens> => {
  const access = await signAccessToken(bindings, session.user.id, session.workspace.id);
  const refresh = await signRefreshToken(bindings, session.user.id, session.workspace.id);
  const refreshHash = await sha256Hex(refresh.token);
  await store.createRefreshToken(session.user.id, refreshHash, refresh.expiresAt);
  return {
    accessToken: access.token,
    refreshToken: refresh.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshTokenExpiresAt: refresh.expiresAt,
  };
};

const storeBlob = async (
  bucket: R2Bucket | undefined,
  key: string,
  bytes: Uint8Array,
  contentType: string,
) => {
  if (!bucket) return;
  await bucket.put(key, bytes, {
    httpMetadata: { contentType },
  });
};

export const createServices = (bindings: AppBindings, options?: ServiceOptions) => {
  let storeInstance: AppStore | null = options?.store ?? null;
  const getStore = () => (storeInstance ??= createStore(bindings));
  const store = new Proxy({} as AppStore, {
    get(_target, property) {
      const value = (getStore() as unknown as Record<string, unknown>)[property as string];
      return typeof value === "function" ? (value as Function).bind(getStore()) : value;
    },
  });

  const authenticate = async (token: string) => {
    try {
      const payload = await verifyAccessToken(bindings, token);
      const session = await store.getAuthSessionByUserId(String(payload.sub));
      if (!session) throw new HttpError(401, "Invalid access token.");
      return session;
    } catch {
      throw new HttpError(401, "Invalid access token.");
    }
  };

  const enqueueJob = async (job: AsyncJob) => {
    if (bindings.ASYNC_JOBS) {
      await bindings.ASYNC_JOBS.send(job);
      return;
    }
    await processAsyncJob(job);
  };

  const recordCollection = async (
    workspace: WorkspaceRecord,
    verification: ProviderVerificationResult,
    invoice: InvoiceRecord,
  ) => {
    await store.recordLedgerTransaction({
      workspaceId: workspace.id,
      transactionType: "COLLECTION",
      sourceType: "provider_transaction",
      sourceId: verification.providerReference,
      reference: invoice.invoiceNumber,
      grossAmountMinor: verification.sourceAmountMinor,
      grossCurrency: verification.sourceCurrency,
      providerFeeMinor: verification.providerFeeMinor,
      payoutFeeMinor: 0,
      netAmountMinor: verification.settledAmountMinor,
      netCurrency: verification.settledCurrency,
      metadata: {
        invoiceId: invoice.id,
        provider: verification.provider,
        paymentMethod: verification.paymentMethod,
      },
      postings: [
        {
          accountCode: "USER_PENDING",
          amountMinor: verification.settledAmountMinor,
          currency: verification.settledCurrency,
        },
        {
          accountCode: "EXTERNAL_CLEARING",
          amountMinor: -verification.settledAmountMinor,
          currency: verification.settledCurrency,
        },
      ],
    });
    await store.applyBalanceDelta(workspace.id, verification.settledCurrency, {
      pending: verification.settledAmountMinor,
    });
    await store.recordLedgerTransaction({
      workspaceId: workspace.id,
      transactionType: "AVAILABILITY",
      sourceType: "provider_transaction",
      sourceId: verification.providerReference,
      reference: invoice.invoiceNumber,
      grossAmountMinor: verification.settledAmountMinor,
      grossCurrency: verification.settledCurrency,
      providerFeeMinor: 0,
      payoutFeeMinor: 0,
      netAmountMinor: verification.settledAmountMinor,
      netCurrency: verification.settledCurrency,
      metadata: {
        invoiceId: invoice.id,
        event: "funds_available",
      },
      postings: [
        {
          accountCode: "USER_PENDING",
          amountMinor: -verification.settledAmountMinor,
          currency: verification.settledCurrency,
        },
        {
          accountCode: "USER_AVAILABLE",
          amountMinor: verification.settledAmountMinor,
          currency: verification.settledCurrency,
        },
      ],
    });
    await store.applyBalanceDelta(workspace.id, verification.settledCurrency, {
      pending: -verification.settledAmountMinor,
      available: verification.settledAmountMinor,
    });
  };

  const maybeCreateAutoSettlement = async (workspace: WorkspaceRecord, amountMinor: number, currency: string) => {
    if (!workspace.autoSettleEnabled || workspace.payoutMode !== "AUTO_SETTLE") return;
    const kyc = await store.getKycProfile(workspace.id);
    if (!kyc || kyc.status !== "APPROVED") return;
    const payoutAccount = await store.getDefaultPayoutAccount(workspace.id, currency);
    if (!payoutAccount || payoutAccount.countryCode !== "NG") return;
    const balances = await store.getBalances(workspace.id);
    const balance = balances.find((item) => item.currency === currency);
    if (!balance || balance.availableMinor < amountMinor) return;
    const withdrawal = await store.createWithdrawal({
      workspaceId: workspace.id,
      payoutAccountId: payoutAccount.id,
      provider: "INTERSWITCH",
      amountMinor,
      currency,
      feeMinor: 0,
      status: "PENDING",
      providerReference: null,
      failureReason: null,
    });
    await store.applyBalanceDelta(workspace.id, currency, { available: -amountMinor, reserved: amountMinor });
    await enqueueJob({ type: "EXECUTE_PAYOUT", withdrawalId: withdrawal.id });
  };

  const processPaymentSuccess = async (
    workspace: WorkspaceRecord,
    invoice: InvoiceRecord,
    verification: ProviderVerificationResult,
  ) => {
    await recordCollection(workspace, verification, invoice);
    await store.markInvoicePaid(invoice.id, nowIso());
    await maybeCreateAutoSettlement(workspace, verification.settledAmountMinor, verification.settledCurrency);
  };

  const processParsedWebhook = async (eventId: string, parsed: ParsedWebhook) => {
    const providerReference = requireValue(parsed.providerReference, "Webhook is missing provider reference.", 400);
    const checkoutSession = await store.getCheckoutSessionByProviderReference(providerReference);
    if (!checkoutSession) {
      await store.updateWebhookEvent(eventId, {
        processingStatus: "FAILED",
        errorMessage: "Checkout session not found.",
        processedAt: nowIso(),
      });
      throw new HttpError(404, "Checkout session not found.");
    }
    const existingProviderTransaction = await store.getProviderTransactionByReference(providerReference);
    if (existingProviderTransaction?.verifiedAt) {
      await store.updateWebhookEvent(eventId, {
        processingStatus: "DUPLICATE",
        processedAt: nowIso(),
      });
      return;
    }

    const invoice = requireValue(await store.getInvoiceBySystemId(checkoutSession.invoiceId), "Invoice not found.", 404);
    const workspace = requireValue(await store.getWorkspaceById(invoice.workspaceId), "Workspace not found.", 404);
    const verification = await providerMap[parsed.provider].verifyTransaction(bindings, providerReference);
    const verifiedAt = verification.isSuccessful ? nowIso() : null;
    await store.upsertProviderTransaction({
      workspaceId: workspace.id,
      invoiceId: invoice.id,
      checkoutSessionId: checkoutSession.id,
      provider: parsed.provider,
      providerReference,
      externalStatus: verification.externalStatus,
      eventType: verification.eventType,
      sourceAmountMinor: verification.sourceAmountMinor,
      sourceCurrency: verification.sourceCurrency,
      settledAmountMinor: verification.settledAmountMinor,
      settledCurrency: verification.settledCurrency,
      providerFeeMinor: verification.providerFeeMinor,
      providerFeeCurrency: verification.providerFeeCurrency,
      paymentMethod: verification.paymentMethod,
      payerEmail: verification.payerEmail,
      payerCountry: verification.payerCountry,
      verifiedAt,
      failureReason: verification.failureReason ?? null,
      rawData: verification.rawData,
    });

    if (!verification.isSuccessful) {
      await store.updateCheckoutSessionStatus(checkoutSession.id, "FAILED");
      await store.updateWebhookEvent(eventId, {
        processingStatus: "PROCESSED",
        processedAt: nowIso(),
      });
      return;
    }

    await store.updateCheckoutSessionStatus(checkoutSession.id, "PAID");
    await processPaymentSuccess(workspace, invoice, verification);
    await store.updateWebhookEvent(eventId, {
      processingStatus: "PROCESSED",
      processedAt: nowIso(),
    });
  };

  const executePayout = async (withdrawalId: string) => {
    const withdrawal = requireValue(await store.getWithdrawal(withdrawalId), "Withdrawal not found.", 404);
    if (withdrawal.status !== "PENDING") {
      return withdrawal;
    }
    const payoutAccount = requireValue(await store.getPayoutAccountById(withdrawal.payoutAccountId), "Payout account not found.", 404);
    const workspace = requireValue(await store.getWorkspaceById(withdrawal.workspaceId), "Workspace not found.", 404);
    const adapter = providerMap.INTERSWITCH;
    await store.updateWithdrawal(withdrawal.id, { status: "PROCESSING" });
    try {
      const decryptedAccountNumber = await decryptValue(bindings, payoutAccount.accountNumberEncrypted);
      const payoutResult = await adapter.createPayout(bindings, {
        withdrawalId: withdrawal.id,
        amountMinor: withdrawal.amountMinor,
        currency: withdrawal.currency,
        workspace,
        payoutAccount: {
          ...payoutAccount,
          accountNumberEncrypted: decryptedAccountNumber,
        },
      });
      await store.createPayoutTransfer({
        workspaceId: workspace.id,
        withdrawalId: withdrawal.id,
        provider: "INTERSWITCH",
        providerReference: payoutResult.providerReference,
        status: payoutResult.status,
        amountMinor: withdrawal.amountMinor,
        currency: withdrawal.currency,
        feeMinor: payoutResult.feeMinor,
        destinationCountryCode: payoutAccount.countryCode,
        rawData: payoutResult.rawData,
      });

      if (payoutResult.status === "COMPLETED") {
        await store.applyBalanceDelta(workspace.id, withdrawal.currency, {
          reserved: -withdrawal.amountMinor,
          available: -payoutResult.feeMinor,
        });
        await store.recordLedgerTransaction({
          workspaceId: workspace.id,
          transactionType: "PAYOUT",
          sourceType: "withdrawal",
          sourceId: withdrawal.id,
          reference: payoutResult.providerReference,
          grossAmountMinor: withdrawal.amountMinor,
          grossCurrency: withdrawal.currency,
          providerFeeMinor: 0,
          payoutFeeMinor: payoutResult.feeMinor,
          netAmountMinor: withdrawal.amountMinor - payoutResult.feeMinor,
          netCurrency: withdrawal.currency,
          metadata: {
            payoutAccountId: payoutAccount.id,
            provider: "INTERSWITCH",
          },
          postings: [
            {
              accountCode: "USER_RESERVED",
              amountMinor: -withdrawal.amountMinor,
              currency: withdrawal.currency,
            },
            {
              accountCode: "PAYOUT_CLEARING",
              amountMinor: withdrawal.amountMinor,
              currency: withdrawal.currency,
            },
          ],
        });
        return store.updateWithdrawal(withdrawal.id, {
          status: "COMPLETED",
          providerReference: payoutResult.providerReference,
          feeMinor: payoutResult.feeMinor,
          completedAt: nowIso(),
        });
      }

      return store.updateWithdrawal(withdrawal.id, {
        status: payoutResult.status,
        providerReference: payoutResult.providerReference,
        feeMinor: payoutResult.feeMinor,
      });
    } catch (error) {
      await store.applyBalanceDelta(workspace.id, withdrawal.currency, {
        reserved: -withdrawal.amountMinor,
        available: withdrawal.amountMinor,
      });
      await store.recordLedgerTransaction({
        workspaceId: workspace.id,
        transactionType: "REVERSAL",
        sourceType: "withdrawal",
        sourceId: withdrawal.id,
        reference: withdrawal.id,
        grossAmountMinor: withdrawal.amountMinor,
        grossCurrency: withdrawal.currency,
        providerFeeMinor: 0,
        payoutFeeMinor: 0,
        netAmountMinor: withdrawal.amountMinor,
        netCurrency: withdrawal.currency,
        metadata: {
          reason: error instanceof Error ? error.message : "Payout failed",
        },
        postings: [
          {
            accountCode: "USER_RESERVED",
            amountMinor: -withdrawal.amountMinor,
            currency: withdrawal.currency,
          },
          {
            accountCode: "USER_AVAILABLE",
            amountMinor: withdrawal.amountMinor,
            currency: withdrawal.currency,
          },
        ],
      });
      return store.updateWithdrawal(withdrawal.id, {
        status: "FAILED",
        failureReason: error instanceof Error ? error.message : "Payout failed",
      });
    }
  };

  const buildStatementPdf = async (workspace: WorkspaceRecord, yearMonth: string) => {
    const { startIso, endIso } = parseYearMonth(yearMonth);
    const items = await store.listLedgerTransactionsForMonth(workspace.id, startIso, endIso);
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    page.drawText(`Nera Statement - ${yearMonth}`, { x: 40, y: 800, size: 18, font: bold });
    page.drawText(workspace.businessName, { x: 40, y: 778, size: 11, font });
    page.drawText(`Generated: ${nowIso()}`, { x: 40, y: 762, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
    let y = 730;
    for (const item of items.slice(0, 28)) {
      const line = `${item.createdAt.slice(0, 10)}  ${item.transactionType}  ${item.reference}  ${item.netAmountMinor} ${item.netCurrency}`;
      page.drawText(line, { x: 40, y, size: 10, font });
      y -= 20;
    }
    const bytes = await pdf.save();
    const bucketKey = `statements/${workspace.id}/${yearMonth}.pdf`;
    await storeBlob(bindings.REPORTS_BUCKET, bucketKey, bytes, "application/pdf");
    await store.createOrUpdateReportExport(workspace.id, "STATEMENT_PDF", yearMonth, "COMPLETED", bucketKey);
    return new Uint8Array(bytes);
  };

  const buildTransactionsCsv = async (workspace: WorkspaceRecord, yearMonth: string) => {
    const { startIso, endIso } = parseYearMonth(yearMonth);
    const items = await store.listLedgerTransactionsForMonth(workspace.id, startIso, endIso);
    const csv = buildCsv([
      ["created_at", "transaction_type", "reference", "gross_amount_minor", "provider_fee_minor", "payout_fee_minor", "net_amount_minor", "currency"],
      ...items.map((item) => [
        item.createdAt,
        item.transactionType,
        item.reference,
        String(item.grossAmountMinor),
        String(item.providerFeeMinor),
        String(item.payoutFeeMinor),
        String(item.netAmountMinor),
        item.netCurrency,
      ]),
    ]);
    const bucketKey = `exports/${workspace.id}/${yearMonth}.csv`;
    await storeBlob(bindings.REPORTS_BUCKET, bucketKey, new TextEncoder().encode(csv), "text/csv");
    await store.createOrUpdateReportExport(workspace.id, "TRANSACTIONS_CSV", yearMonth, "COMPLETED", bucketKey);
    return csv;
  };

  const processAsyncJob = async (job: AsyncJob) => {
    if (job.type === "PROCESS_WEBHOOK") {
      const event = requireValue(await store.getWebhookEvent(job.webhookEventId), "Webhook event not found.", 404);
      const parsed: ParsedWebhook = {
        provider: event.provider,
        eventId: event.eventId,
        providerReference: event.providerReference,
        eventType: event.eventType,
        signatureValid: event.signatureValid,
        payload: JSON.parse(event.payload) as Record<string, unknown>,
      };
      await processParsedWebhook(event.id, parsed);
      return;
    }
    if (job.type === "EXECUTE_PAYOUT") {
      await executePayout(job.withdrawalId);
      return;
    }
    const workspace = requireValue(await store.getWorkspaceById(job.workspaceId), "Workspace not found.", 404);
    if (job.reportType === "STATEMENT_PDF") {
      await buildStatementPdf(workspace, job.yearMonth);
      return;
    }
    await buildTransactionsCsv(workspace, job.yearMonth);
  };

  return {
    store,
    authenticate,
    async register(input: RegisterInput) {
      const existing = await store.findUserByEmail(input.email);
      if (existing) throw new HttpError(409, "Email already registered.");
      const passwordHash = await hashPassword(input.password);
      const session = await store.createUserSession(input, passwordHash);
      const tokens = await createTokens(bindings, store, session);
      return { session: sanitizeSession(session), tokens };
    },
    async login(email: string, password: string) {
      const user = await store.findUserByEmail(email);
      if (!user) throw new HttpError(401, "Invalid email or password.");
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) throw new HttpError(401, "Invalid email or password.");
      const session = requireValue(await store.getAuthSessionByUserId(user.id), "Session not found.", 404);
      const tokens = await createTokens(bindings, store, session);
      return { session: sanitizeSession(session), tokens };
    },
    async refresh(refreshToken: string) {
      try {
        const payload = await verifyRefreshToken(bindings, refreshToken);
        const tokenHash = await sha256Hex(refreshToken);
        const tokenRecord = await store.findRefreshToken(tokenHash);
        if (!tokenRecord || tokenRecord.revokedAt || new Date(tokenRecord.expiresAt) < new Date()) {
          throw new HttpError(401, "Refresh token is invalid.");
        }
        await store.revokeRefreshToken(tokenRecord.id);
        const session = requireValue(await store.getAuthSessionByUserId(String(payload.sub)), "Session not found.", 404);
        const tokens = await createTokens(bindings, store, session);
        return { session: sanitizeSession(session), tokens };
      } catch {
        throw new HttpError(401, "Refresh token is invalid.");
      }
    },
    async getMe(session: AuthSession) {
      const payoutAccounts = await store.listPayoutAccounts(session.workspace.id);
      const balances = await store.getBalances(session.workspace.id);
      return {
        user: sanitizeSession(session).user,
        workspace: session.workspace,
        kycProfile: session.kycProfile,
        payoutAccounts,
        balances,
      };
    },
    async updateProfile(session: AuthSession, patch: Partial<Pick<WorkspaceRecord, "businessName" | "countryCode" | "baseCurrency">>) {
      return store.updateWorkspaceProfile(session.workspace.id, patch);
    },
    async updateSettlementPreferences(
      session: AuthSession,
      payoutMode: WorkspaceRecord["payoutMode"],
      autoSettleEnabled: boolean,
    ) {
      return store.updateSettlementPreferences(session.workspace.id, payoutMode, autoSettleEnabled);
    },
    async getKyc(session: AuthSession) {
      return {
        profile: await store.getKycProfile(session.workspace.id),
        documents: await store.listKycDocuments(session.workspace.id),
      };
    },
    async submitKycDocument(
      session: AuthSession,
      input: {
        documentType: string;
        fileName: string;
        contentType: string;
        contentBase64: string;
        legalName?: string;
        dateOfBirth?: string;
        addressLine1?: string;
        city?: string;
        region?: string;
        postalCode?: string;
        bvn?: string;
        nin?: string;
      },
    ) {
      let verification: Record<string, unknown> | null = null;
      if (input.bvn) {
        const bvnCheck = await verifyBvnWithInterswitch(bindings, {
          bvn: input.bvn,
        });
        verification = { verificationType: "BVN", ...bvnCheck };
      }
      if (input.nin) {
        const ninCheck = await verifyNinWithInterswitch(bindings, {
          nin: input.nin,
        });
        verification = { verificationType: "NIN", ...ninCheck };
      }
      const profile = await store.upsertKycProfile(session.workspace.id, {
        status: "UNDER_REVIEW",
        legalName: input.legalName,
        dateOfBirth: input.dateOfBirth,
        addressLine1: input.addressLine1,
        city: input.city,
        region: input.region,
        postalCode: input.postalCode,
      });
      const bucketKey = `kyc/${session.workspace.id}/${makeId("upload")}-${input.fileName}`;
      const bytes = Uint8Array.from(atob(input.contentBase64), (char) => char.charCodeAt(0));
      await storeBlob(bindings.DOCUMENTS_BUCKET, bucketKey, bytes, input.contentType);
      const document = await store.createKycDocument({
        workspaceId: session.workspace.id,
        kycProfileId: profile.id,
        documentType: input.documentType,
        fileName: input.fileName,
        contentType: input.contentType,
        bucketKey,
        status: "UNDER_REVIEW",
      });
      return { profile, document, verification };
    },
    async createPayoutAccount(
      session: AuthSession,
      input: {
        countryCode: string;
        currency: string;
        bankCode: string;
        bankName: string;
        accountName: string;
        accountNumber: string;
        isDefault?: boolean;
      },
    ) {
      const verification = await verifyBankAccountWithInterswitch(bindings, {
        bankCode: input.bankCode,
        accountNumber: input.accountNumber,
      });
      const verifiedAccountName =
        verification.supported && verification.accountName
          ? verification.accountName
          : input.accountName;
      const verifiedBankName =
        verification.supported && verification.bankName
          ? verification.bankName
          : input.bankName;
      const encrypted = await encryptValue(bindings, input.accountNumber);
      const payoutAccount = await store.createPayoutAccount({
        workspaceId: session.workspace.id,
        provider: "INTERSWITCH",
        countryCode: input.countryCode,
        currency: input.currency,
        bankCode: input.bankCode,
        bankName: verifiedBankName,
        accountName: verifiedAccountName,
        accountNumberLast4: input.accountNumber.slice(-4),
        accountNumberEncrypted: encrypted,
        isDefault: input.isDefault ?? true,
      });
      return {
        ...payoutAccount,
        verification,
      };
    },
    async listPayoutAccounts(session: AuthSession) {
      return store.listPayoutAccounts(session.workspace.id);
    },
    async createCustomer(session: AuthSession, input: Omit<CustomerRecord, "id" | "workspaceId" | "createdAt">) {
      return store.createCustomer({
        workspaceId: session.workspace.id,
        email: input.email,
        name: input.name,
        companyName: input.companyName ?? null,
        countryCode: input.countryCode ?? null,
        metadata: input.metadata ?? {},
      });
    },
    async listCustomers(session: AuthSession) {
      return store.listCustomers(session.workspace.id);
    },
    async createInvoice(
      session: AuthSession,
      input: {
        customerId?: string | null;
        currency: string;
        amountMinor: number;
        title: string;
        description?: string | null;
        dueDate?: string | null;
        allowedMethods?: string[];
        providerPreference?: ProviderName | null;
      },
    ) {
      if (input.customerId) {
        const customer = await store.getCustomer(input.customerId);
        if (!customer || customer.workspaceId !== session.workspace.id) {
          throw new HttpError(404, "Customer not found.");
        }
      }
      const invoiceNumber = `INV-${new Date().getUTCFullYear()}-${makeId("n").slice(-6).toUpperCase()}`;
      const allowedMethods = input.allowedMethods ?? getDefaultMethodsForCurrency(input.currency);
      const preferredProvider = input.providerPreference ?? pickProviderForCurrency(input.currency);
      const corridor = validateCollectionCorridor(preferredProvider, input.currency, allowedMethods);
      if (!corridor.ok) {
        throw new HttpError(400, corridor.reason, {
          provider: preferredProvider,
          currency: input.currency,
          supportedMethods: providerCapabilities[preferredProvider].paymentMethodsByCurrency[input.currency] ?? [],
        });
      }
      return store.createInvoice({
        workspaceId: session.workspace.id,
        customerId: input.customerId ?? null,
        invoiceNumber,
        status: "OPEN",
        currency: input.currency,
        amountMinor: input.amountMinor,
        title: input.title,
        description: input.description ?? null,
        dueDate: input.dueDate ?? null,
        allowedMethods,
        publicToken: makeId("pay"),
        providerPreference: preferredProvider,
      });
    },
    async listInvoices(session: AuthSession) {
      return store.listInvoices(session.workspace.id);
    },
    async getInvoice(session: AuthSession, invoiceId: string) {
      return requireValue(await store.getInvoiceById(session.workspace.id, invoiceId), "Invoice not found.", 404);
    },
    async getPublicInvoice(publicToken: string) {
      const invoice = requireValue(await store.getInvoiceByPublicToken(publicToken), "Invoice not found.", 404);
      const checkoutSession = await store.getLatestCheckoutSession(invoice.id);
      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        currency: invoice.currency,
        amountMinor: invoice.amountMinor,
        title: invoice.title,
        description: invoice.description,
        dueDate: invoice.dueDate,
        checkoutSession,
      };
    },
    async getCheckoutSessionByProviderReference(providerReference: string) {
      return requireValue(
        await store.getCheckoutSessionByProviderReference(providerReference),
        "Checkout session not found.",
        404,
      );
    },
    async getInterswitchRedirectPayload(providerReference: string) {
      const session = requireValue(
        await store.getCheckoutSessionByProviderReference(providerReference),
        "Checkout session not found.",
        404,
      );
      const invoice = requireValue(
        await store.getInvoiceBySystemId(session.invoiceId),
        "Invoice not found.",
        404,
      );
      return {
        session,
        invoice,
      };
    },
    async createCheckoutSession(session: AuthSession, invoiceId: string) {
      const invoice = requireValue(await store.getInvoiceById(session.workspace.id, invoiceId), "Invoice not found.", 404);
      const customer = invoice.customerId ? await store.getCustomer(invoice.customerId) : null;
      const providerName = selectProvider(invoice);
      const corridor = validateCollectionCorridor(providerName, invoice.currency, invoice.allowedMethods);
      if (!corridor.ok) {
        throw new HttpError(400, corridor.reason, {
          provider: providerName,
          currency: invoice.currency,
        });
      }
      const adapter = providerMap[providerName];
      const result = await adapter.createCheckoutSession(bindings, {
        invoice,
        workspace: session.workspace,
        customer,
        returnUrl: `${bindings.APP_URL}/public/pay/${invoice.publicToken}`,
      });
      const checkoutSession = await store.createCheckoutSession({
        invoiceId: invoice.id,
        provider: result.provider,
        providerReference: result.providerReference,
        checkoutUrl: result.checkoutUrl,
        status: "CREATED",
        amountMinor: invoice.amountMinor,
        currency: invoice.currency,
        expiresAt: result.expiresAt,
      });
      return checkoutSession;
    },
    async handleWebhook(provider: ProviderName, rawBody: string, headers: Headers) {
      const parsed = await providerMap[provider].parseWebhook(bindings, rawBody, headers);
      const event = await store.createWebhookEvent({
        provider,
        eventId: parsed.eventId,
        providerReference: parsed.providerReference,
        eventType: parsed.eventType,
        signatureValid: parsed.signatureValid,
        payload: rawBody,
        processingStatus: parsed.signatureValid ? "RECEIVED" : "FAILED",
        errorMessage: parsed.signatureValid ? null : "Invalid webhook signature.",
      });
      if (!parsed.signatureValid) {
        throw new HttpError(401, "Invalid webhook signature.");
      }
      await enqueueJob({ type: "PROCESS_WEBHOOK", webhookEventId: event.id });
      return event;
    },
    async processAsyncJob(job: AsyncJob) {
      await processAsyncJob(job);
    },
    async getBalances(session: AuthSession) {
      return store.getBalances(session.workspace.id);
    },
    async requestWithdrawal(
      session: AuthSession,
      input: { amountMinor: number; currency: string; payoutAccountId?: string },
    ) {
      const payoutAccount = input.payoutAccountId
        ? await store.getPayoutAccountById(input.payoutAccountId)
        : await store.getDefaultPayoutAccount(session.workspace.id, input.currency);
      if (!payoutAccount || payoutAccount.workspaceId !== session.workspace.id) {
        throw new HttpError(404, "Payout account not found.");
      }
      const balances = await store.getBalances(session.workspace.id);
      const balance = balances.find((item) => item.currency === input.currency);
      if (!balance || balance.availableMinor < input.amountMinor) {
        throw new HttpError(400, "Insufficient available balance.");
      }
      await store.applyBalanceDelta(session.workspace.id, input.currency, {
        available: -input.amountMinor,
        reserved: input.amountMinor,
      });
      const withdrawal = await store.createWithdrawal({
        workspaceId: session.workspace.id,
        payoutAccountId: payoutAccount.id,
        provider: "INTERSWITCH",
        amountMinor: input.amountMinor,
        currency: input.currency,
        feeMinor: 0,
        status: "PENDING",
        providerReference: null,
        failureReason: null,
      });
      await enqueueJob({ type: "EXECUTE_PAYOUT", withdrawalId: withdrawal.id });
      return withdrawal;
    },
    async getWithdrawal(session: AuthSession, withdrawalId: string) {
      const withdrawal = requireValue(await store.getWithdrawal(withdrawalId), "Withdrawal not found.", 404);
      if (withdrawal.workspaceId !== session.workspace.id) throw new HttpError(404, "Withdrawal not found.");
      return withdrawal;
    },
    async retryWithdrawal(session: AuthSession, withdrawalId: string) {
      const withdrawal = requireValue(await store.getWithdrawal(withdrawalId), "Withdrawal not found.", 404);
      if (withdrawal.workspaceId !== session.workspace.id) throw new HttpError(404, "Withdrawal not found.");
      if (!["FAILED", "PENDING"].includes(withdrawal.status)) {
        throw new HttpError(400, "Only failed or pending withdrawals can be retried.");
      }
      await store.updateWithdrawal(withdrawal.id, {
        status: "PENDING",
        failureReason: null,
      });
      await enqueueJob({ type: "EXECUTE_PAYOUT", withdrawalId: withdrawal.id });
      return store.getWithdrawal(withdrawal.id);
    },
    async generateStatement(session: AuthSession, yearMonth: string) {
      return buildStatementPdf(session.workspace, yearMonth);
    },
    async generateTransactionsCsv(session: AuthSession, yearMonth: string) {
      return buildTransactionsCsv(session.workspace, yearMonth);
    },
    async getTaxSummary(session: AuthSession, yearMonth: string) {
      const { startIso, endIso } = parseYearMonth(yearMonth);
      const items = await store.listLedgerTransactionsForMonth(session.workspace.id, startIso, endIso);
      const grossIncomeMinor = items
        .filter((item) => item.transactionType === "COLLECTION")
        .reduce((sum, item) => sum + item.grossAmountMinor, 0);
      const providerFeesMinor = items.reduce((sum, item) => sum + item.providerFeeMinor, 0);
      const payoutFeesMinor = items.reduce((sum, item) => sum + item.payoutFeeMinor, 0);
      return {
        yearMonth,
        workspaceId: session.workspace.id,
        currency: session.workspace.baseCurrency,
        grossIncomeMinor,
        providerFeesMinor,
        payoutFeesMinor,
        netIncomeMinor: grossIncomeMinor - providerFeesMinor - payoutFeesMinor,
        estimateOnly: true,
      };
    },
    async createWorkspaceMember(session: AuthSession, input: { userId: string; role: string }) {
      return store.createWorkspaceMember({
        workspaceId: session.workspace.id,
        userId: input.userId,
        role: input.role,
      });
    },
    async listWorkspaceMembers(session: AuthSession) {
      return store.listWorkspaceMembers(session.workspace.id);
    },
    async createSplitRule(
      session: AuthSession,
      input: { targetId: string; ruleType: string; valueBps: number; targetType?: string },
    ) {
      return store.createSplitRule({
        workspaceId: session.workspace.id,
        targetType: input.targetType ?? "WORKSPACE_MEMBER",
        targetId: input.targetId,
        ruleType: input.ruleType,
        valueBps: input.valueBps,
      });
    },
    async listSplitRules(session: AuthSession) {
      return store.listSplitRules(session.workspace.id);
    },
    async previewInvoiceSplit(session: AuthSession, invoiceId: string) {
      const invoice = requireValue(await store.getInvoiceById(session.workspace.id, invoiceId), "Invoice not found.", 404);
      const rules = await store.listSplitRules(session.workspace.id);
      const members = await store.listWorkspaceMembers(session.workspace.id);
      return {
        invoiceId: invoice.id,
        amountMinor: invoice.amountMinor,
        currency: invoice.currency,
        ...computeSplitPreview(invoice.amountMinor, rules, members),
      };
    },
    async getSettlementQuote(
      session: AuthSession,
      input: { sourceCurrency: string; amountMinor: number; preferredProvider?: ProviderName },
    ) {
      const provider =
        input.preferredProvider ??
        (input.sourceCurrency === "NGN" ? "INTERSWITCH" : "FLUTTERWAVE");
      const corridor = validateCollectionCorridor(provider, input.sourceCurrency, ["card"]);
      if (!corridor.ok) {
        throw new HttpError(400, corridor.reason);
      }
      return {
        workspaceId: session.workspace.id,
        ...estimateSettlementQuote(input.sourceCurrency, input.amountMinor, provider),
      };
    },
    async getCollectionCapabilities() {
      return {
        providers: providerCapabilities,
        settlement: getSettlementCapability(),
      };
    },
    async listOpsKycProfiles(status?: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED") {
      return store.listKycProfiles(status);
    },
    async reviewKycProfile(
      workspaceId: string,
      input: { status: "APPROVED" | "REJECTED"; rejectionReason?: string | null },
    ) {
      return store.upsertKycProfile(workspaceId, {
        status: input.status,
        reviewedAt: nowIso(),
        rejectionReason: input.status === "REJECTED" ? input.rejectionReason ?? "Rejected by operations" : null,
      });
    },
    async reconcileProviderReference(providerReference: string) {
      const providerTransaction = await store.getProviderTransactionByReference(providerReference);
      if (providerTransaction) return providerTransaction;
      const checkoutSession = await store.getCheckoutSessionByProviderReference(providerReference);
      if (!checkoutSession) {
        throw new HttpError(404, "Provider reference not found.");
      }
      if (checkoutSession.provider === "INTERSWITCH") {
        const transactionSearch = await searchTransactionWithInterswitch(bindings, {
          providerReference,
        });
        return {
          providerReference,
          provider: "INTERSWITCH",
          transactionSearch,
        };
      }
      const verification = await providerMap[checkoutSession.provider].verifyTransaction(bindings, providerReference);
      return {
        providerReference,
        provider: checkoutSession.provider,
        status: verification.externalStatus,
        isSuccessful: verification.isSuccessful,
        verification,
      };
    },
  };
};
