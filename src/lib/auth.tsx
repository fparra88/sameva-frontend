import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, enModoSoporte, onSesionExpirada, refrescarSesion, setAccessToken, setModoSoporte, type TokenOut, type UsuarioOut } from './api'

/** Marca de pestaña (no guarda el token): una recarga no debe caer en la sesión real del gerente. */
const CLAVE_SOPORTE = 'operativai_soporte'

type Estado = 'cargando' | 'autenticado' | 'anonimo'

interface AuthCtx {
  estado: Estado
  usuario: UsuarioOut | null
  entrar: (email: string, password: string) => Promise<void>
  /** Para /auth/verificar y otros flujos que ya devuelven TokenOut. */
  iniciarConToken: (t: TokenOut) => Promise<void>
  /** Sesión de "ver como" con el token corto que entrega /gerencia/tenants/{id}/impersonar. */
  iniciarSoporte: (token: string) => Promise<void>
  salir: () => Promise<void>
  /** Vuelve a pedir /auth/yo (p. ej. tras guardar el perfil). */
  recargarUsuario: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('cargando')
  const [usuario, setUsuario] = useState<UsuarioOut | null>(null)

  const cargarUsuario = useCallback(async () => {
    const yo = await api<UsuarioOut>('/auth/yo')
    setUsuario(yo)
    setEstado('autenticado')
  }, [])

  // Pestaña de soporte: el token llega por postMessage, nunca se refresca con la cookie del gerente.
  const iniciarSoporte = useCallback(async (token: string) => {
    sessionStorage.setItem(CLAVE_SOPORTE, '1')
    setModoSoporte(true)
    setAccessToken(token)
    await cargarUsuario()
  }, [cargarUsuario])

  // Al abrir la página: si hay cookie de refresh vigente, la sesión sigue.
  useEffect(() => {
    onSesionExpirada(() => { setUsuario(null); setEstado('anonimo') })
    // En una pestaña de soporte (o recargada desde una) no se usa la cookie: sería la sesión del gerente.
    if (window.location.pathname.startsWith('/soporte') || sessionStorage.getItem(CLAVE_SOPORTE)) {
      setModoSoporte(true)
      setEstado('anonimo')
      return
    }
    refrescarSesion()
      .then((ok) => (ok ? cargarUsuario() : setEstado('anonimo')))
      .catch(() => setEstado('anonimo'))
  }, [cargarUsuario])

  const iniciarConToken = useCallback(async (t: TokenOut) => {
    setAccessToken(t.access_token)
    await cargarUsuario()
  }, [cargarUsuario])

  const entrar = useCallback(async (email: string, password: string) => {
    const t = await api<TokenOut>('/auth/login', { method: 'POST', auth: false, body: { email, password } })
    await iniciarConToken(t)
  }, [iniciarConToken])

  const salir = useCallback(async () => {
    // En soporte NO se llama a /auth/logout: cerraría la sesión real del gerente.
    if (!enModoSoporte()) await api('/auth/logout', { method: 'POST', auth: false }).catch(() => undefined)
    setAccessToken(null)
    setUsuario(null)
    setEstado('anonimo')
  }, [])

  const valor = useMemo(
    () => ({ estado, usuario, entrar, iniciarConToken, iniciarSoporte, salir, recargarUsuario: cargarUsuario }),
    [estado, usuario, entrar, iniciarConToken, iniciarSoporte, salir, cargarUsuario],
  )
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth fuera de <AuthProvider>')
  return c
}
