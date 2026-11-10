import { useEffect, useState } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import type { PaginaMeta, ResultadoPagina } from '../../lib/tipos'
import { Aviso, Dialogo } from '../ui'

// App de Meta (pública). Sin ella no se puede abrir el login de Facebook.
const APP_ID = import.meta.env.VITE_META_APP_ID as string | undefined
// Configuración de "Facebook Login for Business"; si falta se pide el permiso por scope.
const CONFIG_ID = import.meta.env.VITE_META_CONFIG_ID as string | undefined
const PERMISOS = 'pages_show_list,pages_messaging,pages_manage_metadata,instagram_basic,instagram_manage_messages,business_management'
const VERSION = 'v21.0'

interface RespuestaLogin { authResponse?: { code?: string } | null }
interface FbSdk { init: (o: object) => void; login: (cb: (r: RespuestaLogin) => void, o: object) => void }
declare global { interface Window { FB?: FbSdk; fbAsyncInit?: () => void } }

let cargaSdk: Promise<FbSdk> | null = null
/** Carga el SDK de Facebook una sola vez. */
function cargarSdk(): Promise<FbSdk> {
  if (cargaSdk) return cargaSdk
  cargaSdk = new Promise<FbSdk>((resolver, rechazar) => {
    window.fbAsyncInit = () => {
      window.FB!.init({ appId: APP_ID, cookie: true, xfbml: false, version: VERSION })
      resolver(window.FB!)
    }
    const s = document.createElement('script')
    s.src = 'https://connect.facebook.net/es_LA/sdk.js'
    s.async = true
    s.onerror = () => { cargaSdk = null; rechazar(new Error('No se pudo cargar Facebook. Revisa tu conexión o el bloqueador de anuncios.')) }
    document.body.appendChild(s)
  })
  return cargaSdk
}

type Paso = 'inicio' | 'conectando' | 'paginas' | 'activando' | 'listo'
const mensaje = (e: unknown, r: string) => (e instanceof ApiError || e instanceof Error ? e.message : r)

/**
 * Conecta Facebook Messenger (y el Instagram de la misma página) con el login de Meta:
 * popup → code → POST /canales/meta/conectar → elegir páginas → POST /canales/meta/activar.
 */
