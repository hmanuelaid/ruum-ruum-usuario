'use client'
import { useState } from 'react'
import { useWizardStore } from '@/lib/store'
import {
  normalizePhone,
  validateRouteInput,
  type FieldErrors,
} from '@/lib/validation/tripRequest'

export default function RouteStep() {
  const { draft, updateDraft, setStep } = useWizardStore()
  const { origin, destination, originContact, destinationContact } = draft
  const [errors, setErrors] = useState<FieldErrors>({})

  function clearError(field: string) {
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function updateOrigin(field: string, value: string) {
    clearError(`origin.${field}`)
    updateDraft({ origin: { ...draft.origin, [field]: value } })
  }
  function updateDest(field: string, value: string) {
    clearError(`destination.${field}`)
    updateDraft({ destination: { ...draft.destination, [field]: value } })
  }
  function updateOriginContact(field: string, value: string) {
    clearError(`originContact.${field}`)
    updateDraft({ originContact: { ...draft.originContact, [field]: value } })
  }
  function updateDestContact(field: string, value: string) {
    clearError(`destinationContact.${field}`)
    updateDraft({ destinationContact: { ...draft.destinationContact, [field]: value } })
  }

  function handleSpecialInstructions(value: string) {
    clearError('specialInstructions')
    updateDraft({ specialInstructions: value })
  }

  function handleContinue() {
    const result = validateRouteInput({
      origin: draft.origin,
      destination: draft.destination,
      originContact: draft.originContact,
      destinationContact: draft.destinationContact,
      specialInstructions: draft.specialInstructions,
    })

    if (!result.ok) {
      setErrors(result.errors)
      return
    }

    setErrors({})
    updateDraft(result.data)
    setStep(3)
  }

  const canContinue = origin.address && destination.address &&
    originContact.name && originContact.phone &&
    destinationContact.name && destinationContact.phone

  return (
    <div className="form-section">

      {/* Origen */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
          <p style={{ fontWeight: 700, fontSize: 15 }}>Origen</p>
        </div>

        <div className="field-group">
          <label className="field-label">Dirección de recogida</label>
          <input className="field-input" placeholder="Av. Insurgentes Sur 1234, CDMX"
            value={origin.address ?? ''}
            onChange={e => updateOrigin('address', e.target.value)} />
          {errors['origin.address'] && <p className="field-error">{errors['origin.address']}</p>}
        </div>

        <div className="field-group">
          <label className="field-label">Referencias</label>
          <input className="field-input" placeholder="Torre azul, entrada principal"
            value={origin.reference ?? ''}
            onChange={e => updateOrigin('reference', e.target.value)} />
          {errors['origin.reference'] && <p className="field-error">{errors['origin.reference']}</p>}
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <p style={{ fontWeight: 600, fontSize: 13 }}>Persona que entrega</p>
        <div className="field-row">
          <div className="field-group">
            <label className="field-label">Nombre</label>
            <input className="field-input" placeholder="Juan García"
              value={originContact.name ?? ''}
              onChange={e => updateOriginContact('name', e.target.value)} />
            {errors['originContact.name'] && <p className="field-error">{errors['originContact.name']}</p>}
          </div>
          <div className="field-group">
            <label className="field-label">Teléfono</label>
            <input className="field-input" type="tel" placeholder="+52 55 0000 0000"
              value={originContact.phone ?? ''}
              onChange={e => updateOriginContact('phone', e.target.value)}
              onBlur={e => {
                const phone = normalizePhone(e.currentTarget.value)
                if (phone) updateOriginContact('phone', phone)
              }} />
            {errors['originContact.phone'] && <p className="field-error">{errors['originContact.phone']}</p>}
          </div>
        </div>
      </div>

      {/* Flecha */}
      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 20 }}>↓</div>

      {/* Destino */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--success)', flexShrink: 0 }} />
          <p style={{ fontWeight: 700, fontSize: 15 }}>Destino</p>
        </div>

        <div className="field-group">
          <label className="field-label">Dirección de entrega</label>
          <input className="field-input" placeholder="Blvd. Kukulcán Km 12, Cancún"
            value={destination.address ?? ''}
            onChange={e => updateDest('address', e.target.value)} />
          {errors['destination.address'] && <p className="field-error">{errors['destination.address']}</p>}
        </div>

        <div className="field-group">
          <label className="field-label">Referencias</label>
          <input className="field-input" placeholder="Hotel Marriott, recepción"
            value={destination.reference ?? ''}
            onChange={e => updateDest('reference', e.target.value)} />
          {errors['destination.reference'] && <p className="field-error">{errors['destination.reference']}</p>}
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <p style={{ fontWeight: 600, fontSize: 13 }}>Persona que recibe</p>
        <div className="field-row">
          <div className="field-group">
            <label className="field-label">Nombre</label>
            <input className="field-input" placeholder="Ana Ruiz"
              value={destinationContact.name ?? ''}
              onChange={e => updateDestContact('name', e.target.value)} />
            {errors['destinationContact.name'] && <p className="field-error">{errors['destinationContact.name']}</p>}
          </div>
          <div className="field-group">
            <label className="field-label">Teléfono</label>
            <input className="field-input" type="tel" placeholder="+52 998 000 0000"
              value={destinationContact.phone ?? ''}
              onChange={e => updateDestContact('phone', e.target.value)}
              onBlur={e => {
                const phone = normalizePhone(e.currentTarget.value)
                if (phone) updateDestContact('phone', phone)
              }} />
            {errors['destinationContact.phone'] && <p className="field-error">{errors['destinationContact.phone']}</p>}
          </div>
        </div>
      </div>

      {/* Instrucciones especiales */}
      <div className="field-group">
        <label className="field-label">Instrucciones especiales (opcional)</label>
        <textarea className="field-input" rows={3}
          placeholder="El vehículo tiene alarma, código: 1234..."
          value={draft.specialInstructions ?? ''}
          onChange={e => handleSpecialInstructions(e.target.value)}
          style={{ resize: 'none' }} />
        {errors.specialInstructions && <p className="field-error">{errors.specialInstructions}</p>}
      </div>

      <button className="btn-primary" disabled={!canContinue} onClick={handleContinue}>
        Continuar →
      </button>
    </div>
  )
}
