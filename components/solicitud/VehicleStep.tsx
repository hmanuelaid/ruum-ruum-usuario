'use client'
import { useEffect, useState } from 'react'
import { useWizardStore } from '@/lib/store'
import type { Vehicle, VehicleType, TransmissionType } from '@/lib/types'
import {
  normalizePlates,
  normalizeVin,
  validateVehicleInput,
  type FieldErrors,
} from '@/lib/validation/tripRequest'

const VEHICLE_TYPES: { value: VehicleType; label: string; emoji: string }[] = [
  { value: 'sedan',  label: 'Sedán',    emoji: '🚗' },
  { value: 'suv',    label: 'SUV',      emoji: '🚙' },
  { value: 'pickup', label: 'Pickup',   emoji: '🛻' },
  { value: 'van',    label: 'Van',      emoji: '🚐' },
  { value: 'moto',   label: 'Moto',     emoji: '🏍️' },
  { value: 'otro',   label: 'Otro',     emoji: '🚘' },
]

export default function VehicleStep() {
  const { draft, updateDraft, setStep } = useWizardStore()
  const [savedVehicles, setSavedVehicles] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [vehiclesError, setVehiclesError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const v = draft.vehicle

  useEffect(() => {
    let cancelled = false

    async function loadVehicles() {
      const response = await fetch('/api/vehicles')
      const payload = await response.json().catch(() => null) as {
        ok?: boolean
        data?: Vehicle[]
        error?: string
      } | null

      if (cancelled) return

      if (!response.ok || !payload?.ok || !Array.isArray(payload.data)) {
        setSavedVehicles([])
        setVehiclesError(payload?.error ?? 'No pudimos cargar tus vehículos.')
        setLoadingVehicles(false)
        return
      }

      setSavedVehicles(payload.data)
      setVehiclesError('')
      setLoadingVehicles(false)
    }

    void loadVehicles()

    return () => {
      cancelled = true
    }
  }, [])

  function clearError(field: string) {
    const key = `vehicle.${field}`
    setErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function update(field: string, value: string) {
    clearError(field)
    updateDraft({ vehicle: { ...draft.vehicle, [field]: value } })
  }

  function loadSaved(id: string) {
    const found = savedVehicles.find(v => v.id === id)
    if (found) {
      setErrors({})
      updateDraft({ vehicle: found })
    }
  }

  function handleContinue() {
    const result = validateVehicleInput(v)
    if (!result.ok) {
      setErrors(Object.fromEntries(
        Object.entries(result.errors).map(([field, message]) => [`vehicle.${field}`, message]),
      ))
      return
    }

    setErrors({})
    updateDraft({ vehicle: { ...draft.vehicle, ...result.data } })
    setStep(2)
  }

  const canContinue = Boolean(v.brand && v.model && v.year && v.plates && v.type && v.transmission)
  const errorFor = (field: string) => errors[`vehicle.${field}`]

  return (
    <div className="form-section">
      {/* Vehículos guardados */}
      {(loadingVehicles || vehiclesError || savedVehicles.length > 0) && (
        <section>
          <p className="field-label" style={{ marginBottom: 8 }}>Usar un vehículo guardado</p>
          {loadingVehicles ? (
            <div className="card" style={{ padding: '12px 14px' }}>
              <p className="muted">Cargando vehículos…</p>
            </div>
          ) : vehiclesError ? (
            <p className="field-error">{vehiclesError}</p>
          ) : (
            <div className="stack">
              {savedVehicles.map(sv => (
                <button key={sv.id}
                  onClick={() => loadSaved(sv.id)}
                  style={{
                    background: draft.vehicle.id === sv.id ? 'var(--primary-dim)' : 'var(--surface-2)',
                    border: `1px solid ${draft.vehicle.id === sv.id ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer', color: 'var(--text)', width: '100%', textAlign: 'left',
                  }}>
                  <span style={{ fontSize: '1.3rem' }}>🚗</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>{sv.alias}</p>
                    <p className="muted" style={{ fontSize: 12 }}>{sv.brand} {sv.model} · {sv.plates}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span className="muted" style={{ fontSize: 12 }}>o ingresa manualmente</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
        </section>
      )}

      {/* Tipo de vehículo */}
      <div className="field-group">
        <label className="field-label">Tipo de vehículo</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {VEHICLE_TYPES.map(({ value, label, emoji }) => (
            <button key={value}
              onClick={() => update('type', value)}
              style={{
                background: v.type === value ? 'var(--primary-dim)' : 'var(--surface-2)',
                border: `1px solid ${v.type === value ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '10px 6px',
                cursor: 'pointer', color: 'var(--text)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
              <span style={{ fontSize: '1.4rem' }}>{emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>
        {errorFor('type') && <p className="field-error">{errorFor('type')}</p>}
      </div>

      {/* Datos básicos */}
      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Marca</label>
          <input className="field-input" placeholder="Toyota"
            value={v.brand ?? ''} onChange={e => update('brand', e.target.value)} />
          {errorFor('brand') && <p className="field-error">{errorFor('brand')}</p>}
        </div>
        <div className="field-group">
          <label className="field-label">Modelo</label>
          <input className="field-input" placeholder="Hilux"
            value={v.model ?? ''} onChange={e => update('model', e.target.value)} />
          {errorFor('model') && <p className="field-error">{errorFor('model')}</p>}
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Año</label>
          <input className="field-input" placeholder="2022" type="number" min="1900"
            value={v.year ?? ''} onChange={e => update('year', e.target.value)} />
          {errorFor('year') && <p className="field-error">{errorFor('year')}</p>}
        </div>
        <div className="field-group">
          <label className="field-label">Color</label>
          <input className="field-input" placeholder="Blanco"
            value={v.color ?? ''} onChange={e => update('color', e.target.value)} />
          {errorFor('color') && <p className="field-error">{errorFor('color')}</p>}
        </div>
      </div>

      <div className="field-row">
        <div className="field-group">
          <label className="field-label">Placas</label>
          <input className="field-input" placeholder="ABC123" maxLength={10}
            value={v.plates ?? ''}
            onChange={e => update('plates', e.target.value.toUpperCase())}
            onBlur={e => {
              const plates = normalizePlates(e.currentTarget.value)
              if (plates) update('plates', plates)
            }} />
          {errorFor('plates') && <p className="field-error">{errorFor('plates')}</p>}
        </div>
        <div className="field-group">
          <label className="field-label">VIN (opcional)</label>
          <input className="field-input" placeholder="1HGBH41JXMN109186" maxLength={20}
            value={v.vin ?? ''}
            onChange={e => update('vin', e.target.value.toUpperCase())}
            onBlur={e => {
              const vin = normalizeVin(e.currentTarget.value)
              if (vin) update('vin', vin)
            }} />
          {errorFor('vin') && <p className="field-error">{errorFor('vin')}</p>}
        </div>
      </div>

      {/* Transmisión */}
      <div className="field-group">
        <label className="field-label">Transmisión</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['automatica', 'manual'] as TransmissionType[]).map(t => (
            <button key={t}
              onClick={() => update('transmission', t)}
              style={{
                flex: 1, padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: v.transmission === t ? 'var(--primary-dim)' : 'var(--surface-2)',
                border: `1px solid ${v.transmission === t ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer', color: 'var(--text)', fontWeight: 500, fontSize: 14,
              }}>
              {t === 'automatica' ? '⚙️ Automática' : '🔧 Manual'}
            </button>
          ))}
        </div>
        {errorFor('transmission') && <p className="field-error">{errorFor('transmission')}</p>}
      </div>

      {/* Estado general */}
      <div className="field-group">
        <label className="field-label">Estado general declarado</label>
        <select className="field-select"
          value={v.condition ?? ''} onChange={e => update('condition', e.target.value)}>
          <option value="">Selecciona una opción</option>
          <option value="Excelente">Excelente — Sin daños visibles</option>
          <option value="Bueno">Bueno — Detalles menores</option>
          <option value="Regular">Regular — Daños visibles</option>
          <option value="Requiere atención">Requiere atención</option>
        </select>
        {errorFor('condition') && <p className="field-error">{errorFor('condition')}</p>}
      </div>

      <button className="btn-primary" disabled={!canContinue} onClick={handleContinue}>
        Continuar →
      </button>
    </div>
  )
}
