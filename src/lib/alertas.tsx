import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api } from './api'
import { useAuth } from './auth'
import { useEvento } from './tiempoReal'

/** Alerta tal como la entrega la API (GET /alertas/mias) y el evento `nueva_alerta` del socket. */
export interface Alerta {
  id: string
  tenant_id: string
  tipo: string
  titulo: string
  mensaje: string
  datos: Record<string, unknown> | null
  leido: boolean
  creado_en: string
  portal_user_id: string | null
}

interface AlertasCtx {
  alertas: Alerta[]
  noLeidas: number
  /** Avisos emergentes de alertas que llegaron en vivo (se quitan solos). */
  toasts: Alerta[]
  cerrarToast: (id: string) => void
  marcarLeida: (id: string) => Promise<void>
  marcarTodas: () => Promise<void>
}

const Ctx = createContext<AlertasCtx | null>(null)
const TOAST_MS = 7000
const MAX_LISTA = 50

const unicas = (lista: Alerta[]) => [...new Map(lista.map((a) => [a.id, a])).values()]
  .sort((a, b) => b.creado_en.localeCompare(a.creado_en)).slice(0, MAX_LISTA)

/**
 * Campana del portal: lista inicial por HTTP y, en vivo, los eventos del socket
 * `alertas_pendientes` (lo que se perdió sin sesión), `nueva_alerta` y `alerta_leida`
 * (otra sesión del mismo negocio la marcó). Va dentro de TiempoRealProvider.
 */
export function AlertasProvider({ children }: { children: ReactNode }) {
  const { estado, usuario } = useAuth()
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [toasts, setToasts] = useState<Alerta[]>([])
  const vistas = useRef(new Set<string>())
  const lista = useRef<Alerta[]>([])
  lista.current = alertas
  // En "ver como" las alertas se muestran pero no se tocan: marcarlas es una escritura.
  const soloLectura = Boolean(usuario?.impersonado_por)

  const contar = useCallback(() => api<{ no_leidas: number }>('/alertas/mias/no-leidas').then((r) => setNoLeidas(r.no_leidas)).catch(() => undefined), [])

  useEffect(() => {
    if (estado !== 'autenticado') return
    api<Alerta[]>(`/alertas/mias?limite=${MAX_LISTA}`).then((l) => { l.forEach((a) => vistas.current.add(a.id)); setAlertas((prev) => unicas([...prev, ...l])) }).catch(() => undefined)
    contar()
  }, [estado, contar])

  // Se pierden eventos mientras la pestaña está dormida: al volver se recalcula el contador.
  useEffect(() => {
    const h = () => { if (document.visibilityState === 'visible' && estado === 'autenticado') contar() }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [estado, contar])

  // El contador va en el título de la pestaña; al salir del portal se devuelve el título original.
  const tituloBase = useRef(document.title)
  useEffect(() => { document.title = noLeidas > 0 ? `(${noLeidas}) ${tituloBase.current}` : tituloBase.current }, [noLeidas])
  useEffect(() => { const t = tituloBase.current; return () => { document.title = t } }, [])

  const cerrarToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  useEvento<Alerta>('nueva_alerta', (a) => {
    if (vistas.current.has(a.id)) return
    vistas.current.add(a.id)
    setAlertas((prev) => unicas([a, ...prev]))
    if (!a.leido) setNoLeidas((n) => n + 1)
    setToasts((t) => [a, ...t].slice(0, 3))
    setTimeout(() => cerrarToast(a.id), TOAST_MS)
  })
  // Al conectar, el servidor manda las últimas sin leer: se suman sin avisar de nuevo.
  useEvento<Alerta[]>('alertas_pendientes', (l) => {
    const nuevas = l.filter((a) => !vistas.current.has(a.id))
    nuevas.forEach((a) => vistas.current.add(a.id))
    if (nuevas.length) setAlertas((prev) => unicas([...prev, ...nuevas]))
    contar()
  })
  useEvento<{ alerta_id: string }>('alerta_leida', ({ alerta_id }) => {
    const estaba = lista.current.find((a) => a.id === alerta_id)
    setAlertas((prev) => prev.map((a) => (a.id === alerta_id ? { ...a, leido: true } : a)))
    if (estaba && !estaba.leido) setNoLeidas((n) => Math.max(0, n - 1))
    else if (!estaba) contar()
  })

  const marcarLeida = useCallback(async (id: string) => {
    if (soloLectura) return
    const antes = lista.current.find((a) => a.id === id)
    if (!antes || antes.leido) return
    setAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, leido: true } : a)))
    setNoLeidas((n) => Math.max(0, n - 1))
    try { await api(`/alertas/${id}/marcar-leida`, { method: 'PATCH' }) }
    catch {
      // Falló: se deshace para no mentirle al usuario sobre lo que tiene pendiente.
      setAlertas((prev) => prev.map((a) => (a.id === id ? { ...a, leido: false } : a)))
      contar()
    }
  }, [soloLectura, contar])

  const marcarTodas = useCallback(async () => {
    if (soloLectura) return
    try {
      await api('/alertas/mias/marcar-todas-leidas', { method: 'PATCH' })
      setAlertas((prev) => prev.map((a) => ({ ...a, leido: true })))
      setNoLeidas(0)
    } catch { contar() }
  }, [soloLectura, contar])

  const valor = useMemo(() => ({ alertas, noLeidas, toasts, cerrarToast, marcarLeida, marcarTodas }), [alertas, noLeidas, toasts, cerrarToast, marcarLeida, marcarTodas])
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useAlertas() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAlertas fuera de <AlertasProvider>')
  return c
}

/** A dónde lleva una alerta al abrirla. */
export function destinoAlerta(a: Pick<Alerta, 'tipo' | 'datos'>): string | null {
  const d = a.datos ?? {}
  const conv = (d.conversation_id ?? d.conversacion_id) as string | undefined
  switch (a.tipo) {
    case 'nuevo_lead': case 'cambio_etapa': case 'cierre': case 'sin_actividad': case 'lead_asignado':
    case 'conversacion_transferida': case 'conversacion_asignada': case 'mensaje_conversacion_asignada':
    case 'conversacion_tomada': case 'conversacion_liberada': case 'conversacion_devuelta_ia': case 'asignacion_fallida':
      return conv ? `/portal/bandeja/${conv}` : '/portal/bandeja'
    case 'reserva_creada': case 'reserva_cancelada': case 'agenda_reprogramada': case 'aviso_cita_no_enviado':
    case 'avisos_cita_oferta_rechazada': case 'avisos_cita_plantilla_inutilizable':
      return '/portal/agenda'
    case 'numeros_pausados': case 'numeros_recortados': return '/portal/canales'
    case 'numero_configuracion_incompleta': return '/portal/agente'
    case 'perfil_incompleto': return '/portal/cuenta'
    case 'solicitud_escritura': return '/portal/cuenta?vista=soporte'
    case 'cuota_excedida': return '/portal/cuenta?vista=suscripcion'
    default: return null
  }
}
