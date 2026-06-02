import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export type ApiProfile = {
  id: string
  name: string
  phone: string | null
  email: string | null
  country?: string | null
  state?: string | null
  address?: string | null
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function createApiSupabaseClient() {
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

export async function getAuthenticatedProfile(
  supabase: Awaited<ReturnType<typeof createApiSupabaseClient>>,
) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile, error: profileError } = await supabase
    .from('app_users')
    .select('id, name, phone, email, country, state, address')
    .eq('auth_id', user.id)
    .maybeSingle<ApiProfile>()

  if (profileError || !profile) return null

  return { authUser: user, profile }
}
