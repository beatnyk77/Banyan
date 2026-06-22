# Banyan — Production Deployment

Deploy to **Vercel** (Next.js) + **Supabase Cloud** (database, auth, storage, edge functions).

## 1. Supabase Cloud

```bash
supabase login
supabase projects create banyan-prod --org-id <your-org-id>
supabase link --project-ref <project-ref>
supabase db push
```

### Auth configuration

In Supabase Dashboard → Authentication → URL Configuration:

- **Site URL:** `https://your-domain.com`
- **Redirect URLs:** `https://your-domain.com/**`, `http://localhost:3000/**`

Enable email provider. Configure SMTP or use Supabase built-in for production.

### Storage

Migrations create the `vault-documents` bucket with RLS. Verify in Dashboard → Storage.

### Edge function

```bash
supabase secrets set \
  RELEASE_NOTIFY_WEBHOOK_SECRET=<openssl rand -hex 32> \
  RESEND_API_KEY=<your-resend-key> \
  SUPABASE_SERVICE_ROLE_KEY=<from-dashboard>

supabase functions deploy release-event-notify --no-verify-jwt
```

### Database webhook

In Supabase Dashboard → Database → Webhooks:

- **Table:** `release_events`
- **Events:** UPDATE
- **URL:** `https://<project-ref>.supabase.co/functions/v1/release-event-notify`
- **Header:** `X-Webhook-Secret: <RELEASE_NOTIFY_WEBHOOK_SECRET>`
- **Payload:** include `record` with new row data

### Seed CA partner (optional)

```sql
insert into public.ca_partners (name, email, referral_code)
values ('Demo CA', 'ca@example.com', 'CA-DEMO');
```

## 2. Generate secrets

```bash
# Escrow keypair
npm run generate:escrow-keys

# Token secrets
openssl rand -hex 32   # NOMINEE_TOKEN_SECRET
openssl rand -hex 32   # VETO_TOKEN_SECRET
openssl rand -hex 32   # RELEASE_NOTIFY_WEBHOOK_SECRET
openssl rand -hex 32   # RAZORPAY_WEBHOOK_SECRET
```

## 3. Vercel

```bash
vercel link
```

Set all environment variables in Vercel Dashboard → Settings → Environment Variables:

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server only — never expose to client |
| `NEXT_PUBLIC_APP_URL` | Yes | `https://your-domain.com` |
| `ANTHROPIC_API_KEY` | Yes | Claude API for intake |
| `RAZORPAY_KEY_ID` | Yes | Live key for production |
| `RAZORPAY_KEY_SECRET` | Yes | Live secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | From Razorpay webhook config |
| `RESEND_API_KEY` | Yes | Email delivery |
| `BANYAN_ESCROW_PUBKEY` | Yes | From `generate:escrow-keys` |
| `BANYAN_ESCROW_PRIVKEY` | Yes | Store as encrypted env var |
| `NEXT_PUBLIC_BANYAN_ESCROW_PUBKEY` | Yes | Same as pubkey |
| `NOMINEE_TOKEN_SECRET` | Yes | Min 32 chars |
| `VETO_TOKEN_SECRET` | Yes | Min 32 chars |
| `RELEASE_NOTIFY_WEBHOOK_SECRET` | Yes | Same value as edge function secret |
| `DIGILOCKER_CLIENT_ID` | Yes | DigiLocker OAuth app |
| `DIGILOCKER_CLIENT_SECRET` | Yes | DigiLocker OAuth app |
| `CLAUSE_LIBRARY_SIGNED` | Yes | `true` only after lawyer sign-off |
| `ENABLE_SMS` | No | Default `false` |

Deploy:

```bash
vercel --prod
```

## 4. Razorpay webhooks

In Razorpay Dashboard → Webhooks, add:

| URL | Events |
|-----|--------|
| `https://your-domain.com/api/billing/webhook` | `payment.captured` |
| `https://your-domain.com/api/billing/pre-order-webhook` | `payment.captured` |

Use the same `RAZORPAY_WEBHOOK_SECRET` in Vercel env vars.

## 5. Resend

Verify sending domain (e.g. `banyan.fo`) and update the `from` address in:

- `app/api/nominees/route.ts`
- `supabase/functions/release-event-notify/index.ts`
- `skills/billing-skill/gst-invoice.ts`

## 6. DigiLocker

Register an OAuth application at [DigiLocker](https://www.digitallocker.gov.in/). Set redirect URI:

```
https://your-domain.com/api/nominees/kyc/callback
```

## 7. Lawyer sign-off (required for production kits)

1. Counsel reviews `skills/clause-assembly-skill/library/clauses.json`
2. Set `"signed": true` and bump `"version"` in the JSON file
3. Set `CLAUSE_LIBRARY_SIGNED=true` in Vercel
4. Redeploy

Until signed, execution kits are watermarked previews (`X-Kit-Preview: true`).

## 8. Post-deploy smoke test

- [ ] Landing page loads
- [ ] Signup → consent → intake unlock
- [ ] Pre-order checkout (Razorpay test/live)
- [ ] Nominee invite email → `/invite/[token]` portal
- [ ] DigiLocker KYC flow completes
- [ ] Release request → time-lock → veto email to second nominee
- [ ] `npm test` passes in CI

## 9. Remaining external gates

| Gate | Owner | Blocks |
|------|-------|--------|
| Lawyer clause sign-off | Legal counsel | Non-preview kit issuance |
| DigiLocker API approval | MeitY / DigiLocker | Nominee KYC |
| Razorpay live KYC | Razorpay | Live payments |
| Resend domain DNS | Ops | Email delivery |