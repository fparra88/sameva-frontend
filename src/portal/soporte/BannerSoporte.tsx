import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import type { SolicitudSoporte } from '../../lib/tipos'

const hh = (iso: string) => new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

/**
 * Barra de la pestaña de "ver como". Por defecto es solo lectura; para editar el gerente tiene que pedir
 * permiso al dueño (que lo aprueba en su portal o desde el correo) y solo dura el tiempo que el dueño elija.
 */
export function BannerSoporte() {
  const { usuario } = useAuth()
  const [sol, setSol] = useState<SolicitudSoporte | null>(null)
  const [pidiendo, setPidiendo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [, tic] = useState(0)

  const cargar = () => api<SolicitudSoporte | null>('/acceso-soporte/estado').then(setSol).catch(() => undefined)
  useEffect(() => { cargar() }, [])
  // Mientras el dueño no responde se consulta cada pocos segundos; con edición activa, un reloj para ver cuándo termina.
  const pendiente = sol?.estado === 'pendiente'
  const editando = sol?.estado === 'aprobada' && sol.concede_hasta !== null && new Date(sol.concede_hasta) > new Date()
  useEffect(() => {
    if (!pendiente && !editando) return
    const i = setInterval(() => { if (pendiente) cargar(); else tic((n) => n + 1); if (editando && sol?.concede_hasta && new Date(sol.concede_hasta) <= new Date()) cargar() }, pendiente ? 4000 : 15000)
    return () => clearInterval(i)
  }, [pendiente, editando, sol?.concede_hasta])

  const solicitar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null); setOcupado(true)
    try { setSol(await api<SolicitudSoporte>('/acceso-soporte/solicitar', { method: 'POST', body: { motivo: motivo.trim() } })); setPidiendo(false); setMotivo('') }
    catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo enviar la solicitud.') }
    finally { setOcupado(false) }
  }
  const cancelar = async () => {
    setError(null); setOcupado(true)
    try { setSol(await api<SolicitudSoporte | null>('/acceso-soporte/cancelar', { method: 'POST' })) }
    catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo cancelar.') }
    finally { setOcupado(false) }
  }

  const boton = 'cursor-pointer rounded-full bg-black/15 px-3 py-0.5 hover:bg-black/25 disabled:opacity-50'
  return (
    <div role="status" className={`sticky top-0 z-[60] px-4 py-2 text-center text-sm font-semibold text-black ${editando ? 'bg-red-400' : 'bg-amber-500'}`}>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>
          Modo soporte: viendo «{usuario?.nombre_negocio ?? 'el negocio'}» como {usuario?.email} ·{' '}
          {editando ? <>edición autorizada hasta {hh(sol!.concede_hasta!)}</> : <>solo lectura{usuario?.impersonacion_expira && <> · vence {hh(usuario.impersonacion_expira)}</>}</>}
        </span>
        {!editando && !pendiente && !pidiendo && <button type="button" className={boton} onClick={() => setPidiendo(true)}>Pedir permiso para editar</button>}
        {pendiente && <><span className="font-normal">Esperando al dueño…</span><button type="button" className={boton} disabled={ocupado} onClick={cancelar}>Retirar solicitud</button></>}
        {editando && <button type="button" className={boton} disabled={ocupado} onClick={cancelar}>Soltar edición</button>}
        <button type="button" onClick={() => window.close()} className={boton}>Cerrar sesión de soporte</button>
      </div>
      {sol && !pendiente && !editando && sol.estado !== 'cancelada' && <p className="mt-1 text-xs font-normal">Última solicitud: {sol.estado}.</p>}
      {pidiendo && (
        <form onSubmit={solicitar} className="mx-auto mt-2 flex max-w-xl flex-col gap-2 sm:flex-row">
          <input className="field flex-1 !bg-white !text-black" aria-label="Motivo para editar" placeholder="¿Qué necesitas cambiar y por qué? (el dueño lo verá)" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} autoFocus />
          <button type="submit" className="btn-primary" disabled={ocupado || motivo.trim().length < 5}>Enviar al dueño</button>
          <button type="button" className={boton} onClick={() => setPidiendo(false)}>Cancelar</button>
        </form>
      )}
      {error && <p role="alert" className="mt-1 text-xs">{error}</p>}
    </div>
  )
}
