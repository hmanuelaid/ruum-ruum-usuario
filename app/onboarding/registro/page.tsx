'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore, useAppStore } from '@/lib/store'
import { validateFile, getPreviewUrl, ACCEPTED_TYPES, MAX_SIZE_MB } from '@/lib/storage'

// ─── tipos locales ────────────────────────────────────────────────────────────
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
  en_revision:     'En revisión',
  aprobado:        'Aprobado',
  rechazado:       'Rechazado',
}
const STATUS_COLOR: Record<DocStatus, string> = {
  pendiente_carga: 'var(--text-muted)',
  en_revision:     'var(--warning, #f59e0b)',
  aprobado:        'var(--success, #22c55e)',
  rechazado:       'var(--danger, #ef4444)',
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function normalizePhone(phone: string) {
  return phone.trim().replace(/\D/g, '')
}
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
function joinName(first: string, last: string) {
  return `${first.trim()} ${last.trim()}`.replace(/\s+/g, ' ').trim()
}
function initialDocs(): DocState[] {
  return USER_DOCS.map(d => ({ ...d, status: 'pendiente_carga', preview: null, uploading: false, error: null }))
}

// ─── componente ───────────────────────────────────────────────────────────────
export default function RegistroPage() {
  const router   = useRouter()
  const { setUser, completeOnboarding } = useAuthStore()
  const { showToast } = useAppStore()

  const [step, setStep]       = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', password: '', confirmPassword: '',
  })

  // sesión activa de Supabase tras el signUp — se pasa a las operaciones del paso 2
  const [supabaseClient, setSupabaseClient] = useState<ReturnType<typeof createClient> | null>(null)
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [docs, setDocs] = useState<DocState[]>(initialDocs)

  const requiredDone = docs.filter(d => d.required).every(d => d.status === 'en_revision' || d.status === 'aprobado')

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  // ── Paso 1: crear cuenta ──────────────────────────────────────────────────
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    const phone = normalizePhone(form.phone)
    const email = form.email.trim().toLowerCase()
    const name  = joinName(form.firstName, form.lastName)

    if (!form.firstName.trim() || !form.lastName.trim()) { setError('Ingresa tu nombre y apellidos.'); return }
    if (!isValidEmail(email))  { setError('Ingresa un correo electrónico válido.'); return }
    if (!/^\d{10}$/.test(phone)) { setError('Ingresa un teléfono nacional de 10 dígitos, sin código internacional.'); return }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
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
      setError('Revisa tu correo para confirmar tu cuenta y luego inicia sesión.')
      setLoading(false)
      return
    }

    // Crear perfil con el mismo browser client que tiene la sesión activa
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

    setUser({ id: profile.id, name: profile.name, phone: profile.phone ?? '', email: profile.email })
    // Guardar el cliente con sesión para usarlo en el paso 2
    setSupabaseClient(supabase)
    setOwnerId(profile.id)
    setLoading(false)
    setStep(2)
  }

  // ── Paso 2: subir documento directo con browser client ────────────────────
  async function handleUpload(docType: string, file: File) {
    if (!supabaseClient || !ownerId) return

    const validationError = validateFile(file)
    if (validationError) {
      setDocs(prev => prev.map(d => d.docType === docType ? { ...d, error: validationError } : d))
      return
    }

    const preview = getPreviewUrl(file)
    setDocs(prev => prev.map(d => d.docType === docType
      ? { ...d, uploading: true, error: null, preview }
      : d
    ))

    // Leer magic bytes para validar contenido (igual que el API route)
    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
    const mimeOk =
      (file.type === 'image/jpeg'      && bytes[0] === 0xff && bytes[1] === 0xd8) ||
      (file.type === 'image/png'       && bytes[0] === 0x89 && bytes[1] === 0x50) ||
      (file.type === 'image/webp'      && bytes[0] === 0x52 && bytes[8] === 0x57) ||
      (file.type === 'application/pdf' && bytes[0] === 0x25 && bytes[1] === 0x50)

    if (!mimeOk) {
      setDocs(prev => prev.map(d => d.docType === docType
        ? { ...d, uploading: false, error: 'El contenido del archivo no coincide con su tipo.' }
        : d
      ))
      return
    }

    const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' } as Record<string, string>)[file.type] ?? 'bin'
    const path = `user/${ownerId}/${docType}/${crypto.randomUUID()}.${ext}`

    // 1. Subir archivo a Storage usando el browser client con sesión
    const { error: uploadError } = await supabaseClient.storage
      .from('documents')
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      setDocs(prev => prev.map(d => d.docType === docType
        ? { ...d, uploading: false, error: `No se pudo subir el archivo: ${uploadError.message}` }
        : d
      ))
      return
    }

    const now = new Date().toISOString()

    // 2. Verificar si ya existe un registro para este docType
    const { data: existing } = await supabaseClient
      .from('documents')
      .select('id, storage_path')
      .eq('owner_id', ownerId)
      .eq('owner_type', 'user')
      .eq('type', docType)
      .maybeSingle()

    const docPayload = {
      owner_id:              ownerId,
      owner_type:            'user',
      type:                  docType,
      status:                'en_revision',
      url:                   null,
      storage_path:          path,
      mime_type:             file.type,
      file_size:             file.size,
      scan_status:           'pending',
      content_validated_at:  now,
      uploaded_at:           now,
      updated_at:            now,
    }

    const docQ = existing
      ? supabaseClient.from('documents').update(docPayload).eq('id', existing.id).select('id').single()
      : supabaseClient.from('documents').insert(docPayload).select('id').single()

    const { error: docError } = await docQ

    if (docError) {
      // Revertir el archivo subido si el registro falló
      await supabaseClient.storage.from('documents').remove([path])
      setDocs(prev => prev.map(d => d.docType === docType
        ? { ...d, uploading: false, error: `Archivo subido pero no registrado: ${docError.message}` }
        : d
      ))
      return
    }

    // Limpiar el archivo anterior si fue reemplazado
    if (existing?.storage_path && existing.storage_path !== path) {
      await supabaseClient.storage.from('documents').remove([existing.storage_path])
    }

    setDocs(prev => prev.map(d => d.docType === docType
      ? { ...d, uploading: false, status: 'en_revision', error: null }
      : d
    ))
  }

  // ── Paso 2: finalizar ────────────────────────────────────────────────────
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
                Sube tus documentos. Los revisamos en menos de 24 horas y te notificamos el resultado.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docs.map(doc => (
                <DocCard
                  key={doc.docType}
                  doc={doc}
                  onFile={file => handleUpload(doc.docType, file)}
                />
              ))}
            </div>

            {/* Progreso */}
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
              <strong style={{ color: requiredDone ? 'var(--success, #22c55e)' : 'var(--text)' }}>
                {docs.filter(d => d.status !== 'pendiente_carga').length} / {docs.filter(d => d.required).length} obligatorios
              </strong>
            </div>

            <button className="btn-primary" disabled={!requiredDone} onClick={handleFinish}>
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

