import { NextResponse } from 'next/server'
import { createApiSupabaseClient, getAuthenticatedProfile, jsonError } from '@/lib/apiAuth'

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
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (trimmed.length === 0) return null // Empty strings become null
  if (trimmed.length > maxLength) return null
  return trimmed
}

function validatePhone(phone: string): boolean {
  // Validación básica para formato internacional
  // Permite: +1234567890, 1234567890 (mínimo 7 dígitos, máximo 15)
  const phoneRegex = /^\+?[1-9]\d{6,14}$/
  return phoneRegex.test(phone)
}

function validateProfilePatch(body: unknown) {
  if (!isRecord(body)) return { error: 'Payload inválido.' }

  // Prohibir actualización de email desde este endpoint
  if ('email' in body) {
    return { error: 'No se puede actualizar el email desde este endpoint.' }
  }

  const payload: Partial<Record<ProfileField, string>> = {}

  // Validar que solo se envíen campos permitidos
  for (const key of Object.keys(body)) {
    if (!PROFILE_FIELDS.includes(key as ProfileField)) {
      return { error: `Campo no permitido: ${key}` }
    }
  }

  // Procesar cada campo
  for (const field of PROFILE_FIELDS) {
    const value = sanitizeText(body[field], field === 'address' ? 500 : 100)
    
    if (value === null) {
      return { error: `Valor inválido para ${field}. Máximo ${field === 'address' ? 500 : 100} caracteres.` }
    }
    
    if (value !== undefined) {
      // Validación específica para teléfono
      if (field === 'phone' && value !== '') {
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
  const supabase = await createApiSupabaseClient()
  const auth = await getAuthenticatedProfile(supabase)

  if (!auth) {
    return jsonError('Sesión no autenticada.', 401)
  }

  // Verificar que el perfil existe
  if (!auth.profile) {
    return jsonError('Perfil no encontrado.', 404)
  }

  // Asegurar que devolvemos todos los campos necesarios
  const profile: ProfileResponse = {
    id: auth.profile.id,
    name: auth.profile.name,
    email: auth.profile.email,
    phone: auth.profile.phone ?? null,
    country: auth.profile.country ?? null,
    state: auth.profile.state ?? null,
    address: auth.profile.address ?? null,
  }

  return NextResponse.json({ ok: true, data: profile })
}

export async function PATCH(req: Request) {
  const supabase = await createApiSupabaseClient()
  const auth = await getAuthenticatedProfile(supabase)

  if (!auth) {
    return jsonError('Sesión no autenticada.', 401)
  }

  // Parsear y validar el body
  const body = await req.json().catch(() => null)
  if (!body) {
    return jsonError('Payload inválido.', 400)
  }

  const validation = validateProfilePatch(body)
  if ('error' in validation) {
    return jsonError(validation.error, 400)
  }

  // Actualizar el perfil usando RPC
  const { error: rpcError } = await supabase.rpc('update_user_profile', {
    profile_payload: validation.payload,
  })

  if (rpcError) {
    console.error('RPC Error:', rpcError)
    return jsonError(rpcError.message, 400)
  }

  // Obtener el perfil completo actualizado
  const { data: updatedProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, name, email, phone, country, state, address')
    .eq('id', auth.profile.id)
    .single()

  if (fetchError) {
    console.error('Error fetching updated profile:', fetchError)
    return jsonError('Perfil actualizado pero error al recuperar los datos.', 500)
  }

  if (!updatedProfile) {
    return jsonError('No se encontró el perfil después de la actualización.', 404)
  }

  // Asegurar el tipo de respuesta
  const profileResponse: ProfileResponse = {
    id: updatedProfile.id,
    name: updatedProfile.name,
    email: updatedProfile.email,
    phone: updatedProfile.phone ?? null,
    country: updatedProfile.country ?? null,
    state: updatedProfile.state ?? null,
    address: updatedProfile.address ?? null,
  }

  return NextResponse.json({ ok: true, data: profileResponse })
}