update public.vehicles v
set owner_id = u.id
from public.app_users u
where v.owner_id::text = u.auth_id::text
  and v.owner_id::text <> u.id::text;

alter table public.vehicles
  drop constraint if exists vehicles_owner_id_fkey;

alter table public.vehicles
  add constraint vehicles_owner_id_fkey
  foreign key (owner_id)
  references public.app_users(id)
  on delete cascade;

create index if not exists vehicles_owner_id_idx
  on public.vehicles(owner_id);
