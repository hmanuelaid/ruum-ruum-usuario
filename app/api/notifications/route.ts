import { NextResponse } from 'next/server'
import { createApiSupabaseClient, getAuthenticatedProfile, jsonError } from '@/lib/apiAuth'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateId(value: unknown) {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 80) return null
  return trimmed
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

  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, type, read, timestamp')
    .eq('user_id', auth.profile.id)
    .order('timestamp', { ascending: false })

  if (error) {
    return jsonError(error.message, 500)
  }

  return NextResponse.json({ ok: true, data: data ?? [] })
}

export async function PATCH(req: Request) {
  const { supabase, auth } = await requireAuth()

  if (!auth) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const body = await req.json().catch(() => null)
  const id = isRecord(body) ? validateId(body.id) : null

  if (!id) {
    return jsonError('id requerido.')
  }

  const { data, error } = await supabase.rpc('mark_notification_read', {
    notification_id: id,
  })

  if (error) {
    return jsonError(error.message, 400)
  }

  return NextResponse.json({ ok: true, data })
}
