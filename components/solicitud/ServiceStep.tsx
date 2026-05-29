'use client'
import { useWizardStore } from '@/lib/store'
import type { ServiceType } from '@/lib/types'

const SERVICES: { value: ServiceType; emoji: string; label: string; desc: string }[] = [
  { value: 'personal',         emoji: '👤', label: 'Personal',           desc: 'Traslado de uso particular' },
  { value: 'empresarial',      emoji: '🏢', label: 'Empresarial',        desc: 'Para empresa o corporativo' },
  { value: 'agencia',          emoji: '🏪', label: 'Agencia',            desc: 'Agencia automotriz' },
  { value: 'lote',             emoji: '🅿️', label: 'Lote',              desc: 'Lote de autos' },
  { value: 'flotilla',         emoji: '🚛', label: 'Flotilla',           desc: 'Múltiples unidades' },
  { value: 'entrega_cliente',  emoji: '🤝', label: 'Entrega a cliente',  desc: 'Delivery a comprador final' },
  { value: 'recuperacion',     emoji: '🔄', label: 'Recuperación',       desc: 'Recuperación de unidad' },
  { value: 'especial',         emoji: '⭐', label: 'Especial',           desc: 'Condiciones específicas' },
]

export default function ServiceStep() {
  const { draft, updateDraft, setStep } = useWizardStore()

  return (
    <div className="form-section">
      <p className="muted">Selecciona el tipo de traslado que mejor describe tu necesidad.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SERVICES.map(({ value, emoji, label, desc }) => (
          <button key={value}
            onClick={() => updateDraft({ serviceType: value })}
            style={{
              background: draft.serviceType === value ? 'var(--primary-dim)' : 'var(--surface-2)',
              border: `1px solid ${draft.serviceType === value ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '14px',
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', color: 'var(--text)', textAlign: 'left', width: '100%',
            }}>
            <span style={{ fontSize: '1.4rem', width: 32, textAlign: 'center', flexShrink: 0 }}>{emoji}</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{label}</p>
              <p className="muted" style={{ fontSize: 12 }}>{desc}</p>
            </div>
            {draft.serviceType === value && (
              <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontSize: 18 }}>✓</span>
            )}
          </button>
        ))}
      </div>

      <button className="btn-primary" disabled={!draft.serviceType} onClick={() => setStep(5)}>
        Ver resumen →
      </button>
    </div>
  )
}