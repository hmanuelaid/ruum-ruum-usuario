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
    // Usar getUser en lugar de getSession (más confiable)
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ getUser error:', userError.message)
      return null
    }
    
    if (!user) {
      console.log('❌ No user found')
      return null
    }
    
    console.log('✅ User found:', user.email)
    
    // Obtener o crear el perfil
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, phone, country, state, address')
      .eq('id', user.id)
      .single()
    let profile = data
    
    // Si no existe perfil, crearlo
    if (profileError && profileError.code === 'PGRST116') {
      console.log('📝 Creating profile for user:', user.id)
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
        return null
      }
      
      profile = newProfile
    } else if (profileError) {
      console.error('❌ Profile error:', profileError)
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
    console.error('❌ Error in getAuthenticatedProfile:', error)
    return null
  }
}

export function jsonError(message: string, status: number = 400) {
  return NextResponse.json(
    { ok: false, error: message },
    { status }
  )
}
