'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Chip } from '@/components/ui/Chip'
import { mockTrips } from '@/lib/mock-data'
import type { Trip, TripStatus } from '@/lib/types'

type Tab = 'Activos' | 'Programados' | 'Finalizados' | 'Cancelados'

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida:  'Solicitud recibida',
  en_revision:         'En revisión',
  conductor_asignado:  'Conductor asignado',
  en_camino_origen:    'En camino',
  recoleccion_proceso: 'Recolección',
  vehiculo_documentado:'Documentado',
  traslado_curso:      'En curso',
  llegando_destino:    'Llegando',
  entrega_proceso:     'Entrega',
  finalizado:          'Finalizado',
  cancelado:           'Cancelado',
  incidente:           'Incidente',
}

const ACTIVE_STATUSES: TripStatus[] = [
  'solicitud_recibida','en_revision','conductor_asignado',
  'en_camino_origen','recoleccion_proceso','vehiculo_documentado',
  'traslado_curso','llegando_destino','entrega_proceso',
]

function filterTrips(trips: Trip[], tab: Tab): Trip[] {
  switch (tab) {
    case 'Activos':     return trips.filter(t => ACTIVE_STATUSES.includes(t.status))
    case 'Programados': return trips.filter(t => t.scheduledAt && ACTIVE_STATUSES.includes(t.status))
    case 'Finalizados': return trips.filter(t => t.status === 'finalizado')
    case 'Cancelados':  return trips.filter(t => t.status === 'cancelado')
  }
}

export default function ViajesPage() {
  const [tab, setTab] = useState<Tab>('Activos')
  const { setActiveTrip } = useAppStore()
  const trips = filterTrips(mockTrips, tab)

  return (
    <>
      <div className="segmented">
        {(['Activos','Programados','Finalizados','Cancelados'] as Tab[]).map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {trips.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🚗</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin viajes aquí</p>
          <p className="muted">Los traslados de esta categoría aparecerán aquí.</p>
        </div>
      ) : (
        <div className="stack">
          {trips.map(trip => (
            <article key={trip.id} className="list-card" onClick={() => setActiveTrip(trip)}>
              <div style={{ flex: 1 }}>
                <p className="kicker">{trip.id}</p>
                <p style={{ fontWeight: 600, fontSize: 14, margin: '4px 0' }}>
                  {trip.vehicle.alias} · {trip.vehicle.brand} {trip.vehicle.model}
                </p>
                <p className="muted" style={{ marginBottom: 4 }}>
                  {trip.origin.address.split(',')[0]} → {trip.destination.address.split(',')[0]}
                </p>
                <p style={{ fontSize: 13, fontWeight: 600 }}>
                  {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(trip.priceEstimatedMXN)}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <Chip status={trip.status}>{STATUS_LABELS[trip.status]}</Chip>
                <button className="btn-mini" aria-label="Ver detalle">
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}