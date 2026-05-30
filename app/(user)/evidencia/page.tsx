'use client'
import { useState } from 'react'
import { mockTrips } from '@/lib/mock-data'
import { Chip } from '@/components/ui/Chip'

export default function EvidenciaPage() {
  const [selected, setSelected] = useState<string | null>(
    mockTrips.length > 0 ? mockTrips[0].id : null
  )
  const trip = mockTrips.find(t => t.id === selected) ?? null

  const inicial = trip?.evidence.find(e => e.type === 'inicial')
  const final   = trip?.evidence.find(e => e.type === 'final')

  if (mockTrips.length === 0) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
      <p style={{ fontSize: 32, marginBottom: 8 }}>📸</p>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin evidencia disponible</p>
      <p className="muted">La evidencia de tus traslados aparecerá aquí.</p>
    </div>
  )

  return (
    <>
      {/* Selector de viaje */}
      <section>
        <p className="kicker" style={{ marginBottom: 8 }}>Selecciona un viaje</p>
        <div className="stack">
          {mockTrips.map(t => (
            <button key={t.id}
              onClick={() => setSelected(t.id)}
              style={{
                background: selected === t.id ? 'var(--primary-dim)' : 'var(--surface)',
                border: `1px solid ${selected === t.id ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', color: 'var(--text)', width: '100%', textAlign: 'left',
              }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{t.id} · {t.vehicle.alias}</p>
                <p className="muted" style={{ fontSize: 12 }}>
                  {t.origin.address.split(',')[0]} → {t.destination.address.split(',')[0]}
                </p>
              </div>
              <Chip status={t.status} />
            </button>
          ))}
        </div>
      </section>

      {/* Evidencia inicial */}
      {trip && (
        <>
          <section>
            <div className="section-head" style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Evidencia inicial</h2>
              {inicial ? <Chip variant="success">Disponible</Chip> : <Chip variant="default">Pendiente</Chip>}
            </div>
            {inicial ? (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="evidence-grid">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="evidence-thumb">📷</div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  {inicial.kmReading && <span><strong>{inicial.kmReading.toLocaleString('es-MX')}</strong> km</span>}
                  {inicial.fuelLevel && <span><strong>{inicial.fuelLevel}%</strong> combustible</span>}
                </div>
                {inicial.notes && <p className="muted">{inicial.notes}</p>}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <p className="muted">Disponible cuando el conductor reciba el vehículo.</p>
              </div>
            )}
          </section>

          {/* Evidencia final */}
          <section>
            <div className="section-head" style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Evidencia final</h2>
              {final ? <Chip variant="success">Disponible</Chip> : <Chip variant="default">Pendiente</Chip>}
            </div>
            {final ? (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="evidence-grid">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="evidence-thumb">📷</div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                  {final.kmReading && <span><strong>{final.kmReading.toLocaleString('es-MX')}</strong> km</span>}
                  {final.fuelLevel && <span><strong>{final.fuelLevel}%</strong> combustible</span>}
                </div>
                {final.notes && <p className="muted">{final.notes}</p>}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <p className="muted">Disponible al completar la entrega.</p>
              </div>
            )}
          </section>
        </>
      )}

      <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
        <p style={{ fontSize: 20, marginBottom: 6 }}>📸</p>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>La evidencia es tu tranquilidad</p>
        <p className="muted" style={{ fontSize: 13 }}>Documentamos tu vehículo antes, durante y después del traslado.</p>
      </div>
    </>
  )
}