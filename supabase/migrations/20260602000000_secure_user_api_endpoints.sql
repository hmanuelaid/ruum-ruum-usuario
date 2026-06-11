create extension if not exists pgcrypto;

alter table if exists public.app_users
  add column if not exists country text,
  add column if not exists state text,
  add column if not exists address text;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  body text not null,
  type text not null default 'info',
  read boolean not null default false,
  timestamp timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint notifications_type_check
    check (type in ('trip', 'evidence', 'payment', 'info'))
);

alter table public.notifications
  add column if not exists timestamp timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

create index if not exists notifications_user_timestamp_idx
  on public.notifications(user_id, timestamp desc);

alter table public.notifications enable row level security;
alter table if exists public.vehicles enable row level security;

drop policy if exists notifications_select_own_user on public.notifications;
drop policy if exists notifications_no_client_insert on public.notifications;
drop policy if exists notifications_no_client_update on public.notifications;
drop policy if exists notifications_no_client_delete on public.notifications;

create policy notifications_select_own_user
  on public.notifications
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

create policy notifications_no_client_insert
  on public.notifications
  as restrictive
  for insert
  to authenticated
  with check (false);

create policy notifications_no_client_update
  on public.notifications
  as restrictive
  for update
  to authenticated
  using (false)
  with check (false);

create policy notifications_no_client_delete
  on public.notifications
  as restrictive
  for delete
  to authenticated
  using (false);

drop policy if exists vehicles_select_own_user on public.vehicles;
drop policy if exists vehicles_no_client_insert on public.vehicles;
drop policy if exists vehicles_no_client_update on public.vehicles;
drop policy if exists vehicles_no_client_delete on public.vehicles;

create policy vehicles_select_own_user
  on public.vehicles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.app_users u
      where u.id::text = owner_id::text
        and u.auth_id = auth.uid()
    )
  );

create policy vehicles_no_client_insert
  on public.vehicles
  as restrictive
  for insert
  to authenticated
  with check (false);

create policy vehicles_no_client_update
  on public.vehicles
  as restrictive
  for update
  to authenticated
  using (false)
  with check (false);

create policy vehicles_no_client_delete
  on public.vehicles
  as restrictive
  for delete
  to authenticated
  using (false);

create or replace function public.update_user_profile(profile_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile public.app_users%rowtype;
  updated_profile public.app_users%rowtype;
  v_name text;
  v_phone text;
  v_country text;
  v_state text;
  v_address text;
begin
  if auth.uid() is null then
    raise exception 'Sesion no autenticada';
  end if;

  if profile_payload is null or jsonb_typeof(profile_payload) <> 'object' then
    raise exception 'Payload invalido';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(profile_payload) as key(name)
    where key.name <> all (array['name', 'phone', 'country', 'state', 'address'])
  ) then
    raise exception 'Payload contiene campos no permitidos';
  end if;

  select *
    into current_profile
    from public.app_users
    where auth_id = auth.uid()
    limit 1;

  if current_profile.id is null then
    raise exception 'Perfil de usuario no encontrado';
  end if;

  v_name := nullif(trim(coalesce(profile_payload ->> 'name', '')), '');
  v_phone := nullif(trim(coalesce(profile_payload ->> 'phone', '')), '');
  v_country := nullif(trim(coalesce(profile_payload ->> 'country', '')), '');
  v_state := nullif(trim(coalesce(profile_payload ->> 'state', '')), '');
  v_address := nullif(trim(coalesce(profile_payload ->> 'address', '')), '');

  if profile_payload ? 'name' and (v_name is null or length(v_name) > 100) then
    raise exception 'Nombre invalido';
  end if;

  if profile_payload ? 'phone' and v_phone is not null and length(v_phone) > 40 then
    raise exception 'Telefono invalido';
  end if;

  if profile_payload ? 'country' and v_country is not null and length(v_country) > 100 then
    raise exception 'Pais invalido';
  end if;

  if profile_payload ? 'state' and v_state is not null and length(v_state) > 100 then
    raise exception 'Estado invalido';
  end if;

  if profile_payload ? 'address' and v_address is not null and length(v_address) > 240 then
    raise exception 'Direccion invalida';
  end if;

  update public.app_users
  set
    name = case when profile_payload ? 'name' then v_name else name end,
    phone = case when profile_payload ? 'phone' then v_phone else phone end,
    country = case when profile_payload ? 'country' then v_country else country end,
    state = case when profile_payload ? 'state' then v_state else state end,
    address = case when profile_payload ? 'address' then v_address else address end
  where id = current_profile.id
  returning * into updated_profile;

  return jsonb_build_object(
    'id', updated_profile.id,
    'name', updated_profile.name,
    'phone', updated_profile.phone,
    'email', updated_profile.email,
    'country', updated_profile.country,
    'state', updated_profile.state,
    'address', updated_profile.address
  );
