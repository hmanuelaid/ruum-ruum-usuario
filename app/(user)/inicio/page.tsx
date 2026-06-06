'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { Chip } from '@/components/ui/Chip'
import { createClient } from '@/lib/supabase'

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida: 'Solicitud recibida', pendiente_revision: 'En revisión',
  pendiente_asignacion: 'Sin conductor', conductor_asignado: 'Conductor asignado',
  conductor_en_camino: 'En camino', recoleccion_proceso: 'Recolección',
  traslado_curso: 'En curso', entrega_proceso: 'Entrega',
  finalizado: 'Finalizado', cancelado: 'Cancelado', incidente: 'Incidente',
}

const ACTIVE_STATUSES = [
  'solicitud_recibida','pendiente_revision','pendiente_asignacion',
  'conductor_asignado','conductor_en_camino','recoleccion_proceso',
  'evidencia_inicial_pendiente','traslado_curso','entrega_proceso','evidencia_final_pendiente',
]

interface Trip {
  id: string
  status: string
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_plates: string | null
  origin_address: string | null
  destination_address: string | null
  client_price_mxn: number | null
  driver_id: string | null
  created_at: string
}

export default function InicioPage() {
  const { user } = useAuthStore()
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null)
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])
  const [totalTrips, setTotalTrips] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    const userId = user.id
    let cancelled = false
    const supabase = createClient()

    async function loadData() {
      setLoading(true)
      setError('')
      const { data: trips, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (cancelled) return

      if (tripsError) {
        setError(`No pudimos cargar tus viajes: ${tripsError.message}`)
        setLoading(false)
        return
      }

      const all = (trips ?? []) as Trip[]
      const active = all.find(t => ACTIVE_STATUSES.includes(t.status)) ?? null
      setActiveTrip(active)
      setRecentTrips(all.slice(0, 3))
      setTotalTrips(all.length)
      setLoading(false)
    }

    void loadData()

    const channel = supabase
      .channel(`user-home-trips:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `user_id=eq.${userId}`,
      }, () => {
        void loadData()
      })
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [user])

  return (
    <>
      {/* Hero */}
      <div className="card-hero">
        <p style={{ fontSize: 13, opacity: .8, marginBottom: 4 }}>
          Hola, {user?.name?.split(' ')[0] ?? 'usuario'} 👋
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>
          Mueve tu auto sin<br />soltar el control.
        </h2>
        <Link href="/solicitar">
          <button style={{
            background: '#fff', color: 'var(--primary)',
            border: 'none', borderRadius: 10,
            padding: '10px 20px', fontWeight: 700,
            fontSize: 14, cursor: 'pointer',
          }}>
            Solicitar traslado →
          </button>
        </Link>
      </div>

      {error && (
        <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
          <p className="field-error">{error}</p>
        </div>
      )}

      {/* Viaje activo */}
      {!loading && activeTrip && (
        <section>
          <div className="section-head">
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Viaje activo</h2>
            <Chip variant="accent">En curso</Chip>
          </div>
          <article className="list-card accent-left">
            <div style={{ flex: 1 }}>
              <p className="kicker">{activeTrip.id} · {activeTrip.vehicle_brand} {activeTrip.vehicle_model}</p>
              <p style={{ fontWeight: 600, fontSize: 14, margin: '4px 0' }}>
                {activeTrip.origin_address?.split(',')[0]} → {activeTrip.destination_address?.split(',')[0]}
              </p>
              <p className="muted">{STATUS_LABELS[activeTrip.status] ?? activeTrip.status}</p>
              {activeTrip.driver_id
                ? <p style={{ fontSize: 12, color: 'var(--success)', marginTop: 4 }}>✓ Conductor asignado</p>
                : <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>⏳ Buscando conductor…</p>}
            </div>
            <Chip status={activeTrip.status}>{STATUS_LABELS[activeTrip.status]}</Chip>
          </article>
        </section>
      )}

      {/* Acciones rápidas */}
      <section>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Acciones rápidas</h2>
        <div className="quick-actions">
          <Link href="/solicitar" className="quick-action">
            <div className="quick-action-icon">🚗</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Solicitar traslado</span>
          </Link>
          <Link href="/viajes" className="quick-action">
            <div className="quick-action-icon">📋</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Mis viajes</span>
          </Link>
          <Link href="/evidencia" className="quick-action">
            <div className="quick-action-icon">📸</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Evidencia</span>
          </Link>
          <Link href="/soporte" className="quick-action">
            <div className="quick-action-icon">💬</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Soporte</span>
          </Link>
        </div>
      </section>

      {/* Métricas rápidas */}
      {!loading && totalTrips > 0 && (
        <div className="metric-grid">
          <div className="metric-card">
            <p className="value">{totalTrips}</p>
            <p className="label">Viajes totales</p>
          </div>
          <div className="metric-card">
            <p className="value">{recentTrips.filter(t => t.status === 'finalizado').length}</p>
            <p className="label">Finalizados</p>
          </div>
        </div>
      )}

      {/* Últimos viajes */}
      {!loading && recentTrips.length > 0 && (
        <section>
          <div className="section-head">
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Últimos viajes</h2>
            <Link href="/viajes"><button className="btn-text">Ver todos</button></Link>
          </div>
          <div className="stack">
            {recentTrips.map(trip => (
              <article key={trip.id} className="list-card">
                <div style={{ flex: 1 }}>
                  <p className="kicker">{trip.id}</p>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: '3px 0' }}>
                    {trip.origin_address?.split(',')[0]} → {trip.destination_address?.split(',')[0]}
                  </p>
                  <p className="muted">
                    ${Number(trip.client_price_mxn).toLocaleString('es-MX')}
                  </p>
                </div>
                <Chip status={trip.status}>{STATUS_LABELS[trip.status]}</Chip>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Sin viajes aún */}
      {!loading && totalTrips === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🚗</p>
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Tu primer traslado te espera</p>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Solicita el traslado de tu vehículo con conductores certificados.
          </p>
          <Link href="/solicitar">
            <button className="btn-primary">Solicitar ahora →</button>
          </Link>
        </div>
      )}

      {/* Mensaje de confianza */}
      <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
        <p style={{ fontSize: 22, marginBottom: 8 }}>🛡️</p>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Conductores certificados</p>
        <p className="muted" style={{ fontSize: 13 }}>
          Evidencia fotográfica, seguimiento de ruta y soporte 24/7.
        </p>
      </div>
    </>
  )
}
