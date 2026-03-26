import type { AppBindings } from "./bindings";
import type {
  ParsedWebhook,
  ProviderCheckoutInput,
  ProviderCheckoutResult,
  ProviderName,
  ProviderPayoutInput,
  ProviderPayoutResult,
  ProviderVerificationResult,
} from "./domain";
import { addDays, makeId, signHmacHex } from "./lib/security";
import { getProviderTimeoutMs } from "./lib/runtime";

const requireProviderConfig = (value: string | undefined, name: string) => {
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing provider config: ${name}`);
  }
  return value;
};

export interface PaymentProviderAdapter {
  readonly provider: ProviderName;
  createCheckoutSession(bindings: AppBindings, input: ProviderCheckoutInput): Promise<ProviderCheckoutResult>;
  verifyTransaction(bindings: AppBindings, providerReference: string): Promise<ProviderVerificationResult>;
  parseWebhook(
    bindings: AppBindings,
    rawBody: string,
    headers: Headers,
  ): Promise<ParsedWebhook>;
  createPayout(bindings: AppBindings, input: ProviderPayoutInput): Promise<ProviderPayoutResult>;
}

const jsonRequest = async (
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
      throw new Error(`Provider request failed (${response.status})`);
    }
    return data as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Provider request timed out.");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

class InterswitchAdapter implements PaymentProviderAdapter {
  readonly provider = "INTERSWITCH" as const;

  async createCheckoutSession(
    bindings: AppBindings,
    input: ProviderCheckoutInput,
  ): Promise<ProviderCheckoutResult> {
    const providerReference = `isw_${makeId("chk")}`;
    if ((bindings.PROVIDER_MODE ?? "mock") === "mock") {
      return {
        provider: this.provider,
        providerReference,
        checkoutUrl: `${bindings.APP_URL}/mock/interswitch/${providerReference}`,
        expiresAt: addDays(new Date().toISOString(), 1),
      };
    }
    requireProviderConfig(bindings.INTERSWITCH_CLIENT_ID, "INTERSWITCH_CLIENT_ID");
    requireProviderConfig(bindings.INTERSWITCH_SECRET_KEY, "INTERSWITCH_SECRET_KEY");
    requireProviderConfig(bindings.INTERSWITCH_MERCHANT_CODE, "INTERSWITCH_MERCHANT_CODE");
    requireProviderConfig(bindings.INTERSWITCH_PAY_ITEM_ID, "INTERSWITCH_PAY_ITEM_ID");

    return {
      provider: this.provider,
      providerReference,
      checkoutUrl: `${bindings.APP_URL}/redirect/interswitch/${providerReference}`,
      expiresAt: addDays(new Date().toISOString(), 1),
    };
  }

  async verifyTransaction(
    bindings: AppBindings,
    providerReference: string,
  ): Promise<ProviderVerificationResult> {
    if ((bindings.PROVIDER_MODE ?? "mock") === "mock") {
      return {
        provider: this.provider,
        providerReference,
        externalStatus: "SUCCESSFUL",
        eventType: "payment.success",
        sourceAmountMinor: 100_000,
        sourceCurrency: "NGN",
        settledAmountMinor: 98_500,
        settledCurrency: "NGN",
        providerFeeMinor: 1_500,
        providerFeeCurrency: "NGN",
        paymentMethod: "BANK_TRANSFER",
        payerEmail: "payer@example.com",
        payerCountry: "NG",
        rawData: { mode: "mock", providerReference },
        isSuccessful: true,
      };
    }

    const baseUrl = bindings.INTERSWITCH_BASE_URL ?? "https://sandbox.interswitchng.com/api";
    const secretKey = requireProviderConfig(bindings.INTERSWITCH_SECRET_KEY, "INTERSWITCH_SECRET_KEY");
    const clientId = requireProviderConfig(bindings.INTERSWITCH_CLIENT_ID, "INTERSWITCH_CLIENT_ID");
    const data = await jsonRequest(
      `${baseUrl}/v1/webpay/transactions/${encodeURIComponent(providerReference)}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${secretKey}`,
          "x-client-id": clientId,
        },
      },
      getProviderTimeoutMs(bindings),
    );

    const status = String(data.status ?? "UNKNOWN");
    const amountMinor = Number(data.amountMinor ?? data.amount ?? 0);
    const feeMinor = Number(data.feeMinor ?? data.fee ?? 0);

    return {
      provider: this.provider,
      providerReference,
      externalStatus: status,
      eventType: "payment.verify",
      sourceAmountMinor: amountMinor,
      sourceCurrency: String(data.currency ?? "NGN"),
      settledAmountMinor: amountMinor - feeMinor,
      settledCurrency: String(data.settlementCurrency ?? data.currency ?? "NGN"),
      providerFeeMinor: feeMinor,
      providerFeeCurrency: String(data.feeCurrency ?? data.currency ?? "NGN"),
      paymentMethod: String(data.paymentMethod ?? "BANK_TRANSFER"),
      payerEmail: data.customerEmail ? String(data.customerEmail) : null,
      payerCountry: data.customerCountry ? String(data.customerCountry) : null,
      rawData: data,
      isSuccessful: status.toUpperCase() === "SUCCESSFUL",
      failureReason: status.toUpperCase() === "SUCCESSFUL" ? null : String(data.failureReason ?? "Verification failed"),
    };
  }

  async parseWebhook(bindings: AppBindings, rawBody: string, headers: Headers): Promise<ParsedWebhook> {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const signatureHeader =
      headers.get("x-interswitch-signature") ?? headers.get("x-signature") ?? "";
    const expected = bindings.INTERSWITCH_WEBHOOK_SECRET
      ? await signHmacHex(rawBody, bindings.INTERSWITCH_WEBHOOK_SECRET)
      : "";

    return {
      provider: this.provider,
      eventId: String(payload.eventId ?? payload.id ?? makeId("evt")),
      providerReference: payload.tx_ref
        ? String(payload.tx_ref)
        : payload.reference
          ? String(payload.reference)
          : null,
      eventType: String(payload.eventType ?? payload.status ?? "payment.webhook"),
      signatureValid: expected ? expected === signatureHeader : true,
      payload,
    };
  }

  async createPayout(bindings: AppBindings, input: ProviderPayoutInput): Promise<ProviderPayoutResult> {
    const providerReference = `iswpo_${makeId("payout")}`;
    if ((bindings.PROVIDER_MODE ?? "mock") === "mock") {
      return {
        provider: this.provider,
        providerReference,
        status: "COMPLETED",
        feeMinor: 100,
        rawData: { mode: "mock", providerReference },
      };
    }

    const baseUrl = bindings.INTERSWITCH_BASE_URL ?? "https://sandbox.interswitchng.com/api";
    const secretKey = requireProviderConfig(bindings.INTERSWITCH_SECRET_KEY, "INTERSWITCH_SECRET_KEY");
    const clientId = requireProviderConfig(bindings.INTERSWITCH_CLIENT_ID, "INTERSWITCH_CLIENT_ID");
    const accountNumber = input.payoutAccount.accountNumberEncrypted;
    const data = await jsonRequest(`${baseUrl}/v1/payouts`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secretKey}`,
        "x-client-id": clientId,
      },
      body: JSON.stringify({
        amount: input.amountMinor,
        currency: input.currency,
        reference: providerReference,
        destination: {
          bankCode: input.payoutAccount.bankCode,
          accountNumber,
          accountName: input.payoutAccount.accountName,
        },
      }),
    }, getProviderTimeoutMs(bindings));

    return {
      provider: this.provider,
      providerReference,
      status: String(data.status ?? "PROCESSING").toUpperCase() === "SUCCESSFUL" ? "COMPLETED" : "PROCESSING",
      feeMinor: Number(data.feeMinor ?? data.fee ?? 0),
      rawData: data,
    };
  }
}

