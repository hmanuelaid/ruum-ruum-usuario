// ─── lib/pricing.ts ───────────────────────────────────────────────────────────
import type { VehicleType, ServiceType, VehicleValueRange } from './types'

// ── Constantes base ───────────────────────────────────────────────────────────
const BASE_FARE_MXN     = 350   // tarifa base fija
const PER_KM_MXN        = 18    // por kilómetro
const MIN_FARE_MXN      = 500   // mínimo cobrable
const FORANEO_SURCHARGE = 1.25  // +25 % si el alcance es foráneo o > 100 km
const ASAP_SURCHARGE    = 1.15  // +15 % por urgencia ("lo antes posible")

// ── Multiplicadores por tipo de vehículo ──────────────────────────────────────
const VEHICLE_MULTIPLIERS: Record<VehicleType, number> = {
  sedan:  1.00,
  suv:    1.10,
  pickup: 1.15,
  van:    1.20,
  moto:   0.80,
  otro:   1.05,
}

// ── Multiplicadores por tipo de servicio ──────────────────────────────────────
const SERVICE_MULTIPLIERS: Record<ServiceType, number> = {
  personal:        1.00,
  empresarial:     1.10,
  agencia:         1.05,
  lote:            1.05,
  flotilla:        1.20,
  entrega_cliente: 1.10,
  recuperacion:    1.25,
  especial:        1.30,
}

// ── Multiplicadores por valor declarado del vehículo ─────────────────────────
// A mayor valor, mayor responsabilidad y cobertura requerida.
const VEHICLE_VALUE_MULTIPLIERS: Record<VehicleValueRange, number> = {
  hasta_200k: 1.00,
  '200k_500k':  1.10,
  '500k_1m':    1.20,
  mas_1m:       1.35,
}

// ── Multiplicadores por horario ───────────────────────────────────────────────
// Franjas acordadas con operaciones:
//   Lun–Vie 06:00–20:00  → base (×1.00)
//   Lun–Vie 20:00–06:00  → nocturno (×1.15)
//   Sábado todo el día   → fin de semana (×1.10)
//   Domingo / festivo    → festivo (×1.20)
//
// Los días festivos oficiales de México se declaran como
// "YYYY-MM-DD" para comparación rápida. Actualiza la lista cada año.
const MEXICO_HOLIDAYS = new Set([
  // 2025
  '2025-01-01', '2025-02-03', '2025-03-17', '2025-04-17', '2025-04-18',
  '2025-05-01', '2025-09-16', '2025-11-17', '2025-12-25',
  // 2026
  '2026-01-01', '2026-02-02', '2026-03-16', '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-09-16', '2026-11-16', '2026-12-25',
])

function isMexicoHoliday(date: Date): boolean {
  const key = date.toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
  return MEXICO_HOLIDAYS.has(key)
}

/**
 * Devuelve el multiplicador de tarifa según el horario del servicio.
 *
 * @param scheduledAt  ISO string de la fecha/hora programada.
 *                     Si es undefined (modo asap) se usa la hora actual.
 */
export function timeMultiplier(scheduledAt?: string): number {
  const date = scheduledAt ? new Date(scheduledAt) : new Date()

  if (isMexicoHoliday(date)) return 1.20

  const day  = date.getDay()   // 0 = domingo, 6 = sábado
  const hour = date.getHours() // hora local del servidor (ajusta con tz si es necesario)

  if (day === 0) return 1.20   // domingo
  if (day === 6) return 1.10   // sábado
  if (hour < 6 || hour >= 20) return 1.15  // nocturno lun–vie
  return 1.00                  // horario normal
}

// ── calcQuote — punto de entrada principal ────────────────────────────────────
export interface CalcQuoteOpts {
  vehicleType?:   VehicleType
  serviceType?:   ServiceType
  vehicleValueRange?: VehicleValueRange
  tripScope?:     'local' | 'foraneo'
  asap?:          boolean
  scheduledAt?:   string  // ISO string; se usa para el multiplicador de horario
}

