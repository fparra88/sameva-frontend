export const nombreContacto = (c: { usuario_nombre: string | null; usuario_username?: string | null; usuario_handle: string | null }) =>
  c.usuario_nombre ?? c.usuario_username ?? c.usuario_handle ?? 'Sin nombre'

export const iniciales = (nombre: string) =>
  nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?'

export function hace(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'ahora'
  if (min < 60) return `${min} min`
  if (min < 1440) return `${Math.round(min / 60)} h`
  return `${Math.round(min / 1440)} d`
}

export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

export const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })

export const dinero = (v: string | number | null) =>
  v === null || v === '' ? '' : Number(v).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

/** `datetime-local` (hora local) ↔ ISO. */
export const aInputLocal = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export const etiquetaEtapa = (e: string) => e.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

// ---------- Fechas del calendario (hora local del navegador) ----------

export function fechaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00`)
  d.setDate(d.getDate() + dias)
  return fechaLocal(d)
}

/** "2026-01-05" → "lunes 5 de enero". */
export function fechaLegible(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00`)
  return Number.isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** "HH:MM:SS" | "HH:MM" → minutos desde medianoche. */
export const aMinutos = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b }
export const deMinutos = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
export const minutosDelDia = (iso: string) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes() }
/** Fecha local ("2026-01-05") + "HH:MM" → ISO UTC para la API. */
export const aIso = (fecha: string, hhmm: string) => new Date(`${fecha}T${hhmm}:00`).toISOString()

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export const pesos = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === '' ? '—' : Number(v).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
