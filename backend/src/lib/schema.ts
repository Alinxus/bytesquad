import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import {
  checkoutStatuses,
  invoiceStatuses,
  kycStatuses,
  ledgerAccountCodes,
  ledgerTransactionTypes,
  payoutModes,
  providerNames,
  reportStatuses,
  reportTypes,
  webhookProcessingStatuses,
  withdrawalStatuses,
} from "../domain";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
};

export const payoutModeEnum = pgEnum("payout_mode", payoutModes);
export const kycStatusEnum = pgEnum("kyc_status", kycStatuses);
export const invoiceStatusEnum = pgEnum("invoice_status", invoiceStatuses);
export const checkoutStatusEnum = pgEnum("checkout_status", checkoutStatuses);
export const providerEnum = pgEnum("provider_name", providerNames);
export const withdrawalStatusEnum = pgEnum("withdrawal_status", withdrawalStatuses);
export const reportTypeEnum = pgEnum("report_type", reportTypes);
export const reportStatusEnum = pgEnum("report_status", reportStatuses);
export const webhookProcessingStatusEnum = pgEnum(
  "webhook_processing_status",
  webhookProcessingStatuses,
);
export const ledgerTransactionTypeEnum = pgEnum(
  "ledger_transaction_type",
  ledgerTransactionTypes,
);
export const ledgerAccountCodeEnum = pgEnum("ledger_account_code", ledgerAccountCodes);

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  ...timestamps,
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
}));

export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  slug: text("slug").notNull(),
  businessName: text("business_name").notNull(),
  countryCode: text("country_code").notNull(),
  baseCurrency: text("base_currency").notNull(),
  payoutMode: payoutModeEnum("payout_mode").notNull(),
  autoSettleEnabled: boolean("auto_settle_enabled").notNull().default(false),
  ...timestamps,
}, (table) => ({
  slugIdx: uniqueIndex("workspaces_slug_idx").on(table.slug),
  ownerIdx: uniqueIndex("workspaces_owner_user_idx").on(table.ownerUserId),
}));

export const refreshTokens = pgTable("refresh_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
}, (table) => ({
  tokenIdx: uniqueIndex("refresh_tokens_hash_idx").on(table.tokenHash),
}));

export const kycProfiles = pgTable("kyc_profiles", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  status: kycStatusEnum("status").notNull(),
  legalName: text("legal_name"),
  countryCode: text("country_code").notNull(),
  dateOfBirth: text("date_of_birth"),
  addressLine1: text("address_line1"),
  city: text("city"),
  region: text("region"),
  postalCode: text("postal_code"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "string" }),
  rejectionReason: text("rejection_reason"),
  ...timestamps,
}, (table) => ({
  workspaceIdx: uniqueIndex("kyc_profiles_workspace_idx").on(table.workspaceId),
}));

export const kycDocuments = pgTable("kyc_documents", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  kycProfileId: text("kyc_profile_id").notNull(),
  documentType: text("document_type").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  bucketKey: text("bucket_key").notNull(),
  status: kycStatusEnum("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const payoutAccounts = pgTable("payout_accounts", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  provider: providerEnum("provider").notNull(),
  countryCode: text("country_code").notNull(),
  currency: text("currency").notNull(),
  bankCode: text("bank_code").notNull(),
  bankName: text("bank_name").notNull(),
  accountName: text("account_name").notNull(),
  accountNumberLast4: text("account_number_last4").notNull(),
  accountNumberEncrypted: text("account_number_encrypted").notNull(),
  isDefault: boolean("is_default").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  companyName: text("company_name"),
  countryCode: text("country_code"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  customerId: text("customer_id"),
  invoiceNumber: text("invoice_number").notNull(),
  status: invoiceStatusEnum("status").notNull(),
  currency: text("currency").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  allowedMethods: jsonb("allowed_methods").$type<string[]>().notNull().default([]),
  publicToken: text("public_token").notNull(),
  providerPreference: providerEnum("provider_preference"),
  paidAt: timestamp("paid_at", { withTimezone: true, mode: "string" }),
  ...timestamps,
}, (table) => ({
  publicTokenIdx: uniqueIndex("invoices_public_token_idx").on(table.publicToken),
}));

export const checkoutSessions = pgTable("checkout_sessions", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull(),
  provider: providerEnum("provider").notNull(),
  providerReference: text("provider_reference").notNull(),
  checkoutUrl: text("checkout_url").notNull(),
  status: checkoutStatusEnum("status").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "string" }),
  ...timestamps,
}, (table) => ({
  refIdx: uniqueIndex("checkout_sessions_provider_reference_idx").on(table.providerReference),
}));

