export function Chip({
  children,
  variant = 'default',
  status,
}: {
  children?: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'accent'
  status?: string
}) {
  const map: Record<string, string> = {
    traslado_curso:      'accent',
    conductor_asignado:  'primary',
    finalizado:          'success',
    cancelado:           'danger',
    en_revision:         'warning',
    solicitud_recibida:  'default',
    en_camino_origen:    'primary',
    recoleccion_proceso: 'warning',
    vehiculo_documentado:'accent',
    llegando_destino:    'accent',
    entrega_proceso:     'warning',
    incidente:           'danger',
  }
  const v = status ? (map[status] ?? 'default') : variant
  return <span className={`chip chip-${v}`}>{children}</span>
}