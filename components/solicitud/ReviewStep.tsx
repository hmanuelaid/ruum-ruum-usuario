'use client'
import { useWizardStore, useAppStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { calcQuote, formatMXN, estimateDistance } from '@/lib/pricing'

const SERVICE_LABELS: Record<string, string> = {
  personal: 'Personal', empresarial: 'Empresarial', agencia: 'Agencia',
  lote: 'Lote', flotilla: 'Flotilla', entrega_cliente: 'Entrega a cliente',
  recuperacion: 'Recuperación', especial: 'Especial',
}

export default function ReviewStep() {
  const { draft, resetDraft } = useWizardStore()
  const { showToast } = useAppStore()
  const router = useRouter()

  const distanceKm = estimateDistance(
    draft.origin.address ?? '',
    draft.destination.address ?? '',
  )
  const price = calcQuote(distanceKm)

  async function handleConfirm() {
    await new Promise(r => setTimeout(r, 800))
    showToast('¡Traslado solicitado! Te confirmaremos en breve.')
    resetDraft()
    router.push('/viajes')
  }

  return (
    <div className="form-section">
      <p className="muted">Revisa los detalles antes de confirmar tu solicitud.</p>

      {/* Vehículo */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p className="kicker">Vehículo</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: '2rem' }}>🚗</span>
          <div>
            <p style={{ fontWeight: 700 }}>
              {draft.vehicle.brand} {draft.vehicle.model} {draft.vehicle.year}
            </p>
            <p className="muted">{draft.vehicle.color} · {draft.vehicle.plates}</p>
            <p className="muted">{draft.vehicle.transmission === 'automatica' ? 'Automático' : 'Manual'} · {draft.vehicle.condition}</p>
          </div>
        </div>
      </div>

      {/* Ruta */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="kicker">Ruta</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 4 }} />
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Origen</p>
            <p style={{ fontWeight: 600, fontSize: 14 }}>{draft.origin.address}</p>
            {draft.origin.reference && <p className="muted">{draft.origin.reference}</p>}
            <p className="muted" style={{ marginTop: 4 }}>
              Entrega: {draft.originContact.name} · {draft.originContact.phone}
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
              Recibe: {draft.destinationContact.name} · {draft.destinationContact.phone}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-muted)', paddingTop: 4 }}>
          <span>📍 ~{distanceKm} km estimados</span>
        </div>
      </div>

      {/* Fecha y servicio */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p className="kicker">Detalles del servicio</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span className="muted">Cuándo</span>
          <span style={{ fontWeight: 600 }}>
            {draft.asap ? '⚡ Lo antes posible' : draft.scheduledAt
              ? new Date(draft.scheduledAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
              : 'Por definir'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span className="muted">Tipo de traslado</span>
          <span style={{ fontWeight: 600 }}>{SERVICE_LABELS[draft.serviceType ?? ''] ?? '—'}</span>
        </div>
        {draft.specialInstructions && (
          <div style={{ paddingTop: 4, borderTop: '1px solid var(--border)' }}>
            <p className="muted" style={{ fontSize: 12 }}>Instrucciones: {draft.specialInstructions}</p>
          </div>
        )}
      </div>

      {/* Cotización */}
      <div className="card-hero" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontSize: 13, opacity: .8 }}>Tarifa estimada</p>
        <p style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{formatMXN(price)}</p>
        <p style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>
          Incluye: conductor certificado, evidencia fotográfica, seguimiento y soporte 24/7.
        </p>
        <p style={{ fontSize: 11, opacity: .6 }}>
          Tarifa base {formatMXN(350)} + {distanceKm} km × $18/km
          {distanceKm > 100 ? ' + cargo foráneo 25%' : ''}
        </p>
      </div>

      {/* Qué incluye */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p className="kicker">Qué incluye</p>
        {[
          '✅ Conductor certificado por Ruum Ruum',
          '📸 Evidencia fotográfica inicial y final',
          '📍 Seguimiento del traslado',
          '💬 Soporte durante el viaje',
          '🛡️ Registro completo del vehículo',
        ].map(item => (
          <p key={item} style={{ fontSize: 13 }}>{item}</p>
        ))}
      </div>

      <button className="btn-primary" onClick={handleConfirm}>
        Confirmar solicitud →
      </button>

      <p className="muted" style={{ textAlign: 'center', fontSize: 12 }}>
        Al confirmar aceptas los términos y condiciones de Ruum Ruum
      </p>
    </div>
  )
}