export const payoutModes = ["HOLD_BALANCE", "AUTO_SETTLE"] as const;
export const kycStatuses = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
export const invoiceStatuses = ["DRAFT", "OPEN", "PAID", "VOID", "EXPIRED"] as const;
export const checkoutStatuses = ["CREATED", "PENDING", "PAID", "FAILED", "EXPIRED", "CANCELLED"] as const;
export const providerNames = ["INTERSWITCH", "FLUTTERWAVE"] as const;
export const withdrawalStatuses = ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"] as const;
export const reportTypes = ["STATEMENT_PDF", "TRANSACTIONS_CSV"] as const;
export const reportStatuses = ["PENDING", "COMPLETED", "FAILED"] as const;
export const webhookProcessingStatuses = ["RECEIVED", "PROCESSED", "DUPLICATE", "FAILED"] as const;
export const ledgerTransactionTypes = ["COLLECTION", "AVAILABILITY", "PAYOUT", "REVERSAL"] as const;
export const ledgerAccountCodes = [
  "USER_PENDING",
  "USER_AVAILABLE",
  "USER_RESERVED",
  "EXTERNAL_CLEARING",
  "PAYOUT_CLEARING",
  "PROVIDER_FEES",
  "PAYOUT_FEES",
] as const;

export type PayoutMode = (typeof payoutModes)[number];
export type KycStatus = (typeof kycStatuses)[number];
export type InvoiceStatus = (typeof invoiceStatuses)[number];
export type CheckoutStatus = (typeof checkoutStatuses)[number];
export type ProviderName = (typeof providerNames)[number];
export type WithdrawalStatus = (typeof withdrawalStatuses)[number];
export type ReportType = (typeof reportTypes)[number];
export type ReportStatus = (typeof reportStatuses)[number];
export type WebhookProcessingStatus = (typeof webhookProcessingStatuses)[number];
export type LedgerTransactionType = (typeof ledgerTransactionTypes)[number];
export type LedgerAccountCode = (typeof ledgerAccountCodes)[number];

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceRecord {
  id: string;
  ownerUserId: string;
  slug: string;
  businessName: string;
  countryCode: string;
  baseCurrency: string;
  payoutMode: PayoutMode;
  autoSettleEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface KycProfileRecord {
  id: string;
  workspaceId: string;
  status: KycStatus;
  legalName: string | null;
  countryCode: string;
  dateOfBirth: string | null;
  addressLine1: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KycDocumentRecord {
  id: string;
  workspaceId: string;
  kycProfileId: string;
  documentType: string;
  fileName: string;
  contentType: string;
  bucketKey: string;
  status: KycStatus;
  createdAt: string;
}

export interface PayoutAccountRecord {
  id: string;
  workspaceId: string;
  provider: ProviderName;
  countryCode: string;
  currency: string;
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNumberLast4: string;
  accountNumberEncrypted: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CustomerRecord {
  id: string;
  workspaceId: string;
  email: string;
  name: string;
  companyName: string | null;
  countryCode: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  workspaceId: string;
  customerId: string | null;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  amountMinor: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  allowedMethods: string[];
  publicToken: string;
  providerPreference: ProviderName | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSessionRecord {
  id: string;
  invoiceId: string;
  provider: ProviderName;
  providerReference: string;
  checkoutUrl: string;
  status: CheckoutStatus;
  amountMinor: number;
  currency: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderTransactionRecord {
  id: string;
  workspaceId: string;
  invoiceId: string | null;
  checkoutSessionId: string | null;
  provider: ProviderName;
  providerReference: string;
  externalStatus: string;
  eventType: string;
  sourceAmountMinor: number;
  sourceCurrency: string;
  settledAmountMinor: number;
  settledCurrency: string;
  providerFeeMinor: number;
  providerFeeCurrency: string;
  paymentMethod: string | null;
  payerEmail: string | null;
  payerCountry: string | null;
  verifiedAt: string | null;
  failureReason: string | null;
  rawData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEventRecord {
  id: string;
  provider: ProviderName;
  eventId: string;
  providerReference: string | null;
  eventType: string;
  signatureValid: boolean;
  payload: string;
  processingStatus: WebhookProcessingStatus;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface LedgerTransactionRecord {
  id: string;
  workspaceId: string;
  transactionType: LedgerTransactionType;
  sourceType: string;
  sourceId: string;
  reference: string;
  grossAmountMinor: number;
  grossCurrency: string;
  providerFeeMinor: number;
  payoutFeeMinor: number;
  netAmountMinor: number;
  netCurrency: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface LedgerPostingRecord {
  id: string;
  ledgerTransactionId: string;
  workspaceId: string;
  accountCode: LedgerAccountCode;
  amountMinor: number;
  currency: string;
  createdAt: string;
}

export interface BalanceRecord {
  id: string;
  workspaceId: string;
  currency: string;
  pendingMinor: number;
  availableMinor: number;
  reservedMinor: number;
  updatedAt: string;
}

export interface WithdrawalRecord {
  id: string;
  workspaceId: string;
  payoutAccountId: string;
  provider: ProviderName;
  amountMinor: number;
  currency: string;
  feeMinor: number;
  status: WithdrawalStatus;
  providerReference: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface PayoutTransferRecord {
  id: string;
  workspaceId: string;
  withdrawalId: string;
  provider: ProviderName;
  providerReference: string;
  status: WithdrawalStatus;
  amountMinor: number;
  currency: string;
  feeMinor: number;
  destinationCountryCode: string;
  rawData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReportExportRecord {
  id: string;
  workspaceId: string;
  type: ReportType;
  periodKey: string;
  status: ReportStatus;
  bucketKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberRecord {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: string;
}

export interface SplitRuleRecord {
  id: string;
  workspaceId: string;
  targetType: string;
  targetId: string;
  ruleType: string;
  valueBps: number;
  createdAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  businessName: string;
  countryCode: string;
  baseCurrency: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface AuthSession {
  user: UserRecord;
  workspace: WorkspaceRecord;
  kycProfile: KycProfileRecord | null;
}

export interface ProviderCheckoutInput {
  invoice: InvoiceRecord;
  workspace: WorkspaceRecord;
  customer: CustomerRecord | null;
  returnUrl: string;
}

export interface ProviderCheckoutResult {
  provider: ProviderName;
  providerReference: string;
  checkoutUrl: string;
  expiresAt: string | null;
}

export interface ProviderVerificationResult {
  provider: ProviderName;
  providerReference: string;
  externalStatus: string;
  eventType: string;
  sourceAmountMinor: number;
  sourceCurrency: string;
  settledAmountMinor: number;
  settledCurrency: string;
  providerFeeMinor: number;
  providerFeeCurrency: string;
  paymentMethod: string | null;
  payerEmail: string | null;
  payerCountry: string | null;
  rawData: Record<string, unknown>;
  isSuccessful: boolean;
  failureReason?: string | null;
}

export interface ParsedWebhook {
  provider: ProviderName;
  eventId: string;
  providerReference: string | null;
  eventType: string;
  signatureValid: boolean;
  payload: Record<string, unknown>;
}

export interface ProviderPayoutInput {
  withdrawalId: string;
  amountMinor: number;
  currency: string;
  payoutAccount: PayoutAccountRecord;
  workspace: WorkspaceRecord;
}

export interface ProviderPayoutResult {
  provider: ProviderName;
  providerReference: string;
  status: WithdrawalStatus;
  feeMinor: number;
  rawData: Record<string, unknown>;
}

export interface LedgerPostingInput {
  accountCode: LedgerAccountCode;
  amountMinor: number;
  currency: string;
}

export interface LedgerTransactionInput {
  workspaceId: string;
  transactionType: LedgerTransactionType;
  sourceType: string;
  sourceId: string;
  reference: string;
  grossAmountMinor: number;
  grossCurrency: string;
  providerFeeMinor: number;
  payoutFeeMinor: number;
  netAmountMinor: number;
  netCurrency: string;
  metadata: Record<string, unknown>;
  postings: LedgerPostingInput[];
}

export type AsyncJob =
  | { type: "PROCESS_WEBHOOK"; webhookEventId: string }
  | { type: "EXECUTE_PAYOUT"; withdrawalId: string }
  | { type: "GENERATE_REPORT"; workspaceId: string; yearMonth: string; reportType: ReportType };

export interface StatementLineItem {
  createdAt: string;
  transactionType: LedgerTransactionType;
  reference: string;
  grossAmountMinor: number;
  providerFeeMinor: number;
  payoutFeeMinor: number;
  netAmountMinor: number;
  currency: string;
  metadata: Record<string, unknown>;
}
