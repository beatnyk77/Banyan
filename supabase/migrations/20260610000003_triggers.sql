-- Auto-create public.users row when auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- AUDIT TRIGGER — HTTP notification via Supabase Database Webhook (dashboard-configured)
create or replace function public.on_release_event_audit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.release_event_log(
    release_event_id, from_status, to_status, actor, logged_at
  ) values (
    new.id,
    case when tg_op = 'INSERT' then null else old.status end,
    new.status,
    'system',
    now()
  );
  return new;
end;
$$;

create trigger release_event_audit
  after insert or update on public.release_events
  for each row execute function public.on_release_event_audit();

create or replace function public.prevent_release_log_delete()
returns trigger language plpgsql as $$
begin
  raise exception
    'Deletion from release_event_log is not permitted (audit immutability invariant)';
end;
$$;

create trigger release_event_log_no_delete
  before delete on public.release_event_log
  for each row execute function public.prevent_release_log_delete();

revoke delete on public.release_event_log from anon;
revoke delete on public.release_event_log from authenticated;