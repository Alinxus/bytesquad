# Nera Backend

Cloudflare Workers backend for Nera's checkout-first financial ops MVP.

## Stack

- Hono for the HTTP API
- Neon Postgres + Drizzle ORM for persistence
- Cloudflare Workers for runtime
- Cloudflare Queues for async webhook and payout jobs
- Cloudflare R2 for KYC documents and generated reports

## Core Features

- Auth with access and refresh tokens
- Solo-freelancer workspace model with future-ready team tables
- KYC profile and document upload flow
- Customer, invoice, and hosted checkout session APIs
- Flutterwave checkout plus Interswitch support integrations
- Webhook verification, idempotent payment processing, and ledger-backed balances
- Withdrawal requests with Interswitch payout execution
- PDF statements and CSV transaction exports
- Collection capability matrix and settlement corridor validation APIs
- OpenAPI spec at `/openapi.json`

## Scripts

- `npm run dev`
- `npm run check`
- `npm test`
- `npm run db:generate`
- `npm run db:push`

## Environment

Set these in Wrangler secrets/vars for non-mock use:

- `DATABASE_URL`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `DATA_ENCRYPTION_KEY`
- `FLUTTERWAVE_SECRET_KEY`
- `FLUTTERWAVE_PUBLIC_KEY`
- `FLUTTERWAVE_WEBHOOK_SECRET`
- `RATE_LIMIT_WINDOW_SECONDS`
- `RATE_LIMIT_MAX_REQUESTS`
- `CORS_ALLOW_ORIGINS`
- `PROVIDER_HTTP_TIMEOUT_MS`
- `OPS_API_KEY`

Optional Interswitch support-service vars:

- `INTERSWITCH_CLIENT_ID`
- `INTERSWITCH_SECRET_KEY`
- `INTERSWITCH_WEBHOOK_SECRET`
- `INTERSWITCH_TERMINAL_ID`
- `INTERSWITCH_TRANSACTION_SEARCH_URL`
- `INTERSWITCH_BANK_VERIFY_URL`
- `INTERSWITCH_BVN_VERIFY_URL`
- `INTERSWITCH_NIN_VERIFY_URL`

`PROVIDER_MODE=mock` is enabled by default for local development.

Use `.dev.vars.example` as the starting point for local secrets.

## Sandbox-Live Checklist

1. Copy `.dev.vars.example` to `.dev.vars` and fill in sandbox credentials.
2. Switch `PROVIDER_MODE=live` only after all required values are present.
3. Create your Neon database and run `npm run db:push`.
4. Provision the Cloudflare Queue and both R2 buckets referenced in `wrangler.jsonc`.
5. Run `npm run dev` and confirm `/health` returns `liveReady: true` before testing payments.
6. Test one Flutterwave global checkout path end-to-end, then validate any Interswitch verification or payout integrations you enable.
7. Set `CORS_ALLOW_ORIGINS` to your frontend domains before exposing the API publicly.

## Current Limits

- Provider endpoints are wired, but you still need to confirm exact payload shapes and auth headers against your own sandbox accounts.
- Rate limiting is still in-memory per Worker instance, which is acceptable for local/sandbox and early production but not the final distributed throttle design.
- KYC is still a manual-review placeholder rather than a complete compliance system.
- The new tax summary and FX quote endpoints are planning/estimate tools, not regulated tax filing or guaranteed settlement quotes.
- The backend now enforces a conservative corridor model: broad collection support is provider-dependent, and live settlement is still Nigeria-only.
- Interswitch is no longer required for checkout collection; merchant code and pay item id are only relevant if you re-enable Interswitch checkout later.
