import { NextResponse } from 'next/server'

export interface Notification {
  id: string
  title: string
  body: string
  type: 'trip' | 'evidence' | 'payment' | 'info'
  read: boolean
  timestamp: string
}

let notifications: Notification[] = [
  {
    id: 'n_001',
    title: 'Conductor asignado',
    body: 'Roberto Sánchez fue asignado a tu traslado RR-2024-001.',
    type: 'trip',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'n_002',
    title: 'Evidencia inicial disponible',
    body: 'Ya puedes ver las fotos iniciales de tu Toyota Hilux.',
    type: 'evidence',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'n_003',
    title: 'Traslado en curso',
    body: 'Tu vehículo está en camino a Cancún, QR.',
    type: 'trip',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'n_004',
    title: 'Solicitud recibida',
    body: 'Recibimos tu solicitud de traslado RR-2024-001.',
    type: 'trip',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
]

export async function GET() {
  return NextResponse.json({ ok: true, data: notifications })
}

export async function PATCH(req: Request) {
  const { id } = await req.json()
  notifications = notifications.map(n =>
    n.id === id ? { ...n, read: true } : n
  )
  return NextResponse.json({ ok: true })
}