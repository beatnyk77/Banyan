alter table public.users enable row level security;
create policy "users_self_all" on public.users for all using (auth.uid() = id);

alter table public.estates enable row level security;
create policy "estates_owner_all" on public.estates
  for all using (auth.uid() = user_id);

alter table public.assets enable row level security;
create policy "assets_owner_all" on public.assets
  for all using (
    estate_id in (select id from public.estates where user_id = auth.uid())
  );

alter table public.documents enable row level security;
create policy "documents_owner_all" on public.documents
  for all using (
    estate_id in (select id from public.estates where user_id = auth.uid())
  );

alter table public.vault_keys enable row level security;
create policy "vault_keys_owner_all" on public.vault_keys
  for all using (auth.uid() = user_id);

alter table public.nominees enable row level security;
create policy "nominees_owner_all" on public.nominees
  for all using (
    estate_id in (select id from public.estates where user_id = auth.uid())
  );

alter table public.wills enable row level security;
create policy "wills_owner_all" on public.wills
  for all using (
    estate_id in (select id from public.estates where user_id = auth.uid())
  );

alter table public.release_events enable row level security;
create policy "release_events_owner_all" on public.release_events
  for all using (
    estate_id in (select id from public.estates where user_id = auth.uid())
  );

alter table public.release_event_log enable row level security;
create policy "release_log_owner_read" on public.release_event_log
  for select using (
    release_event_id in (
      select re.id from public.release_events re
      join public.estates e on e.id = re.estate_id
      where e.user_id = auth.uid()
    )
  );

alter table public.referrals enable row level security;
create policy "referrals_user_read" on public.referrals
  for select using (auth.uid() = user_id);

alter table public.ca_partners enable row level security;

-- Phase 0 pre_orders: deny direct client access; API routes use service role only
alter table public.pre_orders enable row level security;