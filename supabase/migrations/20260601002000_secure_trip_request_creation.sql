create or replace function public.rr_estimate_distance(
  origin_address text,
  destination_address text
)
returns integer
language sql
immutable
as $$
  select case
    when coalesce(length(trim(origin_address)), 0) = 0
      or coalesce(length(trim(destination_address)), 0) = 0
      then 0
    else greatest(((length(origin_address) * 7 + length(destination_address) * 13) % 200) + 10, 15)
  end;
$$;

create or replace function public.rr_calc_quote(distance_km numeric)
returns integer
language sql
immutable
as $$
  select case
    when distance_km <= 0 then 0
    else greatest(
      (round(((350 + distance_km * 18) * case when distance_km > 100 then 1.25 else 1 end) / 10) * 10)::integer,
      500
    )
  end;
$$;

create or replace function public.rr_clean_text(input_value text)
returns text
language sql
immutable
as $$
  select nullif(btrim(regexp_replace(coalesce(input_value, ''), '[[:space:]]+', ' ', 'g')), '');
$$;

create or replace function public.rr_normalize_phone(input_value text)
returns text
language sql
immutable
as $$
  with raw_digits as (
    select regexp_replace(coalesce(input_value, ''), '[^0-9]', '', 'g') as value
  ),
  normalized_digits as (
    select case
      when value ~ '^00[1-9][0-9]{9,14}$' then substring(value from 3)
      when value ~ '^044[0-9]{10}$' then '52' || substring(value from 4)
      when value ~ '^045[0-9]{10}$' then '52' || substring(value from 4)
      when value ~ '^521[0-9]{10}$' then '52' || substring(value from 4)
      when value ~ '^[0-9]{10}$' then '52' || value
      else value
    end as value
    from raw_digits
  )
  select case
    when value ~ '^[1-9][0-9]{9,14}$' then '+' || value
    else null
  end
  from normalized_digits;
$$;

create or replace function public.rr_normalize_plates(input_value text)
returns text
language sql
immutable
as $$
  select nullif(upper(regexp_replace(coalesce(input_value, ''), '[^0-9A-Za-z]', '', 'g')), '');
$$;

create or replace function public.rr_normalize_vin(input_value text)
returns text
language sql
immutable
as $$
  select nullif(upper(regexp_replace(coalesce(input_value, ''), '[^0-9A-Za-z]', '', 'g')), '');
$$;

