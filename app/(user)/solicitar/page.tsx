'use client'
import { useEffect } from 'react'
import { useWizardStore } from '@/lib/store'
import VehicleStep from '@/components/solicitud/VehicleStep'
import RouteStep from '@/components/solicitud/RouteStep'
import ScheduleStep from '@/components/solicitud/ScheduleStep'
import ServiceStep from '@/components/solicitud/ServiceStep'
import ReviewStep from '@/components/solicitud/ReviewStep'

const STEPS = [
  { step: 1, title: 'Vehículo' },
  { step: 2, title: 'Ruta' },
  { step: 3, title: 'Horario' },
  { step: 4, title: 'Servicio' },
  { step: 5, title: 'Revisión' },
] as const

export default function SolicitarPage() {
  const { draft, setStep, checkDraftExpiry } = useWizardStore()

  // Descarta drafts viejos (más de 24h) antes de que el usuario los vea.
  useEffect(() => {
    checkDraftExpiry()
  }, [checkDraftExpiry])

  const step = draft.step ?? 1
  const current = STEPS.find(s => s.step === step) ?? STEPS[0]

  return (
    <div className="form-section">
      <div>
        <div className="step-indicator">
          {STEPS.map(s => (
            <span
              key={s.step}
              className={`step-dot${s.step === step ? ' active' : s.step < step ? ' done' : ''}`}
            />
          ))}
        </div>
        <p className="kicker">Paso {step} de {STEPS.length} · {current.title}</p>
      </div>

      {step === 1 && <VehicleStep />}
      {step === 2 && <RouteStep />}
      {step === 3 && <ScheduleStep />}
      {step === 4 && <ServiceStep />}
      {step === 5 && <ReviewStep />}

      {step > 1 && (
        <button className="btn-ghost" onClick={() => setStep(step - 1)}>
          ← Atrás
        </button>
      )}
    </div>
  )
}