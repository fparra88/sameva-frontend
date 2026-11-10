/**
 * Cliente de la API de OperativAI (zeuticamx/operativ_server).
 *
 * - El access token vive solo en memoria (nunca en localStorage).
 * - El refresh token viaja en la cookie HttpOnly `op_refresh` que la API pone
 *   en /auth/login, /auth/verificar, etc. Por eso todo va con
 *   `credentials: 'include'`.
 * - Ante un 401 se intenta UN /auth/refresh (compartido entre peticiones
 *   simultáneas) y se repite la petición.
 */
const BASE = `${(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api`

let accessToken: string | null = null
let refreshEnCurso: Promise<boolean> | null = null
let alCerrarSesion: (() => void) | null = null

// Sesión de soporte ("ver como"): el token es de vida corta y no tiene refresh. Si se intentara refrescar,
// la cookie del gerente lo cambiaría por SU sesión y se vería su negocio en vez del que se está revisando.
let modoSoporte = false
export const setModoSoporte = (v: boolean) => { modoSoporte = v }
export const enModoSoporte = () => modoSoporte

export const setAccessToken = (t: string | null) => { accessToken = t }
export const getAccessToken = () => accessToken
export const onSesionExpirada = (fn: () => void) => { alCerrarSesion = fn }

export class ApiError extends Error {
  status: number
  retryAfter?: number
  constructor(status: number, message: string, retryAfter?: number) {
    super(message)
    this.status = status
    this.retryAfter = retryAfter
  }
}

export interface TokenOut { access_token: string; refresh_token: string | null; token_type: 'bearer' }

/** FastAPI manda `detail` como texto o como lista de errores de validación. */
function mensajeDeError(cuerpo: unknown, status: number): string {
  const detail = (cuerpo as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  // Errores con código (p. ej. cupo de pruebas del agente): { codigo, mensaje }.
  if (detail && typeof detail === 'object' && !Array.isArray(detail) && typeof (detail as { mensaje?: unknown }).mensaje === 'string') {
    return (detail as { mensaje: string }).mensaje
  }
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d: { msg?: string }) => (d.msg ?? '').replace(/^Value error, /, '')).join('. ')
  }
  if (status === 0) return 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
  if (status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.'
  return 'No se pudo completar la solicitud.'
}

export function refrescarSesion(): Promise<boolean> {
  refreshEnCurso ??= fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then(async (r) => {
      if (!r.ok) return false
      setAccessToken(((await r.json()) as TokenOut).access_token)
      return true
    })
    .catch(() => false)
    .finally(() => { refreshEnCurso = null })
  return refreshEnCurso
}

interface Opciones { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal; blob?: boolean }

export async function api<T>(ruta: string, opciones: Opciones = {}, reintento = true): Promise<T> {
  const { method = 'GET', body, auth = true, signal, blob = false } = opciones
  const headers: Record<string, string> = { Accept: blob ? '*/*' : 'application/json' }
  const esForm = typeof FormData !== 'undefined' && body instanceof FormData
  // FormData: el navegador pone el Content-Type con su boundary.
  if (body !== undefined && !esForm) headers['Content-Type'] = 'application/json'
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`

  let res: Response
  try {
    res = await fetch(`${BASE}${ruta}`, {
      method, headers, signal, credentials: 'include',
      body: body === undefined ? undefined : esForm ? (body as FormData) : JSON.stringify(body),
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError(0, mensajeDeError(null, 0))
  }

  if (res.status === 401 && auth && reintento) {
    if (!modoSoporte && await refrescarSesion()) return api<T>(ruta, opciones, false)
    setAccessToken(null)
    alCerrarSesion?.()
  }

  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null)
    const retry = Number(res.headers.get('Retry-After')) || undefined
    throw new ApiError(res.status, mensajeDeError(cuerpo, res.status), retry)
  }
  if (res.status === 204) return undefined as T
  if (blob) return (await res.blob()) as T
  return res.json() as Promise<T>
}

// ---------- Contratos usados por el portal (ver schemas.py de la API) ----------

export interface UsuarioOut {
  id: string
  email: string
  full_name: string | null
  role: string
  tenant_id: string | null
  nombre_negocio: string | null
  es_gerencia_plataforma: boolean
  /** Solo en sesiones de "ver como": correo del gerente que mira y cuándo vence el token. */
  impersonado_por?: string | null
  impersonacion_expira?: string | null
  impersonacion_escritura_hasta?: string | null
  nombres: string | null
  perfil_completo: boolean
  onboarding_pendiente: boolean
}

export interface VerificacionPendienteOut { email: string; expira_en_minutos: number; reenviar_en_segundos: number }

export interface MetricasOut {
  conversaciones_activas: number
  mensajes_hoy: number
  mensajes_7d: number
  conversaciones_7d: number
  por_canal: Record<string, number>
}

export interface CanalOut {
  channel_type: string
  page_id: string | null
  ig_user_id: string | null
  phone_number_id: string | null
  is_active: boolean
  updated_at: string | null
}

export interface ConversacionOut {
  id: string
  channel_type: string
  status: string
  started_at: string
  last_message_at: string
  usuario_nombre: string | null
  usuario_handle: string | null
  usuario_username?: string | null
  total_mensajes: number
  ultimo_mensaje: string | null
  minutos_restantes_ventana?: number | null
}
