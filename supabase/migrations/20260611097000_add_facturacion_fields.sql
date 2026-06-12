-- ─────────────────────────────────────────────────────────────────────────────
-- Migración: datos de facturación (CFDI / SAT)
--   Agrega: rfc, razon_social, regimen_fiscal, cp_fiscal,
--            uso_cfdi, correo_facturacion,
--            constancia_sat_url, constancia_sat_name
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Nuevas columnas ---------------------------------------------------------

alter table if exists public.app_users
  add column if not exists rfc                 text,
  add column if not exists razon_social        text,
  add column if not exists regimen_fiscal      text,
  add column if not exists cp_fiscal           text,
  add column if not exists uso_cfdi            text,
  add column if not exists correo_facturacion  text,
  add column if not exists constancia_sat_url  text,
  add column if not exists constancia_sat_name text;

-- 2. Constraints de formato --------------------------------------------------

do $$
begin
  -- RFC: 12 chars (moral) o 13 chars (física), solo A-Z, 0-9, & y Ñ
  if not exists (
    select 1 from pg_constraint
    where conname = 'app_users_rfc_format'
      and conrelid = 'public.app_users'::regclass
  ) then
    alter table public.app_users
      add constraint app_users_rfc_format
      check (
        rfc is null
        or (
          length(rfc) between 12 and 13
          and rfc ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$'
        )
      );
  end if;

  -- CP fiscal: exactamente 5 dígitos
  if not exists (
    select 1 from pg_constraint
    where conname = 'app_users_cp_fiscal_format'
      and conrelid = 'public.app_users'::regclass
  ) then
    alter table public.app_users
      add constraint app_users_cp_fiscal_format
      check (cp_fiscal is null or cp_fiscal ~ '^\d{5}$');
  end if;

  -- Régimen fiscal: códigos SAT válidos (3 chars numéricos o alfanuméricos como CP01/CN01)
  if not exists (
    select 1 from pg_constraint
    where conname = 'app_users_regimen_fiscal_values'
      and conrelid = 'public.app_users'::regclass
  ) then
    alter table public.app_users
      add constraint app_users_regimen_fiscal_values
      check (
        regimen_fiscal is null
        or regimen_fiscal in (
          '601','603','605','606','607','608','610','611',
          '612','614','615','616','620','621','622','623',
          '624','625','626'
        )
      );
  end if;

  -- Uso CFDI: catálogo SAT
  if not exists (
    select 1 from pg_constraint
    where conname = 'app_users_uso_cfdi_values'
      and conrelid = 'public.app_users'::regclass
  ) then
    alter table public.app_users
      add constraint app_users_uso_cfdi_values
      check (
        uso_cfdi is null
        or uso_cfdi in (
          'G01','G02','G03',
          'I01','I02','I03','I04','I05','I06','I07','I08',
          'D01','D02','D03','D04','D05','D06','D07','D08','D09','D10',
          'S01','CP01','CN01'
        )
      );
  end if;
end;
$$;

-- 3. Índice para búsquedas por RFC -------------------------------------------
create index if not exists app_users_rfc_idx on public.app_users(rfc)
  where rfc is not null;

-- 4. Función RPC: update_billing_profile ------------------------------------
--    Endpoint seguro para guardar datos de facturación desde el cliente.

