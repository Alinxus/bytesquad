import type { ProviderName } from "../domain";

type ProviderCapability = {
  provider: ProviderName;
  collectionCountries: string[];
  supportedCurrencies: string[];
  paymentMethodsByCurrency: Record<string, string[]>;
  settlementCountries: string[];
  settlementCurrencies: string[];
  notes: string[];
};

export const providerCapabilities: Record<ProviderName, ProviderCapability> = {
  INTERSWITCH: {
    provider: "INTERSWITCH",
    collectionCountries: [],
    supportedCurrencies: [],
    paymentMethodsByCurrency: {},
    settlementCountries: [],
    settlementCurrencies: [],
    notes: [
      "Interswitch is treated as a support-service provider in this backend.",
      "Use it for verification, KYC enrichment, and reconciliation instead of checkout.",
    ],
  },
  FLUTTERWAVE: {
    provider: "FLUTTERWAVE",
    collectionCountries: [
      "NG",
      "US",
      "GB",
      "GH",
      "KE",
      "UG",
      "RW",
      "TZ",
      "ZA",
      "MW",
      "EG",
      "CM",
      "SN",
      "CI",
    ],
    supportedCurrencies: ["NGN", "USD", "GBP", "EUR", "GHS", "KES", "UGX", "RWF", "TZS", "ZAR", "MWK", "EGP", "XAF", "XOF"],
    paymentMethodsByCurrency: {
      NGN: ["card", "ussd", "banktransfer", "account", "internetbanking", "nqr", "applepay", "googlepay", "enaira", "opay"],
      USD: ["card", "account", "applepay", "googlepay"],
      GBP: ["card", "account", "applepay", "googlepay"],
      EUR: ["card", "account", "applepay", "googlepay"],
      GHS: ["card", "ghanamobilemoney"],
      KES: ["card", "mpesa"],
      UGX: ["card", "mobilemoneyuganda"],
      RWF: ["card", "mobilemoneyrwanda"],
      TZS: ["card", "mobilemoneytanzania"],
      ZAR: ["card", "account", "1voucher", "applepay", "googlepay"],
      MWK: ["card", "mobilemoneymalawi"],
      EGP: ["card", "applepay", "googlepay", "fawrypay"],
      XAF: ["card", "mobilemoneyxaf"],
      XOF: ["card", "mobilemoneyxof"],
    },
    settlementCountries: ["NG"],
    settlementCurrencies: ["NGN"],
    notes: [
      "Some Flutterwave methods require account approval before go-live.",
      "This backend currently treats settlement as Nigeria-only even if collection is broader.",
    ],
  },
};

const normalizeMethod = (method: string) => method.toLowerCase().replaceAll("_", "").replaceAll(" ", "");

export const getSupportedMethods = (provider: ProviderName, currency: string) =>
  providerCapabilities[provider].paymentMethodsByCurrency[currency] ?? [];

export const isSupportedMethod = (provider: ProviderName, currency: string, method: string) =>
  getSupportedMethods(provider, currency).some((candidate) => normalizeMethod(candidate) === normalizeMethod(method));

export const pickProviderForCurrency = (_currency: string): ProviderName => "FLUTTERWAVE";

export const validateCollectionCorridor = (provider: ProviderName, currency: string, methods: string[]) => {
  const capability = providerCapabilities[provider];
  if (!capability.supportedCurrencies.includes(currency)) {
    return {
      ok: false,
      reason: `${provider} does not support ${currency} collection in this backend.`,
    };
  }
  const unsupported = methods.filter((method) => !isSupportedMethod(provider, currency, method));
  if (unsupported.length > 0) {
    return {
      ok: false,
      reason: `${provider} does not support ${unsupported.join(", ")} for ${currency}.`,
    };
  }
  return { ok: true as const };
};

export const getSettlementCapability = () => ({
  countries: ["NG"],
  currencies: ["NGN"],
  notes: [
    "Auto-settlement is implemented for Nigerian payout accounts only.",
    "Global collection does not imply global live settlement in this backend.",
  ],
});

export const getDefaultMethodsForCurrency = (currency: string) => {
  if (currency === "NGN") return ["card", "bank_transfer"];
  return ["card"];
};
