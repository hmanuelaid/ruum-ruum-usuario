'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import type { TransmissionType, VehicleType } from '@/lib/types'
import {
  firstValidationError,
  normalizePlates,
  normalizeVin,
  validateVehicleInput,
  type FieldErrors,
} from '@/lib/validation/tripRequest'

type SavedVehicle = {
  id: string
  alias?: string | null
  brand?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
  plates?: string | null
  vin?: string | null
  type?: VehicleType | null
  transmission?: TransmissionType | null
  condition?: string | null
}

type VehicleForm = {
  id?: string
  alias: string
  brand: string
  model: string
  year: string
  color: string
  plates: string
  vin: string
  type: VehicleType | ''
  transmission: TransmissionType | ''
  condition: string
}

type VehicleDisplay = {
  alias?: string | null
  brand?: string | null
  model?: string | null
  year?: number | string | null
  plates?: string | null
  color?: string | null
  transmission?: TransmissionType | '' | null
}

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error?: string }

const EMPTY_FORM: VehicleForm = {
  alias: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  plates: '',
  vin: '',
  type: '',
  transmission: '',
  condition: '',
}

const VEHICLE_TYPES: { value: VehicleType; label: string }[] = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'van', label: 'Van' },
  { value: 'moto', label: 'Moto' },
  { value: 'otro', label: 'Otro' },
]

const TRANSMISSIONS: { value: TransmissionType; label: string }[] = [
  { value: 'automatica', label: 'Automatica' },
  { value: 'manual', label: 'Manual' },
]

const CONDITIONS = [
  'Excelente',
  'Bueno',
  'Regular',
  'Requiere atencion',
]

function vehicleTitle(vehicle: VehicleDisplay) {
  const alias = vehicle.alias?.trim()
  if (alias) return alias

  const name = [vehicle.brand, vehicle.model, vehicle.year]
    .filter(Boolean)
    .join(' ')
    .trim()

  return name || 'Vehiculo'
}

function vehicleSubtitle(vehicle: VehicleDisplay) {
  return [
    vehicle.plates,
    vehicle.color,
    vehicle.transmission === 'automatica' ? 'Automatico' : vehicle.transmission === 'manual' ? 'Manual' : '',
  ]
    .filter(Boolean)
    .join(' · ')
}

function vehicleToForm(vehicle: SavedVehicle): VehicleForm {
  return {
    id: vehicle.id,
    alias: vehicle.alias ?? '',
    brand: vehicle.brand ?? '',
    model: vehicle.model ?? '',
    year: vehicle.year ? String(vehicle.year) : '',
    color: vehicle.color ?? '',
    plates: vehicle.plates ?? '',
    vin: vehicle.vin ?? '',
    type: vehicle.type ?? '',
    transmission: vehicle.transmission ?? '',
    condition: vehicle.condition ?? '',
  }
}

