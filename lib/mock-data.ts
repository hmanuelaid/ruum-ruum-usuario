// ─── lib/mock-data.ts ─────────────────────────────────────────────────────────
import type { Trip, Vehicle, User } from './types'

export const DEMO_DATA_ENABLED = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === 'true'

const demoUser: User = {
  id: 'usr_001',
  name: 'Carlos Mendoza',
  phone: '+52 55 1234 5678',
  email: 'carlos@ejemplo.com',
}

const demoVehicles: Vehicle[] = [
  {
    id: 'veh_001',
    alias: 'Mi camioneta',
    brand: 'Toyota',
    model: 'Hilux',
    year: 2022,
    color: 'Blanco',
    plates: 'ABC-123',
    type: 'pickup',
    transmission: 'automatica',
    condition: 'Bueno',
  },
  {
    id: 'veh_002',
    alias: 'Auto de oficina',
    brand: 'Nissan',
    model: 'Sentra',
    year: 2021,
    color: 'Gris',
    plates: 'XYZ-789',
    type: 'sedan',
    transmission: 'automatica',
    condition: 'Excelente',
  },
]

export const mockUser: User = DEMO_DATA_ENABLED
  ? demoUser
  : { id: '', name: '', phone: '', email: '' }

export const mockVehicles: Vehicle[] = DEMO_DATA_ENABLED ? demoVehicles : []

export const TIMELINE_STEPS = [
  'Solicitud creada',
  'Solicitud aceptada',
  'Conductor asignado',
  'Conductor en camino',
  'Vehículo recibido',
  'Evidencia inicial',
  'Traslado iniciado',
  'Traslado en curso',
  'Vehículo en destino',
  'Evidencia final',
  'Entrega confirmada',
  'Viaje finalizado',
]

export const mockTrips: Trip[] = DEMO_DATA_ENABLED ? [
  {
    id: 'RR-2024-001',
    status: 'traslado_curso',
    vehicle: demoVehicles[0],
    origin: { address: 'Av. Insurgentes Sur 1234, CDMX', reference: 'Torre azul, entrada principal' },
    destination: { address: 'Blvd. Kukulcán Km 12, Cancún, QR', reference: 'Hotel Marriott' },
    originContact: { name: 'Carlos Mendoza', phone: '+52 55 1234 5678' },
    destinationContact: { name: 'Ana Ruiz', phone: '+52 998 765 4321' },
    scheduledAt: '2024-06-10T09:00:00',
    serviceType: 'personal',
    distanceKm: 1680,
    priceEstimatedMXN: 32200,
    driverAssigned: {
      id: 'drv_007',
      name: 'Roberto Sánchez',
      certified: true,
      rating: 4.9,
      phone: '+52 55 9876 5432',
    },
    timeline: TIMELINE_STEPS.map((label, i) => ({
      step: i + 1,
      label,
      done: i < 7,
      active: i === 7,
      timestamp: i < 7 ? `2024-06-10T${String(9 + i).padStart(2, '0')}:00:00` : undefined,
    })),
    evidence: [
      {
        type: 'inicial',
        photos: ['/mock/car-front.jpg', '/mock/car-back.jpg'],
        kmReading: 45200,
        fuelLevel: 80,
        notes: 'Sin daños visibles.',
        timestamp: '2024-06-10T09:30:00',
      },
    ],
    createdAt: '2024-06-09T18:00:00',
  },
  {
    id: 'RR-2024-002',
    status: 'finalizado',
    vehicle: demoVehicles[1],
    origin: { address: 'Periférico Sur 4000, CDMX' },
    destination: { address: 'Av. López Mateos 800, Guadalajara, JAL' },
    originContact: { name: 'Carlos Mendoza', phone: '+52 55 1234 5678' },
    destinationContact: { name: 'Luis Torres', phone: '+52 33 1111 2222' },
    serviceType: 'empresarial',
    distanceKm: 480,
    priceEstimatedMXN: 11060,
    driverAssigned: {
      id: 'drv_003',
      name: 'Miguel Ángel Flores',
      certified: true,
      rating: 4.8,
    },
    timeline: TIMELINE_STEPS.map((label, i) => ({
      step: i + 1, label, done: true, active: false,
      timestamp: `2024-05-15T${String(8 + i).padStart(2, '0')}:00:00`,
    })),
    evidence: [
      {
        type: 'inicial',
        photos: ['/mock/car-front.jpg'],
        kmReading: 32100,
        fuelLevel: 60,
        timestamp: '2024-05-15T08:30:00',
      },
      {
        type: 'final',
        photos: ['/mock/car-back.jpg'],
        kmReading: 32580,
        fuelLevel: 45,
        notes: 'Entrega sin novedad.',
        timestamp: '2024-05-15T19:00:00',
      },
    ],
    createdAt: '2024-05-14T14:00:00',
  },
] : []
