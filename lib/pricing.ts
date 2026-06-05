// ─── lib/pricing.ts ───────────────────────────────────────────────────────────

const BASE_FARE_MXN = 350        // tarifa base
const PER_KM_MXN    = 18         // por kilómetro
const MIN_FARE_MXN  = 500        // mínimo cobrable
const FORANEO_SURCHARGE = 1.25   // +25% si > 100 km

export function calcQuote(distanceKm: number): number {
  if (distanceKm <= 0) return 0
  const surcharge = distanceKm > 100 ? FORANEO_SURCHARGE : 1
  const raw = (BASE_FARE_MXN + distanceKm * PER_KM_MXN) * surcharge
  return Math.max(Math.round(raw / 10) * 10, MIN_FARE_MXN)
}

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(amount)
}

type DistanceMatrixResponse = {
  status: string
  error_message?: string
  rows?: Array<{
    elements?: Array<{
      status: string
      distance?: {
        value: number
      }
    }>
  }>
}

export async function estimateDistance(origin: string, destination: string): Promise<number> {
  if (!origin || !destination) return 0

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Missing GOOGLE_MAPS_API_KEY environment variable.')
  }

  const params = new URLSearchParams({
    origins: origin,
    destinations: destination,
    key: apiKey,
    units: 'metric',
  })

  const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Google Distance Matrix request failed with status ${response.status}.`)
  }

  const data = await response.json() as DistanceMatrixResponse
  if (data.status !== 'OK') {
    throw new Error(data.error_message ?? `Google Distance Matrix returned ${data.status}.`)
  }

  const element = data.rows?.[0]?.elements?.[0]
  if (!element || element.status !== 'OK' || typeof element.distance?.value !== 'number') {
    throw new Error(`Google Distance Matrix element returned ${element?.status ?? 'NO_RESULT'}.`)
  }

  return Math.round((element.distance.value / 1000) * 10) / 10
}