// ─── Tarjeta de documento ─────────────────────────────────────────────────────
function DocCard({ doc, onFile }: { doc: DocState; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div style={{
      border: `1.5px solid ${doc.status === 'aprobado' ? 'var(--success, #22c55e)' : doc.status === 'rechazado' ? 'var(--danger, #ef4444)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-sm)',
      background: doc.status === 'aprobado' ? 'rgba(34,197,94,.06)' : 'var(--surface)',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>
          {doc.status === 'en_revision' ? '🔍' : doc.status === 'aprobado' ? '✅' : doc.status === 'rechazado' ? '❌' : '📎'}
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: 14 }}>{doc.label}</p>
          <p style={{ fontSize: 12, color: STATUS_COLOR[doc.status], fontWeight: 600 }}>
            {STATUS_LABEL[doc.status]}
          </p>
        </div>
        {!doc.required && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 20 }}>
            Opcional
          </span>
        )}
        {doc.status !== 'aprobado' && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={doc.uploading}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-dim)', color: 'var(--primary)',
              border: '1px solid var(--primary)', fontSize: 12,
              fontWeight: 600, cursor: 'pointer', flexShrink: 0,
            }}>
            {doc.uploading ? 'Subiendo…' : doc.preview ? 'Cambiar' : 'Subir'}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }}
        />
      </div>

      {doc.preview && (
        <div style={{ padding: '0 14px 12px' }}>
          {doc.preview.startsWith('blob:') && !doc.preview.endsWith('.pdf') ? (
            <div style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <img src={doc.preview} alt={doc.label}
                style={{ width: '100%', maxHeight: 160, objectFit: 'cover', display: 'block' }} />
              {doc.uploading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)',
                  display: 'grid', placeItems: 'center', fontSize: 13, color: '#fff', fontWeight: 600,
                }}>
                  Subiendo…
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>📄</span>
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

      {!doc.preview && doc.status === 'pendiente_carga' && (
        <p style={{ padding: '0 14px 12px', fontSize: 11, color: 'var(--text-muted)' }}>
          JPG, PNG, WEBP o PDF · Máx {MAX_SIZE_MB} MB
        </p>
      )}
    </div>
  )
}
