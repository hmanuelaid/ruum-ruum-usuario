'use client'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { useAppStore } from '@/lib/store'
import { Chip } from '@/components/ui/Chip'
import { mockTrips } from '@/lib/mock-data'

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida:  'Solicitud recibida',
  en_revision:         'En revisión',
  conductor_asignado:  'Conductor asignado',
  en_camino_origen:    'En camino al origen',
  recoleccion_proceso: 'Recolección en proceso',
  vehiculo_documentado:'Vehículo documentado',
  traslado_curso:      'Traslado en curso',
  llegando_destino:    'Llegando a destino',
  entrega_proceso:     'Entrega en proceso',
  finalizado:          'Finalizado',
  cancelado:           'Cancelado',
  incidente:           'En revisión por incidente',
}

export default function InicioPage() {
  const { user } = useAuthStore()
  const { setActiveTrip } = useAppStore()
  const activeTrip = mockTrips.find(t => t.status === 'traslado_curso')
  const recentTrips = mockTrips.slice(0, 3)

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

      {/* Viaje activo */}
      {activeTrip && (
        <section>
          <div className="section-head">
            <h2 style={{ fontSize: 15, fontWeight: 700 }}>Viaje activo</h2>
            <Chip variant="accent">En curso</Chip>
          </div>
          <article className="list-card accent-left" onClick={() => setActiveTrip(activeTrip)}>
            <div style={{ flex: 1 }}>
              <p className="kicker">{activeTrip.id} · {activeTrip.vehicle.alias}</p>
              <p style={{ fontWeight: 600, fontSize: 14, margin: '4px 0' }}>
                {activeTrip.origin.address.split(',')[0]} → {activeTrip.destination.address.split(',')[0]}
              </p>
              <p className="muted">{STATUS_LABELS[activeTrip.status]}</p>
            </div>
            <button className="btn-mini" aria-label="Ver detalle">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18 15 12 9 6"/>
              </svg>
            </button>
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
          <Link href="/cuenta" className="quick-action">
            <div className="quick-action-icon">💬</div>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Soporte</span>
          </Link>
        </div>
      </section>

      {/* Últimos viajes */}
      <section>
        <div className="section-head">
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Últimos viajes</h2>
          <Link href="/viajes"><button className="btn-text">Ver todos</button></Link>
        </div>
        <div className="stack">
          {recentTrips.map(trip => (
            <article key={trip.id} className="list-card">
              <div style={{ flex: 1 }}>
                <p className="kicker">{trip.id} · {trip.vehicle.alias}</p>
                <p style={{ fontWeight: 600, fontSize: 14, margin: '3px 0' }}>
                  {trip.origin.address.split(',')[0]} → {trip.destination.address.split(',')[0]}
                </p>
                <p className="muted">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(trip.priceEstimatedMXN)}</p>
              </div>
              <Chip status={trip.status}>{STATUS_LABELS[trip.status]}</Chip>
            </article>
          ))}
        </div>
      </section>

      {/* Mensaje de confianza */}
      <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
        <p style={{ fontSize: 22, marginBottom: 8 }}>🛡️</p>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Conductores certificados</p>
        <p className="muted" style={{ fontSize: 13 }}>Cada traslado incluye evidencia fotográfica, seguimiento de ruta y soporte 24/7.</p>
      </div>
    </>
  )
}