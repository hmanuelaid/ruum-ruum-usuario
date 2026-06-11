import { NextResponse } from 'next/server'
import { createApiSupabaseClient, getAuthenticatedProfile, jsonError } from '@/lib/apiAuth'

const VEHICLE_TYPES = ['sedan', 'suv', 'pickup', 'van', 'moto', 'otro']
const TRANSMISSIONS = ['automatica', 'manual']
const VEHICLE_FIELDS = [
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
  'condition',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalString(value: unknown, maxLength = 120) {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (trimmed.length > maxLength) return null
  return trimmed
}

function validateVehiclePayload(body: unknown, options: { partial: boolean }) {
  if (!isRecord(body)) return { error: 'Payload invalido.' }

  for (const key of Object.keys(body)) {
    if (!VEHICLE_FIELDS.includes(key as (typeof VEHICLE_FIELDS)[number])) {
      return { error: `Campo no permitido: ${key}` }
    }
  }

  const payload: Record<string, string | number> = {}

  for (const field of ['id', 'alias', 'brand', 'model', 'color', 'plates', 'vin', 'condition'] as const) {
    const value = optionalString(body[field], field === 'vin' ? 40 : 120)
    if (value === null) return { error: `Valor invalido para ${field}.` }
    if (value !== undefined) payload[field] = value
  }

  if (body.year !== undefined && body.year !== null && body.year !== '') {
    const year = Number(body.year)
    const currentYear = new Date().getFullYear() + 1
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
      return { error: 'Año de vehiculo invalido.' }
    }
    payload.year = year
  }

  const type = optionalString(body.type, 20)
  if (type === null || (type !== undefined && !VEHICLE_TYPES.includes(type))) {
    return { error: 'Tipo de vehiculo no permitido.' }
  }
  if (type !== undefined) payload.type = type

  const transmission = optionalString(body.transmission, 20)
  if (transmission === null || (transmission !== undefined && !TRANSMISSIONS.includes(transmission))) {
    return { error: 'Transmision no permitida.' }
  }
  if (transmission !== undefined) payload.transmission = transmission

  if (!options.partial) {
    for (const field of ['brand', 'model', 'year', 'plates', 'type', 'transmission'] as const) {
      if (!payload[field]) return { error: `Campo requerido: ${field}` }
    }
  }

  return { payload }
}

async function requireAuth() {
  const supabase = await createApiSupabaseClient()
  const auth = await getAuthenticatedProfile(supabase)
  return { supabase, auth }
}

export async function GET() {
  const { supabase, auth } = await requireAuth()

  if (!auth) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const { data, error } = await supabase.rpc('get_user_vehicles')

  if (error) {
    return jsonError(error.message, 500)
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}

export async function POST(req: Request) {
  const { supabase, auth } = await requireAuth()

  if (!auth) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const body = await req.json().catch(() => null)
  const validation = validateVehiclePayload(body, { partial: false })

  if ('error' in validation) {
    return jsonError(validation.error ?? 'Payload invalido.')
  }

  const { data, error } = await supabase.rpc('save_user_vehicle', {
    vehicle_payload: validation.payload,
  })

  if (error) {
    return jsonError(error.message, 400)
  }

  return NextResponse.json({ ok: true, data }, { status: 201 })
}

export async function PATCH(req: Request) {
  const { supabase, auth } = await requireAuth()

  if (!auth) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const body = await req.json().catch(() => null)
  const validation = validateVehiclePayload(body, { partial: true })

  if ('error' in validation) {
    return jsonError(validation.error ?? 'Payload invalido.')
  }

  if (!validation.payload.id) {
    return jsonError('id requerido.')
  }

  const { data, error } = await supabase.rpc('save_user_vehicle', {
    vehicle_payload: validation.payload,
  })

  if (error) {
    return jsonError(error.message, 400)
  }

  return NextResponse.json({ ok: true, data })
}

export async function DELETE(req: Request) {
  const { supabase, auth } = await requireAuth()

  if (!auth) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const body = await req.json().catch(() => null)
  const id = isRecord(body) ? optionalString(body.id, 80) : null

  if (!id) {
    return jsonError('id requerido.')
  }

  const { data, error } = await supabase.rpc('delete_user_vehicle', {
    vehicle_id: id,
  })

  if (error) {
    return jsonError(error.message, 400)
  }

  return NextResponse.json({ ok: true, data })
}