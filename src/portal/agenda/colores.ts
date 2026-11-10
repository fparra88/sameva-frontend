import type { EstadoReserva } from '../../lib/tipos'

export const ESTADO: Record<EstadoReserva, { etiqueta: string; tono: 'ok' | 'aviso' | 'info' | 'gris' }> = {
  confirmada: { etiqueta: 'Confirmada', tono: 'info' },
  completada: { etiqueta: 'Completada', tono: 'ok' },
  no_asistio: { etiqueta: 'No asistió', tono: 'aviso' },
  cancelada: { etiqueta: 'Cancelada', tono: 'gris' },
}
