import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '../components'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Aviso } from '../portal/ui'

interface ImpersonarOut { access_token: string; expira_en: string; email_usuario: string; tenant_nombre: string }

const RUTA = '/soporte/ver-como'
const ESPERA_MS = 20_000

/**
 * Abre el portal del negocio en una pestaña nueva, en solo lectura. El token (corto, sin refresh) pasa de
 * una pestaña a la otra con postMessage: no toca localStorage, ni la URL, ni la sesión real del gerente.
 * La pestaña tiene que abrirse en el clic (antes del await) o el navegador la bloquea como emergente.
 */
export async function verComoNegocio(tenantId: string, motivo: string): Promise<void> {
  const destino = window.open(RUTA, '_blank')
  if (!destino) throw new Error('El navegador bloqueó la pestaña nueva. Permite las ventanas emergentes para este sitio.')
  let listo = false
  let token: string | null = null
  const enviar = () => { if (listo && token) { destino.postMessage({ tipo: 'soporte-token', token }, window.location.origin); window.removeEventListener('message', escuchar) } }
  const escuchar = (e: MessageEvent) => {
    if (e.origin !== window.location.origin || e.source !== destino || e.data?.tipo !== 'soporte-listo') return
    listo = true; enviar()
  }
  window.addEventListener('message', escuchar)
  try {
    const r = await api<ImpersonarOut>(`/gerencia/tenants/${tenantId}/impersonar`, { method: 'POST', body: { motivo } })
    token = r.access_token; enviar()
  } catch (e) {
    window.removeEventListener('message', escuchar); destino.close()
    throw e
  }
  setTimeout(() => window.removeEventListener('message', escuchar), ESPERA_MS)
}

/** Pestaña de soporte: recibe el token del panel de gerencia y entra al portal del negocio. */
export default function VerComo() {
  const { iniciarSoporte } = useAuth()
  const navegar = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!window.opener) { setError('Esta pantalla se abre desde Gerencia → Negocios → Ver como.'); return }
    const alMensaje = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.opener || e.data?.tipo !== 'soporte-token') return
      window.removeEventListener('message', alMensaje); clearTimeout(limite)
      iniciarSoporte(String(e.data.token))
        .then(() => navegar('/portal/bandeja', { replace: true }))
        .catch((err) => setError(err instanceof ApiError ? err.message : 'No se pudo abrir la sesión de soporte.'))
    }
    const limite = setTimeout(() => { window.removeEventListener('message', alMensaje); setError('No llegó la autorización desde Gerencia. Cierra esta pestaña e inténtalo de nuevo.') }, ESPERA_MS)
    window.addEventListener('message', alMensaje)
    window.opener.postMessage({ tipo: 'soporte-listo' }, window.location.origin)
    return () => { window.removeEventListener('message', alMensaje); clearTimeout(limite) }
  }, [iniciarSoporte, navegar])

  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-6 text-ink">
      {error ? <div className="max-w-md space-y-3"><Aviso tipo="error">{error}</Aviso><button type="button" className="btn-ghost" onClick={() => window.close()}>Cerrar pestaña</button></div>
        : <Spinner label="Abriendo el portal del negocio" />}
    </div>
  )
}
