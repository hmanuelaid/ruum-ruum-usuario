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

export function estimateDistance(origin: string, destination: string): number {
  // Mock: genera distancia basada en longitud de strings como seed
  // En producción: reemplazar con Google Maps Distance Matrix API
  if (!origin || !destination) return 0
  const seed = (origin.length * 7 + destination.length * 13) % 200
  return Math.max(seed + 10, 15)
}