export default function VehiculosPage() {
  const router = useRouter()
  const { showToast } = useAppStore()

  const [vehicles, setVehicles] = useState<SavedVehicle[]>([])
  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})

  const editing = Boolean(form.id)
  const canSave = useMemo(
    () => Boolean(form.brand && form.model && form.year && form.plates && form.type && form.transmission),
    [form.brand, form.model, form.plates, form.transmission, form.type, form.year],
  )

  const loadVehicles = useCallback(async () => {
    await Promise.resolve()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/vehicles', {
        headers: { Accept: 'application/json' },
      })

      if (response.status === 401) {
        router.replace('/login')
        return
      }

      const payload = (await response.json().catch(() => null)) as ApiResponse<SavedVehicle[]> | null

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload && !payload.ok
            ? payload.error ?? 'No pudimos cargar tus vehiculos.'
            : 'No pudimos cargar tus vehiculos.',
        )
      }

      setVehicles(payload.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos cargar tus vehiculos.')
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadVehicles()
    }, 0)

    return () => window.clearTimeout(timeout)
  }, [loadVehicles])

  function clearFieldError(field: string) {
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  function update(field: keyof VehicleForm, value: string) {
    clearFieldError(field)
    setFormError('')
    setForm((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setErrors({})
    setFormError('')
    setFormOpen(false)
  }

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setErrors({})
    setFormError('')
    setFormOpen(true)
  }

  function openEditForm(vehicle: SavedVehicle) {
    setForm(vehicleToForm(vehicle))
    setErrors({})
    setFormError('')
    setFormOpen(true)
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validation = validateVehicleInput(form)

    if (!validation.ok) {
      setErrors(validation.errors)
      setFormError(firstValidationError(validation.errors))
      return
    }

    setSaving(true)
    setFormError('')

    try {
      const response = await fetch('/api/vehicles', {
        method: editing ? 'PATCH' : 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validation.data),
      })

      if (response.status === 401) {
        router.replace('/login')
        return
      }

      const payload = (await response.json().catch(() => null)) as ApiResponse<SavedVehicle> | null

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload && !payload.ok
            ? payload.error ?? 'No pudimos guardar el vehiculo.'
            : 'No pudimos guardar el vehiculo.',
        )
      }

      setVehicles((current) => {
        if (editing) {
          return current.map((vehicle) => (
            vehicle.id === payload.data.id ? payload.data : vehicle
          ))
        }

        return [payload.data, ...current]
      })

      resetForm()
      showToast(editing ? 'Vehiculo actualizado.' : 'Vehiculo agregado.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No pudimos guardar el vehiculo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(vehicle: SavedVehicle) {
    if (deletingId) return

    const confirmed = window.confirm(`Eliminar ${vehicleTitle(vehicle)}?`)
    if (!confirmed) return

    setDeletingId(vehicle.id)

    try {
      const response = await fetch('/api/vehicles', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: vehicle.id }),
      })

      if (response.status === 401) {
        router.replace('/login')
        return
      }

      const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null

      if (!response.ok || !payload?.ok) {
        throw new Error(
          payload && !payload.ok
            ? payload.error ?? 'No pudimos eliminar el vehiculo.'
            : 'No pudimos eliminar el vehiculo.',
        )
      }

      setVehicles((current) => current.filter((item) => item.id !== vehicle.id))
      if (form.id === vehicle.id) resetForm()
      showToast('Vehiculo eliminado.')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No pudimos eliminar el vehiculo.')
    } finally {
      setDeletingId('')
    }
  }

  const errorFor = (field: string) => errors[field]

  return (
    <>
      <section className="card-hero">
        <button className="btn-back" type="button" onClick={() => router.back()}>
          Atras
        </button>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,.72)' }}>Mi cuenta</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 6 }}>
          Mis vehiculos
        </h2>
        <p style={{ fontSize: 13, opacity: .82 }}>
          Guarda los datos de tus autos para solicitar traslados mas rapido.
        </p>
      </section>

      {error && (
        <section className="card" role="alert">
          <p className="field-error" style={{ fontWeight: 700 }}>{error}</p>
          <button className="btn-secondary" type="button" onClick={() => void loadVehicles()}>
            Reintentar
          </button>
        </section>
      )}

      <section>
        <div className="section-head">
          <div>
            <p className="kicker">Garaje</p>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>
              {vehicles.length} vehiculo{vehicles.length === 1 ? '' : 's'} guardado{vehicles.length === 1 ? '' : 's'}
            </h2>
          </div>
          <button className="btn-mini" type="button" onClick={openCreateForm} aria-label="Agregar vehiculo">
            +
          </button>
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <p className="muted">Cargando vehiculos...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
            <p style={{ fontWeight: 700, marginBottom: 4 }}>Aun no tienes vehiculos</p>
            <p className="muted" style={{ marginBottom: 14 }}>
              Agrega tu primer vehiculo y lo podras reutilizar al solicitar un traslado.
            </p>
            <button className="btn-primary" type="button" onClick={openCreateForm}>
              Agregar vehiculo
            </button>
          </div>
        ) : (
          <div className="stack">
            {vehicles.map((vehicle) => (
              <article key={vehicle.id} className="list-card" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {vehicleTitle(vehicle)}
                  </p>
                  <p className="muted">{vehicleSubtitle(vehicle) || 'Sin detalles adicionales'}</p>
                  {vehicle.vin && (
                    <p className="kicker" style={{ marginTop: 8 }}>
                      VIN {vehicle.vin}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn-mini"
                    type="button"
                    onClick={() => openEditForm(vehicle)}
                    aria-label={`Editar ${vehicleTitle(vehicle)}`}
                    style={{ width: 46, fontSize: 11 }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-mini"
                    type="button"
                    onClick={() => void handleDelete(vehicle)}
                    disabled={deletingId === vehicle.id}
                    aria-label={`Eliminar ${vehicleTitle(vehicle)}`}
                    style={{ color: 'var(--danger)', width: 46, fontSize: 11 }}
                  >
                    {deletingId === vehicle.id ? '...' : 'Del'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <section className="card">
          <div className="section-head">
            <div>
              <p className="kicker">{editing ? 'Editar vehiculo' : 'Nuevo vehiculo'}</p>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>
                {editing ? vehicleTitle(form) : 'Datos del vehiculo'}
              </h2>
            </div>
            <button className="btn-mini" type="button" onClick={resetForm} aria-label="Cerrar formulario">
              x
            </button>
          </div>

          <form className="form-section" onSubmit={handleSave}>
            <div className="field-group">
              <label className="field-label" htmlFor="vehicle-alias">Alias opcional</label>
              <input
                id="vehicle-alias"
                className="field-input"
                value={form.alias}
                onChange={(event) => update('alias', event.target.value)}
                placeholder="Auto de casa"
                maxLength={80}
              />
              {errorFor('alias') && <p className="field-error">{errorFor('alias')}</p>}
            </div>

            <div className="field-group">
              <label className="field-label">Tipo de vehiculo</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {VEHICLE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => update('type', type.value)}
                    style={{
                      background: form.type === type.value ? 'var(--primary-dim)' : 'var(--surface-2)',
                      border: `1px solid ${form.type === type.value ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '10px 6px',
                    }}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              {errorFor('type') && <p className="field-error">{errorFor('type')}</p>}
            </div>

            <div className="field-row">
              <div className="field-group">
                <label className="field-label" htmlFor="vehicle-brand">Marca</label>
                <input
                  id="vehicle-brand"
                  className="field-input"
                  value={form.brand}
                  onChange={(event) => update('brand', event.target.value)}
                  placeholder="Toyota"
                  maxLength={40}
                />
                {errorFor('brand') && <p className="field-error">{errorFor('brand')}</p>}
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="vehicle-model">Modelo</label>
                <input
                  id="vehicle-model"
                  className="field-input"
                  value={form.model}
                  onChange={(event) => update('model', event.target.value)}
                  placeholder="Hilux"
                  maxLength={60}
                />
                {errorFor('model') && <p className="field-error">{errorFor('model')}</p>}
              </div>
            </div>

            <div className="field-row">
              <div className="field-group">
                <label className="field-label" htmlFor="vehicle-year">Ano</label>
                <input
                  id="vehicle-year"
                  className="field-input"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={form.year}
                  onChange={(event) => update('year', event.target.value)}
                  placeholder="2024"
                />
                {errorFor('year') && <p className="field-error">{errorFor('year')}</p>}
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="vehicle-color">Color opcional</label>
                <input
                  id="vehicle-color"
                  className="field-input"
                  value={form.color}
                  onChange={(event) => update('color', event.target.value)}
                  placeholder="Blanco"
                  maxLength={40}
                />
                {errorFor('color') && <p className="field-error">{errorFor('color')}</p>}
              </div>
            </div>

            <div className="field-row">
              <div className="field-group">
                <label className="field-label" htmlFor="vehicle-plates">Placas</label>
                <input
                  id="vehicle-plates"
                  className="field-input"
                  value={form.plates}
                  onChange={(event) => update('plates', event.target.value.toUpperCase())}
                  onBlur={(event) => {
                    const plates = normalizePlates(event.currentTarget.value)
                    if (plates) update('plates', plates)
                  }}
                  placeholder="ABC123"
                  maxLength={10}
                />
                {errorFor('plates') && <p className="field-error">{errorFor('plates')}</p>}
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="vehicle-vin">VIN opcional</label>
                <input
                  id="vehicle-vin"
                  className="field-input"
                  value={form.vin}
                  onChange={(event) => update('vin', event.target.value.toUpperCase())}
                  onBlur={(event) => {
                    const vin = normalizeVin(event.currentTarget.value)
                    if (vin) update('vin', vin)
                  }}
                  placeholder="1HGBH41JXMN109186"
                  maxLength={20}
                />
                {errorFor('vin') && <p className="field-error">{errorFor('vin')}</p>}
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Transmision</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {TRANSMISSIONS.map((transmission) => (
                  <button
                    key={transmission.value}
                    type="button"
                    onClick={() => update('transmission', transmission.value)}
                    style={{
                      flex: 1,
                      background: form.transmission === transmission.value ? 'var(--primary-dim)' : 'var(--surface-2)',
                      border: `1px solid ${form.transmission === transmission.value ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      padding: '10px',
                    }}
                  >
                    {transmission.label}
                  </button>
                ))}
              </div>
              {errorFor('transmission') && <p className="field-error">{errorFor('transmission')}</p>}
            </div>

            <div className="field-group">
              <label className="field-label" htmlFor="vehicle-condition">Estado declarado opcional</label>
              <select
                id="vehicle-condition"
                className="field-select"
                value={form.condition}
                onChange={(event) => update('condition', event.target.value)}
              >
                <option value="">Selecciona una opcion</option>
                {CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
              {errorFor('condition') && <p className="field-error">{errorFor('condition')}</p>}
            </div>

            {formError && (
              <p className="field-error" role="alert">
                {formError}
              </p>
            )}

            <div className="action-grid">
              <button
                className="btn-secondary"
                type="button"
                onClick={resetForm}
                disabled={saving}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                type="submit"
                disabled={!canSave || saving}
                style={{ flex: 1, width: 'auto' }}
              >
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar vehiculo'}
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  )
}
