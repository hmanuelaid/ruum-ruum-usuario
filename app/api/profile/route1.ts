import { NextResponse } from 'next/server'
import { createApiSupabaseClient, getAuthenticatedProfile, jsonError } from '@/lib/apiAuth'

const PROFILE_FIELDS = ['name', 'phone', 'country', 'state', 'address'] as const
type ProfileField = (typeof PROFILE_FIELDS)[number]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function sanitizeText(value: unknown, maxLength: number) {
  if (value === undefined) return undefined
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (trimmed.length > maxLength) return null
  return trimmed
}

function validateProfilePatch(body: unknown) {
  if (!isRecord(body)) return { error: 'Payload invalido.' }

  const payload: Partial<Record<ProfileField, string>> = {}

  for (const key of Object.keys(body)) {
    if (!PROFILE_FIELDS.includes(key as ProfileField)) {
      return { error: `Campo no permitido: ${key}` }
    }
  }

  for (const field of PROFILE_FIELDS) {
    const value = sanitizeText(body[field], field === 'address' ? 240 : 100)
    if (value === null) return { error: `Valor invalido para ${field}.` }
    if (value !== undefined) payload[field] = value
  }

  if (Object.keys(payload).length === 0) {
    return { error: 'No hay campos para actualizar.' }
  }

  return { payload }
}

export async function GET() {
  const supabase = await createApiSupabaseClient()
  const auth = await getAuthenticatedProfile(supabase)

  if (!auth) {
    return jsonError('Sesion no autenticada.', 401)
  }

  return NextResponse.json({ ok: true, data: auth.profile })
}

export async function PATCH(req: Request) {
  const supabase = await createApiSupabaseClient()
  const auth = await getAuthenticatedProfile(supabase)

  if (!auth) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const body = await req.json().catch(() => null)
  const validation = validateProfilePatch(body)

  if ('error' in validation) {
    return jsonError(validation.error ?? 'Payload invalido.')
  }

  const { data, error } = await supabase.rpc('update_user_profile', {
    profile_payload: validation.payload,
  })

  if (error) {
    return jsonError(error.message, 400)
  }

  return NextResponse.json({ ok: true, data })
}
