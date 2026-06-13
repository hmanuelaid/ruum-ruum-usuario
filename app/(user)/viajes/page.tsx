'use client'
import { useState, useEffect } from 'react'
import { useAppStore, useAuthStore } from '@/lib/store'
import { Chip } from '@/components/ui/Chip'
import { createClient } from '@/lib/supabase'
import type { Trip } from '@/lib/types'
import { STATUS_LABELS, ACTIVE_STATUSES } from '@/lib/tripStatus'

type Tab = 'Activos' | 'Programados' | 'Finalizados' | 'Cancelados'

interface UserTrip {
  id: string
  status: string
  service_type: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_plates: string | null
  vehicle_color: string | null
  vehicle_year: number | null
  vehicle_type: string | null
  vehicle_transmission: string | null
  vehicle_condition: string | null
  origin_address: string | null
  destination_address: string | null
  origin_reference: string | null
  destination_reference: string | null
  origin_contact_name: string | null
  origin_contact_phone: string | null
  dest_contact_name: string | null
  dest_contact_phone: string | null
  scheduled_at: string | null
  special_instructions: string | null
  distance_km: number | null
  client_price_mxn: number | null
  created_at: string
}

export default function ViajesPage() {
  const [tab, setTab] = useState<Tab>('Activos')
  const [trips, setTrips] = useState<UserTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuthStore()
  const { setActiveTrip } = useAppStore()

  useEffect(() => {
    if (!user) return

    const userId = user.id
    let cancelled = false
    const supabase = createClient()

    async function loadTrips() {
      setLoading(true)
      setError('')
      let query = supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (tab === 'Activos')     query = query.in('status', ACTIVE_STATUSES)
      if (tab === 'Programados') query = query.in('status', ACTIVE_STATUSES).not('scheduled_at', 'is', null)
      if (tab === 'Finalizados') query = query.eq('status', 'finalizado')
      if (tab === 'Cancelados')  query = query.eq('status', 'cancelado')

      const { data, error: tripsError } = await query
      if (cancelled) return

      if (tripsError) {
        setError(`No pudimos cargar tus viajes: ${tripsError.message}`)
        setTrips([])
        setLoading(false)
        return
      }

      setTrips((data ?? []) as UserTrip[])
      setLoading(false)
    }

    void loadTrips()

    const channel = supabase
      .channel(`user-trips:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `user_id=eq.${userId}`,
      }, () => {
        void loadTrips()
      })
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [user, tab])

  function openTripDetail(row: UserTrip) {
    setActiveTrip({
      id: row.id,
      status: row.status as Trip['status'],
      vehicle: {
        id: '',
        alias: `${row.vehicle_brand ?? ''} ${row.vehicle_model ?? ''}`.trim(),
        brand: row.vehicle_brand ?? '',
        model: row.vehicle_model ?? '',
        year: row.vehicle_year ?? 0,
        color: row.vehicle_color ?? '',
        plates: row.vehicle_plates ?? '',
        type: (row.vehicle_type ?? 'otro') as Trip['vehicle']['type'],
        transmission: (row.vehicle_transmission ?? 'manual') as Trip['vehicle']['transmission'],
        condition: row.vehicle_condition ?? '',
      },
      origin: {
        address: row.origin_address ?? '',
        reference: row.origin_reference ?? undefined,
      },
      destination: {
        address: row.destination_address ?? '',
        reference: row.destination_reference ?? undefined,
      },
      originContact: {
        name: row.origin_contact_name ?? '',
        phone: row.origin_contact_phone ?? '',
      },
      destinationContact: {
        name: row.dest_contact_name ?? '',
        phone: row.dest_contact_phone ?? '',
      },
      scheduledAt: row.scheduled_at ?? undefined,
      serviceType: (row.service_type ?? 'personal') as Trip['serviceType'],
      distanceKm: row.distance_km ?? 0,
      priceEstimatedMXN: row.client_price_mxn ?? 0,
      timeline: [],
      evidence: [],
      specialInstructions: row.special_instructions ?? undefined,
      createdAt: row.created_at,
    })
  }

  return (
    <>
      <div className="segmented">
        {(['Activos', 'Programados', 'Finalizados', 'Cancelados'] as Tab[]).map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p className="muted">Cargando viajes…</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p className="field-error">{error}</p>
        </div>
      ) : trips.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🚗</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin viajes aquí</p>
          <p className="muted">Los traslados aparecerán aquí una vez solicitados.</p>
        </div>
      ) : (
        <div className="stack">
          {trips.map(t => (
            <article
              key={t.id}
              className="list-card"
              role="button"
              tabIndex={0}
              onClick={() => openTripDetail(t)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openTripDetail(t)
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ flex: 1 }}>
                <p className="kicker">{t.id}</p>
                <p style={{ fontWeight: 600, fontSize: 14, margin: '4px 0' }}>
                  {t.vehicle_brand} {t.vehicle_model} · {t.vehicle_plates}
                </p>
                <p className="muted" style={{ marginBottom: 4 }}>
                  {t.origin_address?.split(',')[0]} → {t.destination_address?.split(',')[0]}
                </p>
                <p style={{ fontSize: 13, fontWeight: 600 }}>
                  {t.client_price_mxn === null
                    ? 'Tarifa por confirmar'
                    : `$${Number(t.client_price_mxn).toLocaleString('es-MX')}`}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <Chip status={t.status}>{STATUS_LABELS[t.status]}</Chip>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}