end;
$$;

create or replace function public.save_user_vehicle(vehicle_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  app_user_id public.app_users.id%type;
  vehicle_record public.vehicles%rowtype;
  vehicle_id_text text := nullif(trim(coalesce(vehicle_payload ->> 'id', '')), '');
  v_alias text := nullif(trim(coalesce(vehicle_payload ->> 'alias', '')), '');
  v_brand text := nullif(trim(coalesce(vehicle_payload ->> 'brand', '')), '');
  v_model text := nullif(trim(coalesce(vehicle_payload ->> 'model', '')), '');
  v_year integer;
  v_color text := nullif(trim(coalesce(vehicle_payload ->> 'color', '')), '');
  v_plates text := nullif(trim(coalesce(vehicle_payload ->> 'plates', '')), '');
  v_vin text := nullif(trim(coalesce(vehicle_payload ->> 'vin', '')), '');
  v_type text := nullif(trim(coalesce(vehicle_payload ->> 'type', '')), '');
  v_transmission text := nullif(trim(coalesce(vehicle_payload ->> 'transmission', '')), '');
  v_condition text := nullif(trim(coalesce(vehicle_payload ->> 'condition', '')), '');
begin
  if auth.uid() is null then
    raise exception 'Sesion no autenticada';
  end if;

  if vehicle_payload is null or jsonb_typeof(vehicle_payload) <> 'object' then
    raise exception 'Payload invalido';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(vehicle_payload) as key(name)
    where key.name <> all (array[
      'id',
      'alias',
      'brand',
      'model',
      'year',
      'color',
      'plates',
      'vin',
      'type',
      'transmission',
      'condition'
    ])
  ) then
    raise exception 'Payload contiene campos no permitidos';
  end if;

  select id
    into app_user_id
    from public.app_users
    where auth_id = auth.uid()
    limit 1;

  if app_user_id is null then
    raise exception 'Perfil de usuario no encontrado';
  end if;

  if vehicle_payload ? 'year' and vehicle_payload ->> 'year' <> '' then
    v_year := (vehicle_payload ->> 'year')::integer;
  end if;

  if vehicle_payload ? 'type'
    and (v_type is null or v_type <> all (array['sedan', 'suv', 'pickup', 'van', 'moto', 'otro'])) then
    raise exception 'Tipo de vehiculo no permitido';
  end if;

  if vehicle_payload ? 'transmission'
    and (v_transmission is null or v_transmission <> all (array['automatica', 'manual'])) then
    raise exception 'Transmision no permitida';
  end if;

  if vehicle_id_text is null then
    if v_brand is null or v_model is null or v_year is null or v_plates is null or v_type is null or v_transmission is null then
      raise exception 'Campos requeridos incompletos';
    end if;

    insert into public.vehicles (
      owner_id,
      alias,
      brand,
      model,
      year,
      color,
      plates,
      vin,
      type,
      transmission,
      condition
    ) values (
      app_user_id,
      coalesce(v_alias, v_brand || ' ' || v_model),
      v_brand,
      v_model,
      v_year,
      v_color,
      v_plates,
      v_vin,
      v_type,
      v_transmission,
      v_condition
    )
    returning * into vehicle_record;
  else
    update public.vehicles
    set
      alias = case when vehicle_payload ? 'alias' then v_alias else alias end,
      brand = case when vehicle_payload ? 'brand' then v_brand else brand end,
      model = case when vehicle_payload ? 'model' then v_model else model end,
      year = case when vehicle_payload ? 'year' then v_year else year end,
      color = case when vehicle_payload ? 'color' then v_color else color end,
      plates = case when vehicle_payload ? 'plates' then v_plates else plates end,
      vin = case when vehicle_payload ? 'vin' then v_vin else vin end,
      type = case when vehicle_payload ? 'type' then v_type else type end,
      transmission = case when vehicle_payload ? 'transmission' then v_transmission else transmission end,
      condition = case when vehicle_payload ? 'condition' then v_condition else condition end
    where id::text = vehicle_id_text
      and owner_id::text = app_user_id::text
    returning * into vehicle_record;

    if vehicle_record.id is null then
      raise exception 'Vehiculo no encontrado';
    end if;
  end if;

  return jsonb_build_object(
    'id', vehicle_record.id,
    'alias', vehicle_record.alias,
    'brand', vehicle_record.brand,
    'model', vehicle_record.model,
    'year', vehicle_record.year,
    'color', vehicle_record.color,
    'plates', vehicle_record.plates,
    'vin', vehicle_record.vin,
    'type', vehicle_record.type,
    'transmission', vehicle_record.transmission,
    'condition', vehicle_record.condition
  );
