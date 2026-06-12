'use client'
import { useState } from 'react'
import { useWizardStore } from '@/lib/store'

function toLocalDateTimeInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

// Campo de hora individual con label
function TimeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="field-group" style={{ flex: 1 }}>
      <label className="field-label" style={{ fontSize: 12 }}>{label}</label>
      <input
        className="field-input"
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ fontSize: 14 }}
      />
    </div>
  )
}

export default function ScheduleStep() {
  const { draft, updateDraft, setStep } = useWizardStore()
  const [error, setError] = useState('')

  const canContinue = draft.asap || !!draft.scheduledAt
  const minDateTime = toLocalDateTimeInputValue(new Date())

  function handleContinue() {
    if (!draft.asap) {
      if (!draft.scheduledAt) {
        setError('Selecciona fecha y hora para programar el viaje.')
        return
      }
      const selectedTime = new Date(draft.scheduledAt).getTime()
      if (!Number.isFinite(selectedTime) || selectedTime < Date.now() - 5 * 60 * 1000) {
        setError('La fecha programada debe ser futura.')
        return
      }
    }
    setError('')
    setStep(4)
  }

  return (
    <div className="form-section">

      {/* ¿Cuándo? */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => {
            setError('')
            updateDraft({ asap: true, scheduledAt: undefined })
          }}
          style={{
            background: draft.asap ? 'var(--primary-dim)' : 'var(--surface-2)',
            border: `1px solid ${draft.asap ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', padding: '16px',
            cursor: 'pointer', color: 'var(--text)', textAlign: 'left',
          }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>⚡ Lo antes posible</p>
          <p className="muted" style={{ fontSize: 13 }}>Asignamos un conductor disponible de inmediato</p>
        </button>

        <button
          onClick={() => {
            setError('')
            updateDraft({ asap: false })
          }}
          style={{
            background: !draft.asap ? 'var(--primary-dim)' : 'var(--surface-2)',
            border: `1px solid ${!draft.asap ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', padding: '16px',
            cursor: 'pointer', color: 'var(--text)', textAlign: 'left',
          }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>📅 Programar fecha y hora</p>
          <p className="muted" style={{ fontSize: 13 }}>Elige cuándo quieres que recojamos el vehículo</p>
        </button>
      </div>

      {/* Selector de fecha */}
      {!draft.asap && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field-group">
            <label className="field-label">Fecha y hora de recolección</label>
            <input className="field-input" type="datetime-local"
              value={draft.scheduledAt ?? ''}
              min={minDateTime}
              onChange={e => {
                setError('')
                updateDraft({ scheduledAt: e.target.value })
              }} />
            {error && <p className="field-error">{error}</p>}
          </div>
        </div>
      )}

      {/* Alcance del traslado */}
      <div className="field-group">
        <label className="field-label">Alcance del traslado</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            { value: 'local'   as const, label: '🏙️ Local',   desc: 'Mismo estado' },
            { value: 'foraneo' as const, label: '🗺️ Foráneo', desc: 'Otro estado' },
          ]).map(({ value, label, desc }) => {
            const selected = draft.tripScope === value
            return (
              <button key={value}
                onClick={() => updateDraft({ tripScope: value })}
                style={{
                  flex: 1, padding: '12px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: selected ? 'var(--primary-dim)' : 'var(--surface-2)',
                  border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                  cursor: 'pointer', color: 'var(--text)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'background 0.15s, border-color 0.15s',
                }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
                <span className="muted" style={{ fontSize: 12 }}>{desc}</span>
                {selected && (
                  <span style={{ color: 'var(--primary)', fontSize: 14, marginTop: 2 }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Ventanas de tiempo */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontWeight: 600, fontSize: 14 }}>Ventanas de tiempo <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>(opcional)</span></p>

        {/* Ventana de recolección */}
        <div className="field-group">
          <label className="field-label">Ventana de recolección</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TimeField
              label="Desde"
              value={draft.collectionWindowStart ?? ''}
              onChange={v => updateDraft({ collectionWindowStart: v })}
            />
            <span style={{
              color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
              paddingTop: 18, flexShrink: 0,
            }}>—</span>
            <TimeField
              label="Hasta"
              value={draft.collectionWindowEnd ?? ''}
              onChange={v => updateDraft({ collectionWindowEnd: v })}
            />
          </div>
        </div>

        {/* Ventana de entrega */}
        <div className="field-group">
          <label className="field-label">Ventana de entrega</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TimeField
              label="Desde"
              value={draft.deliveryWindowStart ?? ''}
              onChange={v => updateDraft({ deliveryWindowStart: v })}
            />
            <span style={{
              color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
              paddingTop: 18, flexShrink: 0,
            }}>—</span>
            <TimeField
              label="Hasta"
              value={draft.deliveryWindowEnd ?? ''}
              onChange={v => updateDraft({ deliveryWindowEnd: v })}
            />
          </div>
        </div>
      </div>

      <button className="btn-primary" disabled={!canContinue} onClick={handleContinue}>
        Continuar →
      </button>
    </div>
  )
}
