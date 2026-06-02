alter table if exists public.app_users
  add column if not exists phone_verified_at timestamptz,
  add column if not exists identity_status text not null default 'phone_pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'app_users_identity_status_check'
      and conrelid = 'public.app_users'::regclass
  ) then
    alter table public.app_users
      add constraint app_users_identity_status_check
      check (identity_status in (
        'phone_pending',
        'phone_verified',
        'documents_pending',
        'verified',
        'rejected'
      ));
  end if;
end;
$$;

create or replace function public.set_app_user_phone_identity_status()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  confirmed_at timestamptz;
  actor_role text := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), current_user);
  is_privileged boolean := actor_role in ('service_role', 'postgres', 'supabase_admin');
begin
  select phone_confirmed_at
    into confirmed_at
    from auth.users
    where id = new.auth_id
      and phone = new.phone
      and phone_confirmed_at is not null
    limit 1;

  if confirmed_at is null then
    new.phone_verified_at = null;

    if not is_privileged or new.identity_status is null or new.identity_status = 'phone_verified' then
      new.identity_status = 'phone_pending';
    end if;

    return new;
  end if;

  new.phone_verified_at = confirmed_at;

  if not is_privileged then
    new.identity_status = 'phone_verified';
  elsif new.identity_status is null or new.identity_status = 'phone_pending' then
    new.identity_status = 'phone_verified';
  end if;

  return new;
end;
$$;

drop trigger if exists set_app_user_phone_identity_status on public.app_users;

create trigger set_app_user_phone_identity_status
before insert or update of auth_id, phone, phone_verified_at, identity_status
on public.app_users
for each row
execute function public.set_app_user_phone_identity_status();

create index if not exists app_users_auth_id_idx on public.app_users(auth_id);
create index if not exists app_users_identity_status_idx on public.app_users(identity_status);
