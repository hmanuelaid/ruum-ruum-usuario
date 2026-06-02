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
  if (trimmed.length === 0) return null
  if (trimmed.length > maxLength) return null
  return trimmed
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{6,14}$/
  return phoneRegex.test(phone)
}

function validateProfilePatch(body: unknown): { error: string } | { payload: Partial<Record<ProfileField, string>> } {
  if (!isRecord(body)) {
    return { error: 'Payload inválido.' }
  }

  if ('email' in body) {
    return { error: 'No se puede actualizar el email desde este endpoint.' }
  }

  const payload: Partial<Record<ProfileField, string>> = {}

  for (const key of Object.keys(body)) {
    if (!PROFILE_FIELDS.includes(key as ProfileField)) {
      return { error: `Campo no permitido: ${key}` }
    }
  }

  for (const field of PROFILE_FIELDS) {
    const value = sanitizeText(body[field], field === 'address' ? 500 : 100)
    
    if (value === null) {
      return { error: `Valor inválido para ${field}. Máximo ${field === 'address' ? 500 : 100} caracteres.` }
    }
    
    if (value !== undefined) {
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
  console.log('🔵 GET /api/profile - Starting...')
  
  const supabase = await createApiSupabaseClient()
  
  // Usar getUser en lugar de getSession
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.log('🔴 No user found:', userError?.message)
    return jsonError('Sesión no autenticada.', 401)
  }
  
  console.log('✅ User authenticated:', user.email)
  
  // Obtener el perfil
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, email, phone, country, state, address')
    .eq('id', user.id)
    .single()
  
  // Si no existe perfil, crearlo
  if (profileError && profileError.code === 'PGRST116') {
    console.log('📝 Creating profile for user')
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        name: user.user_metadata?.name || user.email?.split('@')[0] || '',
        email: user.email,
        phone: null,
        country: null,
        state: null,
        address: null
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating profile:', createError)
      return jsonError('Error al crear perfil', 500)
    }
    
    profile = newProfile
  } else if (profileError) {
    console.error('❌ Profile error:', profileError)
    return jsonError('Error al obtener perfil', 500)
  }

  const response: ProfileResponse = {
    id: profile.id,
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone ?? null,
    country: profile.country ?? null,
    state: profile.state ?? null,
    address: profile.address ?? null,
  }

  console.log('🟢 Profile returned successfully')
  return NextResponse.json({ ok: true, data: response })
}

export async function PATCH(req: Request) {
  console.log('🔵 PATCH /api/profile - Starting...')
  
  const supabase = await createApiSupabaseClient()
  
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    console.log('🔴 No user found')
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

  // Actualizar perfil
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      name: validation.payload.name,
      phone: validation.payload.phone,
      country: validation.payload.country,
      state: validation.payload.state,
      address: validation.payload.address,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('❌ Update error:', updateError)
    return jsonError(updateError.message, 400)
  }

  // Obtener perfil actualizado
  const { data: updatedProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('id, name, email, phone, country, state, address')
    .eq('id', user.id)
    .single()

  if (fetchError) {
    console.error('❌ Fetch error:', fetchError)
    return jsonError('Error al obtener perfil actualizado', 500)
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

  console.log('🟢 Profile updated successfully')
  return NextResponse.json({ ok: true, data: response })
}