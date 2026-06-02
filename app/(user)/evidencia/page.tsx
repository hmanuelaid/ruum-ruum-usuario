'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Chip } from '@/components/ui/Chip'
import { useAuthStore } from '@/lib/store'
import { createClient } from '@/lib/supabase'

interface EvidencePhoto {
  url: string
}

interface TripEvidence {
  id: string
  type: 'inicial' | 'durante' | 'final'
  status: string
  km_reading: number | null
  fuel_level: number | null
  notes: string | null
  created_at: string
  evidence_photos: EvidencePhoto[] | null
}

interface EvidenceTrip {
  id: string
  status: string
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_plates: string | null
  origin_address: string | null
  destination_address: string | null
  evidence: TripEvidence[] | null
}

function EvidenceCard({
  title,
  evidence,
  pendingText,
}: {
  title: string
  evidence?: TripEvidence
  pendingText: string
}) {
  const photos = evidence?.evidence_photos ?? []

  return (
    <section>
      <div className="section-head" style={{ marginBottom: 10 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700 }}>{title}</h2>
        {evidence ? <Chip variant="success">Disponible</Chip> : <Chip variant="default">Pendiente</Chip>}
      </div>
      {evidence ? (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {photos.length > 0 ? (
            <div className="evidence-grid">
              {photos.map(photo => (
                <div
                  key={photo.url}
                  className="evidence-thumb"
                  style={{
                    backgroundImage: `url(${photo.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="evidence-grid">
              <div className="evidence-thumb">📷</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, fontSize: 13, flexWrap: 'wrap' }}>
            {evidence.km_reading !== null && <span><strong>{evidence.km_reading.toLocaleString('es-MX')}</strong> km</span>}
            {evidence.fuel_level !== null && <span><strong>{evidence.fuel_level}%</strong> combustible</span>}
            <span>{new Date(evidence.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
          {evidence.notes && <p className="muted">{evidence.notes}</p>}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
          <p className="muted">{pendingText}</p>
        </div>
      )}
    </section>
  )
}

export default function EvidenciaPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [trips, setTrips] = useState<EvidenceTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      let cancelled = false

      async function verifySession() {
        const supabase = createClient()
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (!cancelled && (authError || !authUser)) {
          router.replace('/login?redirectTo=/evidencia')
        }
      }

      void verifySession()

      return () => {
        cancelled = true
      }
    }

    const userId = user.id
    let cancelled = false

    async function loadEvidence() {
      setLoading(true)
      setError('')
      const supabase = createClient()
      const { data, error: evidenceError } = await supabase
        .from('trips')
        .select(`
          id,
          status,
          vehicle_brand,
          vehicle_model,
          vehicle_plates,
          origin_address,
          destination_address,
          evidence (
            id,
            type,
            status,
            km_reading,
            fuel_level,
            notes,
            created_at,
            evidence_photos (url)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (evidenceError) {
        setError(`No pudimos cargar la evidencia: ${evidenceError.message}`)
        setTrips([])
        setSelected(null)
        setLoading(false)
        return
      }

      const rows = (data ?? []) as EvidenceTrip[]
      setTrips(rows)
      setSelected(current => current ?? rows[0]?.id ?? null)
      setLoading(false)
    }

    void loadEvidence()
    return () => { cancelled = true }
  }, [router, user])

  const trip = trips.find(t => t.id === selected) ?? null
  const inicial = trip?.evidence?.find(e => e.type === 'inicial')
  const final = trip?.evidence?.find(e => e.type === 'final')

  if (loading) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
      <p className="muted">Cargando evidencia…</p>
    </div>
  )

  if (error) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
      <p className="field-error">{error}</p>
    </div>
  )

  if (trips.length === 0) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 16px' }}>
      <p style={{ fontSize: 32, marginBottom: 8 }}>📸</p>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Sin evidencia disponible</p>
      <p className="muted">La evidencia de tus traslados aparecerá aquí.</p>
    </div>
  )

  return (
    <>
      <section>
        <p className="kicker" style={{ marginBottom: 8 }}>Selecciona un viaje</p>
        <div className="stack">
          {trips.map(t => (
            <button key={t.id}
              onClick={() => setSelected(t.id)}
              style={{
                background: selected === t.id ? 'var(--primary-dim)' : 'var(--surface)',
                border: `1px solid ${selected === t.id ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', color: 'var(--text)', width: '100%', textAlign: 'left',
              }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13 }}>
                  {t.id} · {t.vehicle_brand} {t.vehicle_model}
                </p>
                <p className="muted" style={{ fontSize: 12 }}>
                  {t.origin_address?.split(',')[0]} → {t.destination_address?.split(',')[0]}
                </p>
              </div>
              <Chip status={t.status} />
            </button>
          ))}
        </div>
      </section>

      {trip && (
        <>
          <EvidenceCard
            title="Evidencia inicial"
            evidence={inicial}
            pendingText="Disponible cuando el conductor reciba el vehículo."
          />

          <EvidenceCard
            title="Evidencia final"
            evidence={final}
            pendingText="Disponible al completar la entrega."
          />
        </>
      )}

      <div className="card" style={{ textAlign: 'center', padding: '20px 16px' }}>
        <p style={{ fontSize: 20, marginBottom: 6 }}>📸</p>
        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>La evidencia es tu tranquilidad</p>
        <p className="muted" style={{ fontSize: 13 }}>Documentamos tu vehículo antes, durante y después del traslado.</p>
      </div>
    </>
  )
}