export const providerTransactions = pgTable("provider_transactions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  invoiceId: text("invoice_id"),
  checkoutSessionId: text("checkout_session_id"),
  provider: providerEnum("provider").notNull(),
  providerReference: text("provider_reference").notNull(),
  externalStatus: text("external_status").notNull(),
  eventType: text("event_type").notNull(),
  sourceAmountMinor: integer("source_amount_minor").notNull(),
  sourceCurrency: text("source_currency").notNull(),
  settledAmountMinor: integer("settled_amount_minor").notNull(),
  settledCurrency: text("settled_currency").notNull(),
  providerFeeMinor: integer("provider_fee_minor").notNull(),
  providerFeeCurrency: text("provider_fee_currency").notNull(),
  paymentMethod: text("payment_method"),
  payerEmail: text("payer_email"),
  payerCountry: text("payer_country"),
  verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "string" }),
  failureReason: text("failure_reason"),
  rawData: jsonb("raw_data").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
}, (table) => ({
  providerRefIdx: uniqueIndex("provider_transactions_provider_reference_idx").on(
    table.providerReference,
  ),
}));

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  provider: providerEnum("provider").notNull(),
  eventId: text("event_id").notNull(),
  providerReference: text("provider_reference"),
  eventType: text("event_type").notNull(),
  signatureValid: boolean("signature_valid").notNull(),
  payload: text("payload").notNull(),
  processingStatus: webhookProcessingStatusEnum("processing_status").notNull(),
  errorMessage: text("error_message"),
  processedAt: timestamp("processed_at", { withTimezone: true, mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
}, (table) => ({
  eventIdx: uniqueIndex("webhook_events_provider_event_idx").on(table.provider, table.eventId),
}));

export const ledgerTransactions = pgTable("ledger_transactions", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  transactionType: ledgerTransactionTypeEnum("transaction_type").notNull(),
  sourceType: text("source_type").notNull(),
  sourceId: text("source_id").notNull(),
  reference: text("reference").notNull(),
  grossAmountMinor: integer("gross_amount_minor").notNull(),
  grossCurrency: text("gross_currency").notNull(),
  providerFeeMinor: integer("provider_fee_minor").notNull(),
  payoutFeeMinor: integer("payout_fee_minor").notNull(),
  netAmountMinor: integer("net_amount_minor").notNull(),
  netCurrency: text("net_currency").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const ledgerPostings = pgTable("ledger_postings", {
  id: text("id").primaryKey(),
  ledgerTransactionId: text("ledger_transaction_id").notNull(),
  workspaceId: text("workspace_id").notNull(),
  accountCode: ledgerAccountCodeEnum("account_code").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const balances = pgTable("balances", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  currency: text("currency").notNull(),
  pendingMinor: integer("pending_minor").notNull().default(0),
  availableMinor: integer("available_minor").notNull().default(0),
  reservedMinor: integer("reserved_minor").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }).notNull(),
}, (table) => ({
  workspaceCurrencyIdx: uniqueIndex("balances_workspace_currency_idx").on(
    table.workspaceId,
    table.currency,
  ),
}));

export const withdrawals = pgTable("withdrawals", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  payoutAccountId: text("payout_account_id").notNull(),
  provider: providerEnum("provider").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  feeMinor: integer("fee_minor").notNull(),
  status: withdrawalStatusEnum("status").notNull(),
  providerReference: text("provider_reference"),
  failureReason: text("failure_reason"),
  completedAt: timestamp("completed_at", { withTimezone: true, mode: "string" }),
  ...timestamps,
});

export const payoutTransfers = pgTable("payout_transfers", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  withdrawalId: text("withdrawal_id").notNull(),
  provider: providerEnum("provider").notNull(),
  providerReference: text("provider_reference").notNull(),
  status: withdrawalStatusEnum("status").notNull(),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  feeMinor: integer("fee_minor").notNull(),
  destinationCountryCode: text("destination_country_code").notNull(),
  rawData: jsonb("raw_data").$type<Record<string, unknown>>().notNull().default({}),
  ...timestamps,
});

export const reportExports = pgTable("report_exports", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  type: reportTypeEnum("type").notNull(),
  periodKey: text("period_key").notNull(),
  status: reportStatusEnum("status").notNull(),
  bucketKey: text("bucket_key"),
  ...timestamps,
});

export const workspaceMembers = pgTable("workspace_members", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});

export const splitRules = pgTable("split_rules", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  ruleType: text("rule_type").notNull(),
  valueBps: integer("value_bps").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull(),
});