export function ConectarFacebook({ abierto, onCerrar, onTerminado }: { abierto: boolean; onCerrar: () => void; onTerminado: () => void }) {
  const [paso, setPaso] = useState<Paso>('inicio')
  const [error, setError] = useState<string | null>(null)
  const [paginas, setPaginas] = useState<PaginaMeta[]>([])
  const [elegidas, setElegidas] = useState<Set<string>>(new Set())
  const [resultados, setResultados] = useState<ResultadoPagina[]>([])
  const ocupado = paso === 'conectando' || paso === 'activando'

  useEffect(() => { if (abierto) { setPaso('inicio'); setError(null); setPaginas([]); setElegidas(new Set()); setResultados([]) } }, [abierto])

  const cerrar = () => { if (ocupado) return; if (paso === 'listo') onTerminado(); onCerrar() }

  const iniciar = async () => {
    setError(null); setPaso('conectando')
    try {
      const fb = await cargarSdk()
      const code = await new Promise<string>((ok, no) => {
        fb.login((r) => (r.authResponse?.code ? ok(r.authResponse.code) : no(new Error('No se completó la autorización en Facebook.'))),
          CONFIG_ID ? { config_id: CONFIG_ID, response_type: 'code', override_default_response_type: true } : { scope: PERMISOS, response_type: 'code', override_default_response_type: true })
      })
      await api('/canales/meta/conectar', { method: 'POST', body: { code } })
      const lista = await api<PaginaMeta[]>('/canales/meta/paginas')
      setPaginas(lista)
      setElegidas(new Set(lista.filter((p) => !p.ya_conectada).slice(0, 1).map((p) => p.page_id)))
      setPaso('paginas')
    } catch (e) { setError(mensaje(e, 'No se pudo conectar con Facebook.')); setPaso('inicio') }
  }

  const activar = async () => {
    setError(null); setPaso('activando')
    try {
      const r = await api<{ resultados: ResultadoPagina[] }>('/canales/meta/activar', { method: 'POST', body: { page_ids: [...elegidas] } })
      setResultados(r.resultados); setPaso('listo')
    } catch (e) { setError(mensaje(e, 'No se pudieron activar las páginas.')); setPaso('paginas') }
  }

  const alternar = (id: string) => setElegidas((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <Dialogo abierto={abierto} titulo="Conectar Facebook" onCerrar={cerrar} ocupado={ocupado}>
      <div className="mt-2 space-y-4">
        {!APP_ID ? <Aviso tipo="info">La conexión con Facebook todavía no está configurada en este portal (falta VITE_META_APP_ID).</Aviso> : (
          <>
            {error && <Aviso tipo="error">{error}</Aviso>}
            {(paso === 'inicio' || paso === 'conectando') && (
              <>
                <p className="text-sm text-ink-muted">Inicia sesión con Facebook y autoriza las páginas donde quieres que responda tu agente. Si la página tiene un Instagram profesional vinculado, también se conecta.</p>
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn-ghost" onClick={cerrar} disabled={ocupado}>Cancelar</button>
                  <button type="button" className="btn-primary" onClick={iniciar} disabled={ocupado}>{paso === 'conectando' ? 'Conectando…' : 'Continuar con Facebook'}</button>
                </div>
              </>
            )}
            {(paso === 'paginas' || paso === 'activando') && (
              <>
                {paginas.length === 0 ? <Aviso tipo="info">Meta no devolvió ninguna página. Vuelve a intentarlo y marca las páginas que quieras conectar.</Aviso> : (
                  <ul className="max-h-72 space-y-2 overflow-y-auto" aria-label="Páginas disponibles">
                    {paginas.map((p) => (
                      <li key={p.page_id}>
                        <label className={`flex items-center gap-3 rounded-xl border border-line p-3 ${p.ya_conectada ? 'opacity-60' : 'cursor-pointer hover:bg-muted/50'}`}>
                          <input type="checkbox" className="accent-primary" disabled={p.ya_conectada || paso === 'activando'} checked={elegidas.has(p.page_id)} onChange={() => alternar(p.page_id)} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{p.nombre}</span>
                            <span className="block text-xs text-ink-muted">{p.ya_conectada ? 'Ya conectada' : p.ig_username ? `Con Instagram @${p.ig_username}` : 'Sin Instagram vinculado'}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
                {paso === 'activando' && <div className="text-center"><Spinner label="Activando" /></div>}
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn-ghost" onClick={cerrar} disabled={ocupado}>Cancelar</button>
                  <button type="button" className="btn-primary" onClick={activar} disabled={ocupado || elegidas.size === 0}>{paso === 'activando' ? 'Activando…' : `Activar ${elegidas.size || ''} ${elegidas.size === 1 ? 'página' : 'páginas'}`}</button>
                </div>
              </>
            )}
            {paso === 'listo' && (
              <>
                <ul className="space-y-2">
                  {resultados.map((r) => (
                    <li key={r.page_id}>
                      {r.ok ? <Aviso tipo="ok">{r.nombre ?? r.page_id} conectada{r.canales?.includes('instagram') ? ' (Messenger e Instagram)' : ' (Messenger)'}. Tu agente ya responde ahí.</Aviso>
                        : <Aviso tipo="error">{r.nombre ?? r.page_id}: {r.detalle ?? 'no se pudo activar.'}</Aviso>}
                    </li>
                  ))}
                </ul>
                <div className="flex justify-end"><button type="button" className="btn-primary" onClick={cerrar}>Listo</button></div>
              </>
            )}
          </>
        )}
      </div>
    </Dialogo>
  )
}
