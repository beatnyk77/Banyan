-- Table-level grants required for Supabase API roles (RLS filters row access)
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on public.users to authenticated, service_role;
grant select, insert, update, delete on public.estates to authenticated, service_role;
grant select, insert, update, delete on public.assets to authenticated, service_role;
grant select, insert, update, delete on public.documents to authenticated, service_role;
grant select, insert, update, delete on public.vault_keys to authenticated, service_role;
grant select, insert, update, delete on public.nominees to authenticated, service_role;
grant select, insert, update, delete on public.wills to authenticated, service_role;
grant select, insert, update, delete on public.release_events to authenticated, service_role;
grant select on public.release_event_log to authenticated, service_role;
grant insert, delete on public.release_event_log to service_role;
grant select on public.referrals to authenticated, service_role;
grant all on public.referrals to service_role;
grant all on public.ca_partners to service_role;

-- pre_orders: service role only (no client policies)
grant all on public.pre_orders to service_role;