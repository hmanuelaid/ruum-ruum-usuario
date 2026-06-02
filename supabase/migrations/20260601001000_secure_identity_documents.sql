insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'documents',
  'documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table if exists public.documents
  add column if not exists storage_path text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint,
  add column if not exists scan_status text not null default 'pending',
  add column if not exists content_validated_at timestamptz;

do $$
begin
  if to_regclass('public.documents') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conname = 'documents_scan_status_check'
        and conrelid = 'public.documents'::regclass
    ) then
      alter table public.documents
        add constraint documents_scan_status_check
        check (scan_status in ('pending', 'clean', 'infected', 'rejected'));
    end if;

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'documents'
        and column_name = 'url'
    ) then
      update public.documents
      set storage_path = regexp_replace(url, '^.*/storage/v1/object/public/documents/', '')
      where storage_path is null
        and url like '%/storage/v1/object/public/documents/%';

      update public.documents
      set url = null
      where storage_path is not null
        and url is not null;
    end if;

    alter table public.documents enable row level security;

    drop policy if exists documents_select_own_user on public.documents;
    drop policy if exists documents_insert_own_user on public.documents;
    drop policy if exists documents_update_own_user on public.documents;

    create policy documents_select_own_user
      on public.documents
      for select
      to authenticated
      using (
        owner_type = 'user'
        and exists (
          select 1
          from public.app_users u
          where u.id::text = owner_id::text
            and u.auth_id = auth.uid()
        )
      );

    create policy documents_insert_own_user
      on public.documents
      for insert
      to authenticated
      with check (
        owner_type = 'user'
        and exists (
          select 1
          from public.app_users u
          where u.id::text = owner_id::text
            and u.auth_id = auth.uid()
        )
      );

    create policy documents_update_own_user
      on public.documents
      for update
      to authenticated
      using (
        owner_type = 'user'
        and exists (
          select 1
          from public.app_users u
          where u.id::text = owner_id::text
            and u.auth_id = auth.uid()
        )
      )
      with check (
        owner_type = 'user'
        and exists (
          select 1
          from public.app_users u
          where u.id::text = owner_id::text
            and u.auth_id = auth.uid()
        )
      );
  end if;
end;
$$;

create or replace function public.enforce_user_document_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), current_user);
  is_privileged boolean := actor_role in ('service_role', 'postgres', 'supabase_admin');
begin
  if new.owner_type = 'user' and new.storage_path is not null then
    new.url = null;
  end if;

  if is_privileged then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status = 'en_revision';
    new.scan_status = 'pending';
    return new;
  end if;

  if new.storage_path is distinct from old.storage_path then
    new.status = 'en_revision';
    new.scan_status = 'pending';
    return new;
  end if;

  new.status = old.status;
  new.scan_status = old.scan_status;
  return new;
end;
$$;

drop trigger if exists enforce_user_document_security_fields on public.documents;

create trigger enforce_user_document_security_fields
before insert or update of storage_path, url, status, scan_status
on public.documents
for each row
execute function public.enforce_user_document_security_fields();

drop policy if exists documents_storage_insert_own_user on storage.objects;
drop policy if exists documents_storage_select_own_user on storage.objects;
drop policy if exists documents_storage_delete_own_user on storage.objects;

create policy documents_storage_insert_own_user
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'user'
    and exists (
      select 1
      from public.app_users u
      where u.id::text = (storage.foldername(name))[2]
        and u.auth_id = auth.uid()
    )
  );

create policy documents_storage_select_own_user
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'user'
    and exists (
      select 1
      from public.app_users u
      where u.id::text = (storage.foldername(name))[2]
        and u.auth_id = auth.uid()
    )
  );

create policy documents_storage_delete_own_user
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = 'user'
    and exists (
      select 1
      from public.app_users u
      where u.id::text = (storage.foldername(name))[2]
        and u.auth_id = auth.uid()
    )
  );

create index if not exists documents_owner_type_id_type_idx
  on public.documents(owner_type, owner_id, type);

create index if not exists documents_storage_path_idx
  on public.documents(storage_path);
