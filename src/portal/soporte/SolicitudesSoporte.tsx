import { useState } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { fechaCorta, hora } from '../../lib/formato'
import type { EstadoAccesoSoporte, SolicitudSoporte } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip } from '../ui'

const ESTADO: Record<EstadoAccesoSoporte, { t: string; tono: 'ok' | 'info' | 'aviso' | 'gris' }> = {
  pendiente: { t: 'Pendiente', tono: 'info' }, aprobada: { t: 'Aprobada', tono: 'ok' }, rechazada: { t: 'Rechazada', tono: 'gris' },
  revocada: { t: 'Revocada', tono: 'gris' }, cancelada: { t: 'Retirada', tono: 'gris' }, vencida: { t: 'Vencida', tono: 'gris' }, terminada: { t: 'Terminada', tono: 'gris' },
}
const DURACIONES = [15, 30, 60]

/**
 * Pedidos del equipo de soporte para editar en tu negocio. Sin tu aprobación solo pueden mirar; cada
 * aprobación dura lo que tú elijas y puedes cortarla cuando quieras.
 */
export function SolicitudesSoporte() {
  const lista = useApi<SolicitudSoporte[]>('/acceso-soporte/solicitudes')
  const [minutos, setMinutos] = useState<Record<string, number>>({})
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const accion = async (s: SolicitudSoporte, tipo: 'aprobar' | 'rechazar' | 'revocar') => {
    setError(null); setOk(null); setOcupado(s.id)
    try {
      await api(`/acceso-soporte/${s.id}/${tipo}`, { method: 'POST', body: tipo === 'aprobar' ? { duracion_min: minutos[s.id] ?? 30 } : undefined })
      setOk(tipo === 'aprobar' ? `Aprobaste la edición por ${minutos[s.id] ?? 30} minutos.` : tipo === 'rechazar' ? 'Solicitud rechazada.' : 'Acceso de edición revocado.')
      lista.recargar(true)
    } catch (e) { setError(e instanceof ApiError ? e.message : 'No se pudo completar la acción.') }
    finally { setOcupado(null) }
  }

  const items = lista.datos ?? []
  return (
    <section className="card overflow-hidden" aria-labelledby="sop-t">
      <header className="border-b border-line p-5">
        <h2 id="sop-t" className="font-semibold">Soporte de OperativAI</h2>
        <p className="text-sm text-ink-muted">Cuando el equipo de soporte necesita cambiar algo en tu cuenta, te lo pide aquí (o por correo). Mientras no lo apruebes, solo pueden mirar.</p>
      </header>
      <div className="space-y-3 p-5">
        {lista.error && <Aviso tipo="error">{lista.error.message}</Aviso>}
        {error && <Aviso tipo="error">{error}</Aviso>}
        {ok && <Aviso tipo="ok">{ok}</Aviso>}
        {lista.cargando && !lista.datos ? <div className="text-center"><Spinner /></div>
          : items.length === 0 ? <p className="text-center text-sm text-ink-muted">Soporte no ha pedido editar tu cuenta.</p>
          : (
            <ul className="space-y-3">
              {items.map((s) => (
                <li key={s.id} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tono={ESTADO[s.estado].tono}>{ESTADO[s.estado].t}</Chip>
                    <span className="text-sm font-semibold">{s.gerente_email}</span>
                    <span className="text-xs text-ink-muted">{fechaCorta(s.creada_en)} {hora(s.creada_en)}</span>
                  </div>
                  <p className="mt-2 text-sm">«{s.motivo}»</p>
                  {s.estado === 'pendiente' && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="text-sm text-ink-muted">Permitir editar por
                        <select className="field ml-2 inline-block w-auto" value={minutos[s.id] ?? 30} onChange={(e) => setMinutos((m) => ({ ...m, [s.id]: Number(e.target.value) }))}>
                          {DURACIONES.map((d) => <option key={d} value={d}>{d} min</option>)}
                        </select>
                      </label>
                      <button type="button" className="btn-primary min-h-9 px-4 text-sm" disabled={ocupado === s.id} onClick={() => accion(s, 'aprobar')}>Aprobar</button>
                      <button type="button" className="btn-ghost min-h-9 px-4 text-sm" disabled={ocupado === s.id} onClick={() => accion(s, 'rechazar')}>Rechazar</button>
                      <span className="text-xs text-ink-muted">Vence {hora(s.expira_en)}</span>
                    </div>
                  )}
                  {s.estado === 'aprobada' && s.concede_hasta && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-sm text-ink-muted">Puede editar hasta las {hora(s.concede_hasta)}.</span>
                      <button type="button" className="btn-ghost min-h-9 px-4 text-sm hover:text-danger" disabled={ocupado === s.id} onClick={() => accion(s, 'revocar')}>Revocar ahora</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
      </div>
    </section>
  )
}
