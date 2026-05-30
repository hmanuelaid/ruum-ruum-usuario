import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types'

// Datos en memoria (se resetean al reiniciar el servidor)
let profile = {
  id: 'usr_001',
  name: 'Carlos Mendoza',
  phone: '+52 55 1234 5678',
  email: 'carlos@ejemplo.com',
  country: 'México',
  state: 'CDMX',
  address: '',
}

export async function GET() {
  const res: ApiResponse<typeof profile> = { ok: true, data: profile }
  return NextResponse.json(res)
}

export async function PATCH(req: Request) {
  const body = await req.json()
  profile = { ...profile, ...body }
  const res: ApiResponse<typeof profile> = { ok: true, data: profile }
  return NextResponse.json(res)
}