create or replace function public.create_trip_request(request_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  app_user_id public.app_users.id%type;
  trip_id public.trips.id%type;
  vehicle_id public.vehicles.id%type;
  vehicle_id_text text := public.rr_clean_text(request_payload #>> '{vehicle,id}');
  vehicle_alias text := public.rr_clean_text(request_payload #>> '{vehicle,alias}');
  vehicle_brand text := public.rr_clean_text(request_payload #>> '{vehicle,brand}');
  vehicle_model text := public.rr_clean_text(request_payload #>> '{vehicle,model}');
  vehicle_year_text text := public.rr_clean_text(request_payload #>> '{vehicle,year}');
  vehicle_year integer;
  vehicle_color text := public.rr_clean_text(request_payload #>> '{vehicle,color}');
  vehicle_plates text := public.rr_normalize_plates(request_payload #>> '{vehicle,plates}');
  vehicle_vin text := public.rr_normalize_vin(request_payload #>> '{vehicle,vin}');
  vehicle_type text := public.rr_clean_text(request_payload #>> '{vehicle,type}');
  vehicle_transmission text := public.rr_clean_text(request_payload #>> '{vehicle,transmission}');
  vehicle_condition text := public.rr_clean_text(request_payload #>> '{vehicle,condition}');
  origin_address text := public.rr_clean_text(request_payload #>> '{origin,address}');
  destination_address text := public.rr_clean_text(request_payload #>> '{destination,address}');
  origin_reference text := public.rr_clean_text(request_payload #>> '{origin,reference}');
  destination_reference text := public.rr_clean_text(request_payload #>> '{destination,reference}');
  origin_contact_name text := public.rr_clean_text(request_payload #>> '{originContact,name}');
  origin_contact_phone text := public.rr_normalize_phone(request_payload #>> '{originContact,phone}');
  dest_contact_name text := public.rr_clean_text(request_payload #>> '{destinationContact,name}');
  dest_contact_phone text := public.rr_normalize_phone(request_payload #>> '{destinationContact,phone}');
  scheduled_at_text text := public.rr_clean_text(request_payload ->> 'scheduledAt');
  scheduled_at_value timestamptz;
  service_type_value text := coalesce(public.rr_clean_text(request_payload ->> 'serviceType'), 'personal');
  special_instructions text := public.rr_clean_text(request_payload ->> 'specialInstructions');
  asap_value boolean := true;
  distance_km integer;
  client_price_mxn integer;
  driver_pay_mxn integer;
begin
  if auth.uid() is null then
    raise exception 'Sesion no autenticada';
  end if;

  select id
    into app_user_id
    from public.app_users
    where auth_id = auth.uid()
    limit 1;

  if app_user_id is null then
    raise exception 'Perfil de usuario no encontrado';
  end if;

  if request_payload ? 'asap' then
    begin
      asap_value := coalesce((request_payload ->> 'asap')::boolean, true);
    exception
      when invalid_text_representation then
        raise exception 'Valor asap invalido';
    end;
  end if;

  if scheduled_at_text is not null then
    begin
      scheduled_at_value := scheduled_at_text::timestamptz;
    exception
      when others then
        raise exception 'Fecha programada invalida';
    end;
  end if;

  if vehicle_year_text is not null then
    if vehicle_year_text ~ '^\d{4}$' then
      vehicle_year := vehicle_year_text::integer;
    else
      raise exception 'Ano del vehiculo invalido';
    end if;
  end if;

  if service_type_value <> all (array[
    'personal',
    'empresarial',
    'agencia',
    'lote',
    'flotilla',
    'entrega_cliente',
    'recuperacion',
    'especial'
  ]) then
    raise exception 'Tipo de servicio no permitido';
  end if;

  if vehicle_type is not null and vehicle_type <> all (array['sedan', 'suv', 'pickup', 'van', 'moto', 'otro']) then
    raise exception 'Tipo de vehiculo no permitido';
  end if;

  if vehicle_transmission is not null and vehicle_transmission <> all (array['automatica', 'manual']) then
    raise exception 'Transmision no permitida';
  end if;

  if vehicle_id_text is not null
    and vehicle_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Vehiculo guardado invalido';
  end if;

  if vehicle_alias is not null and length(vehicle_alias) > 80 then
    raise exception 'Alias de vehiculo invalido';
  end if;

  if vehicle_brand is not null and (length(vehicle_brand) < 2 or length(vehicle_brand) > 40) then
    raise exception 'Marca de vehiculo invalida';
  end if;

  if vehicle_model is not null and (length(vehicle_model) < 1 or length(vehicle_model) > 60) then
    raise exception 'Modelo de vehiculo invalido';
  end if;

  if vehicle_year is not null
    and (vehicle_year < 1900 or vehicle_year > extract(year from now())::integer + 1) then
    raise exception 'Ano del vehiculo fuera de rango';
  end if;

  if vehicle_color is not null and length(vehicle_color) > 40 then
    raise exception 'Color de vehiculo invalido';
  end if;

  if vehicle_plates is not null and vehicle_plates !~ '^[A-Z0-9]{5,8}$' then
    raise exception 'Placas invalidas';
  end if;

  if vehicle_vin is not null and vehicle_vin !~ '^[A-HJ-NPR-Z0-9]{17}$' then
    raise exception 'VIN invalido';
  end if;

  if vehicle_condition is not null and length(vehicle_condition) > 80 then
    raise exception 'Estado del vehiculo invalido';
  end if;

  if origin_address is not null and (length(origin_address) < 10 or length(origin_address) > 240) then
    raise exception 'Direccion de origen invalida';
  end if;

  if destination_address is not null and (length(destination_address) < 10 or length(destination_address) > 240) then
    raise exception 'Direccion de destino invalida';
  end if;

  if origin_reference is not null and length(origin_reference) > 160 then
    raise exception 'Referencia de origen invalida';
  end if;

  if destination_reference is not null and length(destination_reference) > 160 then
    raise exception 'Referencia de destino invalida';
  end if;

  if origin_contact_name is not null and (length(origin_contact_name) < 2 or length(origin_contact_name) > 80) then
    raise exception 'Contacto de origen invalido';
  end if;

  if dest_contact_name is not null and (length(dest_contact_name) < 2 or length(dest_contact_name) > 80) then
    raise exception 'Contacto de destino invalido';
  end if;

  if special_instructions is not null and length(special_instructions) > 500 then
    raise exception 'Instrucciones especiales invalidas';
  end if;

  if not asap_value and scheduled_at_value is null then
    raise exception 'Fecha programada requerida';
  end if;

  if scheduled_at_value is not null and scheduled_at_value < now() - interval '5 minutes' then
    raise exception 'Fecha programada debe ser futura';
  end if;

  if vehicle_brand is null
    or vehicle_model is null
    or vehicle_year is null
    or vehicle_plates is null
    or vehicle_type is null
    or vehicle_transmission is null
    or origin_address is null
    or destination_address is null
    or origin_contact_name is null
    or origin_contact_phone is null
    or dest_contact_name is null
    or dest_contact_phone is null then
    raise exception 'Campos requeridos incompletos';
  end if;

  if vehicle_id_text is not null
    and vehicle_id_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    select id
      into vehicle_id
      from public.vehicles
      where id::text = vehicle_id_text
        and owner_id::text = app_user_id::text
      limit 1;

    if vehicle_id is null then
      raise exception 'Vehiculo no encontrado para este usuario';
    end if;
  else
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
      coalesce(vehicle_alias, vehicle_brand || ' ' || vehicle_model),
      vehicle_brand,
      vehicle_model,
      vehicle_year,
      vehicle_color,
      vehicle_plates,
      vehicle_vin,
      vehicle_type,
      vehicle_transmission,
      vehicle_condition
    )
    returning id into vehicle_id;
  end if;

  distance_km := public.rr_estimate_distance(origin_address, destination_address);
  client_price_mxn := public.rr_calc_quote(distance_km);
  driver_pay_mxn := round(client_price_mxn * 0.70);

  select public.generate_trip_id() into trip_id;

  if trip_id is null then
    raise exception 'No se pudo generar el folio del viaje';
  end if;

  insert into public.trips (
    id,
    status,
    service_type,
    user_id,
    vehicle_id,
    vehicle_brand,
    vehicle_model,
    vehicle_color,
    vehicle_plates,
    vehicle_year,
    vehicle_vin,
    vehicle_type,
    vehicle_transmission,
    vehicle_condition,
    origin_address,
    destination_address,
    origin_reference,
    destination_reference,
    origin_contact_name,
    origin_contact_phone,
    dest_contact_name,
    dest_contact_phone,
    asap,
    scheduled_at,
    special_instructions,
    distance_km,
    client_price_mxn,
    driver_pay_mxn
  ) values (
    trip_id,
    'solicitud_recibida',
    service_type_value,
    app_user_id,
    vehicle_id,
    vehicle_brand,
    vehicle_model,
    vehicle_color,
    vehicle_plates,
    vehicle_year,
    vehicle_vin,
    vehicle_type,
    vehicle_transmission,
    vehicle_condition,
    origin_address,
    destination_address,
    origin_reference,
    destination_reference,
    origin_contact_name,
    origin_contact_phone,
    dest_contact_name,
    dest_contact_phone,
    asap_value,
    scheduled_at_value,
    special_instructions,
    distance_km,
    client_price_mxn,
    driver_pay_mxn
  );

  insert into public.trip_timeline (
    trip_id,
    step,
    label,
    done,
    active
  )
  select
    trip_id,
    ordinality::integer,
    label,
    false,
    ordinality = 1
  from unnest(array[
    'Solicitud creada',
    'Viaje revisado',
    'Conductor asignado',
    'Conductor acepto',
    'Llegada al origen',
    'Evidencia inicial',
    'Traslado iniciado',
    'En ruta',
    'Llegada a destino',
    'Evidencia final',
    'Entrega confirmada',
    'Viaje cerrado'
  ]) with ordinality as timeline(label, ordinality);

  insert into public.payments (
    trip_id,
    type,
    amount,
    status,
    concept
  ) values
  (
    trip_id,
    'cobro_usuario',
    client_price_mxn,
    'pendiente',
    'Traslado ' || split_part(origin_address, ',', 1) || ' -> ' || split_part(destination_address, ',', 1)
  ),
  (
    trip_id,
    'pago_conductor',
    driver_pay_mxn,
    'pendiente',
    'Pago conductor ' || trip_id
  );

  return jsonb_build_object(
    'tripId', trip_id,
    'vehicleId', vehicle_id,
    'distanceKm', distance_km,
    'clientPriceMxn', client_price_mxn
  );
end;
$$;

revoke all on function public.create_trip_request(jsonb) from public;
grant execute on function public.create_trip_request(jsonb) to authenticated;

alter table if exists public.trips enable row level security;
alter table if exists public.trip_timeline enable row level security;
alter table if exists public.payments enable row level security;
alter table if exists public.vehicles enable row level security;

drop policy if exists trips_select_own_user on public.trips;
drop policy if exists trips_no_client_insert on public.trips;
drop policy if exists trips_no_client_update on public.trips;
drop policy if exists trip_timeline_select_own_user on public.trip_timeline;
drop policy if exists trip_timeline_no_client_insert on public.trip_timeline;
drop policy if exists trip_timeline_no_client_update on public.trip_timeline;
drop policy if exists payments_select_own_user on public.payments;
drop policy if exists payments_no_client_insert on public.payments;
drop policy if exists payments_no_client_update on public.payments;
drop policy if exists vehicles_select_own_user on public.vehicles;
drop policy if exists vehicles_no_client_insert on public.vehicles;
drop policy if exists vehicles_no_client_update on public.vehicles;

create policy trips_select_own_user
  on public.trips
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.app_users u
      where u.id::text = user_id::text
        and u.auth_id = auth.uid()
    )
  );

create policy trips_no_client_insert
  on public.trips
  as restrictive
  for insert
  to authenticated
  with check (false);

create policy trips_no_client_update
  on public.trips
  as restrictive
  for update
  to authenticated
  using (false)
  with check (false);

create policy trip_timeline_select_own_user
  on public.trip_timeline
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      join public.app_users u on u.id::text = t.user_id::text
      where t.id::text = trip_id::text
        and u.auth_id = auth.uid()
    )
  );

create policy trip_timeline_no_client_insert
  on public.trip_timeline
  as restrictive
  for insert
  to authenticated
  with check (false);

create policy trip_timeline_no_client_update
  on public.trip_timeline
  as restrictive
  for update
  to authenticated
  using (false)
  with check (false);

create policy payments_select_own_user
  on public.payments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.trips t
      join public.app_users u on u.id::text = t.user_id::text
      where t.id::text = trip_id::text
        and u.auth_id = auth.uid()
    )
  );

create policy payments_no_client_insert
  on public.payments
  as restrictive
  for insert
  to authenticated
  with check (false);

create policy payments_no_client_update
  on public.payments
  as restrictive
  for update
  to authenticated
  using (false)
  with check (false);

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

create index if not exists trips_user_id_idx on public.trips(user_id);
create index if not exists trips_vehicle_id_idx on public.trips(vehicle_id);
create index if not exists trip_timeline_trip_id_idx on public.trip_timeline(trip_id);
create index if not exists payments_trip_id_idx on public.payments(trip_id);
create index if not exists vehicles_owner_id_idx on public.vehicles(owner_id);
