insert into storage.buckets (id, name, public, file_size_limit)
values ('vault-documents', 'vault-documents', false, 52428800)
on conflict (id) do nothing;

create policy "vault_docs_owner_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'vault-documents'
    and (storage.foldername(name))[1] in (
      select id::text from public.estates where user_id = auth.uid()
    )
  );

create policy "vault_docs_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'vault-documents'
    and (storage.foldername(name))[1] in (
      select id::text from public.estates where user_id = auth.uid()
    )
  );

create policy "vault_docs_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'vault-documents'
    and (storage.foldername(name))[1] in (
      select id::text from public.estates where user_id = auth.uid()
    )
  );