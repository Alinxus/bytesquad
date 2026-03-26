// ============================================================
// Core Entity Types
// ============================================================

export interface User {
  id: string
  email: string
  fullName: string
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  ownerUserId: string
  slug: string
  businessName: string
  countryCode: string
  baseCurrency: string
  payoutMode: 'HOLD_BALANCE' | 'AUTO_SETTLE'
  autoSettleEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface KycProfile {
  id: string
  workspaceId: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  legalName: string | null
  dateOfBirth: string | null
  addressLine1: string | null
  city: string | null
  region: string | null
  postalCode: string | null
  countryCode: string | null
  rejectionReason: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface KycDocument {
  id: string
  workspaceId: string
  kycProfileId: string
  documentType: string
  fileName: string
  contentType: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export interface PayoutAccount {
  id: string
  workspaceId: string
  provider: 'INTERSWITCH' | 'FLUTTERWAVE'
  countryCode: string
  currency: string
  bankCode: string
  bankName: string
  accountName: string
  accountNumberLast4: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  workspaceId: string
  name: string
  email: string
  companyName: string | null
  countryCode: string | null
  createdAt: string
  updatedAt: string
}

export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'EXPIRED'
export type PaymentProvider = 'FLUTTERWAVE' | 'INTERSWITCH'
export type PaymentMethod = 'CARD' | 'BANK_TRANSFER' | 'USSD' | 'MOBILE_MONEY'

export interface Invoice {
  id: string
  workspaceId: string
  customerId: string | null
  customer?: Customer
  invoiceNumber: string
  title: string
  description: string | null
  currency: string
  amountMinor: number
  status: InvoiceStatus
  dueDate: string | null
  paidAt: string | null
  allowedMethods: PaymentMethod[]
  publicToken: string
  providerPreference: PaymentProvider | null
  checkoutSession?: CheckoutSession
  createdAt: string
  updatedAt: string
}

export type CheckoutSessionStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED'

export interface CheckoutSession {
  id: string
  invoiceId: string
  provider: PaymentProvider
  providerReference: string
  checkoutUrl: string
  status: CheckoutSessionStatus
  amountMinor: number
  currency: string
  expiresAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Balance {
  workspaceId: string
  currency: string
  pendingMinor: number
  availableMinor: number
  reservedMinor: number
}

export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface Withdrawal {
  id: string
  workspaceId: string
  payoutAccountId: string
  payoutAccount?: PayoutAccount
  provider: PaymentProvider
  currency: string
  amountMinor: number
  feeMinor: number
  status: WithdrawalStatus
  providerReference: string | null
  failureReason: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export type TransactionType =
  | 'PAYMENT_RECEIVED'
  | 'WITHDRAWAL_INITIATED'
  | 'WITHDRAWAL_COMPLETED'
  | 'WITHDRAWAL_FAILED'
  | 'FEE_CHARGED'
  | 'REFUND'

export interface LedgerTransaction {
  id: string
  workspaceId: string
  currency: string
  type: TransactionType
  amount: number
  balanceBefore: number
  balanceAfter: number
  referenceId: string | null
  referenceType: string | null
  description: string | null
  createdAt: string
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: {
    items: T[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AuthResponse {
  user: User
  workspace: Workspace
  accessToken: string
  refreshToken: string
}

// ============================================================
// Request Types
// ============================================================

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  businessName: string
  email: string
  password: string
  countryCode: string
  baseCurrency: string
}

export interface CreateInvoiceRequest {
  customerId?: string
  title: string
  description?: string
  currency: string
  amountMinor: number
  dueDate?: string
  allowedMethods?: PaymentMethod[]
  providerPreference?: PaymentProvider
}

export interface CreateCustomerRequest {
  name: string
  email: string
  companyName?: string
  countryCode?: string
}

export interface CreateWithdrawalRequest {
  amountMinor: number
  currency: string
  payoutAccountId?: string
}

export interface CreatePayoutAccountRequest {
  countryCode: string
  currency: string
  bankCode: string
  bankName: string
  accountName: string
  accountNumber: string
  isDefault?: boolean
}

export interface UpdateWorkspaceRequest {
  businessName?: string
  countryCode?: string
  baseCurrency?: string
  payoutMode?: 'HOLD_BALANCE' | 'AUTO_SETTLE'
  autoSettleEnabled?: boolean
}

export interface UploadKycDocumentRequest {
  documentType: string
  fileName: string
  contentType: string
  contentBase64: string
  legalName?: string
  dateOfBirth?: string
  addressLine1?: string
  city?: string
  region?: string
  postalCode?: string
  bvn?: string
  nin?: string
}

// ============================================================
// UI / Helper Types
// ============================================================

export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export interface ReportData {
  grossIncome: number
  totalFees: number
  netIncome: number
  currency: string
  period: string
}
