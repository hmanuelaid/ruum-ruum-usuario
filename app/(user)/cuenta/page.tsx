'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string | null
}

type Vehicle = {
  id: string
  vehicle_brand?: string | null
  vehicle_model?: string | null
  vehicle_year?: number | null
  vehicle_plates?: string | null
}

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error?: string }

function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--text-muted)" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}

function SettingsRow({
  label, sub, onClick,
}: { label: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '13px 0',
        background: 'none', border: 'none',
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <strong style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</strong>
        <small style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</small>
      </span>
      <IconChevron />
    </button>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        padding: '12px 16px 8px', margin: 0,
        borderBottom: '1px solid var(--border)',
      }}>
        {title}
      </p>
      <div style={{ padding: '0 16px' }}>
        {children}
      </div>
    </div>
  )
}

export default function CuentaPage() {
  const router = useRouter()
  const { user, setUser, logout } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    async function loadAccount() {
      setLoading(true)
      setError('')
      try {
        const [profileRes, vehiclesRes] = await Promise.all([
          fetch('/api/profile', { headers: { Accept: 'application/json' } }),
          fetch('/api/vehicles', { headers: { Accept: 'application/json' } }),
        ])

        if (profileRes.status === 401 || vehiclesRes.status === 401) {
          router.replace('/login')
          return
        }

        const profilePayload = (await profileRes.json().catch(() => null)) as ApiResponse<UserProfile> | null
        const vehiclesPayload = (await vehiclesRes.json().catch(() => null)) as ApiResponse<Vehicle[]> | null

        if (!profileRes.ok || !profilePayload?.ok) {
          throw new Error(profilePayload && !profilePayload.ok ? profilePayload.error ?? 'Error al cargar perfil.' : 'Error al cargar perfil.')
        }
        if (!vehiclesRes.ok || !vehiclesPayload?.ok) {
          throw new Error(vehiclesPayload && !vehiclesPayload.ok ? vehiclesPayload.error ?? 'Error al cargar vehículos.' : 'Error al cargar vehículos.')
        }

        setProfile(profilePayload.data)
        setVehicles(vehiclesPayload.data)
        setUser({ id: profilePayload.data.id, name: profilePayload.data.name, email: profilePayload.data.email, phone: profilePayload.data.phone ?? '' })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No pudimos cargar tu cuenta.')
      } finally {
        setLoading(false)
      }
    }
    void loadAccount()
  }, [router, setUser])

  async function handleLogout() {
    if (signingOut) return
    setSigningOut(true)
    const supabase = createClient()
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setSigningOut(false)
      return
    }
    logout()
    router.replace('/login')
    router.refresh()
  }

  const displayName  = profile?.name  ?? user?.name  ?? 'Usuario'
  const displayEmail = profile?.email ?? user?.email ?? ''
  const displayPhone = profile?.phone ?? user?.phone ?? ''
  const initial      = displayName.charAt(0).toUpperCase()

  return (
    <>
      {/* Header perfil */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '20px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--primary-dim)',
          border: '2px solid var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: 'var(--primary)',
          flexShrink: 0,
        }}>
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName}
          </p>
          {displayEmail && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayEmail}
            </p>
          )}
          {displayPhone && (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '1px 0 0' }}>
              {displayPhone}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius)', padding: '14px 16px',
        }}>
          <p style={{ color: 'var(--danger)', fontSize: 13, margin: '0 0 8px', fontWeight: 600 }}>
            No pudimos cargar tu cuenta
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: '0 0 12px' }}>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '20px 16px',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>Cargando configuración…</p>
        </div>
      ) : (
        <>
          <SectionCard title="Mi cuenta">
            <SettingsRow
              label="Editar perfil"
              sub="Actualiza tus datos personales"
              onClick={() => router.push('/cuenta/perfil')}
            />
            <SettingsRow
              label="Mis vehículos"
              sub={vehicles.length > 0
                ? `${vehicles.length} vehículo${vehicles.length === 1 ? '' : 's'} registrado${vehicles.length === 1 ? '' : 's'}`
                : 'Agrega o administra tus vehículos'}
              onClick={() => router.push('/cuenta/vehiculos')}
            />
          </SectionCard>

          <SectionCard title="Pagos y facturación">
            <SettingsRow
              label="Métodos de pago"
              sub="Agrega o administra tus métodos guardados"
              onClick={() => router.push('/cuenta/pagos')}
            />
            <SettingsRow
              label="Facturación"
              sub="RFC, razón social y datos fiscales"
              onClick={() => router.push('/cuenta/facturacion')}
            />
          </SectionCard>

          <SectionCard title="Ayuda">
            <SettingsRow
              label="Contactar soporte"
              sub="Habla con nuestro equipo"
              onClick={() => router.push('/soporte')}
            />
            <SettingsRow
              label="Reportar problema"
              sub="Cuéntanos qué ocurrió"
              onClick={() => router.push('/soporte?tipo=incidencia')}
            />
            <SettingsRow
              label="Preguntas frecuentes"
              sub="Consulta respuestas rápidas"
              onClick={() => router.push('/faq')}
            />
          </SectionCard>

          <SectionCard title="Legal">
            <SettingsRow
              label="Documentos legales"
              sub="Términos, privacidad, cookies y consentimientos"
              onClick={() => router.push('/legal')}
            />
            <SettingsRow
              label="Términos y condiciones"
              sub="Consulta las reglas del servicio"
              onClick={() => router.push('/terminos')}
            />
            <SettingsRow
              label="Aviso de privacidad"
              sub="Conoce cómo protegemos tus datos"
              onClick={() => router.push('/privacidad')}
            />
          </SectionCard>

          {/* Cerrar sesión */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            style={{
              width: '100%', padding: '13px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius)',
              color: 'var(--danger)', fontSize: 14, fontWeight: 600,
              cursor: signingOut ? 'not-allowed' : 'pointer',
              opacity: signingOut ? 0.6 : 1,
              transition: 'opacity .15s',
            }}
          >
            {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </>
      )}
    </>
  )
}
