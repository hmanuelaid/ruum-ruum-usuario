'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore, useAppStore } from '@/lib/store'
import { useDocuments } from '@/lib/useDocuments'
import { DocumentUploader } from '@/components/ui/DocumentUploader'

function normalizePhone(phone: string) {
  return phone.trim().replace(/\D/g, '')
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function joinName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, ' ').trim()
}

const USER_DOCS = [
  { docType: 'ine',         label: 'Identificación oficial (INE/Pasaporte)', required: true  },
  { docType: 'comprobante', label: 'Comprobante de domicilio',               required: true  },
  { docType: 'foto_perfil', label: 'Foto de perfil',                         required: false },
]

export default function RegistroPage() {
  const router = useRouter()
  const { setUser, completeOnboarding } = useAuthStore()
  const { showToast } = useAppStore()

  const [step, setStep] = useState<1 | 2>(1)
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

  // ownerId se puebla cuando el paso 1 termina exitosamente
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const { docs, loading: docsLoading, error: docsError, updateDoc } = useDocuments(ownerId, USER_DOCS)

  const requiredDone = docs
    .filter(d => d.required)
    .every(d => d.status === 'en_revision' || d.status === 'aprobado')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // ── Paso 1: crear cuenta ──────────────────────────────────────────────────
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    const phone = normalizePhone(form.phone)
    const email = form.email.trim().toLowerCase()
    const name  = joinName(form.firstName, form.lastName)

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

    // 1. Crear cuenta en Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: { data: { name, phone, user_type: 'personal' } },
    })

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? 'No pudimos crear tu cuenta.')
      setLoading(false)
      return
    }

    // Si Supabase requiere confirmación de email (sin sesión inmediata)
    if (!signUpData.session) {
      setError('Revisa tu correo para confirmar tu cuenta y luego inicia sesión.')
      setLoading(false)
      return
    }

    // 2. Crear perfil en app_users usando el browser client que ya tiene sesión
    const { data: existingProfile } = await supabase
      .from('app_users')
      .select('id, name, phone, email')
      .eq('auth_id', signUpData.user.id)
      .maybeSingle()

    const profileQuery = existingProfile
      ? supabase
          .from('app_users')
          .update({ name, phone, email })
          .eq('id', existingProfile.id)
          .select('id, name, phone, email')
          .single()
      : supabase
          .from('app_users')
          .insert({ auth_id: signUpData.user.id, name, phone, email })
          .select('id, name, phone, email')
          .single()

    const { data: profile, error: profileError } = await profileQuery

    if (profileError || !profile) {
      setError(profileError?.message ?? 'Cuenta creada, pero no pudimos guardar tu perfil. Contacta soporte.')
      setLoading(false)
      return
    }

    // 3. Poblar store y avanzar al paso 2 — sin cambio de ruta, store intacto
    setUser({ id: profile.id, name: profile.name, phone: profile.phone ?? '', email: profile.email })
    setOwnerId(profile.id)
    setLoading(false)
    setStep(2)
  }

  // ── Paso 2: finalizar con o sin documentos ────────────────────────────────
  function handleFinish() {
    completeOnboarding()
    showToast('¡Registro completado! Revisamos tus documentos en menos de 24 h.')
    router.replace('/inicio')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="onboarding-shell">
      {step === 1 && (
        <button className="btn-back" onClick={() => router.back()}>← Atrás</button>
      )}

      <div className="onboarding-card" style={step === 2 ? { gap: '1.25rem' } : undefined}>

        {/* ── Step indicator ── */}
        <div className="step-badge">Paso {step} de 2</div>

        {/* ══════════════════════════════════════════════
            PASO 1 — Datos de la cuenta
        ══════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            <h1 className="onboarding-title">Crea tu cuenta</h1>
            <p className="onboarding-sub">Registra tus datos para gestionar tus traslados.</p>

            <form onSubmit={handleCreateAccount} className="auth-form">
              <label className="field-label">Nombre(s)</label>
              <input className="field-input" placeholder="Juan Carlos"
                value={form.firstName} onChange={e => update('firstName', e.target.value)} required />

              <label className="field-label">Apellido(s)</label>
              <input className="field-input" placeholder="García López"
                value={form.lastName} onChange={e => update('lastName', e.target.value)} required />

              <label className="field-label">Teléfono</label>
              <input className="field-input" type="tel" inputMode="numeric" placeholder="55 0000 0000"
                value={form.phone}
                onChange={e => update('phone', e.target.value.replace(/[^\d\s-]/g, ''))} required />

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
                {loading ? 'Creando cuenta…' : 'Continuar →'}
              </button>
            </form>

            <button className="btn-ghost" onClick={() => router.push('/login')}>
              Ya tengo cuenta
            </button>
          </>
        )}

        {/* ══════════════════════════════════════════════
            PASO 2 — Documentos de identidad
        ══════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <div>
              <h1 className="onboarding-title">Verifica tu identidad</h1>
              <p className="onboarding-sub">
                Sube tus documentos. Los revisamos en menos de 24 horas y te notificamos el resultado.
              </p>
            </div>

            {docsError && (
              <div style={{
                background: 'rgba(239,68,68,.08)',
                border: '1px solid rgba(239,68,68,.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                fontSize: 13,
                color: 'var(--danger)',
              }}>
                {docsError}
              </div>
            )}

            {docsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                <p className="muted">Cargando documentos…</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {docs.map(doc => (
                  <DocumentUploader
                    key={doc.docType}
                    doc={doc}
                    ownerId={ownerId!}
                    ownerType="user"
                    onUploaded={updateDoc}
                  />
                ))}
              </div>
            )}

            {/* Progreso */}
            {!docsLoading && (
              <div style={{
                background: 'var(--surface-2)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13,
              }}>
                <span className="muted">Documentos subidos</span>
                <strong style={{ color: requiredDone ? 'var(--success)' : 'var(--text)' }}>
                  {docs.filter(d => d.status !== 'pendiente_carga').length} / {docs.filter(d => d.required).length} obligatorios
                </strong>
              </div>
            )}

            <button
              className="btn-primary"
              disabled={!requiredDone}
              onClick={handleFinish}
            >
              Finalizar registro →
            </button>

            {!requiredDone && (
              <p className="field-error" style={{ textAlign: 'center' }}>
                Sube los documentos obligatorios para continuar
              </p>
            )}

            <button className="btn-ghost" onClick={handleFinish}>
              Completar más tarde
            </button>
          </>
        )}

      </div>
    </div>
  )
}