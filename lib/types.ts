// ─── lib/types.ts ─────────────────────────────────────────────────────────────

export type VehicleType =
  | 'sedan' | 'suv' | 'pickup' | 'van' | 'moto' | 'otro'

export type TransmissionType = 'automatica' | 'manual'

export type ServiceType =
  | 'personal' | 'empresarial' | 'agencia' | 'lote'
  | 'flotilla' | 'entrega_cliente' | 'recuperacion' | 'especial'

export type TripStatus =
  | 'solicitud_recibida' | 'en_revision' | 'conductor_asignado'
  | 'en_camino_origen' | 'recoleccion_proceso' | 'vehiculo_documentado'
  | 'traslado_curso' | 'llegando_destino' | 'entrega_proceso'
  | 'finalizado' | 'cancelado' | 'incidente'

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
}

export interface Location {
  address: string
  reference?: string
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
}

export interface User {
  id: string
  name: string
  phone: string
  email: string
  avatarUrl?: string
  rfc?: string
  razonSocial?: string
}

export interface ApiResponse<T> {
  ok: boolean
  data: T
  error?: string
}