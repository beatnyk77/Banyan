create table public.pre_orders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  referral_code text,
  razorpay_payment_id text,
  razorpay_order_id text,
  amount_paise integer,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'refunded')),
  created_at timestamptz default now()
);

-- No RLS needed: written only via service-role API routes
