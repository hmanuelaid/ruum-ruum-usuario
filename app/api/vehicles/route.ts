import { NextResponse } from 'next/server'
import type { Vehicle, ApiResponse } from '@/lib/types'

let vehicles: Vehicle[] = [
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

export async function GET() {
  const res: ApiResponse<Vehicle[]> = { ok: true, data: vehicles }
  return NextResponse.json(res)
}

export async function POST(req: Request) {
  const body = await req.json()
  const newVehicle: Vehicle = { ...body, id: 'veh_' + Date.now() }
  vehicles.push(newVehicle)
  return NextResponse.json({ ok: true, data: newVehicle })
}

export async function DELETE(req: Request) {
  const { id } = await req.json()
  vehicles = vehicles.filter(v => v.id !== id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  vehicles = vehicles.map(v => v.id === body.id ? { ...v, ...body } : v)
  return NextResponse.json({ ok: true, data: body })
}