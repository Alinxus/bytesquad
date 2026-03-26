import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import type { AppBindings } from "./bindings";
import type {
  AuthSession,
  BalanceRecord,
  CheckoutSessionRecord,
  CustomerRecord,
  InvoiceRecord,
  KycDocumentRecord,
  KycProfileRecord,
  LedgerTransactionInput,
  LedgerTransactionRecord,
  PayoutAccountRecord,
  PayoutTransferRecord,
  ProviderTransactionRecord,
  RefreshTokenRecord,
  RegisterInput,
  ReportExportRecord,
  ReportStatus,
  ReportType,
  SplitRuleRecord,
  UserRecord,
  WebhookEventRecord,
  WorkspaceRecord,
  WorkspaceMemberRecord,
  WithdrawalRecord,
} from "./domain";
import * as schema from "./lib/schema";
import { makeId, nowIso, slugify } from "./lib/security";

type WorkspaceProfileUpdate = Partial<Pick<WorkspaceRecord, "businessName" | "countryCode" | "baseCurrency">>;
type KycProfileUpdate = Partial<
  Pick<
    KycProfileRecord,
    "status" | "legalName" | "countryCode" | "dateOfBirth" | "addressLine1" | "city" | "region" | "postalCode" | "reviewedAt" | "rejectionReason"
  >
>;