end;
$$;

create or replace function public.delete_user_vehicle(vehicle_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  app_user_id public.app_users.id%type;
  deleted_id text;
begin
  if auth.uid() is null then
    raise exception 'Sesion no autenticada';
  end if;

  if vehicle_id is null or length(trim(vehicle_id)) = 0 then
    raise exception 'id requerido';
  end if;

  select id
    into app_user_id
    from public.app_users
    where auth_id = auth.uid()
    limit 1;

  if app_user_id is null then
    raise exception 'Perfil de usuario no encontrado';
  end if;

  delete from public.vehicles
  where id::text = trim(vehicle_id)
    and owner_id::text = app_user_id::text
  returning id::text into deleted_id;

  if deleted_id is null then
    raise exception 'Vehiculo no encontrado';
  end if;

  return jsonb_build_object('id', deleted_id);
end;
$$;

create or replace function public.mark_notification_read(notification_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  app_user_id public.app_users.id%type;
  updated_id text;
begin
  if auth.uid() is null then
    raise exception 'Sesion no autenticada';
  end if;

  if notification_id is null or length(trim(notification_id)) = 0 then
    raise exception 'id requerido';
  end if;

  select id
    into app_user_id
    from public.app_users
    where auth_id = auth.uid()
    limit 1;

  if app_user_id is null then
    raise exception 'Perfil de usuario no encontrado';
  end if;

  update public.notifications
  set read = true
  where id::text = trim(notification_id)
    and user_id = app_user_id::text
  returning id::text into updated_id;

  if updated_id is null then
    raise exception 'Notificacion no encontrada';
  end if;

  return jsonb_build_object('id', updated_id, 'read', true);
end;
$$;

revoke all on function public.update_user_profile(jsonb) from public;
revoke all on function public.save_user_vehicle(jsonb) from public;
revoke all on function public.delete_user_vehicle(text) from public;
revoke all on function public.mark_notification_read(text) from public;

grant execute on function public.update_user_profile(jsonb) to authenticated;
grant execute on function public.save_user_vehicle(jsonb) to authenticated;
grant execute on function public.delete_user_vehicle(text) to authenticated;
grant execute on function public.mark_notification_read(text) to authenticated;
