'use client'
import { useEffect, useState } from 'react'
import { useWizardStore, useAppStore, useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import {
  firstValidationError,
  validateQuotePayload,
  validateTripRequestPayload,
} from '@/lib/validation/tripRequest'

const SERVICE_LABELS: Record<string, string> = {
  personal: 'Personal', empresarial: 'Empresarial', agencia: 'Agencia',
  lote: 'Lote', flotilla: 'Flotilla', entrega_cliente: 'Entrega a cliente',
  recuperacion: 'Recuperación', especial: 'Especial',
}

type Quote = {
  distanceKm: number
  clientPriceMxn: number
}

function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ReviewStep() {
  const { draft, resetDraft } = useWizardStore()
  const { showToast } = useAppStore()
  const { user } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const hasRoute = Boolean(draft.origin.address && draft.destination.address)

  useEffect(() => {
    const originAddress = draft.origin.address
    const destinationAddress = draft.destination.address

    if (!originAddress || !destinationAddress) {
      return
    }

    const validation = validateQuotePayload({
      origin: { address: originAddress },
      destination: { address: destinationAddress },
    })

    if (!validation.ok) {
      return
    }

    const quotePayload = validation.data
    let cancelled = false

    async function loadQuote() {
      setQuoteLoading(true)
      setQuoteError(null)

      try {
        const response = await fetch('/api/trips/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(quotePayload),
        })

        const payload = await response.json().catch(() => null) as {
          ok?: boolean
          data?: Quote
          error?: string
        } | null

        if (!cancelled) {
          if (!response.ok || !payload?.ok) {
            setQuote(null)
            setQuoteError(payload?.error ?? 'No fue posible calcular la distancia. Puedes continuar con la solicitud.')
          } else {
            setQuote(payload.data ?? null)
          }
          setQuoteLoading(false)
        }
      } catch {
        if (!cancelled) {
          setQuote(null)
          setQuoteError('No fue posible calcular la distancia. Puedes continuar con la solicitud.')
          setQuoteLoading(false)
        }
      }
    }

    loadQuote()

    return () => {
      cancelled = true
    }
  }, [draft.destination.address, draft.origin.address])

  async function handleConfirm() {
    if (!user) { showToast('Debes iniciar sesión'); return }

    const validation = validateTripRequestPayload({
      serviceType: draft.serviceType ?? 'personal',
      vehicle: draft.vehicle,
      origin: draft.origin,
      destination: draft.destination,
      originContact: draft.originContact,
      destinationContact: draft.destinationContact,
      asap: Boolean(draft.asap),
      scheduledAt: draft.scheduledAt,
      specialInstructions: draft.specialInstructions,
    })

    if (!validation.ok) {
      showToast(firstValidationError(validation.errors))
      return
    }

    setLoading(true)

    const response = await fetch('/api/trips/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validation.data),
    })

    const payload = await response.json().catch(() => null) as {
      ok?: boolean
      data?: {
        tripId?: string
      }
      error?: string
    } | null

    if (!response.ok || !payload?.ok) {
      showToast(payload?.error ?? 'Error al crear la solicitud')
      setLoading(false)
      return
    }

    const tripId = payload.data?.tripId ?? 'nueva'
    showToast(`¡Solicitud ${tripId} creada!`)
    resetDraft()
    router.push('/viajes')
  }

  return (
    <div className="form-section">
      <p className="muted">Revisa los detalles antes de confirmar.</p>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="kicker">Vehículo</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: '2rem' }}>🚗</span>
          <div>
            <p style={{ fontWeight: 700 }}>{draft.vehicle.brand} {draft.vehicle.model} {draft.vehicle.year}</p>
            <p className="muted">{draft.vehicle.color} · {draft.vehicle.plates}</p>
            <p className="muted">{draft.vehicle.transmission === 'automatica' ? 'Automático' : 'Manual'} · {draft.vehicle.condition}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="kicker">Ruta</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Origen</p>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{draft.origin.address}</p>
            {draft.origin.reference && <p className="muted">{draft.origin.reference}</p>}
            <p className="muted" style={{ marginTop: 4 }}>
              {draft.originContact.name} · {draft.originContact.phone}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--success)', flexShrink: 0, marginTop: 4 }} />
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Destino</p>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{draft.destination.address}</p>
            {draft.destination.reference && <p className="muted">{draft.destination.reference}</p>}
            <p className="muted" style={{ marginTop: 4 }}>
              {draft.destinationContact.name} · {draft.destinationContact.phone}
            </p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: quoteError ? 'var(--danger, #c0392b)' : 'var(--text-muted)' }}>
          📍 {quoteError
            ? quoteError
            : hasRoute && quote
              ? `~${quote.distanceKm} km estimados`
              : quoteLoading
                ? 'Calculando distancia…'
                : 'Distancia por calcular'}
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p className="kicker">Detalles</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span className="muted">Cuándo</span>
          <span style={{ fontWeight: 600 }}>
            {draft.asap ? '⚡ Lo antes posible' : draft.scheduledAt
              ? new Date(draft.scheduledAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
              : 'Por definir'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span className="muted">Tipo</span>
          <span style={{ fontWeight: 600 }}>{SERVICE_LABELS[draft.serviceType ?? ''] ?? '—'}</span>
        </div>
      </div>

      <div className="card-hero" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontSize: 13, opacity: .8 }}>Tarifa estimada</p>
        <p style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>
          {hasRoute && quote ? formatMXN(quote.clientPriceMxn) : '—'}
        </p>
        <p style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>
          Conductor certificado · Evidencia fotográfica · Seguimiento · Soporte 24/7
        </p>
      </div>

      <button className="btn-primary" disabled={loading} onClick={handleConfirm}>
        {loading ? 'Creando solicitud…' : 'Confirmar solicitud →'}
      </button>

      <p className="muted" style={{ textAlign: 'center', fontSize: 12 }}>
        Al confirmar aceptas los términos y condiciones de Ruum Ruum
      </p>
    </div>
  )
}