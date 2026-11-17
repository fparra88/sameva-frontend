import type { LeadEmbudo } from '../../lib/tipos'

/** Orden del embudo (espejo de services/pipeline_estados.py). */
export const ETAPAS = ['nuevo', 'contactado', 'en_seguimiento', 'cotizado', 'negociacion', 'ganado', 'perdido'] as const
export const CERRADAS = new Set<string>(['ganado', 'perdido'])

/** Un solo tono que se intensifica al avanzar; verde y rojo quedan reservados para el cierre. */
export const TONO: Record<string, string> = {
  nuevo: 'bg-primary/30',
  contactado: 'bg-primary/45',
  en_seguimiento: 'bg-primary/60',
  cotizado: 'bg-primary/75',
  negociacion: 'bg-primary/90',
  ganado: 'bg-success',
  perdido: 'bg-danger',
}

export const abierto = (l: LeadEmbudo) => !CERRADAS.has(l.estado)
/** El cliente escribió al último y sigue sin respuesta. */
export const esperaRespuesta = (l: LeadEmbudo) => abierto(l) && l.ultimo_mensaje_rol === 'user'
export const seguimientoVencido = (l: LeadEmbudo) =>
  abierto(l) && l.proximo_seguimiento !== null && new Date(l.proximo_seguimiento).getTime() < Date.now()
export const diasEnEtapa = (l: LeadEmbudo) =>
  l.etapa_desde ? Math.max(0, Math.floor((Date.now() - new Date(l.etapa_desde).getTime()) / 86_400_000)) : null

export const nombreLead = (l: LeadEmbudo) => l.cliente_nombre ?? l.cliente_username ?? l.cliente_handle ?? 'Sin nombre'

/** Quién escribió el último mensaje, para anteponerlo a la vista previa. */
export const autorMensaje = (rol: string | null) => (rol === 'user' ? 'Cliente' : rol === 'assistant' ? 'IA' : rol ? 'Equipo' : '')

/** Horas promedio → "5 h" / "3 d". */
export const duracion = (horas: number | null) =>
  horas === null ? '—' : horas < 1 ? '< 1 h' : horas < 48 ? `${Math.round(horas)} h` : `${Math.round(horas / 24)} d`
