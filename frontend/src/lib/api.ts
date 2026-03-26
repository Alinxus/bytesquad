import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import type {
  AuthResponse,
  Balance,
  CheckoutSession,
  Customer,
  CreateCustomerRequest,
  CreateInvoiceRequest,
  CreatePayoutAccountRequest,
  CreateWithdrawalRequest,
  Invoice,
  KycDocument,
  KycProfile,
  LoginRequest,
  PayoutAccount,
  RegisterRequest,
  UpdateWorkspaceRequest,
  UploadKycDocumentRequest,
  Withdrawal,
  Workspace,
} from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://nera-backend.olajidealameen4.workers.dev'

// Token management helpers
const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('nera_access_token')
}

const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('nera_refresh_token')
}

const setTokens = (accessToken: string, refreshToken: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem('nera_access_token', accessToken)
  localStorage.setItem('nera_refresh_token', refreshToken)
}

const clearTokens = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem('nera_access_token')
  localStorage.removeItem('nera_refresh_token')
  localStorage.removeItem('nera_user')
  localStorage.removeItem('nera_workspace')
}

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request interceptor: inject auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Queue for requests waiting on refresh
let isRefreshing = false
let failedQueue: Array<{ resolve: (value: string) => void; reject: (error: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

// Response interceptor: handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${token}` }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true
      const refreshToken = getRefreshToken()

      if (!refreshToken) {
        clearTokens()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Backend returns { session, tokens } directly (no data wrapper)
        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const raw = response.data
        const tokens = raw.tokens ?? raw
        const { accessToken, refreshToken: newRefreshToken } = tokens
        setTokens(accessToken, newRefreshToken)
        processQueue(null, accessToken)
        originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${accessToken}` }
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearTokens()
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ============================================================
// Helpers
// ============================================================

// Backend returns { session: { user, workspace, ... }, tokens: { accessToken, refreshToken } }
// No data wrapper — response body IS the object.
function normalizeAuthResponse(raw: {
  session?: { user: import('@/types').User; workspace: Workspace }
  tokens?: { accessToken: string; refreshToken: string }
  user?: import('@/types').User
  workspace?: Workspace
  accessToken?: string
  refreshToken?: string
}): AuthResponse {
  const user = raw.session?.user ?? (raw.user as import('@/types').User)
  const workspace = raw.session?.workspace ?? (raw.workspace as Workspace)
  const accessToken = raw.tokens?.accessToken ?? (raw.accessToken as string)
  const refreshToken = raw.tokens?.refreshToken ?? (raw.refreshToken as string)
  return { user, workspace, accessToken, refreshToken }
}

// Extract a human-readable error from various backend error shapes:
// { error: "..." } | { message: "..." } | { errors: [{ message }] }
export function extractApiError(err: unknown): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data as
    | { message?: string; error?: string; errors?: Array<{ message?: string }> }
    | undefined
  if (!data) return ''
  return (
    data.error ||
    data.message ||
    (Array.isArray(data.errors) && data.errors[0]?.message ? data.errors[0].message : '') ||
    ''
  )
}

// ============================================================
// Auth API — backend returns objects directly, no { data: } wrapper
// ============================================================

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', data)
    return normalizeAuthResponse(res.data) // res.data IS the { session, tokens } object
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', data)
    return normalizeAuthResponse(res.data)
  },

  logout: async (): Promise<void> => {
    try { await api.post('/auth/logout') } finally { clearTokens() }
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await api.post('/auth/refresh', { refreshToken })
    const raw = res.data
    return raw.tokens ?? raw
  },

  me: async (): Promise<{ user: import('@/types').User; workspace: Workspace; kycProfile?: KycProfile }> => {
    const res = await api.get('/auth/me')
    return res.data // { user, workspace, kycProfile, payoutAccounts, balances }
  },
}

// ============================================================
// Workspace / Profile API
// ============================================================

export const workspaceApi = {
  get: async (): Promise<Workspace> => {
    const res = await api.get('/auth/me')
    return res.data.workspace
  },

  update: async (data: UpdateWorkspaceRequest): Promise<Workspace> => {
    const res = await api.patch('/me/profile', data)
    return res.data
  },

  updateSettlement: async (data: { payoutMode?: string; autoSettleEnabled?: boolean }): Promise<Workspace> => {
    const res = await api.patch('/me/settlement-preferences', data)
    return res.data
  },
}

// ============================================================
// Invoices API — /invoices returns Invoice[] directly
// ============================================================

export const invoicesApi = {
  list: async (params?: { status?: string; page?: number; limit?: number }): Promise<{ items: Invoice[]; total: number }> => {
    const res = await api.get('/invoices', { params })
    const data: Invoice[] = res.data
    return { items: data, total: data.length }
  },

  get: async (id: string): Promise<Invoice> => {
    const res = await api.get(`/invoices/${id}`)
    return res.data
  },

  create: async (data: CreateInvoiceRequest): Promise<Invoice> => {
    const res = await api.post('/invoices', data)
    return res.data
  },

  void: async (id: string): Promise<Invoice> => {
    const res = await api.post(`/invoices/${id}/void`)
    return res.data
  },

  createCheckout: async (id: string): Promise<CheckoutSession> => {
    const res = await api.post(`/invoices/${id}/checkout-session`)
    return res.data
  },
}

// ============================================================
// Customers API — /customers returns Customer[] directly
// ============================================================

export const customersApi = {
  list: async (params?: { search?: string; page?: number; limit?: number }): Promise<{ items: Customer[]; total: number }> => {
    const res = await api.get('/customers', { params })
    const data: Customer[] = res.data
    return { items: data, total: data.length }
  },

  get: async (id: string): Promise<Customer> => {
    const res = await api.get(`/customers/${id}`)
    return res.data
  },

  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const res = await api.post('/customers', data)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`)
  },
}

