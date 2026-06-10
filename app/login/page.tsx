'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    setLoading(true); setError(''); setMessage('')
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
    if (authError) { setError('Correo o contraseña incorrectos'); setLoading(false); return }

    const { data: existingProfile, error: profileLookupError } = await supabase
      .from('app_users')
      .select('id, name, phone, email')
      .eq('auth_id', data.user.id)
      .maybeSingle()

    if (profileLookupError) {
      await supabase.auth.signOut()
      setError(`No pudimos cargar tu perfil: ${profileLookupError.message}`)
      setLoading(false)
      return
    }

    let profile = existingProfile

    if (!profile) {
      const { data: createdProfile, error: createProfileError } = await supabase
        .from('app_users')
        .insert({
          auth_id: data.user.id,
          name: data.user.user_metadata?.name ?? data.user.email?.split('@')[0] ?? 'Usuario',
          phone: data.user.user_metadata?.phone ?? '',
          email: data.user.email ?? normalizedEmail,
          status: 'activo',
        })
        .select('id, name, phone, email')
        .single()

      if (createProfileError || !createdProfile) {
        await supabase.auth.signOut()
        setError(createProfileError?.message ?? 'No pudimos crear tu perfil.')
        setLoading(false)
        return
      }

      profile = createdProfile
    }

    setUser({ id: profile.id, name: profile.name, phone: profile.phone ?? '', email: profile.email })

    const redirectTo = new URLSearchParams(window.location.search).get('redirectTo')
    const destination = redirectTo?.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/inicio'

    window.location.assign(destination)
  }

  async function handlePasswordReset() {
    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setError('Escribe tu correo electrónico para enviarte el enlace de recuperación.')
      return
    }

    setResetLoading(true)
    setError('')
    setMessage('')

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setMessage('Te enviamos un enlace para restablecer tu contraseña.')
    }

    setResetLoading(false)
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="brand-mark">R</div>
        <h1 className="onboarding-title">Iniciar sesión</h1>
        <p className="onboarding-sub">Accede para gestionar tus traslados</p>
        <form onSubmit={handleLogin} className="auth-form">
          <label className="field-label">Correo electrónico</label>
          <input type="email" className="field-input" placeholder="correo@ejemplo.com"
            value={email} onChange={e => setEmail(e.target.value)} required />
          <label className="field-label">Contraseña</label>
          <input type="password" className="field-input" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <p className="field-error">{error}</p>}
          {message && <p className="field-hint">{message}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
        <button className="btn-ghost" type="button" onClick={handlePasswordReset} disabled={resetLoading}>
          {resetLoading ? 'Enviando enlace…' : '¿Olvidaste tu contraseña?'}
        </button>
        <button className="btn-ghost" onClick={() => router.push('/onboarding')}>
          ¿Usuario nuevo? Regístrate
        </button>
      </div>
    </div>
  )
}
