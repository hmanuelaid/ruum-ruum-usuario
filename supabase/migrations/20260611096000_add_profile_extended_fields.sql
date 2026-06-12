-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: campos extendidos de perfil de usuario
--   Agrega: nombres, apellidos, curp, calle, numero, colonia,
--            municipio, codigo_postal, avatar_url
--   Actualiza: función update_user_profile para manejar los campos nuevos
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Nuevas columnas en app_users -------------------------------------------

alter table if exists public.app_users
  add column if not exists nombres      text,
  add column if not exists apellidos    text,
  add column if not exists curp         text,
  add column if not exists calle        text,
  add column if not exists numero       text,
  add column if not exists colonia      text,
  add column if not exists municipio    text,
  add column if not exists codigo_postal text,
  add column if not exists avatar_url   text;

-- 2. Constraints de longitud / formato ----------------------------------------

do $$
begin
  -- CURP: exactamente 18 caracteres alfanuméricos en mayúsculas (o NULL)
  if not exists (
    select 1 from pg_constraint
    where conname = 'app_users_curp_format'
      and conrelid = 'public.app_users'::regclass
  ) then
    alter table public.app_users
      add constraint app_users_curp_format
      check (curp is null or (length(curp) = 18 and curp ~ '^[A-Z0-9]+$'));
  end if;

  -- codigo_postal: entre 4 y 10 caracteres alfanuméricos (o NULL)
  if not exists (
    select 1 from pg_constraint
    where conname = 'app_users_cp_format'
      and conrelid = 'public.app_users'::regclass
  ) then
    alter table public.app_users
      add constraint app_users_cp_format
      check (codigo_postal is null or (length(codigo_postal) between 4 and 10));
  end if;
end;
$$;

-- 3. Función update_user_profile actualizada ----------------------------------
--    Permite los campos nuevos además de los existentes.

