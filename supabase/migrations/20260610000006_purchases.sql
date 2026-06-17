create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan text not null check (plan in ('will', 'vault_annual', 'family_annual')),
  amount_paise integer not null,
  razorpay_order_id text not null unique,
  razorpay_payment_id text,
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'failed', 'refunded')
  ),
  referral_code text,
  gst_invoice_sent_at timestamptz,
  created_at timestamptz default now(),
  paid_at timestamptz
);

create index purchases_user_id_idx on public.purchases (user_id);
create index purchases_order_id_idx on public.purchases (razorpay_order_id);

alter table public.purchases enable row level security;

create policy "purchases_owner_read" on public.purchases
  for select using (auth.uid() = user_id);

grant select, insert, update on public.purchases to authenticated, service_role;