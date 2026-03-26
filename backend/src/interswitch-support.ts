import type { AppBindings } from "./bindings";
import { getProviderTimeoutMs } from "./lib/runtime";

const requireConfig = (value: string | undefined, name: string) => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing Interswitch config: ${name}`);
  }
  return value;
};

const jsonFetch = async (
  url: string,
  init: RequestInit,
  timeoutMs: number,
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    if (!response.ok) {
      throw new Error(`Interswitch support API failed (${response.status})`);
    }
    return data as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
  }
};

const getBasicAuthHeader = (bindings: AppBindings) => {
  const clientId = requireConfig(bindings.INTERSWITCH_CLIENT_ID, "INTERSWITCH_CLIENT_ID");
  const secret = requireConfig(bindings.INTERSWITCH_SECRET_KEY, "INTERSWITCH_SECRET_KEY");
  return `Basic ${btoa(`${clientId}:${secret}`)}`;
};

const postWithBasicAuth = (bindings: AppBindings, url: string, body: Record<string, unknown>) =>
  jsonFetch(
    url,
    {
      method: "POST",
      headers: {
        authorization: getBasicAuthHeader(bindings),
      },
      body: JSON.stringify(body),
    },
    getProviderTimeoutMs(bindings),
  );

export const verifyBankAccountWithInterswitch = async (
  bindings: AppBindings,
  input: { bankCode: string; accountNumber: string },
) => {
  if (!bindings.INTERSWITCH_BANK_VERIFY_URL) {
    return {
      supported: false,
      reason: "INTERSWITCH_BANK_VERIFY_URL not configured.",
    };
  }
  const data = await postWithBasicAuth(bindings, bindings.INTERSWITCH_BANK_VERIFY_URL, {
    bankCode: input.bankCode,
    accountNumber: input.accountNumber,
    terminalId: bindings.INTERSWITCH_TERMINAL_ID ?? null,
  });
  return {
    supported: true,
    accountName: String(data.accountName ?? data.account_name ?? ""),
    bankName: String(data.bankName ?? data.bank_name ?? ""),
    raw: data,
  };
};

export const verifyBvnWithInterswitch = async (
  bindings: AppBindings,
  input: { bvn: string; firstName?: string; lastName?: string; dateOfBirth?: string },
) => {
  if (!bindings.INTERSWITCH_BVN_VERIFY_URL) {
    return {
      supported: false,
      reason: "INTERSWITCH_BVN_VERIFY_URL not configured.",
    };
  }
  const data = await postWithBasicAuth(bindings, bindings.INTERSWITCH_BVN_VERIFY_URL, input);
  return {
    supported: true,
    isValid: Boolean(data.isValid ?? data.valid ?? data.match ?? false),
    raw: data,
  };
};

export const verifyNinWithInterswitch = async (
  bindings: AppBindings,
  input: { nin: string },
) => {
  if (!bindings.INTERSWITCH_NIN_VERIFY_URL) {
    return {
      supported: false,
      reason: "INTERSWITCH_NIN_VERIFY_URL not configured.",
    };
  }
  const data = await postWithBasicAuth(bindings, bindings.INTERSWITCH_NIN_VERIFY_URL, input);
  return {
    supported: true,
    isValid: Boolean(data.isValid ?? data.valid ?? data.match ?? false),
    raw: data,
  };
};

export const searchTransactionWithInterswitch = async (
  bindings: AppBindings,
  input: { providerReference: string },
) => {
  if (!bindings.INTERSWITCH_TRANSACTION_SEARCH_URL) {
    return {
      supported: false,
      reason: "INTERSWITCH_TRANSACTION_SEARCH_URL not configured.",
    };
  }
  const data = await jsonFetch(
    `${bindings.INTERSWITCH_TRANSACTION_SEARCH_URL}?reference=${encodeURIComponent(input.providerReference)}`,
    {
      method: "GET",
      headers: {
        authorization: getBasicAuthHeader(bindings),
      },
    },
    getProviderTimeoutMs(bindings),
  );
  return {
    supported: true,
    raw: data,
  };
};
