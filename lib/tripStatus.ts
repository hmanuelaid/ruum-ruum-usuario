// ─── lib/tripStatus.ts ────────────────────────────────────────────────────────
// Fuente única de verdad para etiquetas y agrupaciones de estado de viaje.
// Antes estaban duplicadas en app/(user)/inicio/page.tsx y viajes/page.tsx.

export const STATUS_LABELS: Record<string, string> = {
  solicitud_recibida:           'Solicitud recibida',
  pendiente_revision:           'En revisión',
  pendiente_asignacion:         'Sin conductor',
  conductor_asignado:           'Conductor asignado',
  conductor_en_camino:          'En camino',
  recoleccion_proceso:          'Recolección',
  evidencia_inicial_pendiente:  'Ev. inicial',
  traslado_curso:               'En curso',
  entrega_proceso:              'Entrega',
  evidencia_final_pendiente:    'Ev. final',
  finalizado:                   'Finalizado',
  cancelado:                    'Cancelado',
  incidente:                    'Incidente',
}

export const ACTIVE_STATUSES: string[] = [
  'solicitud_recibida',
  'pendiente_revision',
  'pendiente_asignacion',
  'conductor_asignado',
  'conductor_en_camino',
  'recoleccion_proceso',
  'evidencia_inicial_pendiente',
  'traslado_curso',
  'entrega_proceso',
  'evidencia_final_pendiente',
  'incidente',
]