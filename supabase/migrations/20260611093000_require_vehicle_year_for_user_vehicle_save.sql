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
