import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { calcQuote, estimateDistance } from '@/lib/pricing'
import { firstValidationError, validateQuotePayload } from '@/lib/validation/tripRequest'

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

  const payload = await request.json().catch(() => null) as unknown
  const validation = validateQuotePayload(payload)

  if (!validation.ok) {
    return jsonError(firstValidationError(validation.errors))
  }

  const { origin, destination } = validation.data
  let distanceKm: number
  try {
    distanceKm = await estimateDistance(origin.address, destination.address)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo calcular la distancia.'
    return jsonError(message, 502)
  }

  const clientPriceMxn = calcQuote(distanceKm)

  return NextResponse.json({
    ok: true,
    data: {
      distanceKm,
      clientPriceMxn,
    },
  })
}
