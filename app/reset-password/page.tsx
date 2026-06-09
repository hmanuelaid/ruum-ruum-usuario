'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')

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

    if (updateError) {
      setError(updateError.message)
    } else {
      setMessage('Contraseña actualizada. Ya puedes iniciar sesión.')
      setTimeout(() => router.replace('/login'), 1200)
    }

    setLoading(false)
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-card">
        <div className="brand-mark">R</div>
        <h1 className="onboarding-title">Nueva contraseña</h1>
        <p className="onboarding-sub">Define una contraseña segura para recuperar tu acceso.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field-label">Contraseña</label>
          <input className="field-input" type="password" placeholder="Mínimo 8 caracteres"
            value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
          <label className="field-label">Confirmar contraseña</label>
          <input className="field-input" type="password" placeholder="Repite tu contraseña"
            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required />
          {error && <p className="field-error">{error}</p>}
          {message && <p className="field-hint">{message}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
