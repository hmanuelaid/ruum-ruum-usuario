import { NextResponse } from 'next/server'
import { createApiSupabaseClient, getAuthenticatedProfile, jsonError } from '@/lib/apiAuth'

const DOCUMENT_BUCKET = 'documents'
const SIGNED_URL_TTL_SECONDS = 300

type DocumentRecord = {
  id: string
  type: string
  status: string
  storage_path: string | null
  mime_type: string | null
  notes: string | null
}

export async function GET() {
  const supabase = await createApiSupabaseClient()
  const auth = await getAuthenticatedProfile(supabase)

  if (!auth) {
    return jsonError('Sesion no autenticada.', 401)
  }

  const { data, error } = await supabase
    .from('documents')
    .select('id, type, status, storage_path, mime_type, notes')
    .eq('owner_id', auth.profile.id)
    .eq('owner_type', 'user')

  if (error) {
    return jsonError(`No pudimos cargar tus documentos: ${error.message}`, 500)
  }

  const documents = await Promise.all((data ?? []).map(async (document: DocumentRecord) => {
    let signedUrl: string | undefined

    if (document.storage_path) {
      const { data: signedData } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(document.storage_path, SIGNED_URL_TTL_SECONDS)

      signedUrl = signedData?.signedUrl
    }

    return {
      id: document.id,
      type: document.type,
      status: document.status,
      storagePath: document.storage_path,
      mimeType: document.mime_type,
      notes: document.notes,
      signedUrl,
    }
  }))

  return NextResponse.json({ ok: true, data: documents })
}
