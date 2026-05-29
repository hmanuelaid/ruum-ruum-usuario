'use client'
import { useWizardStore } from '@/lib/store'

export default function RouteStep() {
  const { draft, updateDraft, setStep } = useWizardStore()
  const { origin, destination, originContact, destinationContact } = draft

  function updateOrigin(field: string, value: string) {
    updateDraft({ origin: { ...draft.origin, [field]: value } })
  }
  function updateDest(field: string, value: string) {
    updateDraft({ destination: { ...draft.destination, [field]: value } })
  }
  function updateOriginContact(field: string, value: string) {
    updateDraft({ originContact: { ...draft.originContact, [field]: value } })
  }
  function updateDestContact(field: string, value: string) {
    updateDraft({ destinationContact: { ...draft.destinationContact, [field]: value } })
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
        </div>

        <div className="field-group">
          <label className="field-label">Referencias</label>
          <input className="field-input" placeholder="Torre azul, entrada principal"
            value={origin.reference ?? ''}
            onChange={e => updateOrigin('reference', e.target.value)} />
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <p style={{ fontWeight: 600, fontSize: 13 }}>Persona que entrega</p>
        <div className="field-row">
          <div className="field-group">
            <label className="field-label">Nombre</label>
            <input className="field-input" placeholder="Juan García"
              value={originContact.name ?? ''}
              onChange={e => updateOriginContact('name', e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Teléfono</label>
            <input className="field-input" type="tel" placeholder="+52 55 0000 0000"
              value={originContact.phone ?? ''}
              onChange={e => updateOriginContact('phone', e.target.value)} />
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
        </div>

        <div className="field-group">
          <label className="field-label">Referencias</label>
          <input className="field-input" placeholder="Hotel Marriott, recepción"
            value={destination.reference ?? ''}
            onChange={e => updateDest('reference', e.target.value)} />
        </div>

        <div style={{ height: 1, background: 'var(--border)' }} />

        <p style={{ fontWeight: 600, fontSize: 13 }}>Persona que recibe</p>
        <div className="field-row">
          <div className="field-group">
            <label className="field-label">Nombre</label>
            <input className="field-input" placeholder="Ana Ruiz"
              value={destinationContact.name ?? ''}
              onChange={e => updateDestContact('name', e.target.value)} />
          </div>
          <div className="field-group">
            <label className="field-label">Teléfono</label>
            <input className="field-input" type="tel" placeholder="+52 998 000 0000"
              value={destinationContact.phone ?? ''}
              onChange={e => updateDestContact('phone', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Instrucciones especiales */}
      <div className="field-group">
        <label className="field-label">Instrucciones especiales (opcional)</label>
        <textarea className="field-input" rows={3}
          placeholder="El vehículo tiene alarma, código: 1234..."
          value={draft.specialInstructions ?? ''}
          onChange={e => updateDraft({ specialInstructions: e.target.value })}
          style={{ resize: 'none' }} />
      </div>

      <button className="btn-primary" disabled={!canContinue} onClick={() => setStep(3)}>
        Continuar →
      </button>
    </div>
  )
}