export interface AppStore {
  findUserByEmail(email: string): Promise<UserRecord | null>;
  getWorkspaceById(workspaceId: string): Promise<WorkspaceRecord | null>;
  getAuthSessionByUserId(userId: string): Promise<AuthSession | null>;
  createUserSession(input: RegisterInput, passwordHash: string): Promise<AuthSession>;
  createRefreshToken(userId: string, tokenHash: string, expiresAt: string): Promise<RefreshTokenRecord>;
  findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(id: string): Promise<void>;
  updateWorkspaceProfile(workspaceId: string, patch: WorkspaceProfileUpdate): Promise<WorkspaceRecord>;
  updateSettlementPreferences(
    workspaceId: string,
    payoutMode: WorkspaceRecord["payoutMode"],
    autoSettleEnabled: boolean,
  ): Promise<WorkspaceRecord>;
  getKycProfile(workspaceId: string): Promise<KycProfileRecord | null>;
  listKycProfiles(status?: KycProfileRecord["status"]): Promise<KycProfileRecord[]>;
  upsertKycProfile(workspaceId: string, patch: KycProfileUpdate): Promise<KycProfileRecord>;
  listKycDocuments(workspaceId: string): Promise<KycDocumentRecord[]>;
  createKycDocument(input: Omit<KycDocumentRecord, "id" | "createdAt">): Promise<KycDocumentRecord>;
  createPayoutAccount(input: Omit<PayoutAccountRecord, "id" | "createdAt">): Promise<PayoutAccountRecord>;
  listPayoutAccounts(workspaceId: string): Promise<PayoutAccountRecord[]>;
  getPayoutAccountById(id: string): Promise<PayoutAccountRecord | null>;
  getDefaultPayoutAccount(workspaceId: string, currency?: string): Promise<PayoutAccountRecord | null>;
  createCustomer(input: Omit<CustomerRecord, "id" | "createdAt">): Promise<CustomerRecord>;
  getCustomer(customerId: string): Promise<CustomerRecord | null>;
  listCustomers(workspaceId: string): Promise<CustomerRecord[]>;
  createInvoice(input: Omit<InvoiceRecord, "id" | "createdAt" | "updatedAt" | "paidAt">): Promise<InvoiceRecord>;
  listInvoices(workspaceId: string): Promise<InvoiceRecord[]>;
  getInvoiceBySystemId(invoiceId: string): Promise<InvoiceRecord | null>;
  getInvoiceById(workspaceId: string, invoiceId: string): Promise<InvoiceRecord | null>;
  getInvoiceByPublicToken(publicToken: string): Promise<InvoiceRecord | null>;
  markInvoicePaid(invoiceId: string, paidAt: string): Promise<InvoiceRecord>;
  createCheckoutSession(
    input: Omit<CheckoutSessionRecord, "id" | "createdAt" | "updatedAt">,
  ): Promise<CheckoutSessionRecord>;
  getLatestCheckoutSession(invoiceId: string): Promise<CheckoutSessionRecord | null>;
  getCheckoutSessionByProviderReference(providerReference: string): Promise<CheckoutSessionRecord | null>;
  updateCheckoutSessionStatus(id: string, status: CheckoutSessionRecord["status"]): Promise<CheckoutSessionRecord>;
  upsertProviderTransaction(
    input: Omit<ProviderTransactionRecord, "id" | "createdAt" | "updatedAt">,
  ): Promise<ProviderTransactionRecord>;
  getProviderTransactionByReference(providerReference: string): Promise<ProviderTransactionRecord | null>;
  createWebhookEvent(
    input: Omit<WebhookEventRecord, "id" | "createdAt" | "processedAt">,
  ): Promise<WebhookEventRecord>;
  getWebhookEvent(id: string): Promise<WebhookEventRecord | null>;
  updateWebhookEvent(
    id: string,
    patch: Partial<Pick<WebhookEventRecord, "processingStatus" | "errorMessage" | "processedAt">>,
  ): Promise<WebhookEventRecord>;
  recordLedgerTransaction(input: LedgerTransactionInput): Promise<LedgerTransactionRecord>;
  applyBalanceDelta(
    workspaceId: string,
    currency: string,
    delta: { pending?: number; available?: number; reserved?: number },
  ): Promise<BalanceRecord>;
  getBalances(workspaceId: string): Promise<BalanceRecord[]>;
  createWithdrawal(input: Omit<WithdrawalRecord, "id" | "createdAt" | "updatedAt" | "completedAt">): Promise<WithdrawalRecord>;
  getWithdrawal(id: string): Promise<WithdrawalRecord | null>;
  updateWithdrawal(
    id: string,
    patch: Partial<Pick<WithdrawalRecord, "status" | "providerReference" | "failureReason" | "feeMinor" | "completedAt">>,
  ): Promise<WithdrawalRecord>;
  createPayoutTransfer(input: Omit<PayoutTransferRecord, "id" | "createdAt" | "updatedAt">): Promise<PayoutTransferRecord>;
  createOrUpdateReportExport(
    workspaceId: string,
    type: ReportType,
    periodKey: string,
    status: ReportStatus,
    bucketKey: string | null,
  ): Promise<ReportExportRecord>;
  listLedgerTransactionsForMonth(workspaceId: string, startIso: string, endIso: string): Promise<LedgerTransactionRecord[]>;
  listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberRecord[]>;
  createWorkspaceMember(input: Omit<WorkspaceMemberRecord, "id" | "createdAt">): Promise<WorkspaceMemberRecord>;
  listSplitRules(workspaceId: string): Promise<SplitRuleRecord[]>;
  createSplitRule(input: Omit<SplitRuleRecord, "id" | "createdAt">): Promise<SplitRuleRecord>;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const createDefaultKyc = (workspaceId: string, countryCode: string): KycProfileRecord => {
  const timestamp = nowIso();
  return {
    id: makeId("kyc"),
    workspaceId,
    status: "PENDING",
    legalName: null,
    countryCode,
    dateOfBirth: null,
    addressLine1: null,
    city: null,
    region: null,
    postalCode: null,
    reviewedAt: null,
    rejectionReason: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
};

export class MemoryStore implements AppStore {
  private users = new Map<string, UserRecord>();
  private workspaces = new Map<string, WorkspaceRecord>();
  private refreshTokens = new Map<string, RefreshTokenRecord>();
  private kycProfiles = new Map<string, KycProfileRecord>();
  private kycDocuments = new Map<string, KycDocumentRecord>();
  private payoutAccounts = new Map<string, PayoutAccountRecord>();
  private customers = new Map<string, CustomerRecord>();
  private invoices = new Map<string, InvoiceRecord>();
  private checkoutSessions = new Map<string, CheckoutSessionRecord>();
  private providerTransactions = new Map<string, ProviderTransactionRecord>();
  private webhookEvents = new Map<string, WebhookEventRecord>();
  private ledgerTransactions = new Map<string, LedgerTransactionRecord>();
  private balances = new Map<string, BalanceRecord>();
  private withdrawals = new Map<string, WithdrawalRecord>();
  private payoutTransfers = new Map<string, PayoutTransferRecord>();
  private reportExports = new Map<string, ReportExportRecord>();
  private workspaceMembers = new Map<string, WorkspaceMemberRecord>();
  private splitRules = new Map<string, SplitRuleRecord>();

  async findUserByEmail(email: string) {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async getWorkspaceById(workspaceId: string) {
    return clone(this.workspaces.get(workspaceId) ?? null);
  }

  async getAuthSessionByUserId(userId: string) {
    const user = this.users.get(userId);
    if (!user) return null;
    const workspace = [...this.workspaces.values()].find((item) => item.ownerUserId === userId) ?? null;
    if (!workspace) return null;
    return {
      user: clone(user),
      workspace: clone(workspace),
      kycProfile: clone(this.kycProfiles.get(workspace.id) ?? null),
    };
  }

  async createUserSession(input: RegisterInput, passwordHash: string) {
    const timestamp = nowIso();
    const user: UserRecord = {
      id: makeId("usr"),
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const workspaceId = makeId("wrk");
    const workspace: WorkspaceRecord = {
      id: workspaceId,
      ownerUserId: user.id,
      slug: slugify(input.businessName || input.fullName),
      businessName: input.businessName,
      countryCode: input.countryCode,
      baseCurrency: input.baseCurrency,
      payoutMode: "HOLD_BALANCE",
      autoSettleEnabled: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const kyc = createDefaultKyc(workspaceId, input.countryCode);
    this.users.set(user.id, user);
    this.workspaces.set(workspace.id, workspace);
    this.kycProfiles.set(workspace.id, kyc);
    return { user: clone(user), workspace: clone(workspace), kycProfile: clone(kyc) };
  }

  async createRefreshToken(userId: string, tokenHash: string, expiresAt: string) {
    const token: RefreshTokenRecord = {
      id: makeId("rt"),
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: nowIso(),
    };
    this.refreshTokens.set(token.id, token);
    return clone(token);
  }

  async findRefreshToken(tokenHash: string) {
    return [...this.refreshTokens.values()].find((token) => token.tokenHash === tokenHash) ?? null;
  }

  async revokeRefreshToken(id: string) {
    const token = this.refreshTokens.get(id);
    if (token) {
      token.revokedAt = nowIso();
      this.refreshTokens.set(id, token);
    }
  }

  async updateWorkspaceProfile(workspaceId: string, patch: WorkspaceProfileUpdate) {
    const workspace = this.requireWorkspace(workspaceId);
    const next: WorkspaceRecord = { ...workspace, ...patch, updatedAt: nowIso() };
    this.workspaces.set(workspaceId, next);
    return clone(next);
  }

  async updateSettlementPreferences(workspaceId: string, payoutMode: WorkspaceRecord["payoutMode"], autoSettleEnabled: boolean) {
    const workspace = this.requireWorkspace(workspaceId);
    const next: WorkspaceRecord = { ...workspace, payoutMode, autoSettleEnabled, updatedAt: nowIso() };
    this.workspaces.set(workspaceId, next);
    return clone(next);
  }

  async getKycProfile(workspaceId: string) {
    return clone(this.kycProfiles.get(workspaceId) ?? null);
  }

  async listKycProfiles(status?: KycProfileRecord["status"]) {
    return [...this.kycProfiles.values()]
      .filter((item) => (status ? item.status === status : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(clone);
  }

  async upsertKycProfile(workspaceId: string, patch: KycProfileUpdate) {
    const current = this.kycProfiles.get(workspaceId) ?? createDefaultKyc(workspaceId, patch.countryCode ?? "NG");
    const next: KycProfileRecord = { ...current, ...patch, updatedAt: nowIso() };
    this.kycProfiles.set(workspaceId, next);
    return clone(next);
  }

  async listKycDocuments(workspaceId: string) {
    return [...this.kycDocuments.values()].filter((item) => item.workspaceId === workspaceId).map(clone);
  }

  async createKycDocument(input: Omit<KycDocumentRecord, "id" | "createdAt">) {
    const record: KycDocumentRecord = { id: makeId("doc"), createdAt: nowIso(), ...input };
    this.kycDocuments.set(record.id, record);
    return clone(record);
  }

  async createPayoutAccount(input: Omit<PayoutAccountRecord, "id" | "createdAt">) {
    const record: PayoutAccountRecord = { id: makeId("pacc"), createdAt: nowIso(), ...input };
    if (record.isDefault) {
      for (const account of this.payoutAccounts.values()) {
        if (account.workspaceId === input.workspaceId) account.isDefault = false;
      }
    }
    this.payoutAccounts.set(record.id, record);
    return clone(record);
  }

  async listPayoutAccounts(workspaceId: string) {
    return [...this.payoutAccounts.values()].filter((item) => item.workspaceId === workspaceId).map(clone);
  }

  async getPayoutAccountById(id: string) {
    return clone(this.payoutAccounts.get(id) ?? null);
  }

  async getDefaultPayoutAccount(workspaceId: string, currency?: string) {
    return (
      [...this.payoutAccounts.values()].find(
        (item) =>
          item.workspaceId === workspaceId &&
          item.isDefault &&
          (currency ? item.currency === currency : true),
      ) ?? null
    );
  }

  async createCustomer(input: Omit<CustomerRecord, "id" | "createdAt">) {
    const record: CustomerRecord = { id: makeId("cus"), createdAt: nowIso(), ...input };
    this.customers.set(record.id, record);
    return clone(record);
  }

  async getCustomer(customerId: string) {
    return clone(this.customers.get(customerId) ?? null);
  }

  async listCustomers(workspaceId: string) {
    return [...this.customers.values()].filter((item) => item.workspaceId === workspaceId).map(clone);
  }

  async createInvoice(input: Omit<InvoiceRecord, "id" | "createdAt" | "updatedAt" | "paidAt">) {
    const timestamp = nowIso();
    const record: InvoiceRecord = {
      id: makeId("inv"),
      paidAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...input,
    };
    this.invoices.set(record.id, record);
    return clone(record);
  }

  async listInvoices(workspaceId: string) {
    return [...this.invoices.values()]
      .filter((item) => item.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(clone);
  }

  async getInvoiceBySystemId(invoiceId: string) {
    return clone(this.invoices.get(invoiceId) ?? null);
  }

  async getInvoiceById(workspaceId: string, invoiceId: string) {
    const invoice = this.invoices.get(invoiceId);
    return invoice && invoice.workspaceId === workspaceId ? clone(invoice) : null;
  }

  async getInvoiceByPublicToken(publicToken: string) {
    return [...this.invoices.values()].find((item) => item.publicToken === publicToken) ?? null;
  }

  async markInvoicePaid(invoiceId: string, paidAt: string) {
    const invoice = this.requireInvoice(invoiceId);
    const next: InvoiceRecord = { ...invoice, status: "PAID", paidAt, updatedAt: nowIso() };
    this.invoices.set(invoiceId, next);
    return clone(next);
  }

  async createCheckoutSession(input: Omit<CheckoutSessionRecord, "id" | "createdAt" | "updatedAt">) {
    const timestamp = nowIso();
    const record: CheckoutSessionRecord = { id: makeId("chk"), createdAt: timestamp, updatedAt: timestamp, ...input };
    this.checkoutSessions.set(record.id, record);
    return clone(record);
  }

  async getLatestCheckoutSession(invoiceId: string) {
    return (
      [...this.checkoutSessions.values()]
        .filter((item) => item.invoiceId === invoiceId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
    );
  }

  async getCheckoutSessionByProviderReference(providerReference: string) {
    return [...this.checkoutSessions.values()].find((item) => item.providerReference === providerReference) ?? null;
  }

  async updateCheckoutSessionStatus(id: string, status: CheckoutSessionRecord["status"]) {
    const session = this.checkoutSessions.get(id);
    if (!session) throw new Error("Checkout session not found.");
    const next = { ...session, status, updatedAt: nowIso() };
    this.checkoutSessions.set(id, next);
    return clone(next);
  }

  async upsertProviderTransaction(input: Omit<ProviderTransactionRecord, "id" | "createdAt" | "updatedAt">) {
    const existing = [...this.providerTransactions.values()].find(
      (item) => item.providerReference === input.providerReference,
    );
    const timestamp = nowIso();
    const record: ProviderTransactionRecord = existing
      ? { ...existing, ...input, updatedAt: timestamp }
      : { id: makeId("ptx"), createdAt: timestamp, updatedAt: timestamp, ...input };
    this.providerTransactions.set(record.id, record);
    return clone(record);
  }

  async getProviderTransactionByReference(providerReference: string) {
    return [...this.providerTransactions.values()].find((item) => item.providerReference === providerReference) ?? null;
  }

  async createWebhookEvent(input: Omit<WebhookEventRecord, "id" | "createdAt" | "processedAt">) {
    const record: WebhookEventRecord = {
      id: makeId("wh"),
      createdAt: nowIso(),
      processedAt: null,
      ...input,
    };
    this.webhookEvents.set(record.id, record);
    return clone(record);
  }

  async getWebhookEvent(id: string) {
    return clone(this.webhookEvents.get(id) ?? null);
  }

  async updateWebhookEvent(id: string, patch: Partial<Pick<WebhookEventRecord, "processingStatus" | "errorMessage" | "processedAt">>) {
    const event = this.webhookEvents.get(id);
    if (!event) throw new Error("Webhook event not found.");
    const next = { ...event, ...patch };
    this.webhookEvents.set(id, next);
    return clone(next);
  }

  async recordLedgerTransaction(input: LedgerTransactionInput) {
    const record: LedgerTransactionRecord = {
      id: makeId("ldg"),
      workspaceId: input.workspaceId,
      transactionType: input.transactionType,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      reference: input.reference,
      grossAmountMinor: input.grossAmountMinor,
      grossCurrency: input.grossCurrency,
      providerFeeMinor: input.providerFeeMinor,
      payoutFeeMinor: input.payoutFeeMinor,
      netAmountMinor: input.netAmountMinor,
      netCurrency: input.netCurrency,
      metadata: input.metadata,
      createdAt: nowIso(),
    };
    this.ledgerTransactions.set(record.id, record);
    return clone(record);
  }

  async applyBalanceDelta(workspaceId: string, currency: string, delta: { pending?: number; available?: number; reserved?: number }) {
    const key = `${workspaceId}:${currency}`;
    const current =
      this.balances.get(key) ??
      ({
        id: makeId("bal"),
        workspaceId,
        currency,
        pendingMinor: 0,
        availableMinor: 0,
        reservedMinor: 0,
        updatedAt: nowIso(),
      } satisfies BalanceRecord);
    const next: BalanceRecord = {
      ...current,
      pendingMinor: current.pendingMinor + (delta.pending ?? 0),
      availableMinor: current.availableMinor + (delta.available ?? 0),
      reservedMinor: current.reservedMinor + (delta.reserved ?? 0),
      updatedAt: nowIso(),
    };
    this.balances.set(key, next);
    return clone(next);
  }

  async getBalances(workspaceId: string) {
    return [...this.balances.values()].filter((item) => item.workspaceId === workspaceId).map(clone);
  }

  async createWithdrawal(input: Omit<WithdrawalRecord, "id" | "createdAt" | "updatedAt" | "completedAt">) {
    const timestamp = nowIso();
    const record: WithdrawalRecord = {
      id: makeId("wd"),
      createdAt: timestamp,
      updatedAt: timestamp,
      completedAt: null,
      ...input,
    };
    this.withdrawals.set(record.id, record);
    return clone(record);
  }

  async getWithdrawal(id: string) {
    return clone(this.withdrawals.get(id) ?? null);
  }

  async updateWithdrawal(id: string, patch: Partial<Pick<WithdrawalRecord, "status" | "providerReference" | "failureReason" | "feeMinor" | "completedAt">>) {
    const record = this.withdrawals.get(id);
    if (!record) throw new Error("Withdrawal not found.");
    const next = { ...record, ...patch, updatedAt: nowIso() };
    this.withdrawals.set(id, next);
    return clone(next);
  }

  async createPayoutTransfer(input: Omit<PayoutTransferRecord, "id" | "createdAt" | "updatedAt">) {
    const timestamp = nowIso();
    const record: PayoutTransferRecord = { id: makeId("ptr"), createdAt: timestamp, updatedAt: timestamp, ...input };
    this.payoutTransfers.set(record.id, record);
    return clone(record);
  }

  async createOrUpdateReportExport(workspaceId: string, type: ReportType, periodKey: string, status: ReportStatus, bucketKey: string | null) {
    const existing = [...this.reportExports.values()].find(
      (item) => item.workspaceId === workspaceId && item.type === type && item.periodKey === periodKey,
    );
    const timestamp = nowIso();
    const record: ReportExportRecord = existing
      ? { ...existing, status, bucketKey, updatedAt: timestamp }
      : {
          id: makeId("rpt"),
          workspaceId,
          type,
          periodKey,
          status,
          bucketKey,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
    this.reportExports.set(record.id, record);
    return clone(record);
  }

  async listLedgerTransactionsForMonth(workspaceId: string, startIso: string, endIso: string) {
    return [...this.ledgerTransactions.values()]
      .filter((item) => item.workspaceId === workspaceId && item.createdAt >= startIso && item.createdAt < endIso)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map(clone);
  }

  async listWorkspaceMembers(workspaceId: string) {
    return [...this.workspaceMembers.values()].filter((item) => item.workspaceId === workspaceId).map(clone);
  }

  async createWorkspaceMember(input: Omit<WorkspaceMemberRecord, "id" | "createdAt">) {
    const record: WorkspaceMemberRecord = { id: makeId("wm"), createdAt: nowIso(), ...input };
    this.workspaceMembers.set(record.id, record);
    return clone(record);
  }

  async listSplitRules(workspaceId: string) {
    return [...this.splitRules.values()].filter((item) => item.workspaceId === workspaceId).map(clone);
  }

  async createSplitRule(input: Omit<SplitRuleRecord, "id" | "createdAt">) {
    const record: SplitRuleRecord = { id: makeId("sr"), createdAt: nowIso(), ...input };
    this.splitRules.set(record.id, record);
    return clone(record);
  }

  private requireWorkspace(workspaceId: string) {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) throw new Error("Workspace not found.");
    return workspace;
  }

  private requireInvoice(invoiceId: string) {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error("Invoice not found.");
    return invoice;
  }
}

class NeonStore implements AppStore {
  private db;

  constructor(connectionString: string) {
    this.db = drizzle(neon(connectionString), { schema });
  }

  async findUserByEmail(email: string) {
    return (await this.db.query.users.findFirst({ where: eq(schema.users.email, email) })) ?? null;
  }

  async getWorkspaceById(workspaceId: string) {
    return (await this.db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, workspaceId) })) ?? null;
  }

  async getAuthSessionByUserId(userId: string) {
    const user = await this.db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!user) return null;
    const workspace = await this.db.query.workspaces.findFirst({
      where: eq(schema.workspaces.ownerUserId, userId),
    });
    if (!workspace) return null;
    const kycProfile = await this.db.query.kycProfiles.findFirst({
      where: eq(schema.kycProfiles.workspaceId, workspace.id),
    });
    return { user, workspace, kycProfile: kycProfile ?? null };
  }

  async createUserSession(input: RegisterInput, passwordHash: string) {
    const timestamp = nowIso();
    const userId = makeId("usr");
    const workspaceId = makeId("wrk");
    const baseSlug = slugify(input.businessName || input.fullName);
    const slug = `${baseSlug}-${workspaceId.split("_")[1].slice(0, 6)}`;
    await this.db.insert(schema.users).values({
      id: userId,
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await this.db.insert(schema.workspaces).values({
      id: workspaceId,
      ownerUserId: userId,
      slug,
      businessName: input.businessName,
      countryCode: input.countryCode,
      baseCurrency: input.baseCurrency,
      payoutMode: "HOLD_BALANCE",
      autoSettleEnabled: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await this.db.insert(schema.kycProfiles).values(createDefaultKyc(workspaceId, input.countryCode));
    const session = await this.getAuthSessionByUserId(userId);
    if (!session) throw new Error("Failed to create auth session.");
    return session;
  }

  async createRefreshToken(userId: string, tokenHash: string, expiresAt: string) {
    const record = {
      id: makeId("rt"),
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt: nowIso(),
    };
    await this.db.insert(schema.refreshTokens).values(record);
    return record;
  }

  async findRefreshToken(tokenHash: string) {
    return (
      (await this.db.query.refreshTokens.findFirst({
        where: eq(schema.refreshTokens.tokenHash, tokenHash),
      })) ?? null
    );
  }

  async revokeRefreshToken(id: string) {
    await this.db.update(schema.refreshTokens).set({ revokedAt: nowIso() }).where(eq(schema.refreshTokens.id, id));
  }

  async updateWorkspaceProfile(workspaceId: string, patch: WorkspaceProfileUpdate) {
    await this.db
      .update(schema.workspaces)
      .set({ ...patch, updatedAt: nowIso() })
      .where(eq(schema.workspaces.id, workspaceId));
    const row = await this.db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, workspaceId) });
    if (!row) throw new Error("Workspace not found.");
    return row;
  }

  async updateSettlementPreferences(workspaceId: string, payoutMode: WorkspaceRecord["payoutMode"], autoSettleEnabled: boolean) {
    await this.db
      .update(schema.workspaces)
      .set({ payoutMode, autoSettleEnabled, updatedAt: nowIso() })
      .where(eq(schema.workspaces.id, workspaceId));
    const row = await this.db.query.workspaces.findFirst({ where: eq(schema.workspaces.id, workspaceId) });
    if (!row) throw new Error("Workspace not found.");
    return row;
  }

  async getKycProfile(workspaceId: string) {
    return (
      (await this.db.query.kycProfiles.findFirst({
        where: eq(schema.kycProfiles.workspaceId, workspaceId),
      })) ?? null
    );
  }

  async listKycProfiles(status?: KycProfileRecord["status"]) {
    return this.db.query.kycProfiles.findMany({
      where: status ? eq(schema.kycProfiles.status, status) : undefined,
      orderBy: desc(schema.kycProfiles.updatedAt),
    });
  }

  async upsertKycProfile(workspaceId: string, patch: KycProfileUpdate) {
    const existing = await this.getKycProfile(workspaceId);
    if (existing) {
      await this.db
        .update(schema.kycProfiles)
        .set({ ...patch, updatedAt: nowIso() })
        .where(eq(schema.kycProfiles.workspaceId, workspaceId));
    } else {
      await this.db.insert(schema.kycProfiles).values({
        ...createDefaultKyc(workspaceId, patch.countryCode ?? "NG"),
        ...patch,
      });
    }
    const row = await this.getKycProfile(workspaceId);
    if (!row) throw new Error("KYC profile not found.");
    return row;
  }

  async listKycDocuments(workspaceId: string) {
    return this.db.query.kycDocuments.findMany({
      where: eq(schema.kycDocuments.workspaceId, workspaceId),
      orderBy: asc(schema.kycDocuments.createdAt),
    });
  }

  async createKycDocument(input: Omit<KycDocumentRecord, "id" | "createdAt">) {
    const record = { id: makeId("doc"), createdAt: nowIso(), ...input };
    await this.db.insert(schema.kycDocuments).values(record);
    return record;
  }

  async createPayoutAccount(input: Omit<PayoutAccountRecord, "id" | "createdAt">) {
    if (input.isDefault) {
      await this.db
        .update(schema.payoutAccounts)
        .set({ isDefault: false })
        .where(eq(schema.payoutAccounts.workspaceId, input.workspaceId));
    }
    const record = { id: makeId("pacc"), createdAt: nowIso(), ...input };
    await this.db.insert(schema.payoutAccounts).values(record);
    return record;
  }

  async listPayoutAccounts(workspaceId: string) {
    return this.db.query.payoutAccounts.findMany({
      where: eq(schema.payoutAccounts.workspaceId, workspaceId),
      orderBy: desc(schema.payoutAccounts.createdAt),
    });
  }

  async getPayoutAccountById(id: string) {
    return (await this.db.query.payoutAccounts.findFirst({ where: eq(schema.payoutAccounts.id, id) })) ?? null;
  }

  async getDefaultPayoutAccount(workspaceId: string, currency?: string) {
    const filters = [eq(schema.payoutAccounts.workspaceId, workspaceId), eq(schema.payoutAccounts.isDefault, true)];
    if (currency) filters.push(eq(schema.payoutAccounts.currency, currency));
    return (await this.db.query.payoutAccounts.findFirst({ where: and(...filters) })) ?? null;
  }

  async createCustomer(input: Omit<CustomerRecord, "id" | "createdAt">) {
    const record = { id: makeId("cus"), createdAt: nowIso(), ...input };
    await this.db.insert(schema.customers).values(record);
    return record;
  }

  async getCustomer(customerId: string) {
    return (await this.db.query.customers.findFirst({ where: eq(schema.customers.id, customerId) })) ?? null;
  }

  async listCustomers(workspaceId: string) {
    return this.db.query.customers.findMany({
      where: eq(schema.customers.workspaceId, workspaceId),
      orderBy: desc(schema.customers.createdAt),
    });
  }

  async createInvoice(input: Omit<InvoiceRecord, "id" | "createdAt" | "updatedAt" | "paidAt">) {
    const timestamp = nowIso();
    const record = { id: makeId("inv"), paidAt: null, createdAt: timestamp, updatedAt: timestamp, ...input };
    await this.db.insert(schema.invoices).values(record);
    return record;
  }

  async listInvoices(workspaceId: string) {
    return this.db.query.invoices.findMany({
      where: eq(schema.invoices.workspaceId, workspaceId),
      orderBy: desc(schema.invoices.createdAt),
    });
  }

  async getInvoiceBySystemId(invoiceId: string) {
    return (await this.db.query.invoices.findFirst({ where: eq(schema.invoices.id, invoiceId) })) ?? null;
  }

  async getInvoiceById(workspaceId: string, invoiceId: string) {
    return (
      (await this.db.query.invoices.findFirst({
        where: and(eq(schema.invoices.workspaceId, workspaceId), eq(schema.invoices.id, invoiceId)),
      })) ?? null
    );
  }

  async getInvoiceByPublicToken(publicToken: string) {
    return (await this.db.query.invoices.findFirst({ where: eq(schema.invoices.publicToken, publicToken) })) ?? null;
  }

  async markInvoicePaid(invoiceId: string, paidAt: string) {
    await this.db
      .update(schema.invoices)
      .set({ status: "PAID", paidAt, updatedAt: nowIso() })
      .where(eq(schema.invoices.id, invoiceId));
    const row = await this.db.query.invoices.findFirst({ where: eq(schema.invoices.id, invoiceId) });
    if (!row) throw new Error("Invoice not found.");
    return row;
  }

  async createCheckoutSession(input: Omit<CheckoutSessionRecord, "id" | "createdAt" | "updatedAt">) {
    const timestamp = nowIso();
    const record = { id: makeId("chk"), createdAt: timestamp, updatedAt: timestamp, ...input };
    await this.db.insert(schema.checkoutSessions).values(record);
    return record;
  }

  async getLatestCheckoutSession(invoiceId: string) {
    return (
      (await this.db.query.checkoutSessions.findFirst({
        where: eq(schema.checkoutSessions.invoiceId, invoiceId),
        orderBy: desc(schema.checkoutSessions.createdAt),
      })) ?? null
    );
  }

  async getCheckoutSessionByProviderReference(providerReference: string) {
    return (
      (await this.db.query.checkoutSessions.findFirst({
        where: eq(schema.checkoutSessions.providerReference, providerReference),
      })) ?? null
    );
  }

  async updateCheckoutSessionStatus(id: string, status: CheckoutSessionRecord["status"]) {
    await this.db.update(schema.checkoutSessions).set({ status, updatedAt: nowIso() }).where(eq(schema.checkoutSessions.id, id));
    const row = await this.db.query.checkoutSessions.findFirst({ where: eq(schema.checkoutSessions.id, id) });
    if (!row) throw new Error("Checkout session not found.");
    return row;
  }

  async upsertProviderTransaction(input: Omit<ProviderTransactionRecord, "id" | "createdAt" | "updatedAt">) {
    const existing = await this.getProviderTransactionByReference(input.providerReference);
    const timestamp = nowIso();
    if (existing) {
      await this.db
        .update(schema.providerTransactions)
        .set({ ...input, updatedAt: timestamp })
        .where(eq(schema.providerTransactions.id, existing.id));
      const row = await this.getProviderTransactionByReference(input.providerReference);
      if (!row) throw new Error("Provider transaction not found.");
      return row;
    }
    const record = { id: makeId("ptx"), createdAt: timestamp, updatedAt: timestamp, ...input };
    await this.db.insert(schema.providerTransactions).values(record);
    return record;
  }

  async getProviderTransactionByReference(providerReference: string) {
    return (
      (await this.db.query.providerTransactions.findFirst({
        where: eq(schema.providerTransactions.providerReference, providerReference),
      })) ?? null
    );
  }

  async createWebhookEvent(input: Omit<WebhookEventRecord, "id" | "createdAt" | "processedAt">) {
    const record = { id: makeId("wh"), createdAt: nowIso(), processedAt: null, ...input };
    await this.db.insert(schema.webhookEvents).values(record);
    return record;
  }

  async getWebhookEvent(id: string) {
    return (await this.db.query.webhookEvents.findFirst({ where: eq(schema.webhookEvents.id, id) })) ?? null;
  }

  async updateWebhookEvent(id: string, patch: Partial<Pick<WebhookEventRecord, "processingStatus" | "errorMessage" | "processedAt">>) {
    await this.db.update(schema.webhookEvents).set(patch).where(eq(schema.webhookEvents.id, id));
    const row = await this.getWebhookEvent(id);
    if (!row) throw new Error("Webhook event not found.");
    return row;
  }

  async recordLedgerTransaction(input: LedgerTransactionInput) {
    const ledgerTransactionId = makeId("ldg");
    const record: LedgerTransactionRecord = {
      id: ledgerTransactionId,
      workspaceId: input.workspaceId,
      transactionType: input.transactionType,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      reference: input.reference,
      grossAmountMinor: input.grossAmountMinor,
      grossCurrency: input.grossCurrency,
      providerFeeMinor: input.providerFeeMinor,
      payoutFeeMinor: input.payoutFeeMinor,
      netAmountMinor: input.netAmountMinor,
      netCurrency: input.netCurrency,
      metadata: input.metadata,
      createdAt: nowIso(),
    };
    await this.db.insert(schema.ledgerTransactions).values(record);
    if (input.postings.length > 0) {
      await this.db.insert(schema.ledgerPostings).values(
        input.postings.map((posting) => ({
          id: makeId("ldgp"),
          ledgerTransactionId,
          workspaceId: input.workspaceId,
          accountCode: posting.accountCode,
          amountMinor: posting.amountMinor,
          currency: posting.currency,
          createdAt: record.createdAt,
        })),
      );
    }
    return record;
  }

  async applyBalanceDelta(workspaceId: string, currency: string, delta: { pending?: number; available?: number; reserved?: number }) {
    const existing = await this.db.query.balances.findFirst({
      where: and(eq(schema.balances.workspaceId, workspaceId), eq(schema.balances.currency, currency)),
    });
    const timestamp = nowIso();
    if (existing) {
      await this.db
        .update(schema.balances)
        .set({
          pendingMinor: existing.pendingMinor + (delta.pending ?? 0),
          availableMinor: existing.availableMinor + (delta.available ?? 0),
          reservedMinor: existing.reservedMinor + (delta.reserved ?? 0),
          updatedAt: timestamp,
        })
        .where(eq(schema.balances.id, existing.id));
    } else {
      await this.db.insert(schema.balances).values({
        id: makeId("bal"),
        workspaceId,
        currency,
        pendingMinor: delta.pending ?? 0,
        availableMinor: delta.available ?? 0,
        reservedMinor: delta.reserved ?? 0,
        updatedAt: timestamp,
      });
    }
    const row = await this.db.query.balances.findFirst({
      where: and(eq(schema.balances.workspaceId, workspaceId), eq(schema.balances.currency, currency)),
    });
    if (!row) throw new Error("Balance not found.");
    return row;
  }

  async getBalances(workspaceId: string) {
    return this.db.query.balances.findMany({
      where: eq(schema.balances.workspaceId, workspaceId),
      orderBy: asc(schema.balances.currency),
    });
  }

  async createWithdrawal(input: Omit<WithdrawalRecord, "id" | "createdAt" | "updatedAt" | "completedAt">) {
    const timestamp = nowIso();
    const record = { id: makeId("wd"), createdAt: timestamp, updatedAt: timestamp, completedAt: null, ...input };
    await this.db.insert(schema.withdrawals).values(record);
    return record;
  }

  async getWithdrawal(id: string) {
    return (await this.db.query.withdrawals.findFirst({ where: eq(schema.withdrawals.id, id) })) ?? null;
  }

  async updateWithdrawal(id: string, patch: Partial<Pick<WithdrawalRecord, "status" | "providerReference" | "failureReason" | "feeMinor" | "completedAt">>) {
    await this.db.update(schema.withdrawals).set({ ...patch, updatedAt: nowIso() }).where(eq(schema.withdrawals.id, id));
    const row = await this.getWithdrawal(id);
    if (!row) throw new Error("Withdrawal not found.");
    return row;
  }

  async createPayoutTransfer(input: Omit<PayoutTransferRecord, "id" | "createdAt" | "updatedAt">) {
    const timestamp = nowIso();
    const record = { id: makeId("ptr"), createdAt: timestamp, updatedAt: timestamp, ...input };
    await this.db.insert(schema.payoutTransfers).values(record);
    return record;
  }

  async createOrUpdateReportExport(workspaceId: string, type: ReportType, periodKey: string, status: ReportStatus, bucketKey: string | null) {
    const existing = await this.db.query.reportExports.findFirst({
      where: and(
        eq(schema.reportExports.workspaceId, workspaceId),
        eq(schema.reportExports.type, type),
        eq(schema.reportExports.periodKey, periodKey),
      ),
    });
    const timestamp = nowIso();
    if (existing) {
      await this.db
        .update(schema.reportExports)
        .set({ status, bucketKey, updatedAt: timestamp })
        .where(eq(schema.reportExports.id, existing.id));
    } else {
      await this.db.insert(schema.reportExports).values({
        id: makeId("rpt"),
        workspaceId,
        type,
        periodKey,
        status,
        bucketKey,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    const row = await this.db.query.reportExports.findFirst({
      where: and(
        eq(schema.reportExports.workspaceId, workspaceId),
        eq(schema.reportExports.type, type),
        eq(schema.reportExports.periodKey, periodKey),
      ),
    });
    if (!row) throw new Error("Report export not found.");
    return row;
  }

  async listLedgerTransactionsForMonth(workspaceId: string, startIso: string, endIso: string) {
    return this.db.query.ledgerTransactions.findMany({
      where: and(
        eq(schema.ledgerTransactions.workspaceId, workspaceId),
        gte(schema.ledgerTransactions.createdAt, startIso),
        lt(schema.ledgerTransactions.createdAt, endIso),
      ),
      orderBy: asc(schema.ledgerTransactions.createdAt),
    });
  }

  async listWorkspaceMembers(workspaceId: string) {
    return this.db.query.workspaceMembers.findMany({
      where: eq(schema.workspaceMembers.workspaceId, workspaceId),
      orderBy: asc(schema.workspaceMembers.createdAt),
    });
  }

  async createWorkspaceMember(input: Omit<WorkspaceMemberRecord, "id" | "createdAt">) {
    const record = { id: makeId("wm"), createdAt: nowIso(), ...input };
    await this.db.insert(schema.workspaceMembers).values(record);
    return record;
  }

  async listSplitRules(workspaceId: string) {
    return this.db.query.splitRules.findMany({
      where: eq(schema.splitRules.workspaceId, workspaceId),
      orderBy: asc(schema.splitRules.createdAt),
    });
  }

  async createSplitRule(input: Omit<SplitRuleRecord, "id" | "createdAt">) {
    const record = { id: makeId("sr"), createdAt: nowIso(), ...input };
    await this.db.insert(schema.splitRules).values(record);
    return record;
  }
}

let singletonMemoryStore: MemoryStore | null = null;

export const createStore = (bindings: AppBindings, options?: { memoryStore?: MemoryStore }) => {
  if (bindings.DATABASE_URL) {
    return new NeonStore(bindings.DATABASE_URL);
  }
  if (options?.memoryStore) {
    return options.memoryStore;
  }
  singletonMemoryStore ??= new MemoryStore();
  return singletonMemoryStore;
};
