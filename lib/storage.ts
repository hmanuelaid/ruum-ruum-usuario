// lib/storage.ts
import { createClient } from './supabase'
import {
  ACCEPTED_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_MB,
  validateDocumentMetadata,
} from './documentValidation'

export const ACCEPTED_TYPES = [...ACCEPTED_DOCUMENT_TYPES]
export const MAX_SIZE_MB = MAX_DOCUMENT_SIZE_MB
export const MAX_SIZE_BYTES = MAX_DOCUMENT_SIZE_BYTES

export function validateFile(file: File): string | null {
  return validateDocumentMetadata(file)
}

export function getPreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

export async function uploadDocument(params: {
  file: File
  ownerId: string
  ownerType: 'user' | 'driver'
  docType: string
}): Promise<{
  document: {
    id: string
    status: string
    storagePath: string
    mimeType: string
  }
  fileSize: number
  mimeType: string
  path: string
  signedUrl?: string
} | { error: string }> {
  const { file, ownerType, docType } = params
  const formData = new FormData()
  formData.append('file', file)
  formData.append('ownerType', ownerType)
  formData.append('docType', docType)

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json().catch(() => null) as {
    ok?: boolean
    data?: {
      document: {
        id: string
        status: string
        storagePath: string
        mimeType: string
      }
      fileSize: number
      mimeType: string
      path: string
      signedUrl?: string
    }
    error?: string
  } | null

  if (!response.ok || !payload?.ok || !payload.data) {
    return { error: payload?.error ?? 'No se pudo subir el documento.' }
  }

  return payload.data
}

export async function uploadEvidence(params: {
  file: File
  tripId: string
  type: 'inicial' | 'final' | 'durante'
  index: number
}): Promise<{ url: string; path: string } | { error: string }> {
  const { file, tripId, type, index } = params
  const supabase = createClient()

  const ext  = file.name.split('.').pop()
  const path = `${tripId}/${type}_${index}_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('evidence')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) return { error: error.message }

  const { data } = supabase.storage.from('evidence').getPublicUrl(path)
  return { url: data.publicUrl, path }
}
