'use client'
import { useState } from 'react'
import { useWizardStore } from '@/lib/store'

function toLocalDateTimeInputValue(date: Date) {
  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
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

      {/* Tipo de traslado */}
      <div className="field-group">
        <label className="field-label">Alcance del traslado</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: '🏙️ Local', desc: 'Mismo estado' },
            { label: '🗺️ Foráneo', desc: 'Otro estado' },
          ].map(({ label, desc }) => (
            <button key={label}
              style={{
                flex: 1, padding: '12px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                cursor: 'pointer', color: 'var(--text)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
              <span className="muted" style={{ fontSize: 12 }}>{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ventanas de tiempo */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontWeight: 600, fontSize: 14 }}>Ventanas de tiempo (opcional)</p>
        <div className="field-group">
          <label className="field-label">Ventana de recolección</label>
          <input className="field-input" placeholder="Ej. Entre 9:00 y 11:00 AM"
            style={{ fontSize: 13 }} />
        </div>
        <div className="field-group">
          <label className="field-label">Ventana de entrega</label>
          <input className="field-input" placeholder="Ej. Antes de las 6:00 PM"
            style={{ fontSize: 13 }} />
        </div>
      </div>

      <button className="btn-primary" disabled={!canContinue} onClick={handleContinue}>
        Continuar →
      </button>
    </div>
  )
}
