import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {
  firstValidationError,
  validateTripRequestPayload,
} from '@/lib/validation/tripRequest'
import { enforceRateLimit } from '@/lib/rateLimit'

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    },
  )
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const rateLimitResponse = await enforceRateLimit(request, user.id, {
    prefix: 'trip-request',
    limit: 8,
    window: '10 m',
  })
  if (rateLimitResponse) return rateLimitResponse

  const payload = await request.json().catch(() => null) as Record<string, unknown> | null

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return jsonError('Solicitud invalida.')
  }

  const validation = validateTripRequestPayload(payload)
  if (!validation.ok) {
    return jsonError(firstValidationError(validation.errors))
  }

  const { data, error } = await supabase.rpc('create_trip_request', {
    request_payload: validation.data,
  })

  if (error) {
    return jsonError(error.message, 400)
  }

  return NextResponse.json({
    ok: true,
    data,
  })
}
