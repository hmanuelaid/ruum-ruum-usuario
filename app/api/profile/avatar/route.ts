import { NextResponse } from 'next/server'
import { createApiSupabaseClient, getAuthenticatedProfile, jsonError } from '@/lib/apiAuth'
import { validateDocumentContent } from '@/lib/documentValidation'
import { enforceRateLimit } from '@/lib/rateLimit'
import { logger } from '@/lib/logger'

const DOCUMENT_BUCKET = 'documents'
const SIGNED_URL_TTL_SECONDS = 300

type AvatarRecord = {
  avatar_url: string | null
}

async function signedAvatarUrl(
  supabase: Awaited<ReturnType<typeof createApiSupabaseClient>>,
  value: string | null,
) {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value

  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(value, SIGNED_URL_TTL_SECONDS)

  if (error) {
    logger.error({ err: error.message, path: value }, 'Error signing profile avatar')
    return null
  }

  return data?.signedUrl ?? null
}

export async function GET() {
  try {
    const supabase = await createApiSupabaseClient()
    const auth = await getAuthenticatedProfile(supabase)

    if (!auth) {
      return jsonError('Sesión no autenticada.', 401)
    }

    const { data, error } = await supabase
      .from('app_users')
      .select('avatar_url')
      .eq('id', auth.profile.id)
      .maybeSingle<AvatarRecord>()

    if (error) {
      logger.error({ err: error.message, code: error.code }, 'Error loading profile avatar')
      return jsonError('No pudimos cargar tu foto de perfil.', 500)
    }

    return NextResponse.json({
      ok: true,
      data: {
        avatar_url: await signedAvatarUrl(supabase, data?.avatar_url ?? null),
      },
    })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Unexpected error in profile avatar GET')
    return jsonError('Error interno del servidor', 500)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createApiSupabaseClient()
    const auth = await getAuthenticatedProfile(supabase)

    if (!auth) {
      return jsonError('Sesión no autenticada.', 401)
    }

    const rateLimitResponse = await enforceRateLimit(request, auth.profile.id, {
      prefix: 'profile-avatar-upload',
      limit: 8,
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

    if (!validation.mimeType.startsWith('image/')) {
      return jsonError('Solo se permiten imágenes JPG, PNG o WEBP.')
    }

    const candidatePaths = [
      `user/${auth.user.id}/foto_perfil/${crypto.randomUUID()}.${validation.extension}`,
      `user/${auth.profile.id}/foto_perfil/${crypto.randomUUID()}.${validation.extension}`,
    ]

    const { data: currentProfile } = await supabase
      .from('app_users')
      .select('avatar_url')
      .eq('id', auth.profile.id)
      .maybeSingle<AvatarRecord>()

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
      logger.error({ err: uploadError.message, path }, 'Error uploading profile avatar')
      return jsonError(`No se pudo guardar la foto: ${uploadError.message}`, 500)
    }

    const { data: updatedProfile, error: updateError } = await supabase.rpc('update_user_profile', {
      profile_payload: { avatar_url: path },
    })

    if (updateError || !updatedProfile) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([path])
      logger.error({ err: updateError?.message ?? 'unknown', code: (updateError as { code?: string } | null)?.code }, 'Error saving profile avatar')
      return jsonError(updateError?.message ?? 'La foto subió, pero no se pudo guardar en tu perfil.', 400)
    }

    const previousPath = currentProfile?.avatar_url
    if (previousPath && !/^https?:\/\//i.test(previousPath) && previousPath !== path) {
      await supabase.storage.from(DOCUMENT_BUCKET).remove([previousPath])
    }

    const avatarUrl = await signedAvatarUrl(supabase, path)
    if (!avatarUrl) {
      return jsonError('La foto se guardó, pero no pudimos generar la vista previa.', 500)
    }

    return NextResponse.json({
      ok: true,
      data: {
        avatar_url: avatarUrl,
      },
    })
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Unexpected error in profile avatar POST')
    return jsonError('Error interno del servidor', 500)
  }
}
