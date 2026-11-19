import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { esGerencia } from '../../lib/roles'
import type { SolicitudSoporte } from '../../lib/tipos'

const hh = (iso: string) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
const DURACIONES = [15, 30, 60]

/**
 * Barra amarilla del DUEÑO: aparece cuando soporte de OperativAI pide permiso para editar el negocio y deja
 * aprobarlo o rechazarlo en el momento. Con una edición ya aprobada y vigente, deja revocarla.
 * (Contraparte de BannerSoporte, que es la barra de la pestaña de soporte.)
 */
export function BannerSolicitudSoporte() {
  const { usuario } = useAuth()
  const aplica = esGerencia(usuario) && !usuario?.impersonado_por
  const [lista, setLista] = useState<SolicitudSoporte[]>([])
  const [minutos, setMinutos] = useState(30)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, tic] = useState(0)

  const cargar = useCallback(() => {
    api<SolicitudSoporte[]>('/acceso-soporte/solicitudes').then(setLista).catch(() => undefined)
  }, [])

  // Consulta al montar y cada 10 s (y al volver a la pestaña): el aviso tiene que llegar aunque el dueño no recargue.
  useEffect(() => {
    if (!aplica) return
    cargar()
    const i = setInterval(() => { if (!document.hidden) { cargar(); tic((n) => n + 1) } }, 10_000)
    const v = () => { if (!document.hidden) cargar() }
    document.addEventListener('visibilitychange', v)
    return () => { clearInterval(i); document.removeEventListener('visibilitychange', v) }
  }, [aplica, cargar])

  if (!aplica) return null
  const ahora = Date.now()
  const pendiente = lista.find((s) => s.estado === 'pendiente' && new Date(s.expira_en).getTime() > ahora)
  const activa = lista.find((s) => s.estado === 'aprobada' && s.concede_hasta && new Date(s.concede_hasta).getTime() > ahora)
  const s = pendiente ?? activa
  if (!s) return null

  const accion = async (tipo: 'aprobar' | 'rechazar' | 'revocar') => {
    setError(null); setOcupado(true)
    try {
      await api(`/acceso-soporte/${s.id}/${tipo}`, { method: 'POST', body: tipo === 'aprobar' ? { duracion_min: minutos } : undefined })
      cargar()
    } catch (e) { setError(e instanceof ApiError ? e.message : 'No se pudo completar la acción.') }
    finally { setOcupado(false) }
  }

  const boton = 'cursor-pointer rounded-full bg-black/15 px-3 py-0.5 hover:bg-black/25 disabled:opacity-50'
  return (
    <div role="alert" className="sticky top-0 z-[60] bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-black">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        {pendiente ? (<>
          <span>Soporte ({pendiente.gerente_email}) pide permiso para editar tu negocio: «{pendiente.motivo}»</span>
          <label className="font-normal">por
            <select className="ml-1 rounded-md bg-white px-1 py-0.5 text-black" value={minutos} onChange={(e) => setMinutos(Number(e.target.value))} disabled={ocupado}>
              {DURACIONES.map((d) => <option key={d} value={d}>{d} min</option>)}
            </select>
          </label>
          <button type="button" className="cursor-pointer rounded-full bg-black px-3 py-0.5 text-white hover:bg-black/80 disabled:opacity-50" disabled={ocupado} onClick={() => accion('aprobar')}>Aprobar</button>
          <button type="button" className={boton} disabled={ocupado} onClick={() => accion('rechazar')}>Rechazar</button>
        </>) : (<>
          <span>Soporte ({s.gerente_email}) puede editar tu negocio hasta las {hh(s.concede_hasta!)}.</span>
          <button type="button" className={boton} disabled={ocupado} onClick={() => accion('revocar')}>Revocar ahora</button>
        </>)}
      </div>
      {error && <p className="mt-1 text-xs font-normal">{error}</p>}
    </div>
  )
}
