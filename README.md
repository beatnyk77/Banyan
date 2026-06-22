# Banyan

Family asset continuity platform by Founder's Office & Co.

Banyan guides users through a conversational intake to build an encrypted registry of assets, generates a religion-aware will draft with an offline execution kit, stores documents in a client-side encrypted vault, and releases access to verified nominees through a controlled emergency protocol.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript (strict)
- **Supabase** — auth, Postgres, storage, edge functions
- **Razorpay** — checkout + webhooks
- **Anthropic Claude** — conversational intake
- **libsodium** — client-side encryption + Shamir 2-of-3 key ceremony

## Local development

### Prerequisites

- Node.js 20+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- Razorpay test account (for billing flows)

### Setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

1. Start Supabase locally: `supabase start`
2. Copy keys from `supabase status -o env` into the Supabase vars
3. Generate escrow keys: `npm run generate:escrow-keys`
4. Generate token secrets: `openssl rand -hex 32` (run twice for `NOMINEE_TOKEN_SECRET` and `VETO_TOKEN_SECRET`)
5. Add Razorpay test keys and optional `ANTHROPIC_API_KEY`

Apply migrations:

```bash
supabase db reset   # or: supabase migration up
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:db` | DB integration tests (requires local Supabase) |
| `npm run generate:escrow-keys` | Generate NaCl escrow keypair |

## Environment variables

See [.env.local.example](.env.local.example) for the full list. Server routes validate required vars at runtime via `lib/env.ts`.

## Product flows

1. **Signup** → DPDP consent capture → protected dashboard
2. **Intake** → conversational asset registry (encrypted client-side)
3. **Will** → clause-library assembly → execution kit PDF download
4. **Vault** → Shamir key ceremony → encrypted document storage → nominee invites
5. **Billing** → Razorpay checkout with optional CA referral code
6. **Pre-order** → Phase 0 landing-page checkout (₹1,999)
7. **Nominee portal** → `/invite/[token]` — DigiLocker KYC + emergency release request

## Deployment

See [DEPLOY.md](DEPLOY.md) for production deployment to Vercel + Supabase Cloud.

## Legal note

Banyan generates will-ready documents and offline execution kits. It does not execute legally valid digital wills in India. Set `CLAUSE_LIBRARY_SIGNED=true` only after counsel signs the clause library in `skills/clause-assembly-skill/library/clauses.json`.