'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore, useAppStore } from '@/lib/store'
import { validateFile, getPreviewUrl, ACCEPTED_TYPES, MAX_SIZE_MB } from '@/lib/storage'

// ─── tipos ────────────────────────────────────────────────────────────────────
type DocStatus = 'pendiente_carga' | 'en_revision' | 'aprobado' | 'rechazado'

interface DocState {
  docType: string
  label: string
  required: boolean
  status: DocStatus
  preview: string | null
  uploading: boolean
  error: string | null
}

const USER_DOCS: Pick<DocState, 'docType' | 'label' | 'required'>[] = [
  { docType: 'ine',         label: 'Identificación oficial (INE/Pasaporte)', required: true  },
  { docType: 'comprobante', label: 'Comprobante de domicilio',               required: true  },
  { docType: 'foto_perfil', label: 'Foto de perfil',                         required: false },
]

const STATUS_LABEL: Record<DocStatus, string> = {
  pendiente_carga: 'Pendiente',
  en_revision:     'En revisión ✓',
  aprobado:        'Aprobado ✓',
  rechazado:       'Rechazado',
}
const STATUS_COLOR: Record<DocStatus, string> = {
  pendiente_carga: 'var(--text-muted)',
  en_revision:     'var(--warning, #f59e0b)',
  aprobado:        'var(--success, #22c55e)',
  rechazado:       'var(--danger, #ef4444)',
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const normalizePhone  = (p: string) => p.trim().replace(/\D/g, '')
const isValidEmail    = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
const joinName        = (f: string, l: string) => `${f.trim()} ${l.trim()}`.replace(/\s+/g, ' ').trim()
const initialDocs     = (): DocState[] => USER_DOCS.map(d => ({ ...d, status: 'pendiente_carga', preview: null, uploading: false, error: null }))

// Espera a que las cookies de sesión de Supabase SSR estén listas en el navegador
async function waitForSessionCookie(maxMs = 3000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    const hasCookie = document.cookie.split(';').some(c => c.trim().startsWith('sb-'))
    if (hasCookie) return
    await new Promise(r => setTimeout(r, 100))
  }
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

// ─── componente ───────────────────────────────────────────────────────────────
export default function RegistroPage() {
  const router = useRouter()
  const { setUser, completeOnboarding } = useAuthStore()
  const { showToast } = useAppStore()

  const [step, setStep]         = useState<1 | 2>(1)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: '' })
  const [docs, setDocs]       = useState<DocState[]>(initialDocs)

  const requiredDone = docs.filter(d => d.required).every(d => d.status === 'en_revision' || d.status === 'aprobado')

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }))

  // ── Paso 1: crear cuenta ──────────────────────────────────────────────────
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    const phone = normalizePhone(form.phone)
    const email = form.email.trim().toLowerCase()
    const name  = joinName(form.firstName, form.lastName)

    if (!form.firstName.trim() || !form.lastName.trim()) { setError('Ingresa tu nombre y apellidos.'); return }
    if (!isValidEmail(email))          { setError('Ingresa un correo electrónico válido.'); return }
    if (!/^\d{10}$/.test(phone))       { setError('Ingresa un teléfono de 10 dígitos sin código internacional.'); return }
    if (form.password.length < 8)      { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()

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

    if (!signUpData.session) {
      setError('Revisa tu correo para confirmar tu cuenta e inicia sesión.')
      setLoading(false)
      return
    }

    // Crear perfil con el browser client (tiene sesión activa)
    const { data: existingProfile } = await supabase
      .from('app_users')
      .select('id, name, phone, email')
      .eq('auth_id', signUpData.user.id)
      .maybeSingle()

    const profileQ = existingProfile
      ? supabase.from('app_users').update({ name, phone, email }).eq('id', existingProfile.id).select('id, name, phone, email').single()
      : supabase.from('app_users').insert({ auth_id: signUpData.user.id, name, phone, email }).select('id, name, phone, email').single()

    const { data: profile, error: profileError } = await profileQ

    if (profileError || !profile) {
      setError(profileError?.message ?? 'Cuenta creada, pero no pudimos guardar tu perfil. Contacta soporte.')
      setLoading(false)
      return
    }

    // Esperar a que Supabase SSR escriba las cookies en document.cookie
    // para que el API route de upload pueda leer la sesión
    await waitForSessionCookie()

    setUser({ id: profile.id, name: profile.name, phone: profile.phone ?? '', email: profile.email })
    setLoading(false)
    setStep(2)
  }

  // ── Paso 2: upload via API route (sesión ya lista en cookies) ─────────────
  async function handleUpload(docType: string, file: File) {
    const validationError = validateFile(file)
    if (validationError) {
      setDocs(prev => prev.map(d => d.docType === docType ? { ...d, error: validationError } : d))
      return
    }

    setDocs(prev => prev.map(d => d.docType === docType
      ? { ...d, uploading: true, error: null, preview: getPreviewUrl(file) }
      : d
    ))

    const formData = new FormData()
    formData.append('file', file)
    formData.append('ownerType', 'user')
    formData.append('docType', docType)

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
      const payload = await res.json().catch(() => null) as { ok?: boolean; error?: string } | null

      if (!res.ok || !payload?.ok) {
        setDocs(prev => prev.map(d => d.docType === docType
          ? { ...d, uploading: false, error: payload?.error ?? 'No se pudo subir el archivo.' }
          : d
        ))
        return
      }

      setDocs(prev => prev.map(d => d.docType === docType
        ? { ...d, uploading: false, status: 'en_revision', error: null }
        : d
      ))
    } catch {
      setDocs(prev => prev.map(d => d.docType === docType
        ? { ...d, uploading: false, error: 'Error de red al subir el archivo.' }
        : d
      ))
    }
  }

  // ── Finalizar ─────────────────────────────────────────────────────────────
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
        <div className="step-badge">Paso {step} de 2</div>

        {/* ══ PASO 1 ══ */}
        {step === 1 && (
          <>
            <h1 className="onboarding-title">Crea tu cuenta</h1>
            <p className="onboarding-sub">Registra tus datos para gestionar tus traslados.</p>

            <form onSubmit={handleCreateAccount} className="auth-form">
              <label className="field-label">Nombre(s)</label>
              <input className="field-input" placeholder="JUAN CARLOS"
                value={form.firstName}
                onChange={e => update('firstName', e.target.value.toUpperCase())}
                autoCapitalize="characters"
                style={{ textTransform: 'uppercase' }}
                required />

              <label className="field-label">Apellido(s)</label>
              <input className="field-input" placeholder="GARCIA LOPEZ"
                value={form.lastName}
                onChange={e => update('lastName', e.target.value.toUpperCase())}
                autoCapitalize="characters"
                style={{ textTransform: 'uppercase' }}
                required />

              <label className="field-label">Teléfono</label>
              <input className="field-input" type="tel" inputMode="numeric" placeholder="55 0000 0000"
                value={form.phone} onChange={e => update('phone', e.target.value.replace(/[^\d\s-]/g, ''))} required />

              <label className="field-label">Correo electrónico</label>
              <input className="field-input" type="email" placeholder="correo@ejemplo.com"
                value={form.email} onChange={e => update('email', e.target.value)} required />

              <label className="field-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="field-input"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  style={{ paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  aria-label={showPwd ? 'Ocultar contraseña' : 'Ver contraseña'}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  {showPwd ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>

              <label className="field-label">Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="field-input"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  style={{ paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Ver contraseña'}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}
                >
                  {showConfirm ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>

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

        {/* ══ PASO 2 ══ */}
        {step === 2 && (
          <>
            <div>
              <h1 className="onboarding-title">Verifica tu identidad</h1>
              <p className="onboarding-sub">
                Sube tus documentos. Los revisamos en menos de 24 horas y te avisamos el resultado.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docs.map(doc => (
                <DocCard key={doc.docType} doc={doc} onFile={file => handleUpload(doc.docType, file)} />
              ))}
            </div>

            <div style={{
              background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
              padding: '12px 14px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', fontSize: 13,
            }}>
              <span className="muted">Documentos subidos</span>
              <strong style={{ color: requiredDone ? 'var(--success, #22c55e)' : 'var(--text)' }}>
                {docs.filter(d => d.status !== 'pendiente_carga').length} / {docs.filter(d => d.required).length} obligatorios
              </strong>
            </div>

            <button className="btn-primary" disabled={!requiredDone} onClick={handleFinish}>
              Finalizar registro →
            </button>

            {!requiredDone && (
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                Sube los documentos obligatorios para finalizar
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

// ─── Tarjeta de documento ─────────────────────────────────────────────────────
function DocCard({ doc, onFile }: { doc: DocState; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{
      border: `1.5px solid ${doc.status === 'aprobado' ? 'var(--success,#22c55e)' : doc.status === 'rechazado' ? 'var(--danger,#ef4444)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      background: doc.status === 'aprobado' ? 'rgba(34,197,94,.06)' : 'var(--surface)',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
          {doc.status === 'en_revision' ? '🔍' : doc.status === 'aprobado' ? '✅' : doc.status === 'rechazado' ? '❌' : '📎'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{doc.label}</p>
          <p style={{ fontSize: 12, color: STATUS_COLOR[doc.status], fontWeight: 600, marginTop: 2 }}>
            {STATUS_LABEL[doc.status]}
          </p>
        </div>
        {!doc.required && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
            Opcional
          </span>
        )}
        {doc.status !== 'aprobado' && (
          <button onClick={() => inputRef.current?.click()} disabled={doc.uploading} style={{
            padding: '6px 14px', borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-dim)', color: 'var(--primary)',
            border: '1px solid var(--primary)', fontSize: 12,
            fontWeight: 600, cursor: doc.uploading ? 'wait' : 'pointer', flexShrink: 0,
          }}>
            {doc.uploading ? 'Subiendo…' : doc.preview ? 'Cambiar' : 'Subir'}
          </button>
        )}
        <input ref={inputRef} type="file" accept={ACCEPTED_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      </div>

      {doc.preview && !doc.error && (
        <div style={{ padding: '0 14px 12px' }}>
          {doc.preview.startsWith('blob:') && (doc.preview.includes('image') || !doc.preview.includes('pdf')) ? (
            <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <img src={doc.preview} alt={doc.label}
                style={{ width: '100%', maxHeight: 140, objectFit: 'cover', display: 'block' }} />
              {doc.uploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', fontSize: 13, color: '#fff', fontWeight: 600 }}>
                  Subiendo…
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.4rem' }}>📄</span>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{doc.uploading ? 'Subiendo PDF…' : 'PDF listo'}</p>
            </div>
          )}
        </div>
      )}

      {doc.error && (
        <p style={{ padding: '0 14px 12px', fontSize: 12, color: 'var(--danger, #ef4444)' }}>
          ⚠️ {doc.error}
        </p>
      )}

      {!doc.preview && doc.status === 'pendiente_carga' && !doc.error && (
        <p style={{ padding: '0 14px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
          JPG, PNG, WEBP o PDF · Máx {MAX_SIZE_MB} MB
        </p>
      )}
    </div>
  )
}