CREATE TYPE "public"."checkout_status" AS ENUM('CREATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('DRAFT', 'OPEN', 'PAID', 'VOID', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."ledger_account_code" AS ENUM('USER_PENDING', 'USER_AVAILABLE', 'USER_RESERVED', 'EXTERNAL_CLEARING', 'PAYOUT_CLEARING', 'PROVIDER_FEES', 'PAYOUT_FEES');--> statement-breakpoint
CREATE TYPE "public"."ledger_transaction_type" AS ENUM('COLLECTION', 'AVAILABILITY', 'PAYOUT', 'REVERSAL');--> statement-breakpoint
CREATE TYPE "public"."payout_mode" AS ENUM('HOLD_BALANCE', 'AUTO_SETTLE');--> statement-breakpoint
CREATE TYPE "public"."provider_name" AS ENUM('INTERSWITCH', 'FLUTTERWAVE');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('STATEMENT_PDF', 'TRANSACTIONS_CSV');--> statement-breakpoint
CREATE TYPE "public"."webhook_processing_status" AS ENUM('RECEIVED', 'PROCESSED', 'DUPLICATE', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "balances" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"currency" text NOT NULL,
	"pending_minor" integer DEFAULT 0 NOT NULL,
	"available_minor" integer DEFAULT 0 NOT NULL,
	"reserved_minor" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checkout_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"provider" "provider_name" NOT NULL,
	"provider_reference" text NOT NULL,
	"checkout_url" text NOT NULL,
	"status" "checkout_status" NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"company_name" text,
	"country_code" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"customer_id" text,
	"invoice_number" text NOT NULL,
	"status" "invoice_status" NOT NULL,
	"currency" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" text,
	"allowed_methods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"public_token" text NOT NULL,
	"provider_preference" "provider_name",
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"kyc_profile_id" text NOT NULL,
	"document_type" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"bucket_key" text NOT NULL,
	"status" "kyc_status" NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kyc_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"status" "kyc_status" NOT NULL,
	"legal_name" text,
	"country_code" text NOT NULL,
	"date_of_birth" text,
	"address_line1" text,
	"city" text,
	"region" text,
	"postal_code" text,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ledger_postings" (
	"id" text PRIMARY KEY NOT NULL,
	"ledger_transaction_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"account_code" "ledger_account_code" NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ledger_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"transaction_type" "ledger_transaction_type" NOT NULL,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"reference" text NOT NULL,
	"gross_amount_minor" integer NOT NULL,
	"gross_currency" text NOT NULL,
	"provider_fee_minor" integer NOT NULL,
	"payout_fee_minor" integer NOT NULL,
	"net_amount_minor" integer NOT NULL,
	"net_currency" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payout_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"provider" "provider_name" NOT NULL,
	"country_code" text NOT NULL,
	"currency" text NOT NULL,
	"bank_code" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_name" text NOT NULL,
	"account_number_last4" text NOT NULL,
	"account_number_encrypted" text NOT NULL,
	"is_default" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payout_transfers" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"withdrawal_id" text NOT NULL,
	"provider" "provider_name" NOT NULL,
	"provider_reference" text NOT NULL,
	"status" "withdrawal_status" NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"fee_minor" integer NOT NULL,
	"destination_country_code" text NOT NULL,
	"raw_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"invoice_id" text,
	"checkout_session_id" text,
	"provider" "provider_name" NOT NULL,
	"provider_reference" text NOT NULL,
	"external_status" text NOT NULL,
	"event_type" text NOT NULL,
	"source_amount_minor" integer NOT NULL,
	"source_currency" text NOT NULL,
	"settled_amount_minor" integer NOT NULL,
	"settled_currency" text NOT NULL,
	"provider_fee_minor" integer NOT NULL,
	"provider_fee_currency" text NOT NULL,
	"payment_method" text,
	"payer_email" text,
	"payer_country" text,
	"verified_at" timestamp with time zone,
	"failure_reason" text,
	"raw_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_exports" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"type" "report_type" NOT NULL,
	"period_key" text NOT NULL,
	"status" "report_status" NOT NULL,
	"bucket_key" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "split_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"rule_type" text NOT NULL,
	"value_bps" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" "provider_name" NOT NULL,
	"event_id" text NOT NULL,
	"provider_reference" text,
	"event_type" text NOT NULL,
	"signature_valid" boolean NOT NULL,
	"payload" text NOT NULL,
	"processing_status" "webhook_processing_status" NOT NULL,
	"error_message" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "withdrawals" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"payout_account_id" text NOT NULL,
	"provider" "provider_name" NOT NULL,
	"amount_minor" integer NOT NULL,
	"currency" text NOT NULL,
	"fee_minor" integer NOT NULL,
	"status" "withdrawal_status" NOT NULL,
	"provider_reference" text,
	"failure_reason" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_members" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"slug" text NOT NULL,
	"business_name" text NOT NULL,
	"country_code" text NOT NULL,
	"base_currency" text NOT NULL,
	"payout_mode" "payout_mode" NOT NULL,
	"auto_settle_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "balances_workspace_currency_idx" ON "balances" USING btree ("workspace_id","currency");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "checkout_sessions_provider_reference_idx" ON "checkout_sessions" USING btree ("provider_reference");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_public_token_idx" ON "invoices" USING btree ("public_token");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kyc_profiles_workspace_idx" ON "kyc_profiles" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "provider_transactions_provider_reference_idx" ON "provider_transactions" USING btree ("provider_reference");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "refresh_tokens_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_provider_event_idx" ON "webhook_events" USING btree ("provider","event_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_slug_idx" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_owner_user_idx" ON "workspaces" USING btree ("owner_user_id");