import { NextResponse } from 'next/server'
import { createApiSupabaseClient, getAuthenticatedProfile, jsonError } from '@/lib/apiAuth'
import { validateDocumentContent } from '@/lib/documentValidation'
import { enforceRateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

const DOCUMENT_BUCKET = 'documents'
const SIGNED_URL_TTL_SECONDS = 300

type BillingRecord = {
  constancia_sat_url: string | null
  constancia_sat_name: string | null
}

export async function POST(request: Request) {
  try {
    const supabase = await createApiSupabaseClient()
    const auth = await getAuthenticatedProfile(supabase)

    if (!auth) {
      return jsonError('Sesión no autenticada.', 401)
    }

    const rateLimitResponse = await enforceRateLimit(request, auth.profile.id, {
      prefix: 'billing-constancia-upload',
      limit: 6,
      window: '10 m',
    })
    if (rateLimitResponse) return rateLimitResponse

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return jsonError('Archivo requerido.')
    }

    const validation = await validateDocumentContent(file)
    if ('error' in validation) {
      return jsonError(validation.error)
    }

    const candidatePaths = [
      `user/${auth.user.id}/constancia-fiscal/${crypto.randomUUID()}.${validation.extension}`,
      `user/${auth.profile.id}/constancia-fiscal/${crypto.randomUUID()}.${validation.extension}`,
      `user/${auth.user.id}/comprobante/${crypto.randomUUID()}.${validation.extension}`,
      `user/${auth.profile.id}/comprobante/${crypto.randomUUID()}.${validation.extension}`,
    ]

    const { data: currentProfile } = await supabase
      .from('app_users')
      .select('constancia_sat_url, constancia_sat_name')
      .eq('id', auth.profile.id)
      .maybeSingle<BillingRecord>()

    let path = candidatePaths[0]
    let uploadError: { message: string } | null = null

    for (const candidatePath of candidatePaths) {
      const { error } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(candidatePath, file, {
          contentType: validation.mimeType,
          upsert: false,
        })

      if (!error) {
        path = candidatePath
        uploadError = null
        break
      }

      uploadError = error
    }

    if (uploadError) {
      logger.error({ err: uploadError.message, path }, 'Error uploading billing constancia')
      return jsonError(`No se pudo guardar la constancia: ${uploadError.message}`, 500)
    }

    const { data: updatedProfile, error: updateError } = await supabase.rpc('update_billing_profile', {
      billing_payload: {
        constancia_sat_url: path,
        constancia_sat_name: file.name,
      },
    })

    if (updateError || !updatedProfile) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([path])
      logger.error({ err: updateError?.message ?? 'unknown', code: (updateError as { code?: string } | null)?.code }, 'Error saving billing constancia')
      return jsonError(updateError?.message ?? 'La constancia subió, pero no se pudo guardar en tu perfil.', 400)
    }

    const previousPath = currentProfile?.constancia_sat_url
    if (previousPath && !/^https?:\/\//i.test(previousPath) && previousPath !== path) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([previousPath])
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

    if (signedError || !signedData?.signedUrl) {
      logger.error({ err: signedError?.message ?? 'sin URL', path }, 'Error signing billing constancia')
      return jsonError('La constancia se guardó, pero no pudimos generar la vista previa.', 500)
    }

    return NextResponse.json({
      ok: true,
      data: {
        constancia_sat_url: signedData.signedUrl,
        constancia_sat_name: file.name,
        mime_type: validation.mimeType,
      },
    })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Unexpected error in billing constancia POST')
    return jsonError('Error interno del servidor', 500)
  }
}
