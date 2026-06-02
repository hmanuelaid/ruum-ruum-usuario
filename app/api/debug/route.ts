// app/api/debug/route.ts
import { NextResponse } from 'next/server'
import { createApiSupabaseClient } from '@/lib/apiAuth'

export async function GET() {
  const supabase = await createApiSupabaseClient()
  
  // Verificar sesión
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  // Verificar usuario
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  return NextResponse.json({
    hasSession: !!session,
    sessionError: sessionError?.message || null,
    hasUser: !!user,
    userError: userError?.message || null,
    userEmail: user?.email || null,
    userId: user?.id || null,
    timestamp: new Date().toISOString()
  })
}