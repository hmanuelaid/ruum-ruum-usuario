'use client'
import { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'
import { Chip } from '@/components/ui/Chip'

const STATUS_LABELS: Record<string, string> = {
  pendiente:   'Pendiente',
  en_revision: 'En revisión',
  aprobado:    'Aprobado',
  rechazado:   'Rechazado',
  pagado:      'Pagado',
  revocado:    'Revocado',
  ajustado:    'Ajustado',
}

const METHOD_LABELS: Record<string, string> = {
  tarjeta:     '💳 Tarjeta',
  transferencia: '🏦 Transferencia',
  efectivo:    '💵 Efectivo',
  oxxo:        '🏪 OXXO',
}

interface Payment {
  id: string
  trip_id: string
  type: string
  amount: number
  status: string
  method: string | null
  concept: string | null
  created_at: string
  paid_at: string | null
}

export default function PagosPage() {
  const { user } = useAuthStore()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'todos' | 'pendientes' | 'pagados'>('todos')

  const loadPayments = useCallback(async () => {
    if (!user) return

    await Promise.resolve()
    setLoading(true)
    const supabase = createClient()

    // Obtener viajes del usuario para luego buscar sus pagos
    const { data: trips } = await supabase
      .from('trips')
      .select('id')
      .eq('user_id', user!.id)

    if (!trips || trips.length === 0) {
      setPayments([])
      setLoading(false)
      return
    }

    const tripIds = trips.map(t => t.id)

    const { data } = await supabase
      .from('payments')
      .select('*')
      .in('trip_id', tripIds)
      .eq('type', 'cobro_usuario')
      .order('created_at', { ascending: false })

    setPayments((data ?? []) as Payment[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadPayments()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [loadPayments])

  const filtered = payments.filter(p => {
    if (tab === 'pendientes') return p.status === 'pendiente' || p.status === 'en_revision'
    if (tab === 'pagados')    return p.status === 'pagado'
    return true
  })

  const totalPagado   = payments.filter(p => p.status === 'pagado').reduce((s, p) => s + Number(p.amount), 0)
  const totalPendiente = payments.filter(p => p.status === 'pendiente').reduce((s, p) => s + Number(p.amount), 0)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <button onClick={() => history.back()}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Mis pagos</h1>
      </div>

      {/* Métricas */}
      {!loading && (
        <div className="metric-grid">
          <div className="metric-card">
            <p className="value" style={{ fontSize: 20, color: 'var(--success)' }}>
              ${totalPagado.toLocaleString('es-MX')}
            </p>
            <p className="label">Total pagado</p>
          </div>
          <div className="metric-card">
            <p className="value" style={{ fontSize: 20, color: 'var(--warning)' }}>
              ${totalPendiente.toLocaleString('es-MX')}
            </p>
            <p className="label">Pendiente</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="segmented">
        {([
          { key: 'todos',      label: 'Todos' },
          { key: 'pendientes', label: 'Pendientes' },
          { key: 'pagados',    label: 'Pagados' },
        ] as const).map(t => (
          <button key={t.key}
            className={tab === t.key ? 'active' : ''}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p className="muted">Cargando pagos…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>💳</p>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin pagos aquí</p>
          <p className="muted" style={{ fontSize: 13 }}>
            {tab === 'pendientes'
              ? 'No tienes pagos pendientes.'
              : tab === 'pagados'
              ? 'Aún no tienes pagos completados.'
              : 'Tus pagos aparecerán aquí una vez que solicites un traslado.'}
          </p>
        </div>
      ) : (
        <div className="stack">
          {filtered.map(p => (
            <article key={p.id} className="list-card">
              <div style={{ flex: 1 }}>
                <p className="kicker" style={{ marginBottom: 4 }}>{p.trip_id}</p>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {p.concept ?? 'Traslado'}
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {p.method && (
                    <span className="muted" style={{ fontSize: 12 }}>
                      {METHOD_LABELS[p.method] ?? p.method}
                    </span>
                  )}
                  <span className="muted" style={{ fontSize: 12 }}>
                    {new Date(p.created_at).toLocaleDateString('es-MX', { dateStyle: 'medium' })}
                  </span>
                  {p.paid_at && (
                    <span style={{ fontSize: 12, color: 'var(--success)' }}>
                      ✓ Pagado {new Date(p.paid_at).toLocaleDateString('es-MX')}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <p style={{ fontWeight: 800, fontSize: 16 }}>
                  ${Number(p.amount).toLocaleString('es-MX')}
                </p>
                <Chip status={p.status}>{STATUS_LABELS[p.status] ?? p.status}</Chip>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="card" style={{ padding: '16px', background: 'var(--surface-2)' }}>
        <p style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>ℹ️ Sobre los pagos</p>
        <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
          Los pagos se procesan al confirmar la entrega del vehículo. Si tienes alguna
          duda sobre un cobro, contáctanos desde la sección de soporte.
        </p>
      </div>
    </>
  )
}
