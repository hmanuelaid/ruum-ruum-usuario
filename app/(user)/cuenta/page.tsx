'use client'
import { useEffect, useState } from 'react'
import { useAuthStore, useAppStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import type { Vehicle } from '@/lib/types'

type AccountStats = {
  totalTrips: number
  totalSpent: number
  vehicles: number
}

type ProfileResponse = {
  id: string
  name: string
  phone: string | null
  email: string | null
  country?: string | null
  state?: string | null
  address?: string | null
}

const EMPTY_STATS: AccountStats = {
  totalTrips: 0,
  totalSpent: 0,
  vehicles: 0,
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function CuentaPage() {
  const { user, setUser } = useAuthStore()
  const { showToast } = useAppStore()
  const [profile, setProfile] = useState<ProfileResponse | null>(user)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stats, setStats] = useState<AccountStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadAccount() {
      const [profileResponse, vehiclesResponse] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/vehicles'),
      ])

      const profilePayload = await profileResponse.json().catch(() => null) as {
        ok?: boolean
        data?: ProfileResponse
        error?: string
      } | null
      const vehiclesPayload = await vehiclesResponse.json().catch(() => null) as {
        ok?: boolean
        data?: Vehicle[]
        error?: string
      } | null

      if (cancelled) return

      if (!profileResponse.ok || !profilePayload?.ok || !profilePayload.data) {
        setError(profilePayload?.error ?? 'No pudimos cargar tu perfil.')
        setLoading(false)
        return
      }

      if (!vehiclesResponse.ok || !vehiclesPayload?.ok || !Array.isArray(vehiclesPayload.data)) {
        setError(vehiclesPayload?.error ?? 'No pudimos cargar tus vehículos.')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('id, client_price_mxn')
        .eq('user_id', profilePayload.data.id)

      if (cancelled) return

      if (tripsError) {
        setError(`No pudimos cargar tus métricas: ${tripsError.message}`)
        setLoading(false)
        return
      }

      setProfile(profilePayload.data)
      setUser({
        id: profilePayload.data.id,
        name: profilePayload.data.name,
        phone: profilePayload.data.phone ?? '',
        email: profilePayload.data.email ?? '',
      })
      setVehicles(vehiclesPayload.data)
      setStats({
        totalTrips: trips?.length ?? 0,
        totalSpent: (trips ?? []).reduce((sum, trip) => sum + Number(trip.client_price_mxn ?? 0), 0),
        vehicles: vehiclesPayload.data.length,
      })
      setError('')
      setLoading(false)
    }

    void loadAccount()

    return () => {
      cancelled = true
    }
  }, [setUser])

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <p className="muted">Cargando cuenta…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
        <p className="field-error">{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Perfil */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--primary-dim)', display: 'grid',
          placeItems: 'center', fontSize: '1.8rem', flexShrink: 0,
        }}>👤</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: 17 }}>{profile?.name ?? 'Usuario'}</p>
          <p className="muted">{profile?.phone}</p>
          <p className="muted">{profile?.email}</p>
          {(profile?.state || profile?.country) && (
            <p className="muted">{[profile.state, profile.country].filter(Boolean).join(', ')}</p>
          )}
        </div>
        <button className="btn-mini" onClick={() => showToast('Editar perfil próximamente')} aria-label="Editar perfil">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/>
          </svg>
        </button>
      </div>

      {/* Mis vehículos */}
      <section>
        <div className="section-head" style={{ marginBottom: 10 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Mis vehículos</h2>
          <button className="btn-text" onClick={() => showToast('Agrega un vehículo desde Solicitar traslado')}>+ Agregar</button>
        </div>
        {vehicles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <p style={{ fontSize: 28, marginBottom: 8 }}>🚗</p>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin vehículos guardados</p>
            <p className="muted">Cuando solicites un traslado, tus vehículos reales aparecerán aquí.</p>
          </div>
        ) : (
          <div className="stack">
            {vehicles.map(v => (
              <article key={v.id} className="list-card">
                <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-dim)', display: 'grid', placeItems: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🚗</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{v.alias}</p>
                  <p className="muted">{v.brand} {v.model} {v.year} · {v.plates}</p>
                  <p className="muted" style={{ fontSize: 12 }}>{v.color} · {v.transmission === 'automatica' ? 'Automático' : 'Manual'}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Configuración */}
      <section>
        <div className="settings-group">
          <h3>Pago y facturación</h3>
          <button className="settings-row" onClick={() => showToast('Próximamente')}>Métodos de pago <span>›</span></button>
          <button className="settings-row" onClick={() => showToast('Próximamente')}>Facturación <span>›</span></button>
        </div>
        <div className="settings-group" style={{ marginTop: 16 }}>
          <h3>Soporte</h3>
          <button className="settings-row">Preguntas frecuentes <span>›</span></button>
          <button className="settings-row">Reportar problema <span>›</span></button>
          <button className="settings-row">Contactar soporte <span>›</span></button>
          <button className="settings-row">Términos y condiciones <span>›</span></button>
          <button className="settings-row">Aviso de privacidad <span>›</span></button>
        </div>
      </section>

      {/* Métricas rápidas */}
      <div className="metric-grid">
        <div className="metric-card">
          <p className="value">{stats.totalTrips}</p>
          <p className="label">Viajes totales</p>
        </div>
        <div className="metric-card">
          <p className="value">{formatCurrency(stats.totalSpent)}</p>
          <p className="label">Total invertido</p>
        </div>
        <div className="metric-card">
          <p className="value">{stats.vehicles}</p>
          <p className="label">Vehículos</p>
        </div>
        <div className="metric-card">
          <p className="value">-</p>
          <p className="label">Calificación</p>
        </div>
      </div>
    </>
  )
}
