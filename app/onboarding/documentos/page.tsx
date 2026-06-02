'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { useAppStore } from '@/lib/store'
import { useDocuments } from '@/lib/useDocuments'
import { DocumentUploader } from '@/components/ui/DocumentUploader'
import { createClient } from '@/lib/supabase'

const USER_DOCS = [
  { docType: 'ine',          label: 'Identificación oficial (INE/Pasaporte)', required: true  },
  { docType: 'comprobante',  label: 'Comprobante de domicilio',               required: true  },
  { docType: 'foto_perfil',  label: 'Foto de perfil',                         required: false },
]

export default function DocumentosPage() {
  const router = useRouter()
  const { user, setUser, completeOnboarding } = useAuthStore()
  const { showToast } = useAppStore()
  const [profileLoading, setProfileLoading] = useState(!user)
  const [profileError, setProfileError] = useState('')

  const ownerId   = user?.id ?? null
  const { docs, loading, error: documentsError, updateDoc } = useDocuments(ownerId, USER_DOCS)

  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        setProfileLoading(false)
        setProfileError('')
      })
      return
    }

    let cancelled = false

    async function loadProfile() {
      const supabase = createClient()
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()

      if (cancelled) return

      if (authError || !authUser) {
        router.replace('/login?redirectTo=/onboarding/documentos')
        return
      }

      const { data: profile, error: profileLookupError } = await supabase
        .from('app_users')
        .select('id, name, phone, email')
        .eq('auth_id', authUser.id)
        .maybeSingle()

      if (cancelled) return

      if (profileLookupError || !profile) {
        setProfileError(profileLookupError?.message ?? 'No encontramos tu perfil. Vuelve a completar el registro.')
        setProfileLoading(false)
        return
      }

      setUser({
        id: profile.id,
        name: profile.name,
        phone: profile.phone ?? '',
        email: profile.email ?? authUser.email ?? '',
      })
      setProfileLoading(false)
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [router, setUser, user])

  const requiredDone = docs
    .filter(d => d.required)
    .every(d => d.status === 'en_revision' || d.status === 'aprobado')

  async function handleFinish() {
    completeOnboarding()
    showToast('¡Documentos enviados! Los revisamos en menos de 24 h.')
    router.replace('/inicio')
  }

  return (
    <div className="onboarding-shell">
      <button className="btn-back" onClick={() => router.back()}>← Atrás</button>

      <div className="onboarding-card" style={{ gap: '1.25rem' }}>
        <div className="step-badge">Paso 2 de 2</div>

        <div>
          <h1 className="onboarding-title">Verifica tu identidad</h1>
          <p className="onboarding-sub">
            Sube tus documentos. Los revisamos en menos de 24 horas y te notificamos el resultado.
          </p>
        </div>

        {profileError && (
          <div style={{
            background: 'rgba(239,68,68,.08)',
            border: '1px solid rgba(239,68,68,.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: 13,
            color: 'var(--danger)',
          }}>
            {profileError}
          </div>
        )}

        {documentsError && (
          <div style={{
            background: 'rgba(239,68,68,.08)',
            border: '1px solid rgba(239,68,68,.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            fontSize: 13,
            color: 'var(--danger)',
          }}>
            {documentsError}
          </div>
        )}

        {profileLoading || loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <p className="muted">
              {profileLoading ? 'Preparando tu perfil…' : 'Cargando documentos…'}
            </p>
          </div>
        ) : !ownerId ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <p className="muted">Completa tu registro para subir documentos.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {docs.map(doc => (
              <DocumentUploader
                key={doc.docType}
                doc={doc}
                ownerId={ownerId}
                ownerType="user"
                onUploaded={updateDoc}
              />
            ))}
          </div>
        )}

        {/* Progreso */}
        {!loading && (
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
      </div>
    </div>
  )
}
