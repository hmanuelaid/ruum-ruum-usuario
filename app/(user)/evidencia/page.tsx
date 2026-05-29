'use client'
import { useState } from 'react'
import { mockTrips } from '@/lib/mock-data'
import { Chip } from '@/components/ui/Chip'

export default function EvidenciaPage() {
  const [selected, setSelected] = useState(mockTrips[0].id)
  const trip = mockTrips.find(t => t.id === selected) ?? mockTrips[0]

  const inicial = trip.evidence.find(e => e.type === 'inicial')
  const final   = trip.evidence.find(e => e.type === 'final')

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
              <span><strong>{inicial.kmReading?.toLocaleString('es-MX')}</strong> km</span>
              <span><strong>{inicial.fuelLevel}%</strong> combustible</span>
            </div>
            {inicial.notes && <p className="muted">{inicial.notes}</p>}
            <p className="muted" style={{ fontSize: 12 }}>
              {inicial.timestamp ? new Date(inicial.timestamp).toLocaleString('es-MX') : ''}
            </p>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <p className="muted">La evidencia inicial estará disponible cuando el conductor reciba el vehículo.</p>
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
              <span><strong>{final.kmReading?.toLocaleString('es-MX')}</strong> km</span>
              <span><strong>{final.fuelLevel}%</strong> combustible</span>
            </div>
            {final.notes && <p className="muted">{final.notes}</p>}
            <p className="muted" style={{ fontSize: 12 }}>
              {final.timestamp ? new Date(final.timestamp).toLocaleString('es-MX') : ''}
            </p>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <p className="muted">La evidencia final estará disponible al completar la entrega.</p>
          </div>
        )}
      </section>

      {/* Principio clave */}
      <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
        <p style={{ fontSize: 20, marginBottom: 6 }}>📸</p>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>La evidencia es tu tranquilidad</p>
        <p className="muted" style={{ fontSize: 13 }}>Documentamos tu vehículo antes, durante y después del traslado.</p>
      </div>
    </>
  )
}