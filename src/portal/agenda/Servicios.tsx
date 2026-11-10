import { PencilSimple, Plus } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { pesos } from '../../lib/formato'
import { esGerencia } from '../../lib/roles'
import type { ServicioCita } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip, Dialogo } from '../ui'

const mensaje = (e: unknown, r: string) => (e instanceof ApiError ? e.message : r)

/** Catálogo de servicios que se pueden agendar (duración, precio y regla de cancelación). */
export function Servicios({ base }: { base: string }) {
  const { usuario } = useAuth()
  const gerencia = esGerencia(usuario)
  const lista = useApi<ServicioCita[]>(`${base}/servicios`)
  const [editando, setEditando] = useState<ServicioCita | 'nuevo' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const alternar = async (s: ServicioCita) => {
    setError(null); setAviso(null)
    try { await api(`${base}/servicios/${s.id}`, { method: 'PATCH', body: { activo: !s.activo } }); lista.recargar(true) }
    catch (e) { setError(mensaje(e, 'No se pudo cambiar el estado.')) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">Lo que tus clientes pueden reservar. La duración define cuánto espacio ocupa en la grilla.</p>
        {gerencia && <button type="button" className="btn-primary" onClick={() => setEditando('nuevo')}><Plus size={16} aria-hidden /> Nuevo servicio</button>}
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {aviso && <Aviso tipo="ok">{aviso}</Aviso>}
      {lista.error && <Aviso tipo="error">{lista.error.message}</Aviso>}
      {lista.cargando && !lista.datos ? <div className="p-8 text-center"><Spinner /></div>
        : lista.datos?.length === 0 ? <p className="card px-6 py-12 text-center text-ink-muted">Todavía no hay servicios.</p>
        : (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/60 text-xs text-ink-muted"><tr>
                <th scope="col" className="px-4 py-2 font-medium">Servicio</th><th scope="col" className="px-4 py-2 font-medium">Duración</th><th scope="col" className="px-4 py-2 font-medium">Precio</th><th scope="col" className="px-4 py-2 font-medium">Cancelación</th><th scope="col" className="px-4 py-2" />
              </tr></thead>
              <tbody className="divide-y divide-line">
                {lista.datos?.map((s) => (
                  <tr key={s.id} className={s.activo ? '' : 'opacity-60'}>
                    <td className="px-4 py-3"><span className="font-semibold">{s.nombre}</span> {!s.activo && <Chip>inactivo</Chip>}</td>
                    <td className="px-4 py-3 tabular-nums">{s.duracion_minutos} min</td>
                    <td className="px-4 py-3 tabular-nums">{pesos(s.precio)}</td>
                    <td className="px-4 py-3 text-ink-muted">{s.antelacion_cancelacion_horas === null ? 'Sin regla' : `${s.antelacion_cancelacion_horas} h de antelación`}</td>
                    <td className="px-4 py-3">{gerencia && <div className="flex justify-end gap-2">
                      <button type="button" className="btn-ghost size-9 px-0" aria-label={`Editar ${s.nombre}`} onClick={() => setEditando(s)}><PencilSimple size={15} aria-hidden /></button>
                      <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => alternar(s)}>{s.activo ? 'Desactivar' : 'Activar'}</button>
                    </div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {editando && <FormServicio base={base} servicio={editando === 'nuevo' ? null : editando} onCerrar={() => setEditando(null)} onGuardado={(m) => { setEditando(null); setAviso(m); lista.recargar(true) }} />}
    </div>
  )
}

function FormServicio({ base, servicio, onCerrar, onGuardado }: { base: string; servicio: ServicioCita | null; onCerrar: () => void; onGuardado: (m: string) => void }) {
  const [nombre, setNombre] = useState(servicio?.nombre ?? '')
  const [duracion, setDuracion] = useState(String(servicio?.duracion_minutos ?? 30))
  const [precio, setPrecio] = useState(servicio?.precio != null ? String(servicio.precio) : '')
  const [regla, setRegla] = useState(servicio?.antelacion_cancelacion_horas != null)
  const [horas, setHoras] = useState(String(servicio?.antelacion_cancelacion_horas ?? 24))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setGuardando(true); setError(null)
    try {
      const cuerpo = {
        nombre: nombre.trim(), duracion_minutos: Number(duracion), precio: precio === '' ? null : Number(precio),
        // null explícito borra la regla; al crear, omitirla equivale a "sin regla".
        antelacion_cancelacion_horas: regla ? Math.round(Number(horas)) : null,
      }
      if (servicio) await api(`${base}/servicios/${servicio.id}`, { method: 'PATCH', body: cuerpo })
      else await api(`${base}/servicios`, { method: 'POST', body: cuerpo })
      onGuardado(servicio ? `"${cuerpo.nombre}" actualizado.` : `"${cuerpo.nombre}" agregado.`)
    } catch (err) { setError(mensaje(err, 'No se pudo guardar el servicio.')) }
    finally { setGuardando(false) }
  }
  const valido = nombre.trim().length >= 2 && Number(duracion) >= 5 && Number(duracion) <= 480 && (!regla || (Number(horas) >= 0 && Number(horas) <= 720))

  return (
    <Dialogo abierto titulo={servicio ? 'Editar servicio' : 'Nuevo servicio'} onCerrar={onCerrar} ocupado={guardando}>
      <form onSubmit={enviar} className="mt-3 space-y-4">
        {error && <Aviso tipo="error">{error}</Aviso>}
        <div><label htmlFor="s-nombre" className="field-label">Nombre</label><input id="s-nombre" className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={255} required autoFocus /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="s-dur" className="field-label">Duración (minutos)</label><input id="s-dur" type="number" min={5} max={480} step={5} className="field" value={duracion} onChange={(e) => setDuracion(e.target.value)} required /></div>
          <div><label htmlFor="s-precio" className="field-label">Precio (opcional)</label><input id="s-precio" type="number" min={0} step="0.01" inputMode="decimal" className="field" value={precio} onChange={(e) => setPrecio(e.target.value)} /></div>
        </div>
        <div className="space-y-2 rounded-xl bg-muted/50 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium"><input type="checkbox" className="accent-primary" checked={regla} onChange={(e) => setRegla(e.target.checked)} /> Exigir antelación para que el cliente cancele</label>
          {regla && <div className="flex items-center gap-2"><input aria-label="Horas de antelación" type="number" min={0} max={720} step={1} className="field !min-h-9 !w-24" value={horas} onChange={(e) => setHoras(e.target.value)} /><span className="text-sm text-ink-muted">horas antes de la cita</span></div>}
          <p className="text-xs text-ink-muted">Si el cliente cancela con menos tiempo (por el chat), la cita se marca como cancelación tardía. El equipo siempre puede cancelar.</p>
        </div>
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onCerrar} disabled={guardando}>Cancelar</button><button type="submit" className="btn-primary" disabled={guardando || !valido}>{guardando ? 'Guardando…' : 'Guardar'}</button></div>
      </form>
    </Dialogo>
  )
}
