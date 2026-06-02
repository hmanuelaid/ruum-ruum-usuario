// lib/useDocuments.ts
'use client'
import { useEffect, useState } from 'react'
import { createClient } from './supabase'
import type { DocStatus, DocumentItem } from '@/components/ui/DocumentUploader'

type DocumentRecord = {
  id?: string
  type?: string
  status?: DocStatus
  storage_path?: string | null
  mime_type?: string | null
  notes?: string | null
}

async function getSignedDocumentUrl(documentId: string) {
  const response = await fetch(`/api/documents/signed-url?documentId=${encodeURIComponent(documentId)}`)
  const payload = await response.json().catch(() => null) as {
    ok?: boolean
    data?: {
      signedUrl?: string
    }
  } | null

  if (!response.ok || !payload?.ok) return undefined
  return payload.data?.signedUrl
}

export function useDocuments(ownerId: string | null, docTypes: { docType: string; label: string; required: boolean }[]) {
  const [docs, setDocs] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(Boolean(ownerId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ownerId) {
      queueMicrotask(() => {
        setDocs([])
        setLoading(false)
        setError('')
      })
      return
    }

    const supabase = createClient()
    let cancelled = false

    async function loadDocuments() {
      setLoading(true)
      setError('')

      const { data, error: documentsError } = await supabase
        .from('documents')
        .select('id, type, status, storage_path, mime_type, notes')
        .eq('owner_id', ownerId)

      if (documentsError) {
        if (!cancelled) {
          setDocs([])
          setError(`No pudimos cargar tus documentos: ${documentsError.message}`)
          setLoading(false)
        }
        return
      }

      const merged = await Promise.all(docTypes.map(async dt => {
        const found = data?.find(d => d.type === dt.docType) as DocumentRecord | undefined
        const previewUrl = found?.id && found.storage_path
          ? await getSignedDocumentUrl(found.id)
          : undefined

        return {
          id: found?.id,
          docType: dt.docType,
          label: dt.label,
          required: dt.required,
          status: (found?.status ?? 'pendiente_carga') as DocStatus,
          previewUrl,
          storagePath: found?.storage_path ?? undefined,
          mimeType: found?.mime_type ?? undefined,
          notes: found?.notes ?? undefined,
        }
      }))

      if (!cancelled) {
        setDocs(merged)
        setLoading(false)
      }
    }

    loadDocuments()

    const channel = supabase
      .channel(`documents:${ownerId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'documents',
        filter: `owner_id=eq.${ownerId}`,
      }, async payload => {
        const updated = payload.new as DocumentRecord
        const previewUrl = updated.id && updated.storage_path
          ? await getSignedDocumentUrl(updated.id)
          : undefined

        setDocs(prev => prev.map(d => {
          if (d.docType === updated.type) {
            return {
              ...d,
              status: updated.status ?? d.status,
              previewUrl,
              storagePath: updated.storage_path ?? undefined,
              mimeType: updated.mime_type ?? undefined,
              notes: updated.notes ?? undefined,
            }
          }

          return d
        }))
      })
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [docTypes, ownerId])

  function updateDoc(updated: DocumentItem) {
    setDocs(prev => prev.map(d => d.docType === updated.docType ? updated : d))
  }

  return { docs, loading, error, updateDoc }
}