/**
 * Calcula el precio estimado para el cliente en MXN.
 *
 * Fórmula:
 *   (BASE + distancia × PER_KM) × vehículo × servicio × alcance × urgencia × horario
 *   redondeado a decenas, mínimo MIN_FARE_MXN
 */
export function calcQuote(distanceKm: number, opts?: CalcQuoteOpts): number {
  if (distanceKm <= 0) return 0

  const vehicleMult = VEHICLE_MULTIPLIERS[opts?.vehicleType  ?? 'sedan'] ?? 1.0
  const serviceMult = SERVICE_MULTIPLIERS[opts?.serviceType  ?? 'personal'] ?? 1.0
  const valueMult   = VEHICLE_VALUE_MULTIPLIERS[opts?.vehicleValueRange ?? 'hasta_200k'] ?? 1.0
  const scopeMult   = opts?.tripScope === 'foraneo' || distanceKm > 100
    ? FORANEO_SURCHARGE
    : 1.0
  const asapMult    = opts?.asap ? ASAP_SURCHARGE : 1.0
  const timeMult    = opts?.asap
    ? timeMultiplier()                   // asap → hora actual
    : timeMultiplier(opts?.scheduledAt)  // programado → hora elegida

  const raw = (BASE_FARE_MXN + distanceKm * PER_KM_MXN)
    * vehicleMult * serviceMult * valueMult * scopeMult * asapMult * timeMult

  return Math.max(Math.round(raw / 10) * 10, MIN_FARE_MXN)
}

// ── Utilidades ────────────────────────────────────────────────────────────────
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
    countrycodes: 'mx',
  })

  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: { 'User-Agent': 'RuumRuum/1.0 (contacto@ruumruum.com)' },
      cache: 'no-store',
    },
  )

  if (!res.ok) throw new Error(`Nominatim error ${res.status}`)

  const data = await res.json() as Array<{ lon: string; lat: string }>
  if (!data.length) throw new Error(`No se encontró la dirección: "${address}"`)

  return [parseFloat(data[0].lon), parseFloat(data[0].lat)]
}

// ─── Distancia por carretera: OpenRouteService (primario) ─────────────────────
async function distanceViaORS(
  originCoords: [number, number],
  destCoords: [number, number],
): Promise<number> {
  const apiKey = process.env.ORS_API_KEY
  if (!apiKey) throw new Error('ORS_API_KEY no configurada')

  const res = await fetch(
    'https://api.openrouteservice.org/v2/matrix/driving-car',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify({
        locations: [originCoords, destCoords],
        metrics: ['distance'],
        units: 'km',
      }),
      cache: 'no-store',
    },
  )

  if (!res.ok) throw new Error(`ORS error ${res.status}`)

  const data = await res.json() as { distances?: number[][] }
  const km = data.distances?.[0]?.[1]
  if (typeof km !== 'number' || km <= 0) throw new Error('ORS no devolvió distancia válida')

  return Math.round(km * 10) / 10
}

// ─── Distancia por carretera: OSRM público (fallback) ────────────────────────
async function distanceViaOSRM(
  originCoords: [number, number],
  destCoords: [number, number],
): Promise<number> {
  const [oLon, oLat] = originCoords
  const [dLon, dLat] = destCoords

  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${dLon},${dLat}?overview=false`,
    { cache: 'no-store' },
  )
  if (!res.ok) throw new Error(`OSRM error ${res.status}`)

  const data = await res.json() as { routes?: Array<{ distance: number }> }
  const meters = data.routes?.[0]?.distance
  if (typeof meters !== 'number' || meters <= 0) throw new Error('OSRM no devolvió ruta válida')

  return Math.round((meters / 1000) * 10) / 10
}

// ─── estimateDistance — punto de entrada público ──────────────────────────────
export async function estimateDistance(origin: string, destination: string): Promise<number> {
  if (!origin || !destination) return 0

  const [originCoords, destCoords] = await Promise.all([
    geocode(origin),
    geocode(destination),
  ])

  if (process.env.ORS_API_KEY) {
    try {
      return await distanceViaORS(originCoords, destCoords)
    } catch {
      console.warn('[pricing] ORS falló, usando OSRM como fallback')
    }
  }

  return distanceViaOSRM(originCoords, destCoords)
}