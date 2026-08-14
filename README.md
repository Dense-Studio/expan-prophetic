# EXPAN Prophetic Registration

Registration, event check-in, secure administration and reliable Arkesel bulk SMS campaigns for EXPAN.

## Local development

1. Copy `.env.example` to `.env` and fill in the development values.
2. Use `vercel dev` when testing registration, check-in, admin or SMS APIs. Plain `npm run dev` serves only the Vite frontend.
3. Run `npm test` and `npm run build` before deployment.

## Reliable SMS rollout

Bulk sending is deny-by-default. `SMS_BULK_ENABLED` must remain `false` until all steps below pass.

1. Create a Supabase backup.
2. Run `supabase_reliable_sms_migration.sql` in the Supabase SQL editor. This provisions the campaign system without changing the legacy public policies.
3. Add the server-only Vercel environment variables listed in `.env.example`. Never prefix secrets with `VITE_`.
4. Deploy with `ARKESEL_SANDBOX=true` and `SMS_BULK_ENABLED=false`; verify secure login, registration and check-in.
5. Run `supabase_admin_rls_lockdown.sql`, then repeat the login, registration and check-in checks. This is the point where direct anonymous table access is removed.
6. In Supabase Vault, create `expan_app_url` and `expan_sms_worker_secret`, then run the commented `cron.schedule` block at the end of the reliable SMS migration.
7. Temporarily set `SMS_BULK_ENABLED=true` while sandbox remains enabled. Create a small campaign and verify batching, history and callbacks without billing.
8. Set `ARKESEL_SANDBOX=false`, deploy, and send a three-number pilot only after confirming the Arkesel balance and sender ID.
9. Once the pilot reports correctly, leave `SMS_BULK_ENABLED=true` for production campaigns.

## Campaign safety behavior

- Campaign audiences are immutable snapshots of the active admin filters.
- Ghana numbers are normalized and deduplicated before credits are calculated.
- Explicit provider throttling and server errors retry three times. Ambiguous timeouts are held for review to prevent accidental duplicate messages.
- Only `NOT_DELIVERED` and `EXPIRED` recipients can be retried from admin.
- Cancelling affects queued recipients only; accepted messages cannot be recalled.
- Arkesel callbacks update delivery status and the recovery worker reconciles unsettled provider IDs.
