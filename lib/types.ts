// ─── lib/types.ts ─────────────────────────────────────────────────────────────
import type { TripStatus } from '@ruum/types'
export type { TripStatus } from '@ruum/types'

export type VehicleType =
  | 'sedan' | 'suv' | 'pickup' | 'van' | 'moto' | 'otro'

export type TransmissionType = 'automatica' | 'manual'

export type ServiceType =
  | 'personal' | 'empresarial' | 'agencia' | 'lote'
  | 'flotilla' | 'entrega_cliente' | 'recuperacion' | 'especial'

// Rango de valor declarado del vehículo (usado para calcular tarifa y seguro).
// Rangos en lugar de valor libre para reducir el incentivo a subdeclarar
// y evitar disputas por valuación exacta.
export type VehicleValueRange =
  | 'hasta_200k'   // Hasta $200,000
  | '200k_500k'    // $200,000 – $500,000
  | '500k_1m'      // $500,000 – $1,000,000
  | 'mas_1m'       // Más de $1,000,000

export interface Vehicle {
  id: string
  alias: string
  brand: string
  model: string
  year: number
  color: string
  plates: string
  vin?: string
  type: VehicleType
  transmission: TransmissionType
  condition: string
  photos?: string[]
  // Rango de valor declarado — opcional para compatibilidad con vehículos guardados
  valueRange?: VehicleValueRange
}

export interface Location {
  address: string
  // Campos desglosados de la dirección
  calle?: string
  numero?: string
  colonia?: string
  municipio?: string
  estado?: string
  codigoPostal?: string
  // Otros
  reference?: string
  collectionNotes?: string   // Notas / indicaciones de recolección
  lat?: number
  lng?: number
}

export interface Contact {
  name: string
  phone: string
}

export interface TripTimeline {
  step: number
  label: string
  timestamp?: string
  done: boolean
  active: boolean
}

export interface Evidence {
  type: 'inicial' | 'durante' | 'final'
  photos: string[]
  kmReading?: number
  fuelLevel?: number
  notes?: string
  timestamp?: string
}

export interface Driver {
  id: string
  name: string
  photo?: string
  certified: boolean
  rating?: number
  phone?: string
}

export interface Trip {
  id: string
  status: TripStatus
  vehicle: Vehicle
  origin: Location
  destination: Location
  originContact: Contact
  destinationContact: Contact
  scheduledAt?: string
  serviceType: ServiceType
  distanceKm: number
  priceEstimatedMXN: number
  driverAssigned?: Driver
  timeline: TripTimeline[]
  evidence: Evidence[]
  specialInstructions?: string
  createdAt: string
}

// Wizard de solicitud
export interface SolicitudDraft {
  step: number
  vehicle: Partial<Vehicle>
  origin: Partial<Location>
  destination: Partial<Location>
  originContact: Partial<Contact>
  destinationContact: Partial<Contact>
  scheduledAt?: string
  asap: boolean
  serviceType?: ServiceType
  specialInstructions?: string
  distanceKm?: number
  priceEstimatedMXN?: number
  // Alcance del traslado
  tripScope?: 'local' | 'foraneo'
  // Ventanas de tiempo
  collectionWindowStart?: string   // HH:MM
  collectionWindowEnd?: string     // HH:MM
  deliveryWindowStart?: string     // HH:MM
  deliveryWindowEnd?: string       // HH:MM
}

export interface User {
  id: string
  name: string
  phone: string
  email: string
  avatarUrl?: string
  rfc?: string
  razonSocial?: string
  country?: string | null
  state?: string | null
  address?: string | null
}

export interface ApiResponse<T> {
  ok: boolean
  data: T
  error?: string
}