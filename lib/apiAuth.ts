// lib/apiAuth.ts
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function createApiSupabaseClient() {
  const cookieStore = await cookies()
  
  // Crear el cliente con la configuración correcta de cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: Parameters<typeof cookieStore.set>[2]) {
          // En API routes, no podemos setear cookies fácilmente
          // pero necesitamos esta función para que Supabase funcione
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Ignorar errores en API routes
          }
        },
        remove(name: string, options: Parameters<typeof cookieStore.set>[2]) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch {
            // Ignorar errores en API routes
          }
        },
      },
    }
  )
  
  return supabase
}

export async function getAuthenticatedProfile(supabase: SupabaseClient) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('getUser error:', userError.message)
      return null
    }
    
    if (!user) {
      return null
    }
    
    const { data, error: profileError } = await supabase
      .from('app_users')
      .select('id, name, email, phone, country, state, address')
      .eq('auth_id', user.id)
      .maybeSingle()
    let profile = data
    
    if (!profile && (!profileError || profileError.code === 'PGRST116')) {
      const { data: newProfile, error: createError } = await supabase
        .from('app_users')
        .insert({
          auth_id: user.id,
          name: user.user_metadata?.name ?? user.email?.split('@')[0] ?? 'Usuario',
          email: user.email ?? '',
          phone: user.user_metadata?.phone ?? '',
          country: null,
          state: null,
          address: null,
        })
        .select('id, name, email, phone, country, state, address')
        .single()
      
      if (createError) {
        console.error('Error creating app user profile:', createError)
        return null
      }
      
      profile = newProfile
    } else if (profileError) {
      console.error('App user profile error:', profileError)
      return null
    }

    if (!profile) {
      return null
    }
    
    return {
      user,
      profile: {
        id: profile.id,
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone ?? null,
        country: profile.country ?? null,
        state: profile.state ?? null,
        address: profile.address ?? null,
      }
    }
  } catch (error) {
    console.error('Error in getAuthenticatedProfile:', error)
    return null
  }
}

export function jsonError(message: string, status: number = 400) {
  return NextResponse.json(
    { ok: false, error: message },
    { status }
  )
}
