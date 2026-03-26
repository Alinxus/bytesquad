import type { AsyncJob, AuthSession } from "./domain";

export interface AppBindings {
  APP_URL: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  REFRESH_TOKEN_SECRET?: string;
  DATA_ENCRYPTION_KEY?: string;
  ACCESS_TOKEN_TTL_MINUTES?: string;
  REFRESH_TOKEN_TTL_DAYS?: string;
  PROVIDER_MODE?: string;
  DEFAULT_SETTLEMENT_COUNTRY?: string;
  DEFAULT_SETTLEMENT_CURRENCY?: string;
  INTERSWITCH_BASE_URL?: string;
  INTERSWITCH_CLIENT_ID?: string;
  INTERSWITCH_SECRET_KEY?: string;
  INTERSWITCH_WEBHOOK_SECRET?: string;
  INTERSWITCH_MERCHANT_CODE?: string;
  INTERSWITCH_PAY_ITEM_ID?: string;
  INTERSWITCH_TERMINAL_ID?: string;
  INTERSWITCH_TRANSACTION_SEARCH_URL?: string;
  INTERSWITCH_BANK_VERIFY_URL?: string;
  INTERSWITCH_BVN_VERIFY_URL?: string;
  INTERSWITCH_NIN_VERIFY_URL?: string;
  FLUTTERWAVE_BASE_URL?: string;
  FLUTTERWAVE_SECRET_KEY?: string;
  FLUTTERWAVE_PUBLIC_KEY?: string;
  FLUTTERWAVE_WEBHOOK_SECRET?: string;
  RATE_LIMIT_WINDOW_SECONDS?: string;
  RATE_LIMIT_MAX_REQUESTS?: string;
  CORS_ALLOW_ORIGINS?: string;
  PROVIDER_HTTP_TIMEOUT_MS?: string;
  LOG_LEVEL?: string;
  OPS_API_KEY?: string;
  ASYNC_JOBS?: Queue<AsyncJob>;
  DOCUMENTS_BUCKET?: R2Bucket;
  REPORTS_BUCKET?: R2Bucket;
}

export interface AppVariables {
  auth: AuthSession;
  requestId: string;
}

export interface AppEnv {
  Bindings: AppBindings;
  Variables: AppVariables;
}
