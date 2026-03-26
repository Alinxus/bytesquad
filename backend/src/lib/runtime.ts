import type { AppBindings } from "../bindings";
import { HttpError } from "../services";

type EnvValidationResult = {
  mode: "mock" | "live";
  missing: string[];
};

const requiredLiveKeys = [
  "DATABASE_URL",
  "JWT_SECRET",
  "REFRESH_TOKEN_SECRET",
  "DATA_ENCRYPTION_KEY",
  "FLUTTERWAVE_SECRET_KEY",
  "FLUTTERWAVE_WEBHOOK_SECRET",
] as const;

const parseOrigins = (raw: string | undefined) =>
  (raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

export const validateEnv = (bindings: AppBindings): EnvValidationResult => {
  const mode = (bindings.PROVIDER_MODE ?? "mock") === "live" ? "live" : "mock";
  const missing =
    mode === "live"
      ? requiredLiveKeys.filter((key) => {
          const value = bindings[key];
          return typeof value !== "string" || value.trim().length === 0;
        })
      : [];

  return { mode, missing: [...missing] };
};

export const assertLiveReady = (bindings: AppBindings) => {
  const result = validateEnv(bindings);
  if (result.mode === "live" && result.missing.length > 0) {
    throw new HttpError(500, "Live provider mode is missing required configuration.", {
      missing: result.missing,
    });
  }
};

export const getAllowedOrigins = (bindings: AppBindings) => parseOrigins(bindings.CORS_ALLOW_ORIGINS);

export const isOriginAllowed = (bindings: AppBindings, origin: string | null) => {
  if (!origin) return false;
  const allowed = getAllowedOrigins(bindings);
  if (allowed.includes("*")) return true;
  return allowed.includes(origin);
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitState>();

export const applyRateLimit = (bindings: AppBindings, key: string) => {
  const windowSeconds = Number(bindings.RATE_LIMIT_WINDOW_SECONDS ?? 60);
  const maxRequests = Number(bindings.RATE_LIMIT_MAX_REQUESTS ?? 60);
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      limited: false,
      remaining: maxRequests - 1,
      resetAt: now + windowSeconds * 1000,
    };
  }

  if (current.count >= maxRequests) {
    return {
      limited: true,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);
  return {
    limited: false,
    remaining: maxRequests - current.count,
    resetAt: current.resetAt,
  };
};

export const getClientIp = (headers: Headers) =>
  headers.get("cf-connecting-ip") ??
  headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  "local";

export const isSensitiveRoute = (path: string) => {
  if (path.startsWith("/health") || path.startsWith("/openapi.json") || path.startsWith("/mock/")) {
    return false;
  }
  return true;
};

export const getProviderTimeoutMs = (bindings: AppBindings) =>
  Math.max(1_000, Number(bindings.PROVIDER_HTTP_TIMEOUT_MS ?? 15_000));
