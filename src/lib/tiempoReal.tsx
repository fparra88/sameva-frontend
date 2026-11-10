import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { getAccessToken } from './api'
import { useAuth } from './auth'

/**
 * Socket.IO de la API (/socket.io). Eventos que usa la Bandeja:
 *  - mensaje_nuevo            { conversation_id, ...mensaje }
 *  - conversacion_actualizada { conversation_id, status, asignado_a }
 *  - datos_actualizados       { recurso }  (p. ej. "conversaciones", "agenda")
 */
const Ctx = createContext<Socket | null>(null)
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '') || undefined

export function TiempoRealProvider({ children }: { children: ReactNode }) {
  const { estado } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (estado !== 'autenticado') return
    // `auth` como función: cada reconexión manda el access token vigente.
    const s = io(BASE, { path: '/socket.io', transports: ['websocket'], auth: (cb) => cb({ token: getAccessToken() }) })
    setSocket(s)
    return () => { s.disconnect(); setSocket(null) }
  }, [estado])

  return <Ctx.Provider value={socket}>{children}</Ctx.Provider>
}

/** Suscribe `fn` a un evento mientras el componente esté montado. */
export function useEvento<T = unknown>(evento: string, fn: (datos: T) => void) {
  const socket = useContext(Ctx)
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    if (!socket) return
    const h = (d: T) => ref.current(d)
    socket.on(evento, h)
    return () => { socket.off(evento, h) }
  }, [socket, evento])
}
