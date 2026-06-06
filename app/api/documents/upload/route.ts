import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { validateDocumentContent } from '@/lib/documentValidation'
import { enforceRateLimit } from '@/lib/rateLimit'

const DOCUMENT_BUCKET = 'documents'
const SIGNED_URL_TTL_SECONDS = 300
const ALLOWED_USER_DOC_TYPES = new Set(['ine', 'comprobante', 'foto_perfil'])

type AppUserProfile = {
  id: string
  name: string
  email: string | null
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
    .select('id, name, email')
    .eq('auth_id', user.id)
    .maybeSingle<AppUserProfile>()

  return profile
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const profile = await getAuthenticatedProfile(supabase)

  if (!profile) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const rateLimitResponse = await enforceRateLimit(request, profile.id, {
    prefix: 'document-upload',
    limit: 6,
    window: '10 m',
  })
  if (rateLimitResponse) return rateLimitResponse

  const formData = await request.formData()
  const file = formData.get('file')
  const ownerType = String(formData.get('ownerType') ?? '')
  const docType = String(formData.get('docType') ?? '')

  if (ownerType !== 'user') {
    return jsonError('Tipo de propietario no permitido.', 403)
  }

  if (!ALLOWED_USER_DOC_TYPES.has(docType)) {
    return jsonError('Tipo de documento no permitido.')
  }

  if (!(file instanceof File)) {
    return jsonError('Archivo requerido.')
  }

  const validation = await validateDocumentContent(file)
  if ('error' in validation) {
    return jsonError(validation.error)
  }

  const now = new Date().toISOString()
  const path = `user/${profile.id}/${docType}/${crypto.randomUUID()}.${validation.extension}`

  const { data: existing, error: existingError } = await supabase
    .from('documents')
    .select('id, storage_path')
    .eq('owner_id', profile.id)
    .eq('owner_type', 'user')
    .eq('type', docType)
    .maybeSingle<{ id: string; storage_path: string | null }>()

  if (existingError) {
    return jsonError(`No se pudo consultar el documento: ${existingError.message}`, 500)
  }

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, {
      contentType: validation.mimeType,
      upsert: false,
    })

  if (uploadError) {
    return jsonError(`No se pudo guardar el archivo privado: ${uploadError.message}`, 500)
  }

  const documentPayload = {
    owner_id: profile.id,
    owner_type: 'user',
    owner_name: profile.name,
    type: docType,
    status: 'en_revision',
    url: null,
    storage_path: path,
    mime_type: validation.mimeType,
    file_size: file.size,
    scan_status: 'pending',
    content_validated_at: now,
    uploaded_at: now,
    updated_at: now,
  }

  const query = existing
    ? supabase
      .from('documents')
      .update(documentPayload)
      .eq('id', existing.id)
      .select('id, status, storage_path, mime_type, file_size, scan_status')
      .single()
    : supabase
      .from('documents')
      .insert(documentPayload)
      .select('id, status, storage_path, mime_type, file_size, scan_status')
      .single()

  const { data: document, error: documentError } = await query

  if (documentError) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([path])
    return jsonError(`El archivo subio, pero no se registro para revision: ${documentError.message}`, 500)
  }

  if (existing?.storage_path && existing.storage_path !== path) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([existing.storage_path])
  }

  const { data: signedData } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  return NextResponse.json({
    ok: true,
    data: {
      document: {
        id: document.id,
        status: document.status,
        storagePath: document.storage_path,
        mimeType: document.mime_type,
      },
      fileSize: document.file_size,
      mimeType: document.mime_type,
      path,
      signedUrl: signedData?.signedUrl,
    },
  })
}
