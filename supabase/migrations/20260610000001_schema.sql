-- users: DPDP consent fields included
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  date_of_birth date,
  religion text check (religion in ('hindu','christian','parsi','muslim','other')),
  consent_given_at timestamptz,
  consent_purpose text default 'succession_document_generation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- estates: NO intake_conversation column (conversation is transient RAM only)
create table public.estates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  intake_state text not null default 'welcome',
  estate_json_enc text,
  estate_envelope_meta jsonb,
  intake_completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  asset_class text not null check (asset_class in (
    'bank','mutual_fund','insurance','property','epf_ppf',
    'demat','locker','crypto','vehicle','loan','digital_account','domain'
  )),
  institution text,
  aa_source boolean not null default false,
  claim_process_meta jsonb,
  asset_payload_enc text,
  asset_envelope_meta jsonb,
  wallet_meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  doc_type text not null check (doc_type in (
    'property_deed','insurance_policy','bank_statement',
    'photo_id','will_draft','execution_kit','other'
  )),
  file_name text not null,
  storage_path text not null,
  envelope_meta jsonb not null,
  file_size_bytes integer,
  created_at timestamptz default now()
);

create table public.vault_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade unique,
  kdf_salt text not null,
  kdf_opslimit integer not null,
  kdf_memlimit integer not null,
  user_share_enc text not null,
  escrow_share_enc text not null,
  kit_issued boolean not null default false,
  kit_issued_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.nominees (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  relationship text,
  invite_token text unique default encode(gen_random_bytes(32), 'hex'),
  invite_sent_at timestamptz,
  kyc_status text not null default 'pending' check (
    kyc_status in ('pending','invited','kyc_submitted','kyc_verified','rejected')
  ),
  digilocker_ref text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.wills (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  version integer not null default 1,
  clause_set_hash text not null,
  clause_library_version text not null,
  religion_branch text not null,
  status text not null default 'draft' check (
    status in ('draft','kit_issued','executed_confirmed')
  ),
  will_doc_path text,
  kit_doc_path text,
  envelope_meta jsonb,
  generated_at timestamptz default now(),
  kit_issued_at timestamptz,
  executed_confirmed_at timestamptz
);

create table public.release_events (
  id uuid primary key default gen_random_uuid(),
  estate_id uuid not null references public.estates(id) on delete cascade,
  initiator_nominee_id uuid references public.nominees(id),
  status text not null default 'requested' check (
    status in (
      'requested','death_cert_submitted','ops_review',
      'time_lock','approved','rejected','completed'
    )
  ),
  death_certificate_path text,
  ops_notes text,
  time_lock_expires_at timestamptz,
  notified_nominees jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.release_event_log (
  id uuid primary key default gen_random_uuid(),
  release_event_id uuid not null references public.release_events(id),
  from_status text,
  to_status text not null,
  actor text not null,
  notes text,
  logged_at timestamptz default now()
);

create table public.ca_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  icai_membership_no text,
  referral_code text not null unique,
  commission_rate numeric(4,2) not null default 0.25,
  white_label_subdomain text,
  white_label_config jsonb,
  payout_ledger jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  ca_partner_id uuid not null references public.ca_partners(id),
  user_id uuid references public.users(id),
  referral_code text not null,
  plan_purchased text,
  amount_paid_paise integer,
  commission_amount_paise integer,
  commission_status text not null default 'pending' check (
    commission_status in ('pending','approved','settled')
  ),
  razorpay_order_id text,
  embed_source text,
  created_at timestamptz default now()
);