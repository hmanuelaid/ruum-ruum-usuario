'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'

const DOCS = [
  { id: 'ine',         label: 'Identificación oficial (INE)', required: true },
  { id: 'comprobante', label: 'Comprobante de domicilio',     required: true },
  { id: 'foto',        label: 'Foto de perfil',               required: false },
]

export default function DocumentosPage() {
  const router = useRouter()
  const { setUser, completeOnboarding } = useAuthStore()
  const { showToast } = useAppStore()
  const [uploaded, setUploaded] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const requiredDone = DOCS.filter(d => d.required).every(d => uploaded[d.id])

  async function handleFinish() {
    setSubmitting(true); setError('')
    const supabase = createClient()
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem('reg_data') : null
    const reg = raw ? JSON.parse(raw) : {}

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: reg.email ?? '',
      password: reg.password,
    })

    if (signUpError) { setError(signUpError.message); setSubmitting(false); return }

    // 2. Crear perfil en app_users
    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .insert({
        auth_id: authData.user?.id,
        name: reg.name,
        email: reg.email ?? '',
        phone: reg.phone,
        type: 'personal',
        status: 'activo',
      })
      .select()
      .single()

    if (profileError) { setError('Error al crear perfil'); setSubmitting(false); return }

    setUser({ id: profile.id, name: profile.name, phone: profile.phone, email: profile.email })
    completeOnboarding()
    showToast('¡Registro completado!')
    router.replace('/inicio')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>← Atrás</button>
      <div className="onboarding-card">
        <div className="step-badge">Paso 3 de 3</div>
        <h1 className="onboarding-title">Verifica tu identidad</h1>
        <p className="onboarding-sub">Los revisamos en menos de 24 h.</p>
        <div className="doc-list">
          {DOCS.map(doc => (
            <div key={doc.id}
              className={`doc-row${uploaded[doc.id] ? ' doc-done' : ''}`}
              onClick={() => setUploaded(u => ({ ...u, [doc.id]: !u[doc.id] }))}>
              <span className="doc-icon">{uploaded[doc.id] ? '✓' : '↑'}</span>
              <span className="doc-label">{doc.label}</span>
              {!doc.required && <span className="doc-opt">Opcional</span>}
            </div>
          ))}
        </div>
        {error && <p className="field-error">{error}</p>}
        <button className="btn-primary"
          disabled={!requiredDone || submitting} onClick={handleFinish}>
          {submitting ? 'Creando cuenta…' : 'Finalizar registro'}
        </button>
        {!requiredDone && (
          <p className="field-error">Sube los documentos obligatorios para continuar</p>
        )}
      </div>
    </div>
  )
}