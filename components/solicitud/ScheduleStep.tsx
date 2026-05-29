'use client'
import { useWizardStore } from '@/lib/store'

export default function ScheduleStep() {
  const { draft, updateDraft, setStep } = useWizardStore()

  const canContinue = draft.asap || !!draft.scheduledAt

  return (
    <div className="form-section">

      {/* ¿Cuándo? */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={() => updateDraft({ asap: true, scheduledAt: undefined })}
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
          onClick={() => updateDraft({ asap: false })}
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
              min={new Date().toISOString().slice(0, 16)}
              onChange={e => updateDraft({ scheduledAt: e.target.value })} />
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

      <button className="btn-primary" disabled={!canContinue} onClick={() => setStep(4)}>
        Continuar →
      </button>
    </div>
  )
}