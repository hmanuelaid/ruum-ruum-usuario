import { NextResponse } from 'next/server'
import { createApiSupabaseClient, getAuthenticatedProfile, jsonError } from '@/lib/apiAuth'

const SUPPORT_TYPES = [
  'problema_viaje',
  'incidente',
  'pagos',
  'evidencia',
  'cancelaciones',
  'otro',
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateSupportPayload(body: unknown) {
  if (!isRecord(body)) return { error: 'Payload invalido.' }

  const type = typeof body.type === 'string' ? body.type.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!SUPPORT_TYPES.includes(type)) {
    return { error: 'Tipo de soporte no permitido.' }
  }

  if (message.length < 10 || message.length > 2000) {
    return { error: 'Describe el problema con entre 10 y 2000 caracteres.' }
  }

  return {
    payload: {
      type,
      message,
    },
  }
}

export async function POST(req: Request) {
  const supabase = await createApiSupabaseClient()
  const auth = await getAuthenticatedProfile(supabase)

  if (!auth) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const body = await req.json().catch(() => null)
  const validation = validateSupportPayload(body)

  if ('error' in validation) {
    return jsonError(validation.error ?? 'Payload invalido.')
  }

  const { data, error } = await supabase.rpc('create_support_request', {
    support_payload: validation.payload,
  })

  if (error) {
    if (error.code === 'PGRST202' || error.message.includes('create_support_request')) {
      return jsonError(
        'El módulo de soporte necesita actualizar la base de datos. Intenta de nuevo en unos minutos o contáctanos por WhatsApp.',
        503,
      )
    }

    return jsonError(error.message, 400)
  }

  return NextResponse.json({ ok: true, data }, { status: 201 })
}
