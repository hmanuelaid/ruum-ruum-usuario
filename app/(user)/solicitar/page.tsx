'use client'
import { useWizardStore } from '@/lib/store'
import VehicleStep    from '@/components/solicitud/VehicleStep'
import RouteStep      from '@/components/solicitud/RouteStep'
import ScheduleStep   from '@/components/solicitud/ScheduleStep'
import ServiceStep    from '@/components/solicitud/ServiceStep'
import ReviewStep     from '@/components/solicitud/ReviewStep'

const STEPS = [
  'Vehículo',
  'Origen y destino',
  'Cuándo',
  'Tipo de servicio',
  'Revisión',
]

export default function SolicitarPage() {
  const { draft, setStep } = useWizardStore()
  const current = draft.step

  return (
    <>
      {/* Step indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p className="kicker">Paso {current} de {STEPS.length}</p>
        <div className="step-indicator">
          {STEPS.map((_, i) => (
            <span key={i} className={`step-dot${i + 1 === current ? ' active' : i + 1 < current ? ' done' : ''}`} />
          ))}
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{STEPS[current - 1]}</h2>
      </div>

      {/* Steps */}
      {current === 1 && <VehicleStep />}
      {current === 2 && <RouteStep />}
      {current === 3 && <ScheduleStep />}
      {current === 4 && <ServiceStep />}
      {current === 5 && <ReviewStep />}

      {/* Back button */}
      {current > 1 && (
        <button className="btn-secondary" onClick={() => setStep(current - 1)}>
          ← Atrás
        </button>
      )}
    </>
  )
}