create or replace function public.update_user_profile(profile_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile  public.app_users%rowtype;
  updated_profile  public.app_users%rowtype;

  -- campos existentes
  v_name           text;
  v_phone          text;
  v_country        text;
  v_state          text;
  v_address        text;

  -- campos nuevos: datos personales
  v_nombres        text;
  v_apellidos      text;
  v_curp           text;

  -- campos nuevos: domicilio
  v_calle          text;
  v_numero         text;
  v_colonia        text;
  v_municipio      text;
  v_codigo_postal  text;

  -- foto
  v_avatar_url     text;

  -- lista de campos permitidos
  allowed_fields   text[] := array[
    'name', 'phone', 'country', 'state', 'address',
    'nombres', 'apellidos', 'curp',
    'calle', 'numero', 'colonia', 'municipio', 'codigo_postal',
    'avatar_url'
  ];
begin
  -- autenticación
  if auth.uid() is null then
    raise exception 'Sesion no autenticada';
  end if;

  if profile_payload is null or jsonb_typeof(profile_payload) <> 'object' then
    raise exception 'Payload invalido';
  end if;

  -- validar que no vengan campos desconocidos
  if exists (
    select 1
    from jsonb_object_keys(profile_payload) as key(name)
    where key.name <> all (allowed_fields)
  ) then
    raise exception 'Payload contiene campos no permitidos';
  end if;

  -- cargar perfil actual
  select *
    into current_profile
    from public.app_users
    where auth_id = auth.uid()
    limit 1;

  if current_profile.id is null then
    raise exception 'Perfil de usuario no encontrado';
  end if;

  -- ── extraer y sanitizar valores ──────────────────────────────────────────

  -- campos heredados
  v_name          := nullif(trim(coalesce(profile_payload ->> 'name',    '')), '');
  v_phone         := nullif(trim(coalesce(profile_payload ->> 'phone',   '')), '');
  v_country       := nullif(trim(coalesce(profile_payload ->> 'country', '')), '');
  v_state         := nullif(trim(coalesce(profile_payload ->> 'state',   '')), '');
  v_address       := nullif(trim(coalesce(profile_payload ->> 'address', '')), '');

  -- datos personales nuevos (forzar mayúsculas en DB también)
  v_nombres       := nullif(upper(trim(coalesce(profile_payload ->> 'nombres',   ''))), '');
  v_apellidos     := nullif(upper(trim(coalesce(profile_payload ->> 'apellidos', ''))), '');
  v_curp          := nullif(upper(trim(coalesce(profile_payload ->> 'curp',      ''))), '');

  -- domicilio (forzar mayúsculas)
  v_calle         := nullif(upper(trim(coalesce(profile_payload ->> 'calle',         ''))), '');
  v_numero        := nullif(upper(trim(coalesce(profile_payload ->> 'numero',        ''))), '');
  v_colonia       := nullif(upper(trim(coalesce(profile_payload ->> 'colonia',       ''))), '');
  v_municipio     := nullif(upper(trim(coalesce(profile_payload ->> 'municipio',     ''))), '');
  v_codigo_postal := nullif(upper(trim(coalesce(profile_payload ->> 'codigo_postal', ''))), '');

  -- avatar
  v_avatar_url    := nullif(trim(coalesce(profile_payload ->> 'avatar_url', '')), '');

  -- ── validaciones de longitud ─────────────────────────────────────────────

  if profile_payload ? 'name'     and (v_name is null or length(v_name) > 200) then
    raise exception 'Nombre invalido (max 200 caracteres)';
  end if;

  if profile_payload ? 'phone'    and v_phone is not null and length(v_phone) > 40 then
    raise exception 'Telefono invalido';
  end if;

  if profile_payload ? 'address'  and v_address is not null and length(v_address) > 500 then
    raise exception 'Direccion invalida';
  end if;

  if profile_payload ? 'nombres'  and v_nombres is not null and length(v_nombres) > 150 then
    raise exception 'Nombres invalidos (max 150 caracteres)';
  end if;

  if profile_payload ? 'apellidos' and v_apellidos is not null and length(v_apellidos) > 150 then
    raise exception 'Apellidos invalidos (max 150 caracteres)';
  end if;

  if profile_payload ? 'curp' and v_curp is not null and length(v_curp) <> 18 then
    raise exception 'CURP invalida: debe tener exactamente 18 caracteres';
  end if;

  if profile_payload ? 'calle'    and v_calle is not null and length(v_calle) > 200 then
    raise exception 'Calle invalida';
  end if;

  if profile_payload ? 'numero'   and v_numero is not null and length(v_numero) > 20 then
    raise exception 'Numero invalido';
  end if;

  if profile_payload ? 'colonia'  and v_colonia is not null and length(v_colonia) > 150 then
    raise exception 'Colonia invalida';
  end if;

  if profile_payload ? 'municipio' and v_municipio is not null and length(v_municipio) > 150 then
    raise exception 'Municipio invalido';
  end if;

  if profile_payload ? 'codigo_postal' and v_codigo_postal is not null
     and (length(v_codigo_postal) < 4 or length(v_codigo_postal) > 10) then
    raise exception 'Codigo postal invalido';
  end if;

  if profile_payload ? 'avatar_url' and v_avatar_url is not null and length(v_avatar_url) > 500 then
    raise exception 'URL de avatar invalida';
  end if;

  -- ── actualizar ───────────────────────────────────────────────────────────

  update public.app_users
  set
    -- campos heredados
    name          = case when profile_payload ? 'name'          then v_name          else name          end,
    phone         = case when profile_payload ? 'phone'         then v_phone         else phone         end,
    country       = case when profile_payload ? 'country'       then v_country       else country       end,
    state         = case when profile_payload ? 'state'         then v_state         else state         end,
    address       = case when profile_payload ? 'address'       then v_address       else address       end,

    -- datos personales nuevos
    nombres       = case when profile_payload ? 'nombres'       then v_nombres       else nombres       end,
    apellidos     = case when profile_payload ? 'apellidos'     then v_apellidos     else apellidos     end,
    curp          = case when profile_payload ? 'curp'          then v_curp          else curp          end,

    -- domicilio
    calle         = case when profile_payload ? 'calle'         then v_calle         else calle         end,
    numero        = case when profile_payload ? 'numero'        then v_numero        else numero        end,
    colonia       = case when profile_payload ? 'colonia'       then v_colonia       else colonia       end,
    municipio     = case when profile_payload ? 'municipio'     then v_municipio     else municipio     end,
    codigo_postal = case when profile_payload ? 'codigo_postal' then v_codigo_postal else codigo_postal end,

    -- foto
    avatar_url    = case when profile_payload ? 'avatar_url'    then v_avatar_url    else avatar_url    end
  where id = current_profile.id
  returning * into updated_profile;

  -- ── respuesta ────────────────────────────────────────────────────────────

  return jsonb_build_object(
    'id',            updated_profile.id,
    'name',          updated_profile.name,
    'nombres',       updated_profile.nombres,
    'apellidos',     updated_profile.apellidos,
    'curp',          updated_profile.curp,
    'phone',         updated_profile.phone,
    'email',         updated_profile.email,
    'country',       updated_profile.country,
    'state',         updated_profile.state,
    'address',       updated_profile.address,
    'calle',         updated_profile.calle,
    'numero',        updated_profile.numero,
    'colonia',       updated_profile.colonia,
    'municipio',     updated_profile.municipio,
    'codigo_postal', updated_profile.codigo_postal,
    'avatar_url',    updated_profile.avatar_url
  );
end;
$$;

-- permisos (revocar todo a public, solo authenticated puede ejecutar)
revoke all on function public.update_user_profile(jsonb) from public;
grant execute on function public.update_user_profile(jsonb) to authenticated;
