import { NextResponse } from 'next/server'
import { createApiSupabaseClient, getAuthenticatedProfile, jsonError } from '@/lib/apiAuth'
import { logger } from '@/lib/logger'

const PROFILE_FIELDS = ['name', 'phone', 'country', 'state', 'address'] as const
type ProfileField = (typeof PROFILE_FIELDS)[number]

type ProfileResponse = {
  id: string
  name: string
  email: string
  phone: string | null
  country: string | null
  state: string | null
  address: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitizeText(value: unknown, maxLength: number) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length > maxLength) return null
  return trimmed
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{6,14}$/
  return phoneRegex.test(phone)
}

function validateProfilePatch(body: unknown): { error: string } | { payload: Partial<Record<ProfileField, string | null>> } {
  if (!isRecord(body)) {
    return { error: 'Payload inválido.' }
  }

  if ('email' in body) {
    return { error: 'No se puede actualizar el email desde este endpoint.' }
  }

  const payload: Partial<Record<ProfileField, string | null>> = {}

  for (const key of Object.keys(body)) {
    if (!PROFILE_FIELDS.includes(key as ProfileField)) {
      return { error: `Campo no permitido: ${key}` }
    }
  }

  for (const field of PROFILE_FIELDS) {
    const value = sanitizeText(body[field], field === 'address' ? 500 : 100)
    
    if (value === null && body[field] !== null) {
      return { error: `Valor inválido para ${field}. Máximo ${field === 'address' ? 500 : 100} caracteres.` }
    }
    
    if (value !== undefined) {
      if (field === 'phone' && value !== null && value !== '') {
        if (!validatePhone(value)) {
          return { error: 'Formato de teléfono inválido. Usa formato internacional (+525500000000).' }
        }
      }
      payload[field] = value
    }
  }

  if (Object.keys(payload).length === 0) {
    return { error: 'No hay campos para actualizar.' }
  }

  return { payload }
}

export async function GET() {
  try {
    const supabase = await createApiSupabaseClient()
    const auth = await getAuthenticatedProfile(supabase)

    if (!auth) {
      return jsonError('Sesión no autenticada.', 401)
    }

    const profile = auth.profile
    
    const response: ProfileResponse = {
      id: profile.id,
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone ?? null,
      country: profile.country ?? null,
      state: profile.state ?? null,
      address: profile.address ?? null,
    }
    
    return NextResponse.json({ ok: true, data: response })
    
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Unexpected error in profile GET')
    return jsonError('Error interno del servidor', 500)
  }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createApiSupabaseClient()
    const auth = await getAuthenticatedProfile(supabase)

    if (!auth) {
      return jsonError('Sesión no autenticada.', 401)
    }
    
    const body = await req.json().catch(() => null)
    if (!body) {
      return jsonError('Payload inválido.', 400)
    }
    
    const validation = validateProfilePatch(body)
    
    if ('error' in validation) {
      return jsonError(validation.error, 400)
    }
    
    const { data: updatedProfile, error: updateError } = await supabase.rpc('update_user_profile', {
      profile_payload: validation.payload,
    })

    if (updateError || !updatedProfile) {
      logger.error({ err: updateError?.message ?? 'unknown', code: (updateError as { code?: string })?.code }, 'Update error in profile PATCH')
      return jsonError(updateError?.message ?? 'Error al actualizar perfil', 400)
    }
    
    const response: ProfileResponse = {
      id: updatedProfile.id,
      name: updatedProfile.name || '',
      email: updatedProfile.email || '',
      phone: updatedProfile.phone ?? null,
      country: updatedProfile.country ?? null,
      state: updatedProfile.state ?? null,
      address: updatedProfile.address ?? null,
    }
    
    return NextResponse.json({ ok: true, data: response })
    
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Unexpected error in profile PATCH')
    return jsonError('Error interno del servidor', 500)
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createApiSupabaseClient()

    // getAuthenticatedProfile crea el perfil si no existe,
    // usando name/phone de user_metadata (que se pasaron en el signUp)
    const auth = await getAuthenticatedProfile(supabase)

    if (!auth) {
      return jsonError('Sesión no autenticada.', 401)
    }

    // Aplicar name y phone del body si se enviaron (complementan user_metadata)
    const body = await req.json().catch(() => null) as {
      name?: string
      phone?: string
      email?: string
    } | null

    const patchFields: Record<string, string> = {}
    if (body?.name && typeof body.name === 'string') {
      patchFields.name = body.name.trim().replace(/\s+/g, ' ').slice(0, 100)
    }
    if (body?.phone && typeof body.phone === 'string') {
      const digits = body.phone.replace(/\D/g, '')
      if (/^\d{10}$/.test(digits)) patchFields.phone = digits
    }

    if (Object.keys(patchFields).length > 0) {
      await supabase
        .from('app_users')
        .update(patchFields)
        .eq('id', auth.profile.id)
    }

    const profile = { ...auth.profile, ...patchFields }

    return NextResponse.json({
      ok: true,
      data: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone ?? '',
      },
    })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Unexpected error in profile POST')
    return jsonError('Error interno del servidor', 500)
  }
}