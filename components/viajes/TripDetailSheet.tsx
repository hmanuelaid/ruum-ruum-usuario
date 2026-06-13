'use client'
import { useAppStore } from '@/lib/store'

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida:   'Solicitud recibida',
  pendiente_revision:   'En revisión',
  pendiente_asignacion: 'Sin conductor',
  conductor_asignado:   'Conductor asignado',
  conductor_en_camino:  'En camino al origen',
  recoleccion_proceso:  'Recolección en proceso',
  evidencia_inicial_pendiente: 'Evidencia inicial pendiente',
  traslado_curso:       'Traslado en curso',
  entrega_proceso:      'Entrega en proceso',
  evidencia_final_pendiente: 'Evidencia final pendiente',
  finalizado:           'Finalizado',
  cancelado:            'Cancelado',
  incidente:            'En revisión por incidente',
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

export default function TripDetailSheet() {
  const { activeTrip, setActiveTrip } = useAppStore()
  const isOpen = !!activeTrip

  return (
    <div
      className={`sheet-backdrop${isOpen ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) setActiveTrip(null) }}
      inert={!isOpen}
    >
      <aside className="sheet" role="dialog" aria-modal="true"
        style={{ gap: 20, paddingBottom: 40 }}>
        <div className="sheet-handle" />

        {activeTrip && (
          <>
            {/* Header */}
            <div className="sheet-header">
              <div>
                <p className="kicker">Viaje {activeTrip.id}</p>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                  {STATUS_LABELS[activeTrip.status] ?? activeTrip.status}
                </h2>
              </div>
              <button className="btn-icon" onClick={() => setActiveTrip(null)} aria-label="Cerrar">
                <svg viewBox="0 0 24 24" width={18} height={18} fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>

            {/* Vehículo */}
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: '2.2rem' }}>🚗</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: 15 }}>
                  {activeTrip.vehicle.brand} {activeTrip.vehicle.model} {activeTrip.vehicle.year}
                </p>
                <p className="muted">{activeTrip.vehicle.color} · {activeTrip.vehicle.plates}</p>
                <p className="muted" style={{ fontSize: 12 }}>
                  {activeTrip.vehicle.transmission === 'automatica' ? 'Automático' : 'Manual'} · {activeTrip.vehicle.condition}
                </p>
              </div>
            </div>

            {/* Conductor asignado */}
            {activeTrip.driverAssigned && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p className="kicker">Tu conductor</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--primary-dim)',
                    display: 'grid', placeItems: 'center',
                    fontSize: '1.6rem', flexShrink: 0,
                  }}>👤</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15 }}>
                      {activeTrip.driverAssigned.name}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      {activeTrip.driverAssigned.certified && (
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: 'var(--success)',
                          background: 'rgba(34,197,94,.12)',
                          padding: '2px 8px', borderRadius: 20,
                        }}>✓ Certificado</span>
                      )}
                      {activeTrip.driverAssigned.rating && (
                        <span className="muted" style={{ fontSize: 13 }}>
                          ⭐ {activeTrip.driverAssigned.rating}
                        </span>
                      )}
                    </div>
                    <p className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      ID: {activeTrip.driverAssigned.id}
                    </p>
                  </div>
                  {activeTrip.driverAssigned.phone && (
                    <a href={`tel:${activeTrip.driverAssigned.phone}`}
                      style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'var(--primary-dim)',
                        display: 'grid', placeItems: 'center',
                        color: 'var(--primary)', textDecoration: 'none', flexShrink: 0,
                      }}
                      aria-label="Llamar conductor">
                      📞
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Ruta */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="kicker">Ruta del traslado</p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 4 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                  <div style={{ width: 2, height: 40, background: 'var(--border)' }} />
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--success)', flexShrink: 0 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Origen</p>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{activeTrip.origin.address}</p>
                    {activeTrip.origin.reference && (
                      <p className="muted" style={{ fontSize: 12 }}>{activeTrip.origin.reference}</p>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Destino</p>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{activeTrip.destination.address}</p>
                    {activeTrip.destination.reference && (
                      <p className="muted" style={{ fontSize: 12 }}>{activeTrip.destination.reference}</p>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}>
                  <strong>{activeTrip.distanceKm}</strong>
                  <span className="muted"> km</span>
                </span>
                <span style={{ fontSize: 13 }}>
                  <strong>{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(activeTrip.priceEstimatedMXN)}</strong>
                  <span className="muted"> estimado</span>
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p className="kicker" style={{ marginBottom: 8 }}>Línea de tiempo</p>
              {activeTrip.timeline.length > 0 ? (
              <ol className="timeline">
                {activeTrip.timeline.map((item) => (
                  <li key={item.step}
                    className={`timeline-item${item.done ? ' done' : ''}`}>
                    <div className={`timeline-dot${item.active ? ' active' : item.done ? ' done' : ''}`}>
                      {item.done && !item.active && (
                        <svg viewBox="0 0 24 24" width={10} height={10} fill="none"
                          stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="timeline-label" style={{
                        fontWeight: item.active ? 700 : item.done ? 500 : 400,
                        color: item.active ? 'var(--primary)' : item.done ? 'var(--text)' : 'var(--text-muted)',
                      }}>
                        {item.label}
                      </p>
                      {item.timestamp && (
                        <p className="timeline-time">{formatDate(item.timestamp)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              ) : (
                <div className="card" style={{ padding: '14px' }}>
                  <p className="muted">La línea de tiempo aparecerá cuando el traslado avance.</p>
                </div>
              )}
            </div>

            {/* Evidencia disponible */}
            {activeTrip.evidence.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p className="kicker">Evidencia disponible</p>
                {activeTrip.evidence.map((ev, i) => (
                  <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>
                        {ev.type === 'inicial' ? '📸 Evidencia inicial' : ev.type === 'final' ? '✅ Evidencia final' : '📍 Durante traslado'}
                      </p>
                      <span style={{
                        fontSize: 11, padding: '2px 8px', borderRadius: 20,
                        background: 'rgba(34,197,94,.12)', color: 'var(--success)', fontWeight: 600,
                      }}>Disponible</span>
                    </div>
                    <div className="evidence-grid">
                      {[...Array(Math.min(ev.photos.length || 3, 3))].map((_, j) => (
                        <div key={j} className="evidence-thumb">📷</div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                      {ev.kmReading && <span><strong>{ev.kmReading.toLocaleString('es-MX')}</strong> km</span>}
                      {ev.fuelLevel && <span><strong>{ev.fuelLevel}%</strong> combustible</span>}
                    </div>
                    {ev.notes && <p className="muted" style={{ fontSize: 13 }}>{ev.notes}</p>}
                  </div>
                ))}
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeTrip.status === 'traslado_curso' && (
                <div className="card" style={{ background: 'rgba(34,197,94,.08)', borderColor: 'var(--success)' }}>
                  <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--success)', marginBottom: 4 }}>
                    🚗 Tu vehículo está en camino
                  </p>
                  <p className="muted" style={{ fontSize: 13 }}>
                    El conductor está realizando el traslado. Te notificaremos cuando esté llegando.
                  </p>
                </div>
              )}
              <div className="action-grid">
                <button className="btn-secondary" onClick={() => {}}>
                  💬 Soporte
                </button>
                <button className="btn-secondary" onClick={() => {}}>
                  📸 Ver evidencia
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}