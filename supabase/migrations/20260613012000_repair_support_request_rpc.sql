create extension if not exists pgcrypto;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null,
  message text not null,
  status text not null default 'abierto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_requests_type_check'
      and conrelid = 'public.support_requests'::regclass
  ) then
    alter table public.support_requests
      add constraint support_requests_type_check
      check (type in ('problema_viaje', 'incidente', 'pagos', 'evidencia', 'cancelaciones', 'otro'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'support_requests_status_check'
      and conrelid = 'public.support_requests'::regclass
  ) then
    alter table public.support_requests
      add constraint support_requests_status_check
      check (status in ('abierto', 'en_revision', 'resuelto', 'cerrado'));
  end if;
end;
$$;

create index if not exists support_requests_user_created_idx
  on public.support_requests(user_id, created_at desc);

alter table public.support_requests enable row level security;

drop policy if exists support_requests_select_own_user on public.support_requests;
drop policy if exists support_requests_no_client_insert on public.support_requests;
drop policy if exists support_requests_no_client_update on public.support_requests;
drop policy if exists support_requests_no_client_delete on public.support_requests;

create policy support_requests_select_own_user
  on public.support_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.app_users u
      where u.id::text = user_id
        and u.auth_id = auth.uid()
    )
  );

create policy support_requests_no_client_insert
  on public.support_requests
  as restrictive
  for insert
  to authenticated
  with check (false);

create policy support_requests_no_client_update
  on public.support_requests
  as restrictive
  for update
  to authenticated
  using (false)
  with check (false);

create policy support_requests_no_client_delete
  on public.support_requests
  as restrictive
  for delete
  to authenticated
  using (false);

create or replace function public.create_support_request(support_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  app_user_id public.app_users.id%type;
  request_record public.support_requests%rowtype;
  request_type text := nullif(trim(coalesce(support_payload ->> 'type', '')), '');
  request_message text := nullif(trim(coalesce(support_payload ->> 'message', '')), '');
begin
  if auth.uid() is null then
    raise exception 'Sesion no autenticada';
  end if;

  if support_payload is null or jsonb_typeof(support_payload) <> 'object' then
    raise exception 'Payload invalido';
  end if;

  if request_type is null
    or request_type <> all (array['problema_viaje', 'incidente', 'pagos', 'evidencia', 'cancelaciones', 'otro']) then
    raise exception 'Tipo de soporte no permitido';
  end if;

  if request_message is null or length(request_message) < 10 or length(request_message) > 2000 then
    raise exception 'Mensaje de soporte invalido';
  end if;

  select id
    into app_user_id
    from public.app_users
    where auth_id = auth.uid()
    limit 1;

  if app_user_id is null then
    raise exception 'Perfil de usuario no encontrado';
  end if;

  insert into public.support_requests (
    user_id,
    type,
    message,
    status
  ) values (
    app_user_id::text,
    request_type,
    request_message,
    'abierto'
  )
  returning * into request_record;

  return jsonb_build_object(
    'id', request_record.id,
    'status', request_record.status,
    'createdAt', request_record.created_at
  );
end;
$$;

revoke all on function public.create_support_request(jsonb) from public;
grant execute on function public.create_support_request(jsonb) to authenticated;

notify pgrst, 'reload schema';
