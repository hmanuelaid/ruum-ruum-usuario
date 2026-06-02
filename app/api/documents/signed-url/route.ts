import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const DOCUMENT_BUCKET = 'documents'
const SIGNED_URL_TTL_SECONDS = 300

type AppUserProfile = {
  id: string
}

type DocumentRecord = {
  id: string
  owner_id: string
  owner_type: string
  storage_path: string | null
  mime_type: string | null
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    },
  )
}

async function getAuthenticatedProfile(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return null

  const { data: profile } = await supabase
    .from('app_users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle<AppUserProfile>()

  return profile
}

export async function GET(request: NextRequest) {
  const documentId = request.nextUrl.searchParams.get('documentId')

  if (!documentId) {
    return jsonError('documentId requerido.')
  }

  const supabase = await createSupabaseServerClient()
  const profile = await getAuthenticatedProfile(supabase)

  if (!profile) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, owner_id, owner_type, storage_path, mime_type')
    .eq('id', documentId)
    .maybeSingle<DocumentRecord>()

  if (documentError) {
    return jsonError(`No se pudo consultar el documento: ${documentError.message}`, 500)
  }

  if (
    !document ||
    document.owner_type !== 'user' ||
    String(document.owner_id) !== String(profile.id) ||
    !document.storage_path
  ) {
    return jsonError('Documento no encontrado.', 404)
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(document.storage_path, SIGNED_URL_TTL_SECONDS)

  if (signedError || !signedData?.signedUrl) {
    return jsonError(`No se pudo generar acceso temporal: ${signedError?.message ?? 'sin URL'}`, 500)
  }

  return NextResponse.json({
    ok: true,
    data: {
      signedUrl: signedData.signedUrl,
      expiresIn: SIGNED_URL_TTL_SECONDS,
      mimeType: document.mime_type,
    },
  })
}
