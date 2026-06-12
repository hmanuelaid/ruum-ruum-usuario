'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Icono ojo abierto
function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

// Icono ojo cerrado
function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()

  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPwd, setShowPwd]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  // Flujo de recuperación
  const [resetMode, setResetMode]   = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetDone, setResetDone]   = useState(false)
  const [resetError, setResetError] = useState('')

  // ── Login ────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const normalizedEmail = email.trim().toLowerCase()

    if (!isValidEmail(normalizedEmail)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    setLoading(true); setError('')
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail, password,
    })

    if (authError) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

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
      ? redirectTo : '/inicio'

    router.replace(destination)
  }

  // ── Recuperar contraseña ──────────────────────────────────────────────────
  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    const normalized = resetEmail.trim().toLowerCase()

    if (!isValidEmail(normalized)) {
      setResetError('Ingresa un correo electrónico válido.')
      return
    }

    setResetLoading(true)
    setResetError('')
    const supabase = createClient()

    const { error: err } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setResetLoading(false)

    if (err) {
      setResetError(err.message)
    } else {
      setResetDone(true)
    }
  }

  // ── Render: modal de recuperación ─────────────────────────────────────────
  if (resetMode) {
    return (
      <div className="onboarding-shell">
        <div className="onboarding-card">
          <button
            className="btn-back"
            onClick={() => { setResetMode(false); setResetDone(false); setResetError('') }}
            style={{ alignSelf: 'flex-start', marginBottom: '0.5rem' }}
          >
            ← Volver
          </button>

          <div className="brand-mark">R</div>
          <h1 className="onboarding-title">Recuperar contraseña</h1>

          {resetDone ? (
            <>
              <div style={{
                background: 'var(--success-light, #E1F5EE)',
                border: '1px solid var(--success, #1D9E75)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 16px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 24, marginBottom: 8 }}>📬</p>
                <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--success, #1D9E75)' }}>
                  Enlace enviado
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
                  Revisa tu bandeja de entrada en <strong>{resetEmail}</strong> y sigue las instrucciones.
                </p>
              </div>
              <button
                className="btn-ghost"
                onClick={() => { setResetMode(false); setResetDone(false) }}
              >
                Volver al inicio de sesión
              </button>
            </>
          ) : (
            <>
              <p className="onboarding-sub">
                Escribe tu correo y te enviamos un enlace para crear una nueva contraseña.
              </p>
              <form onSubmit={handleReset} className="auth-form">
                <label className="field-label">Correo electrónico</label>
                <input
                  type="email"
                  className="field-input"
                  placeholder="correo@ejemplo.com"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  required
                  autoFocus
                />
                {resetError && <p className="field-error">{resetError}</p>}
                <button type="submit" className="btn-primary" disabled={resetLoading}>
                  {resetLoading ? 'Enviando…' : 'Enviar enlace de recuperación'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── Render: login principal ───────────────────────────────────────────────
  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="brand-mark">R</div>
        <h1 className="onboarding-title">Iniciar sesión</h1>
        <p className="onboarding-sub">Accede para gestionar tus traslados</p>

        <form onSubmit={handleLogin} className="auth-form">
          <label className="field-label">Correo electrónico</label>
          <input
            type="email"
            className="field-input"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className="field-label">Contraseña</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPwd ? 'text' : 'password'}
              className="field-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{ paddingRight: '2.8rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              aria-label={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
            >
              {showPwd ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>

          {error && <p className="field-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <button
          className="btn-ghost"
          type="button"
          onClick={() => { setResetMode(true); setResetEmail(email) }}
        >
          ¿Olvidaste tu contraseña?
        </button>

        <button className="btn-ghost" onClick={() => router.push('/onboarding/registro')}>
          ¿Usuario nuevo? Regístrate
        </button>
      </div>
    </div>
  )
}