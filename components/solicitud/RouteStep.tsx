'use client'
import { useState } from 'react'
import { useWizardStore } from '@/lib/store'
import {
  normalizePhone,
  validateRouteInput,
  type FieldErrors,
} from '@/lib/validation/tripRequest'

// Convierte el valor a mayúsculas antes de enviarlo al handler
function toUpper(value: string) {
  return value.toUpperCase()
}

// ─── Sección de dirección reutilizable ────────────────────────────────────────
interface AddressSectionProps {
  prefix: 'origin' | 'destination'
  label: string
  accentColor: string
  accentShape?: string
  loc: Record<string, string | undefined>
  onChange: (field: string, value: string) => void
  errors: FieldErrors
  contactLabel: string
  collectionNotesLabel: string
  contactName: string
  contactPhone: string
  onContactName: (v: string) => void
  onContactPhone: (v: string) => void
  onBlurPhone: (v: string) => void
}

function AddressSection({
  prefix, label, accentColor, accentShape,
  loc, onChange, errors,
  contactLabel, collectionNotesLabel,
  contactName, contactPhone,
  onContactName, onContactPhone, onBlurPhone,
}: AddressSectionProps) {
  const e = (field: string) => errors[`${prefix}.${field}`]
  const contactKey = prefix === 'origin' ? 'originContact' : 'destinationContact'

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 12, height: 12,
          borderRadius: accentShape === 'square' ? 2 : '50%',
          background: accentColor,
          flexShrink: 0,
        }} />
        <p style={{ fontWeight: 700, fontSize: 15 }}>{label}</p>
      </div>

      {/* Calle + Número */}
      <div className="field-row">
        <div className="field-group" style={{ flex: 3 }}>
          <label className="field-label">Calle</label>
          <input className="field-input" placeholder="AV. INSURGENTES SUR"
            value={loc.calle ?? ''}
            style={{ textTransform: 'uppercase' }}
            onChange={e2 => onChange('calle', toUpper(e2.target.value))} />
          {e('calle') && <p className="field-error">{e('calle')}</p>}
        </div>
        <div className="field-group" style={{ flex: 1 }}>
          <label className="field-label">Número</label>
          <input className="field-input" placeholder="1234"
            value={loc.numero ?? ''}
            style={{ textTransform: 'uppercase' }}
            onChange={e2 => onChange('numero', toUpper(e2.target.value))} />
          {e('numero') && <p className="field-error">{e('numero')}</p>}
        </div>
      </div>

      {/* Colonia */}
      <div className="field-group">
        <label className="field-label">Colonia / Fraccionamiento</label>
        <input className="field-input" placeholder="DEL VALLE"
          value={loc.colonia ?? ''}
          style={{ textTransform: 'uppercase' }}
          onChange={e2 => onChange('colonia', toUpper(e2.target.value))} />
        {e('colonia') && <p className="field-error">{e('colonia')}</p>}
      </div>

      {/* Municipio + Estado */}
      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Municipio / Alcaldía</label>
          <input className="field-input" placeholder="BENITO JUÁREZ"
            value={loc.municipio ?? ''}
            style={{ textTransform: 'uppercase' }}
            onChange={e2 => onChange('municipio', toUpper(e2.target.value))} />
          {e('municipio') && <p className="field-error">{e('municipio')}</p>}
        </div>
        <div className="field-group">
          <label className="field-label">Estado</label>
          <input className="field-input" placeholder="CDMX"
            value={loc.estado ?? ''}
            style={{ textTransform: 'uppercase' }}
            onChange={e2 => onChange('estado', toUpper(e2.target.value))} />
          {e('estado') && <p className="field-error">{e('estado')}</p>}
        </div>
      </div>

      {/* Código Postal */}
      <div className="field-group">
        <label className="field-label">Código Postal</label>
        <input className="field-input" placeholder="03100" maxLength={5}
          inputMode="numeric"
          value={loc.codigoPostal ?? ''}
          onChange={e2 => onChange('codigoPostal', e2.target.value.replace(/\D/g, '').slice(0, 5))} />
        {e('codigoPostal') && <p className="field-error">{e('codigoPostal')}</p>}
      </div>

      {/* Referencias */}
      <div className="field-group">
        <label className="field-label">Referencias</label>
        <input className="field-input" placeholder="TORRE AZUL, PORTÓN NEGRO, ENTRE CALLES..."
          value={loc.reference ?? ''}
          style={{ textTransform: 'uppercase' }}
          onChange={e2 => onChange('reference', toUpper(e2.target.value))} />
        {e('reference') && <p className="field-error">{e('reference')}</p>}
      </div>

      {/* Notas / Indicaciones de entrega */}
      <div className="field-group">
        <label className="field-label">{collectionNotesLabel}</label>
        <textarea className="field-input" rows={2}
          placeholder="TOCAR TIMBRE 2 VECES, EL VEHÍCULO ESTÁ EN CAJÓN 5..."
          value={loc.collectionNotes ?? ''}
          onChange={e2 => onChange('collectionNotes', toUpper(e2.target.value))}
          style={{ resize: 'none', textTransform: 'uppercase' }} />
        {e('collectionNotes') && <p className="field-error">{e('collectionNotes')}</p>}
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Persona de contacto */}
      <p style={{ fontWeight: 600, fontSize: 13 }}>{contactLabel}</p>
      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Nombre</label>
          <input className="field-input" placeholder="JUAN GARCÍA"
            value={contactName}
            style={{ textTransform: 'uppercase' }}
            onChange={e2 => onContactName(toUpper(e2.target.value))} />
          {errors[`${contactKey}.name`] && (
            <p className="field-error">{errors[`${contactKey}.name`]}</p>
          )}
        </div>
        <div className="field-group">
          <label className="field-label">Teléfono</label>
          <input className="field-input" type="tel" placeholder="55 0000 0000"
            value={contactPhone}
            onChange={e2 => onContactPhone(e2.target.value)}
            onBlur={e2 => onBlurPhone(e2.currentTarget.value)} />
          {errors[`${contactKey}.phone`] && (
            <p className="field-error">{errors[`${contactKey}.phone`]}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
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

  const canContinue =
    origin.calle && origin.numero && origin.colonia &&
    origin.municipio && origin.estado && origin.codigoPostal &&
    destination.calle && destination.numero && destination.colonia &&
    destination.municipio && destination.estado && destination.codigoPostal &&
    originContact.name && originContact.phone &&
    destinationContact.name && destinationContact.phone

  return (
    <div className="form-section">

      <AddressSection
        prefix="origin"
        label="Origen"
        accentColor="var(--primary)"
        loc={origin as Record<string, string | undefined>}
        onChange={updateOrigin}
        errors={errors}
        contactLabel="Persona que entrega"
        collectionNotesLabel="Notas / Indicaciones de recolección"
        contactName={originContact.name ?? ''}
        contactPhone={originContact.phone ?? ''}
        onContactName={v => updateOriginContact('name', v)}
        onContactPhone={v => updateOriginContact('phone', v)}
        onBlurPhone={v => {
          const phone = normalizePhone(v)
          if (phone) updateOriginContact('phone', phone)
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 20 }}>↓</div>

      <AddressSection
        prefix="destination"
        label="Destino"
        accentColor="var(--success)"
        accentShape="square"
        loc={destination as Record<string, string | undefined>}
        onChange={updateDest}
        errors={errors}
        contactLabel="Persona que recibe"
        collectionNotesLabel="Notas / Indicaciones de entrega"
        contactName={destinationContact.name ?? ''}
        contactPhone={destinationContact.phone ?? ''}
        onContactName={v => updateDestContact('name', v)}
        onContactPhone={v => updateDestContact('phone', v)}
        onBlurPhone={v => {
          const phone = normalizePhone(v)
          if (phone) updateDestContact('phone', phone)
        }}
      />

      <button className="btn-primary" disabled={!canContinue} onClick={handleContinue}>
        Continuar →
      </button>
    </div>
  )
}
