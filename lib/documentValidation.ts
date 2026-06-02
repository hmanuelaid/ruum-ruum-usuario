export const ACCEPTED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const
export const MAX_DOCUMENT_SIZE_MB = 10
export const MAX_DOCUMENT_SIZE_BYTES = MAX_DOCUMENT_SIZE_MB * 1024 * 1024

export type AcceptedDocumentType = (typeof ACCEPTED_DOCUMENT_TYPES)[number]

const EXTENSIONS_BY_TYPE: Record<AcceptedDocumentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export function validateDocumentMetadata(file: File): string | null {
  if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type as AcceptedDocumentType)) {
    return 'Tipo no permitido. Usa JPG, PNG, WEBP o PDF.'
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return `El archivo supera ${MAX_DOCUMENT_SIZE_MB}MB.`
  }

  if (file.size === 0) {
    return 'El archivo esta vacio.'
  }

  return null
}

export async function validateDocumentContent(file: File): Promise<{
  extension: string
  mimeType: AcceptedDocumentType
} | { error: string }> {
  const metadataError = validateDocumentMetadata(file)
  if (metadataError) return { error: metadataError }

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const declaredType = file.type as AcceptedDocumentType

  const matchesJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const matchesPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  const matchesWebp =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  const matchesPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46

  const signatures: Record<AcceptedDocumentType, boolean> = {
    'image/jpeg': matchesJpeg,
    'image/png': matchesPng,
    'image/webp': matchesWebp,
    'application/pdf': matchesPdf,
  }

  if (!signatures[declaredType]) {
    return { error: 'El contenido del archivo no coincide con el tipo declarado.' }
  }

  return {
    extension: EXTENSIONS_BY_TYPE[declaredType],
    mimeType: declaredType,
  }
}