create or replace function public.update_billing_profile(billing_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_profile  public.app_users%rowtype;
  updated_profile  public.app_users%rowtype;

  v_rfc                text;
  v_razon_social       text;
  v_regimen_fiscal     text;
  v_cp_fiscal          text;
  v_uso_cfdi           text;
  v_correo_facturacion text;
  v_constancia_url     text;
  v_constancia_name    text;

  allowed_fields text[] := array[
    'rfc', 'razon_social', 'regimen_fiscal', 'cp_fiscal',
    'uso_cfdi', 'correo_facturacion',
    'constancia_sat_url', 'constancia_sat_name'
  ];

  valid_regimenes text[] := array[
    '601','603','605','606','607','608','610','611',
    '612','614','615','616','620','621','622','623',
    '624','625','626'
  ];

  valid_usos text[] := array[
    'G01','G02','G03',
    'I01','I02','I03','I04','I05','I06','I07','I08',
    'D01','D02','D03','D04','D05','D06','D07','D08','D09','D10',
    'S01','CP01','CN01'
  ];
begin
  -- autenticación
  if auth.uid() is null then
    raise exception 'Sesion no autenticada';
  end if;

  if billing_payload is null or jsonb_typeof(billing_payload) <> 'object' then
    raise exception 'Payload invalido';
  end if;

  -- validar campos permitidos
  if exists (
    select 1
    from jsonb_object_keys(billing_payload) as key(name)
    where key.name <> all (allowed_fields)
  ) then
    raise exception 'Payload contiene campos no permitidos';
  end if;

  -- cargar perfil
  select * into current_profile
    from public.app_users
    where auth_id = auth.uid()
    limit 1;

  if current_profile.id is null then
    raise exception 'Perfil de usuario no encontrado';
  end if;

  -- ── extraer y sanitizar ─────────────────────────────────────────────────

  v_rfc                := nullif(upper(trim(coalesce(billing_payload ->> 'rfc', ''))), '');
  v_razon_social       := nullif(upper(trim(coalesce(billing_payload ->> 'razon_social', ''))), '');
  v_regimen_fiscal     := nullif(trim(coalesce(billing_payload ->> 'regimen_fiscal', '')), '');
  v_cp_fiscal          := nullif(trim(coalesce(billing_payload ->> 'cp_fiscal', '')), '');
  v_uso_cfdi           := nullif(trim(coalesce(billing_payload ->> 'uso_cfdi', '')), '');
  v_correo_facturacion := nullif(lower(trim(coalesce(billing_payload ->> 'correo_facturacion', ''))), '');
  v_constancia_url     := nullif(trim(coalesce(billing_payload ->> 'constancia_sat_url', '')), '');
  v_constancia_name    := nullif(trim(coalesce(billing_payload ->> 'constancia_sat_name', '')), '');

  -- ── validaciones ────────────────────────────────────────────────────────

  if v_rfc is not null then
    if not (length(v_rfc) between 12 and 13 and v_rfc ~ '^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$') then
      raise exception 'RFC invalido. Verifica el formato.';
    end if;
  end if;

  if v_razon_social is not null and length(v_razon_social) > 300 then
    raise exception 'Razon social invalida (max 300 caracteres)';
  end if;

  if v_regimen_fiscal is not null and not (v_regimen_fiscal = any(valid_regimenes)) then
    raise exception 'Regimen fiscal invalido';
  end if;

  if v_cp_fiscal is not null and v_cp_fiscal !~ '^\d{5}$' then
    raise exception 'Codigo postal fiscal invalido (debe ser 5 digitos)';
  end if;

  if v_uso_cfdi is not null and not (v_uso_cfdi = any(valid_usos)) then
    raise exception 'Uso de CFDI invalido';
  end if;

  if v_correo_facturacion is not null
     and v_correo_facturacion !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Correo de facturacion invalido';
  end if;

  if v_constancia_url is not null and length(v_constancia_url) > 500 then
    raise exception 'URL de constancia invalida';
  end if;

  -- ── actualizar ──────────────────────────────────────────────────────────

  update public.app_users
  set
    rfc                 = case when billing_payload ? 'rfc'                 then v_rfc                 else rfc                 end,
    razon_social        = case when billing_payload ? 'razon_social'        then v_razon_social        else razon_social        end,
    regimen_fiscal      = case when billing_payload ? 'regimen_fiscal'      then v_regimen_fiscal      else regimen_fiscal      end,
    cp_fiscal           = case when billing_payload ? 'cp_fiscal'           then v_cp_fiscal           else cp_fiscal           end,
    uso_cfdi            = case when billing_payload ? 'uso_cfdi'            then v_uso_cfdi            else uso_cfdi            end,
    correo_facturacion  = case when billing_payload ? 'correo_facturacion'  then v_correo_facturacion  else correo_facturacion  end,
    constancia_sat_url  = case when billing_payload ? 'constancia_sat_url'  then v_constancia_url      else constancia_sat_url  end,
    constancia_sat_name = case when billing_payload ? 'constancia_sat_name' then v_constancia_name     else constancia_sat_name end
  where id = current_profile.id
  returning * into updated_profile;

  -- ── respuesta ────────────────────────────────────────────────────────────

  return jsonb_build_object(
    'id',                   updated_profile.id,
    'rfc',                  updated_profile.rfc,
    'razon_social',         updated_profile.razon_social,
    'regimen_fiscal',       updated_profile.regimen_fiscal,
    'cp_fiscal',            updated_profile.cp_fiscal,
    'uso_cfdi',             updated_profile.uso_cfdi,
    'correo_facturacion',   updated_profile.correo_facturacion,
    'constancia_sat_url',   updated_profile.constancia_sat_url,
    'constancia_sat_name',  updated_profile.constancia_sat_name
  );
end;
$$;

-- permisos
revoke all   on function public.update_billing_profile(jsonb) from public;
grant execute on function public.update_billing_profile(jsonb) to authenticated;
