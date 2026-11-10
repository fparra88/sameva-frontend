import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from './api'

export interface Carga<T> {
  datos: T | null
  cargando: boolean
  error: ApiError | null
  recargar: (silencioso?: boolean) => void
}

/** GET con carga/error/recarga. `ruta` null = no pedir (p. ej. según rol o selección). */
export function useApi<T>(ruta: string | null): Carga<T> {
  const [datos, setDatos] = useState<T | null>(null)
  const [cargando, setCargando] = useState(ruta !== null)
  const [error, setError] = useState<ApiError | null>(null)
  const [n, setN] = useState(0)
  const [silencioso, setSilencioso] = useState(false)

  useEffect(() => {
    if (ruta === null) { setDatos(null); setCargando(false); setError(null); return }
    const ctrl = new AbortController()
    if (!silencioso) setCargando(true)
    api<T>(ruta, { signal: ctrl.signal })
      .then((d) => { setDatos(d); setError(null) })
      .catch((e) => {
        if ((e as Error).name === 'AbortError') return
        setError(e instanceof ApiError ? e : new ApiError(0, 'Error inesperado'))
      })
      .finally(() => { if (!ctrl.signal.aborted) setCargando(false) })
    return () => ctrl.abort()
  }, [ruta, n]) // eslint-disable-line react-hooks/exhaustive-deps

  const recargar = useCallback((s = false) => { setSilencioso(s); setN((x) => x + 1) }, [])
  return { datos, cargando, error, recargar }
}

export function useDebounce<T>(valor: T, ms: number): T {
  const [v, setV] = useState(valor)
  useEffect(() => { const t = setTimeout(() => setV(valor), ms); return () => clearTimeout(t) }, [valor, ms])
  return v
}
