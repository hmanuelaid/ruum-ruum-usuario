import type { SupabaseClient, User } from '@supabase/supabase-js'

const USER_TYPES = new Set([
  'personal',
  'empresarial',
  'agencia',
  'lote',
  'flotilla',
  'arrendadora',
  'taller',
  'aseguradora',
])

type UserRow = {
  id?: string | null
}

function normalizeType(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : null
}

function hasTrustedUserType(user: User) {
  const appMetadata = user.app_metadata ?? {}
  const type = normalizeType(appMetadata.type ?? appMetadata.role)
  if (type && USER_TYPES.has(type)) return true

  const roles = Array.isArray(appMetadata.roles) ? appMetadata.roles : []
  return roles.some(item => {
    const normalized = normalizeType(item)
    return normalized ? USER_TYPES.has(normalized) : false
  })
}

async function getAppUserProfileIdByField(
  supabase: SupabaseClient,
  field: 'auth_id' | 'email',
  value: string
) {
  const { data, error } = await supabase
    .from('app_users')
    .select('id')
    .eq(field, value)
    .maybeSingle()

  if (error) return null
  return (data as UserRow | null)?.id ?? null
}

export async function hasUserAccess(supabase: SupabaseClient, user: User) {
  if (hasTrustedUserType(user)) return true

  const profileByAuthId = await getAppUserProfileIdByField(supabase, 'auth_id', user.id)
  if (profileByAuthId) return true

  if (!user.email) return false

  const profileByEmail = await getAppUserProfileIdByField(supabase, 'email', user.email)
  return Boolean(profileByEmail)
}
