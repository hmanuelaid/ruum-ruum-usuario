import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { calcQuote, estimateDistance } from '@/lib/pricing'

type QuotePayload = {
  origin?: {
    address?: string
  }
  destination?: {
    address?: string
  }
}

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

  const payload = await request.json().catch(() => null) as QuotePayload | null
  const origin = payload?.origin?.address?.trim() ?? ''
  const destination = payload?.destination?.address?.trim() ?? ''

  if (!origin || !destination) {
    return jsonError('Origen y destino son requeridos.')
  }

  const distanceKm = estimateDistance(origin, destination)
  const clientPriceMxn = calcQuote(distanceKm)

  return NextResponse.json({
    ok: true,
    data: {
      distanceKm,
      clientPriceMxn,
    },
  })
}