class FlutterwaveAdapter implements PaymentProviderAdapter {
  readonly provider = "FLUTTERWAVE" as const;

  async createCheckoutSession(
    bindings: AppBindings,
    input: ProviderCheckoutInput,
  ): Promise<ProviderCheckoutResult> {
    const providerReference = `flw_${makeId("chk")}`;
    if ((bindings.PROVIDER_MODE ?? "mock") === "mock") {
      return {
        provider: this.provider,
        providerReference,
        checkoutUrl: `${bindings.APP_URL}/mock/flutterwave/${providerReference}`,
        expiresAt: addDays(new Date().toISOString(), 1),
      };
    }

    const baseUrl = bindings.FLUTTERWAVE_BASE_URL ?? "https://api.flutterwave.com/v3";
    const secretKey = requireProviderConfig(bindings.FLUTTERWAVE_SECRET_KEY, "FLUTTERWAVE_SECRET_KEY");
    const data = await jsonRequest(`${baseUrl}/payments`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        tx_ref: providerReference,
        amount: input.invoice.amountMinor / 100,
        currency: input.invoice.currency,
        redirect_url: input.returnUrl,
        payment_options: input.invoice.allowedMethods.join(",") || "card,banktransfer",
        customer: {
          email: input.customer?.email ?? input.workspace.slug + "@nera.local",
          name: input.customer?.name ?? input.workspace.businessName,
        },
        customizations: {
          title: input.invoice.title,
          description: input.invoice.description ?? input.invoice.title,
        },
      }),
    }, getProviderTimeoutMs(bindings));

    const dataRoot = (data.data ?? data) as Record<string, unknown>;

    return {
      provider: this.provider,
      providerReference,
      checkoutUrl: String(dataRoot.link ?? input.returnUrl),
      expiresAt: addDays(new Date().toISOString(), 1),
    };
  }

  async verifyTransaction(
    bindings: AppBindings,
    providerReference: string,
  ): Promise<ProviderVerificationResult> {
    if ((bindings.PROVIDER_MODE ?? "mock") === "mock") {
      return {
        provider: this.provider,
        providerReference,
        externalStatus: "successful",
        eventType: "charge.completed",
        sourceAmountMinor: 250_000,
        sourceCurrency: "USD",
        settledAmountMinor: 245_000,
        settledCurrency: bindings.DEFAULT_SETTLEMENT_CURRENCY ?? "NGN",
        providerFeeMinor: 5_000,
        providerFeeCurrency: "USD",
        paymentMethod: "card",
        payerEmail: "global-client@example.com",
        payerCountry: "US",
        rawData: { mode: "mock", providerReference },
        isSuccessful: true,
      };
    }

    const baseUrl = bindings.FLUTTERWAVE_BASE_URL ?? "https://api.flutterwave.com/v3";
    const secretKey = requireProviderConfig(bindings.FLUTTERWAVE_SECRET_KEY, "FLUTTERWAVE_SECRET_KEY");
    const data = await jsonRequest(
      `${baseUrl}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(providerReference)}`,
      {
        method: "GET",
        headers: {
          authorization: `Bearer ${secretKey}`,
        },
      },
      getProviderTimeoutMs(bindings),
    );
    const dataRoot = (data.data ?? data) as Record<string, unknown>;
    const status = String(dataRoot.status ?? data.status ?? "unknown");
    const amount = Number(dataRoot.amount ?? 0);
    const fee = Number(dataRoot.app_fee ?? dataRoot.fee ?? 0);

    return {
      provider: this.provider,
      providerReference,
      externalStatus: status,
      eventType: String(dataRoot.event_type ?? "charge.completed"),
      sourceAmountMinor: Math.round(amount * 100),
      sourceCurrency: String(dataRoot.currency ?? "USD"),
      settledAmountMinor: Math.round((Number(dataRoot.amount_settled ?? amount - fee)) * 100),
      settledCurrency: String(dataRoot.settlement_currency ?? bindings.DEFAULT_SETTLEMENT_CURRENCY ?? "NGN"),
      providerFeeMinor: Math.round(fee * 100),
      providerFeeCurrency: String(dataRoot.fee_currency ?? dataRoot.currency ?? "USD"),
      paymentMethod: dataRoot.payment_type ? String(dataRoot.payment_type) : null,
      payerEmail: dataRoot.customer && typeof dataRoot.customer === "object" && "email" in dataRoot.customer
        ? String((dataRoot.customer as { email?: string }).email ?? "")
        : null,
      payerCountry: dataRoot.ip_country ? String(dataRoot.ip_country) : null,
      rawData: dataRoot,
      isSuccessful: status.toLowerCase() === "successful",
      failureReason: status.toLowerCase() === "successful" ? null : String(dataRoot.processor_response ?? "Verification failed"),
    };
  }

  async parseWebhook(bindings: AppBindings, rawBody: string, headers: Headers): Promise<ParsedWebhook> {
    const payload = JSON.parse(rawBody) as Record<string, unknown>;
    const signatureHeader = headers.get("verif-hash") ?? "";
    const expected = bindings.FLUTTERWAVE_WEBHOOK_SECRET ?? "";
    const payloadData = (payload.data ?? payload) as Record<string, unknown>;

    return {
      provider: this.provider,
      eventId: String(payload.id ?? payloadData.id ?? makeId("evt")),
      providerReference: payloadData.tx_ref ? String(payloadData.tx_ref) : null,
      eventType: String(payload.event ?? payload.type ?? "charge.completed"),
      signatureValid: expected ? expected === signatureHeader : true,
      payload,
    };
  }

  async createPayout(): Promise<ProviderPayoutResult> {
    throw new Error("Flutterwave payouts are not enabled in v1; use Interswitch for NGN settlements.");
  }
}

export const interswitchAdapter = new InterswitchAdapter();
export const flutterwaveAdapter = new FlutterwaveAdapter();

export const providerMap: Record<ProviderName, PaymentProviderAdapter> = {
  INTERSWITCH: interswitchAdapter,
  FLUTTERWAVE: flutterwaveAdapter,
};
