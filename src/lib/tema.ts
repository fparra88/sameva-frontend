import { useSyncExternalStore } from 'react'

export type Tema = 'light' | 'dark'
const CLAVE = 'operativai_tema'
const oyentes = new Set<() => void>()

const leer = (): Tema => {
  try {
    const g = localStorage.getItem(CLAVE)
    if (g === 'light' || g === 'dark') return g
  } catch { /* sin acceso a localStorage */ }
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function guardarTema(t: Tema) {
  try { localStorage.setItem(CLAVE, t) } catch { /* ignorar */ }
  oyentes.forEach((f) => f())
}

/** Tema del portal (claro/oscuro). Se guarda solo en este navegador. */
export function useTema(): Tema {
  return useSyncExternalStore((f) => { oyentes.add(f); return () => { oyentes.delete(f) } }, leer, () => 'light')
}
