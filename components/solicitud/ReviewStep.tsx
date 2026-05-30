'use client'
import { useState } from 'react'
import { useWizardStore, useAppStore, useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { calcQuote, formatMXN, estimateDistance } from '@/lib/pricing'
import { createClient } from '@/lib/supabase'

const SERVICE_LABELS: Record<string, string> = {
  personal: 'Personal', empresarial: 'Empresarial', agencia: 'Agencia',
  lote: 'Lote', flotilla: 'Flotilla', entrega_cliente: 'Entrega a cliente',
  recuperacion: 'Recuperación', especial: 'Especial',
}

const TIMELINE_STEPS = [
  'Solicitud creada', 'Viaje revisado', 'Conductor asignado',
  'Conductor aceptó', 'Llegada al origen', 'Evidencia inicial',
  'Traslado iniciado', 'En ruta', 'Llegada a destino',
  'Evidencia final', 'Entrega confirmada', 'Viaje cerrado',
]

export default function ReviewStep() {
  const { draft, resetDraft } = useWizardStore()
  const { showToast } = useAppStore()
  const { user } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const distanceKm = estimateDistance(
    draft.origin.address ?? '',
    draft.destination.address ?? '',
  )
  const price = calcQuote(distanceKm)
  const driverPay = Math.round(price * 0.70)

  async function handleConfirm() {
    if (!user) { showToast('Debes iniciar sesión'); return }
    setLoading(true)
    const supabase = createClient()

    // Generar ID de viaje
    const { data: idData } = await supabase.rpc('generate_trip_id')
    const tripId = idData ?? `RR-${Date.now()}`

    // Crear vehículo si no existe
    let vehicleId: string | null = null
    if (draft.vehicle.id) {
      vehicleId = draft.vehicle.id
    } else {
      const { data: veh } = await supabase
        .from('vehicles')
        .insert({
          owner_id: user.id,
          alias: draft.vehicle.alias ?? `${draft.vehicle.brand} ${draft.vehicle.model}`,
          brand: draft.vehicle.brand,
          model: draft.vehicle.model,
          year: draft.vehicle.year ? Number(draft.vehicle.year) : null,
          color: draft.vehicle.color,
          plates: draft.vehicle.plates,
          vin: draft.vehicle.vin,
          type: draft.vehicle.type,
          transmission: draft.vehicle.transmission,
          condition: draft.vehicle.condition,
        })
        .select('id')
        .single()
      vehicleId = veh?.id ?? null
    }

    // Crear viaje
    const insertPayload = {
  id: tripId,
  status: 'solicitud_recibida',
  service_type: draft.serviceType ?? 'personal',
  user_id: user.id,
  vehicle_id: vehicleId,
  vehicle_brand: draft.vehicle.brand,
  vehicle_model: draft.vehicle.model,
  vehicle_year: draft.vehicle.year ? Number(draft.vehicle.year) : null,
  vehicle_color: draft.vehicle.color,
  vehicle_plates: draft.vehicle.plates,
  vehicle_vin: draft.vehicle.vin,
  vehicle_type: draft.vehicle.type,
  vehicle_transmission: draft.vehicle.transmission,
  vehicle_condition: draft.vehicle.condition,
  origin_address: draft.origin.address,
  origin_reference: draft.origin.reference,
  destination_address: draft.destination.address,
  destination_reference: draft.destination.reference,
  origin_contact_name: draft.originContact.name,
  origin_contact_phone: draft.originContact.phone,
  dest_contact_name: draft.destinationContact.name,
  dest_contact_phone: draft.destinationContact.phone,
  scheduled_at: draft.scheduledAt ?? null,
  asap: draft.asap,
  distance_km: distanceKm,
  client_price_mxn: price,
  driver_pay_mxn: driverPay,
  special_instructions: draft.specialInstructions,
}
console.log('INSERT PAYLOAD:', JSON.stringify(insertPayload, null, 2))
const { error: tripError } = await supabase.from('trips').insert(insertPayload)
console.log('TRIP ERROR:', tripError)

    if (tripError) {
      showToast('Error al crear la solicitud')
      setLoading(false)
      return
    }

    // Crear timeline
    await supabase.from('trip_timeline').insert(
      TIMELINE_STEPS.map((label, i) => ({
        trip_id: tripId,
        step: i + 1,
        label,
        done: false,
        active: i === 0,
      }))
    )

    // Crear pagos pendientes
    await supabase.from('payments').insert([
      {
        trip_id: tripId,
        type: 'cobro_usuario',
        amount: price,
        status: 'pendiente',
        concept: `Traslado ${draft.origin.address?.split(',')[0]} → ${draft.destination.address?.split(',')[0]}`,
      },
      {
        trip_id: tripId,
        type: 'pago_conductor',
        amount: driverPay,
        status: 'pendiente',
        concept: `Pago conductor ${tripId}`,
      },
    ])

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
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>📍 ~{distanceKm} km estimados</p>
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
        <p style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{formatMXN(price)}</p>
        <p style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>
          Conductor certificado · Evidencia fotográfica · Seguimiento · Soporte 24/7
        </p>
        <p style={{ fontSize: 11, opacity: .6 }}>
          Base $350 + {distanceKm} km × $18{distanceKm > 100 ? ' + 25% foráneo' : ''}
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