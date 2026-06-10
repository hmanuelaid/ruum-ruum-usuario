'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

function normalizePhone(phone: string) {
  return phone.trim().replace(/\D/g, '')
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function joinName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' ').trim()
}

export default function RegistroPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const phone = normalizePhone(form.phone)
    const email = form.email.trim().toLowerCase()
    const name = joinName(form.firstName, form.lastName)

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Ingresa tu nombre y apellidos.')
      return
    }

    if (!isValidEmail(email)) {
      setError('Ingresa un correo electrónico válido.')
      return
    }

    if (!/^\d{10}$/.test(phone)) {
      setError('Ingresa un teléfono nacional de 10 dígitos, sin código internacional.')
      return
    }

    if (form.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          name,
          phone,
          user_type: 'personal',
        },
      },
    })

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? 'No pudimos crear tu cuenta.')
      setLoading(false)
      return
    }

    // Si Supabase no generó sesión (confirmación de email activa), redirigir a login
    if (!signUpData.session) {
      setError('Cuenta creada. Confirma tu correo e inicia sesión para continuar.')
      setLoading(false)
      return
    }

    // Crear perfil via API route autenticado (evita escritura directa desde el cliente)
    const profileRes = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    })

    const profilePayload = await profileRes.json().catch(() => null) as {
      ok?: boolean
      data?: { id: string; name: string; phone: string | null; email: string }
      error?: string
    } | null

    if (!profileRes.ok || !profilePayload?.ok || !profilePayload.data) {
      setError(profilePayload?.error ?? 'No pudimos crear tu perfil.')
      setLoading(false)
      return
    }

    const profile = profilePayload.data

    setUser({
      id: profile.id,
      name: profile.name,
      phone: profile.phone ?? '',
      email: profile.email,
    })

    // router.push preserva el store de Zustand; window.location.assign lo destruye
    router.push('/onboarding/documentos')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>← Atrás</button>
      <div className="onboarding-card">
        <div className="step-badge">Paso 1 de 2</div>
        <h1 className="onboarding-title">Crea tu cuenta</h1>
        <p className="onboarding-sub">Registra tus datos para gestionar tus traslados.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field-label">Nombre(s)</label>
          <input className="field-input" placeholder="Juan Carlos"
            value={form.firstName} onChange={e => update('firstName', e.target.value)} required />

          <label className="field-label">Apellido(s)</label>
          <input className="field-input" placeholder="García López"
            value={form.lastName} onChange={e => update('lastName', e.target.value)} required />

          <label className="field-label">Teléfono</label>
          <input className="field-input" type="tel" inputMode="numeric" placeholder="55 0000 0000"
            value={form.phone} onChange={e => update('phone', e.target.value.replace(/[^\d\s-]/g, ''))} required />

          <label className="field-label">Correo electrónico</label>
          <input className="field-input" type="email" placeholder="correo@ejemplo.com"
            value={form.email} onChange={e => update('email', e.target.value)} required />

          <label className="field-label">Contraseña</label>
          <input className="field-input" type="password" placeholder="Mínimo 8 caracteres"
            value={form.password} onChange={e => update('password', e.target.value)} minLength={8} required />

          <label className="field-label">Confirmar contraseña</label>
          <input className="field-input" type="password" placeholder="Repite tu contraseña"
            value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} minLength={8} required />

          {error && <p className="field-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <button className="btn-ghost" onClick={() => router.push('/login')}>
          Ya tengo cuenta
        </button>
      </div>
    </div>
  )
}