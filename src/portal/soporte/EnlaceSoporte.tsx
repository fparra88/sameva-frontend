import { useEffect, useState } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { fechaCorta, hora } from '../../lib/formato'
import type { InfoEnlaceSoporte } from '../../lib/tipos'
import { Aviso } from '../ui'

const DURACIONES = [15, 30, 60]
const FINAL: Record<string, string> = {
  aprobada: 'Esta solicitud ya fue aprobada.', rechazada: 'Esta solicitud ya fue rechazada.', revocada: 'Este acceso ya fue revocado.',
  cancelada: 'Soporte retiró la solicitud.', vencida: 'La solicitud venció sin respuesta.', terminada: 'El acceso ya terminó.',
}

/**
 * Enlace del correo (/acceso-soporte#t=…): el dueño aprueba o rechaza sin iniciar sesión. El token va en el
 * fragmento de la URL (no llega a ningún servidor) y se manda en el cuerpo; es de un solo uso.
 */
export default function EnlaceSoporte() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('t'))
  const [info, setInfo] = useState<InfoEnlaceSoporte | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [minutos, setMinutos] = useState(30)
  const [ocupado, setOcupado] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setError('El enlace está incompleto. Ábrelo de nuevo desde el correo.'); return }
    api<InfoEnlaceSoporte>('/acceso-soporte/enlace/leer', { method: 'POST', auth: false, body: { token } })
      .then(setInfo)
      .catch((e) => setError(e instanceof ApiError && e.status === 404 ? 'Este enlace no es válido o ya no existe.' : e instanceof ApiError ? e.message : 'No se pudo abrir la solicitud.'))
  }, [token])

  const responder = async (aprobar: boolean) => {
    setError(null); setOcupado(true)
    try {
      const r = await api<InfoEnlaceSoporte>(aprobar ? '/acceso-soporte/enlace/aprobar' : '/acceso-soporte/enlace/rechazar', {
        method: 'POST', auth: false, body: aprobar ? { token, duracion_min: minutos } : { token },
      })
      setInfo(r)
      setResultado(aprobar ? `Listo: soporte podrá editar durante ${minutos} minutos. Puedes revocarlo desde Ajustes → Soporte.` : 'Listo: rechazaste la solicitud.')
    } catch (e) { setError(e instanceof ApiError ? e.message : 'No se pudo registrar tu respuesta.') }
    finally { setOcupado(false) }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-bg p-4 text-ink">
      <div className="card w-full max-w-md space-y-4 p-6">
        <h1 className="text-xl font-bold">Soporte pide editar tu cuenta</h1>
        {error && <Aviso tipo="error">{error}</Aviso>}
        {!info && !error && <div className="text-center"><Spinner /></div>}
        {info && (
          <>
            <p className="text-sm text-ink-muted"><strong className="text-ink">{info.gerente_email}</strong> pide permiso para hacer cambios en <strong className="text-ink">{info.tenant_nombre}</strong>. Mientras no lo apruebes, solo puede mirar.</p>
            <blockquote className="rounded-xl bg-muted p-3 text-sm">«{info.motivo}»</blockquote>
            {resultado ? <Aviso tipo="ok">{resultado}</Aviso>
              : info.estado !== 'pendiente' ? <Aviso tipo="info">{FINAL[info.estado] ?? 'Esta solicitud ya fue atendida.'}</Aviso>
              : (
                <>
                  <label className="block text-sm text-ink-muted">Permitir editar por
                    <select className="field mt-1" value={minutos} onChange={(e) => setMinutos(Number(e.target.value))}>
                      {DURACIONES.map((d) => <option key={d} value={d}>{d} minutos</option>)}
                    </select>
                  </label>
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn-ghost" disabled={ocupado} onClick={() => responder(false)}>Rechazar</button>
                    <button type="button" className="btn-primary" disabled={ocupado} onClick={() => responder(true)}>{ocupado ? 'Enviando…' : 'Aprobar'}</button>
                  </div>
                  <p className="text-xs text-ink-muted">La solicitud vence el {fechaCorta(info.expira_en)} a las {hora(info.expira_en)}.</p>
                </>
              )}
          </>
        )}
      </div>
    </div>
  )
}
