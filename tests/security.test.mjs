import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

test('dependency policy keeps vulnerable and unused packages out', () => {
  const pkg = JSON.parse(read('package.json'))

  assert.equal(pkg.dependencies.cloudinary, undefined)
  assert.equal(pkg.overrides.postcss, '8.5.10')
  assert.match(pkg.scripts.test, /node --test/)
  assert.match(pkg.scripts['audit:security'], /npm audit/)
})

test('private user routes are protected by the Supabase server guard', () => {
  const proxy = read('proxy.ts')

  assert.match(proxy, /supabase\.auth\.getUser\(\)/)
  assert.match(proxy, /NextResponse\.redirect\(loginUrl\)/)
  assert.match(proxy, /\/inicio\/:path\*/)
  assert.match(proxy, /\/solicitar\/:path\*/)
  assert.match(proxy, /\/cuenta\/:path\*/)
})

test('onboarding signup does not use SMS verification or store passwords', () => {
  const registration = read('app/onboarding/registro/page.tsx')
  const verificationPath = path.join(root, 'app/onboarding/verificacion/page.tsx')

  assert.equal(existsSync(verificationPath), false)
  assert.match(registration, /signUp/)
  assert.doesNotMatch(registration, /signInWithOtp|verifyOtp|channel:\s*['"]sms['"]|type:\s*['"]sms['"]/)
  assert.doesNotMatch(registration, /onboarding\/verificacion/)
  assert.doesNotMatch(registration, /reg_password|password.*sessionStorage|sessionStorage.*password|sessionStorage/i)
})

test('document uploads stay private and require server validation', () => {
  const uploadRoute = read('app/api/documents/upload/route.ts')
  const signedUrlRoute = read('app/api/documents/signed-url/route.ts')
  const storage = read('lib/storage.ts')

  assert.match(uploadRoute, /validateDocumentContent/)
  assert.match(uploadRoute, /supabase\.auth\.getUser\(\)/)
  assert.match(uploadRoute, /createSignedUrl/)
  assert.match(signedUrlRoute, /createSignedUrl/)
  assert.match(storage, /\/api\/documents\/upload/)
  assert.doesNotMatch(uploadRoute, /getPublicUrl/)
  assert.doesNotMatch(uploadRoute, /url:\s*null/)
})

test('trip creation validates payloads and uses the atomic RPC', () => {
  const requestRoute = read('app/api/trips/request/route.ts')
  const reviewStep = read('components/solicitud/ReviewStep.tsx')
  const migration = read('supabase/migrations/20260601002000_secure_trip_request_creation.sql')

  assert.match(requestRoute, /validateTripRequestPayload/)
  assert.match(requestRoute, /rpc\('create_trip_request'/)
  assert.doesNotMatch(reviewStep, /\.from\('trips'\)/)
  assert.doesNotMatch(reviewStep, /\.from\('trip_timeline'\)/)
  assert.doesNotMatch(reviewStep, /\.from\('payments'\)/)
  assert.match(migration, /create or replace function public\.create_trip_request/)
  assert.match(migration, /rr_normalize_phone/)
  assert.match(migration, /insert into public\.trips/)
  assert.match(migration, /insert into public\.trip_timeline/)
  assert.match(migration, /insert into public\.payments/)
})

test('sensitive mutation endpoints enforce rate limits', () => {
  const rateLimit = read('lib/rateLimit.ts')
  const tripRequestRoute = read('app/api/trips/request/route.ts')
  const uploadRoute = read('app/api/documents/upload/route.ts')

  assert.match(rateLimit, /@upstash\/ratelimit/)
  assert.match(rateLimit, /UPSTASH_REDIS_REST_URL/)
  assert.match(rateLimit, /UPSTASH_REDIS_REST_TOKEN/)
  assert.match(rateLimit, /x-forwarded-for/)
  assert.match(rateLimit, /NextResponse\.json\([\s\S]*status:\s*429/)
  assert.match(tripRequestRoute, /enforceRateLimit\(request,\s*user\.id/)
  assert.match(uploadRoute, /enforceRateLimit\(request,\s*profile\.id/)
})
