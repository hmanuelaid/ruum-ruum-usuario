import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import type { User } from '@/lib/types'
import AuthHydrator from '@/components/layout/AuthHydrator'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import SettingsSheet from '@/components/layout/SettingsSheet'
import TripDetailSheet from '@/components/viajes/TripDetailSheet'
import Toast from '@/components/ui/Toast'

async function getAuthenticatedProfile(): Promise<User> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
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

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser()

  if (error || !authUser) {
    redirect('/login')
  }

  const { data: existingProfile } = await supabase
    .from('app_users')
    .select('id, name, phone, email')
    .eq('auth_id', authUser.id)
    .maybeSingle()

  let profile = existingProfile

  if (!profile) {
    const { data: createdProfile } = await supabase
      .from('app_users')
      .insert({
        auth_id: authUser.id,
        name: authUser.user_metadata?.name ?? authUser.email?.split('@')[0] ?? 'Usuario',
        phone: authUser.user_metadata?.phone ?? '',
        email: authUser.email ?? '',
      })
      .select('id, name, phone, email')
      .single()

    profile = createdProfile
  }

  if (!profile) {
    redirect('/login')
  }

  return {
    id: profile.id,
    name: profile.name,
    phone: profile.phone ?? '',
    email: profile.email ?? authUser.email ?? '',
  }
}

export default async function UserLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedProfile()

  return (
    <div className="phone-shell">
      <AuthHydrator user={user} />
      <TopBar />
      <BottomNav />
      <main className="page-content" id="main-content">
        {children}
      </main>
      <SettingsSheet />
      <TripDetailSheet />
      <Toast />
    </div>
  )
}
