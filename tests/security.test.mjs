import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'

test('NEXT_PUBLIC_ENABLE_DEMO_DATA no puede estar activo en producción', () => {
  const inProd = process.env.NODE_ENV === 'production'
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === 'true'
  assert.ok(!(inProd && demoEnabled), 'NEXT_PUBLIC_ENABLE_DEMO_DATA=true no puede estar activo en production')
})

test('No hay ORS_API_KEY expuesta en .env.example', async () => {
  const file = path.resolve(process.cwd(), '.env.example')
  const content = await fs.promises.readFile(file, 'utf8')
  const hasExposed = /ORS_API_KEY\s*=\s*[^\s]/.test(content) && !/Provide your API key/.test(content)
  assert.strictEqual(hasExposed, false, '.env.example contiene un valor para ORS_API_KEY')
})

test('TripDetailSheet usa etiquetas centralizadas de estado', async () => {
  const file = path.resolve(process.cwd(), 'components/viajes/TripDetailSheet.tsx')
  const content = await fs.promises.readFile(file, 'utf8')

  assert.match(content, /from ['"]@\/lib\/tripStatus['"]/, 'TripDetailSheet debe importar lib/tripStatus')
  assert.doesNotMatch(content, /const\s+STATUS_LABELS\s*:/, 'No debe redefinir STATUS_LABELS localmente')
})