// ============================================================
// Balances API — /balances returns Balance[] directly
// ============================================================

export const balancesApi = {
  list: async (): Promise<Balance[]> => {
    const res = await api.get('/balances')
    return res.data
  },
}

// ============================================================
// Withdrawals API
// ============================================================

export const withdrawalsApi = {
  list: async (params?: { status?: string; page?: number; limit?: number }): Promise<{ items: Withdrawal[]; total: number }> => {
    const res = await api.get('/withdrawals', { params })
    const data: Withdrawal[] = Array.isArray(res.data) ? res.data : (res.data.withdrawals ?? [])
    return { items: data, total: data.length }
  },

  get: async (id: string): Promise<Withdrawal> => {
    const res = await api.get(`/withdrawals/${id}`)
    return res.data
  },

  create: async (data: CreateWithdrawalRequest): Promise<Withdrawal> => {
    const res = await api.post('/withdrawals', data)
    return res.data
  },
}

// ============================================================
// Payout Accounts API
// ============================================================

export const payoutAccountsApi = {
  list: async (): Promise<PayoutAccount[]> => {
    const res = await api.get('/me/payout-accounts')
    return Array.isArray(res.data) ? res.data : (res.data.payoutAccounts ?? [])
  },

  get: async (id: string): Promise<PayoutAccount> => {
    const res = await api.get(`/me/payout-accounts/${id}`)
    return res.data
  },

  create: async (data: CreatePayoutAccountRequest): Promise<PayoutAccount> => {
    const res = await api.post('/me/payout-accounts', data)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/me/payout-accounts/${id}`)
  },
}

// ============================================================
// KYC API — /me/kyc returns { profile, documents } directly
// ============================================================

export const kycApi = {
  getProfile: async (): Promise<{ profile: KycProfile; documents: KycDocument[] }> => {
    const res = await api.get('/me/kyc')
    return res.data
  },

  uploadDocument: async (data: UploadKycDocumentRequest): Promise<KycDocument> => {
    const res = await api.post('/me/kyc/documents', data)
    return res.data
  },
}

// ============================================================
// Reports API
// ============================================================

export const reportsApi = {
  getStatement: async (yearMonth: string): Promise<Blob> => {
    const res = await api.get(`/reports/statements/${yearMonth}`, { responseType: 'blob' })
    return res.data
  },

  getTransactionsCsv: async (yearMonth: string): Promise<Blob> => {
    const res = await api.get('/reports/transactions.csv', { params: { yearMonth }, responseType: 'blob' })
    return res.data
  },

  getTaxSummary: async (yearMonth: string) => {
    const res = await api.get(`/reports/tax-summary/${yearMonth}`)
    return res.data
  },
}

export { setTokens, clearTokens, getAccessToken, getRefreshToken }
export default api
