// ─── lib/pricing.ts ───────────────────────────────────────────────────────────

const BASE_FARE_MXN    = 350   // tarifa base
const PER_KM_MXN       = 18    // por kilómetro
const MIN_FARE_MXN     = 500   // mínimo cobrable
const FORANEO_SURCHARGE = 1.25 // +25% si > 100 km

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

// ─── Geocodificación: texto → [lon, lat] ──────────────────────────────────────
// Usa Nominatim (OpenStreetMap) — completamente gratis, sin API key.
// Límite: 1 req/seg en producción; para mayor volumen usa una instancia propia.

async function geocode(address: string): Promise<[number, number]> {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    countrycodes: 'mx',          // prioriza resultados en México
  })

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        // Nominatim requiere un User-Agent identificable
        'User-Agent': 'RuumRuum/1.0 (contacto@ruumruum.com)',
      },
      cache: 'no-store',
    },
  )

  if (!res.ok) throw new Error(`Nominatim error ${res.status}`)

  const data = await res.json() as Array<{ lon: string; lat: string }>
  if (!data.length) throw new Error(`No se encontró la dirección: "${address}"`)

  return [parseFloat(data[0].lon), parseFloat(data[0].lat)]
}

// ─── Distancia por carretera: OpenRouteService (primario) ─────────────────────
// Gratis: 2 000 req/día sin tarjeta de crédito.
// Registro en: https://openrouteservice.org/dev/#/signup
// Variable de entorno: ORS_API_KEY

async function distanceViaORS(
  originCoords: [number, number],
  destCoords: [number, number],
): Promise<number> {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) throw new Error('ORS_API_KEY no configurada')

  const body = {
    locations: [originCoords, destCoords],
    metrics: ['distance'],
    units: 'km',
  }

  const res = await fetch(
    'https://api.openrouteservice.org/v2/matrix/driving-car',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    },
  )

  if (!res.ok) throw new Error(`ORS error ${res.status}`)

  const data = await res.json() as { distances?: number[][] }
  const km = data.distances?.[0]?.[1]
  if (typeof km !== 'number' || km <= 0) throw new Error('ORS no devolvió distancia válida')

  return Math.round(km * 10) / 10
}

// ─── Distancia por carretera: OSRM público (fallback gratuito) ────────────────
// Servidor comunitario de OSRM — sin límite oficial pero no apto para
// producción de alto volumen. Ideal como respaldo o en desarrollo.

async function distanceViaOSRM(
  originCoords: [number, number],
  destCoords: [number, number],
): Promise<number> {
  const [oLon, oLat] = originCoords
  const [dLon, dLat] = destCoords

  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${oLon},${oLat};${dLon},${dLat}?overview=false`

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`OSRM error ${res.status}`)

  const data = await res.json() as { routes?: Array<{ distance: number }> }
  const meters = data.routes?.[0]?.distance
  if (typeof meters !== 'number' || meters <= 0) throw new Error('OSRM no devolvió ruta válida')

  return Math.round((meters / 1000) * 10) / 10
}

// ─── estimateDistance: punto de entrada público ───────────────────────────────
// Flujo:
//   1. Geocodifica origen y destino con Nominatim (gratis)
//   2. Calcula distancia con ORS si ORS_API_KEY está presente
//   3. Si ORS falla o no hay key, usa OSRM como fallback

export async function estimateDistance(origin: string, destination: string): Promise<number> {
  if (!origin || !destination) return 0

  // Geocodificar ambas direcciones en paralelo
  const [originCoords, destCoords] = await Promise.all([
    geocode(origin),
    geocode(destination),
  ])

  // Intentar ORS primero; caer en OSRM si no hay key o falla
  if (process.env.ORS_API_KEY) {
    try {
      return await distanceViaORS(originCoords, destCoords)
    } catch {
      console.warn('[pricing] ORS falló, usando OSRM como fallback')
    }
  }

  return distanceViaOSRM(originCoords, destCoords)
}
