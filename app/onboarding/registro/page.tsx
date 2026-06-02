'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

function normalizePhone(phone: string) {
  return phone.trim().replace(/[\s()-]/g, '')
}

export default function RegistroPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [form, setForm] = useState({
    name: '',
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
    const name = form.name.trim()

    if (!/^\+\d{8,15}$/.test(phone)) {
      setError('Ingresa el teléfono en formato internacional, por ejemplo +525500000000.')
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

    const profilePayload = {
      auth_id: signUpData.user.id,
      name,
      email,
      phone,
      type: 'personal',
      status: 'activo',
    }

    const { data: existingProfile, error: existingError } = await supabase
      .from('app_users')
      .select('id')
      .eq('auth_id', signUpData.user.id)
      .maybeSingle()

    if (existingError) {
      setError(`No pudimos consultar tu perfil: ${existingError.message}`)
      setLoading(false)
      return
    }

    const profileRequest = existingProfile
      ? supabase
          .from('app_users')
          .update(profilePayload)
          .eq('id', existingProfile.id)
          .select('id, name, phone, email')
          .single()
      : supabase
          .from('app_users')
          .insert(profilePayload)
          .select('id, name, phone, email')
          .single()

    const { data: profile, error: profileError } = await profileRequest

    if (profileError || !profile) {
      setError(profileError?.message ?? 'No pudimos crear tu perfil.')
      setLoading(false)
      return
    }

    if (!signUpData.session) {
      setError('Cuenta creada. Revisa tu correo para confirmar tu cuenta e inicia sesión.')
      setLoading(false)
      return
    }

    setUser({
      id: profile.id,
      name: profile.name,
      phone: profile.phone ?? '',
      email: profile.email,
    })

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
          <label className="field-label">Nombre completo</label>
          <input className="field-input" placeholder="Juan García"
            value={form.name} onChange={e => update('name', e.target.value)} required />

          <label className="field-label">Teléfono</label>
          <input className="field-input" type="tel" placeholder="+52 55 0000 0000"
            value={form.phone} onChange={e => update('phone', e.target.value)} required />

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
