'use client'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { Chip } from '@/components/ui/Chip'
import { createClient } from '@/lib/supabase'

type Tab = 'Activos' | 'Programados' | 'Finalizados' | 'Cancelados'

const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida: 'Solicitud recibida', pendiente_revision: 'En revisión',
  pendiente_asignacion: 'Sin conductor', conductor_asignado: 'Conductor asignado',
  conductor_en_camino: 'En camino', recoleccion_proceso: 'Recolección',
  evidencia_inicial_pendiente: 'Ev. inicial', traslado_curso: 'En curso',
  entrega_proceso: 'Entrega', evidencia_final_pendiente: 'Ev. final',
  finalizado: 'Finalizado', cancelado: 'Cancelado', incidente: 'Incidente',
}

const ACTIVE = ['solicitud_recibida','pendiente_revision','pendiente_asignacion',
  'conductor_asignado','conductor_en_camino','recoleccion_proceso',
  'evidencia_inicial_pendiente','traslado_curso','entrega_proceso',
  'evidencia_final_pendiente','incidente']

interface UserTrip {
  id: string
  status: string
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_plates: string | null
  origin_address: string | null
  destination_address: string | null
  client_price_mxn: number | null
}

export default function ViajesPage() {
  const [tab, setTab] = useState<Tab>('Activos')
  const [trips, setTrips] = useState<UserTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return

    const userId = user.id
    let cancelled = false

    async function loadTrips() {
      setLoading(true)
      setError('')
      const supabase = createClient()
      let query = supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (tab === 'Activos')     query = query.in('status', ACTIVE)
      if (tab === 'Programados') query = query.in('status', ACTIVE).not('scheduled_at', 'is', null)
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

      setTrips(data ?? [])
      setLoading(false)
    }

    void loadTrips()
    return () => { cancelled = true }
  }, [user, tab])

  return (
    <>
      <div className="segmented">
        {(['Activos','Programados','Finalizados','Cancelados'] as Tab[]).map(t => (
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
            <article key={t.id} className="list-card">
              <div style={{ flex: 1 }}>
                <p className="kicker">{t.id}</p>
                <p style={{ fontWeight: 600, fontSize: 14, margin: '4px 0' }}>
                  {t.vehicle_brand} {t.vehicle_model} · {t.vehicle_plates}
                </p>
                <p className="muted" style={{ marginBottom: 4 }}>
                  {t.origin_address?.split(',')[0]} → {t.destination_address?.split(',')[0]}
                </p>
                <p style={{ fontSize: 13, fontWeight: 600 }}>
                  ${Number(t.client_price_mxn).toLocaleString('es-MX')}
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
