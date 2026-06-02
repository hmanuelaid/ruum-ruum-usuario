'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function normalizePhone(phone: string) {
  return phone.trim().replace(/[\s()-]/g, '')
}

export default function RegistroPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const phone = normalizePhone(form.phone)

    if (!/^\+\d{8,15}$/.test(phone)) {
      setError('Ingresa el teléfono en formato internacional, por ejemplo +525500000000.')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
        data: {
          name: form.name,
          email: form.email,
        },
      },
    })

    if (otpError) {
      setError(`No pudimos enviar el código: ${otpError.message}`)
      setLoading(false)
      return
    }

    sessionStorage.setItem('reg_phone', phone)
    sessionStorage.setItem('reg_data', JSON.stringify({
      name: form.name,
      email: form.email,
      phone,
    }))
    router.push('/onboarding/verificacion')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>← Atrás</button>
      <div className="onboarding-card">
        <div className="step-badge">Paso 1 de 3</div>
        <h1 className="onboarding-title">Crea tu cuenta</h1>
        <p className="onboarding-sub">Te enviaremos un código SMS para validar tu teléfono</p>

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

          {error && <p className="field-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Enviando código…' : 'Enviar código'}
          </button>
        </form>

        <button className="btn-ghost" onClick={() => router.push('/login')}>
          Ya tengo cuenta
        </button>
      </div>
    </div>
  )
}
