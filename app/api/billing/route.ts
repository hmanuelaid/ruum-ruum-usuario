import { NextResponse } from 'next/server'
import { createApiSupabaseClient, getAuthenticatedProfile, jsonError } from '@/lib/apiAuth'
import { logger } from '@/lib/logger'

const DOCUMENT_BUCKET = 'documents'
const SIGNED_URL_TTL_SECONDS = 300

const BILLING_FIELDS = [
  'rfc',
  'razon_social',
  'regimen_fiscal',
  'cp_fiscal',
  'uso_cfdi',
  'correo_facturacion',
  'constancia_sat_url',
  'constancia_sat_name',
] as const

const BILLING_PATCH_FIELDS = [
  'rfc',
  'razon_social',
  'regimen_fiscal',
  'cp_fiscal',
  'uso_cfdi',
  'correo_facturacion',
] as const

type BillingField = (typeof BILLING_FIELDS)[number]
type BillingPatchField = (typeof BILLING_PATCH_FIELDS)[number]
type BillingPayload = Partial<Record<BillingPatchField, string | null>>

type BillingRecord = Record<BillingField, string | null>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeText(value: unknown, maxLength: number) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (trimmed.length > maxLength) return null
  return trimmed || null
}

function validateBillingPatch(body: unknown): { error: string } | { payload: BillingPayload } {
  if (!isRecord(body)) {
    return { error: 'Payload inválido.' }
  }

  const payload: BillingPayload = {}

  for (const key of Object.keys(body)) {
    if (!BILLING_PATCH_FIELDS.includes(key as BillingPatchField)) {
      return { error: `Campo no permitido: ${key}` }
    }
  }

  const maxLengths: Record<BillingPatchField, number> = {
    rfc: 13,
    razon_social: 300,
    regimen_fiscal: 3,
    cp_fiscal: 5,
    uso_cfdi: 4,
    correo_facturacion: 254,
  }

  for (const field of BILLING_PATCH_FIELDS) {
    const normalized = normalizeText(body[field], maxLengths[field])
    if (normalized === null && body[field] !== null && body[field] !== undefined && body[field] !== '') {
      return { error: `Valor inválido para ${field}.` }
    }

    if (normalized !== undefined) {
      payload[field] = normalized
    }
  }

  if (Object.keys(payload).length === 0) {
    return { error: 'No hay campos para actualizar.' }
  }

  return { payload }
}

async function resolveConstanciaUrl(
  supabase: Awaited<ReturnType<typeof createApiSupabaseClient>>,
  value: string | null,
) {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value

  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(value, SIGNED_URL_TTL_SECONDS)

  if (error) {
    logger.error({ err: error.message, path: value }, 'Error creating billing signed URL')
    return null
  }

  return data?.signedUrl ?? null
}

function toResponse(record: BillingRecord, constanciaUrl: string | null) {
  return {
    rfc: record.rfc,
    razon_social: record.razon_social,
    regimen_fiscal: record.regimen_fiscal,
    cp_fiscal: record.cp_fiscal,
    uso_cfdi: record.uso_cfdi,
    correo_facturacion: record.correo_facturacion,
    constancia_sat_url: constanciaUrl,
    constancia_sat_name: record.constancia_sat_name,
  }
}

export async function GET() {
  try {
    const supabase = await createApiSupabaseClient()
    const auth = await getAuthenticatedProfile(supabase)

    if (!auth) {
      return jsonError('Sesión no autenticada.', 401)
    }

    const { data, error } = await supabase
      .from('app_users')
      .select(BILLING_FIELDS.join(', '))
      .eq('id', auth.profile.id)
      .maybeSingle<BillingRecord>()

    if (error) {
      logger.error({ err: error.message, code: error.code }, 'Error loading billing profile')
      return jsonError('No pudimos cargar tus datos de facturación.', 500)
    }

    if (!data) {
      return jsonError('Perfil de usuario no encontrado.', 404)
    }

    const constanciaUrl = await resolveConstanciaUrl(supabase, data.constancia_sat_url)

    return NextResponse.json({ ok: true, data: toResponse(data, constanciaUrl) })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Unexpected error in billing GET')
    return jsonError('Error interno del servidor', 500)
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createApiSupabaseClient()
    const auth = await getAuthenticatedProfile(supabase)

    if (!auth) {
      return jsonError('Sesión no autenticada.', 401)
    }

    const body = await request.json().catch(() => null)
    const validation = validateBillingPatch(body)

    if ('error' in validation) {
      return jsonError(validation.error, 400)
    }

    const { data, error } = await supabase.rpc('update_billing_profile', {
      billing_payload: validation.payload,
    })

    if (error || !data) {
      logger.error({ err: error?.message ?? 'unknown', code: (error as { code?: string } | null)?.code }, 'Error updating billing profile')
      return jsonError(error?.message ?? 'No pudimos guardar los datos de facturación.', 400)
    }

    const record = data as BillingRecord
    const constanciaUrl = await resolveConstanciaUrl(supabase, record.constancia_sat_url)

    return NextResponse.json({ ok: true, data: toResponse(record, constanciaUrl) })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Unexpected error in billing PATCH')
    return jsonError('Error interno del servidor', 500)
  }
}
