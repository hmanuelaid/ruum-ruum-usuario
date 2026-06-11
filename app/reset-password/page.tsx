'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function EyeOpen() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

const toggleStyle = {
  position: 'absolute' as const,
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
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirm]     = useState('')
  const [showPwd, setShowPwd]             = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [done, setDone]                   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setDone(true)
      setTimeout(() => router.replace('/login'), 2000)
    }
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="brand-mark">R</div>
        <h1 className="onboarding-title">Nueva contraseña</h1>

        {done ? (
          <div style={{
            background: 'var(--success-light, #E1F5EE)',
            border: '1px solid var(--success, #1D9E75)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px 16px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>✅</p>
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--success, #1D9E75)' }}>
              Contraseña actualizada
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Redirigiendo al inicio de sesión…
            </p>
          </div>
        ) : (
          <>
            <p className="onboarding-sub">Define una contraseña segura para recuperar tu acceso.</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <label className="field-label">Nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="field-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  required
                  style={{ paddingRight: '2.8rem' }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Ocultar' : 'Ver'} style={toggleStyle}>
                  {showPwd ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>

              <label className="field-label">Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="field-input"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={e => setConfirm(e.target.value)}
                  minLength={8}
                  required
                  style={{ paddingRight: '2.8rem' }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Ocultar' : 'Ver'} style={toggleStyle}>
                  {showConfirm ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>

              {error && <p className="field-error">{error}</p>}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}