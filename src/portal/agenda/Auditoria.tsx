import { useState } from 'react'
import { Spinner } from '../../components'
import { aIso, fechaLocal, sumarDias } from '../../lib/formato'
import type { EstadoReserva, Proveedor, ReservaAuditoria } from '../../lib/tipos'
import { useApi, useDebounce } from '../../lib/useApi'
import { Aviso, Chip } from '../ui'
import { ESTADO } from './colores'

const EVENTO: Record<ReservaAuditoria['evento'], string> = {
  creada: 'Creada', reprogramada: 'Reprogramada', cambio_barbero: 'Cambio de proveedor', cancelada: 'Cancelada', completada: 'Completada', no_asistio: 'No asistió',
}

/** Bitácora de cambios de las citas (solo lectura): quién hizo qué y desde dónde. */
export function Auditoria({ base }: { base: string }) {
  const hoy = fechaLocal(new Date())
  const [desde, setDesde] = useState(sumarDias(hoy, -7))
  const [hasta, setHasta] = useState(hoy)
  const [proveedor, setProveedor] = useState('')
  const [estado, setEstado] = useState<EstadoReserva | ''>('')
  const [cliente, setCliente] = useState('')
  const clienteDeb = useDebounce(cliente.trim(), 300)
  const proveedores = useApi<Proveedor[]>(`${base}/proveedores`)

  const invalido = desde > hasta
  const q = new URLSearchParams({ limite: '200' })
  if (desde) q.set('desde', aIso(desde, '00:00'))
  if (hasta) q.set('hasta', new Date(`${hasta}T23:59:59`).toISOString())
  if (proveedor) q.set('proveedor_id', proveedor)
  if (estado) q.set('estado', estado)
  if (clienteDeb) q.set('cliente', clienteDeb.slice(0, 255))
  const lista = useApi<ReservaAuditoria[]>(invalido ? null : `${base}/auditoria?${q}`)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div><label htmlFor="a-desde" className="field-label">Desde</label><input id="a-desde" type="date" className="field" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} /></div>
        <div><label htmlFor="a-hasta" className="field-label">Hasta</label><input id="a-hasta" type="date" className="field" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} /></div>
        <div><label htmlFor="a-prov" className="field-label">Proveedor</label><select id="a-prov" className="field" value={proveedor} onChange={(e) => setProveedor(e.target.value)}><option value="">Todos</option>{proveedores.datos?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
        <div><label htmlFor="a-est" className="field-label">Estado actual</label><select id="a-est" className="field" value={estado} onChange={(e) => setEstado(e.target.value as EstadoReserva | '')}><option value="">Cualquiera</option>{(Object.keys(ESTADO) as EstadoReserva[]).map((k) => <option key={k} value={k}>{ESTADO[k].etiqueta}</option>)}</select></div>
        <div><label htmlFor="a-cli" className="field-label">Cliente</label><input id="a-cli" type="search" className="field" value={cliente} onChange={(e) => setCliente(e.target.value)} maxLength={255} placeholder="Nombre" /></div>
      </div>
      {invalido && <Aviso tipo="error">La fecha inicial no puede ser posterior a la final.</Aviso>}
      {lista.error && <Aviso tipo="error">{lista.error.message}</Aviso>}
      {lista.cargando && !lista.datos ? <div className="p-6 text-center"><Spinner /></div>
        : lista.datos?.length === 0 ? <p className="card px-6 py-10 text-center text-ink-muted">Sin movimientos en este periodo.</p>
        : lista.datos && (
          <div className={`card overflow-x-auto ${lista.cargando ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted/60 text-xs text-ink-muted"><tr>
                <th scope="col" className="px-4 py-2 font-medium">Cuándo</th><th scope="col" className="px-4 py-2 font-medium">Evento</th><th scope="col" className="px-4 py-2 font-medium">Cita</th><th scope="col" className="px-4 py-2 font-medium">Quién</th><th scope="col" className="px-4 py-2 font-medium">Detalle</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {lista.datos.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-2 tabular-nums text-ink-muted">{h.creado_en ? new Date(h.creado_en).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td>
                    <td className="px-4 py-2 font-medium">{EVENTO[h.evento] ?? h.evento}</td>
                    <td className="px-4 py-2">{h.cliente_nombre ?? 'Cliente'} · {h.servicio_nombre}<span className="block text-xs text-ink-muted">{h.proveedor_nombre}</span></td>
                    <td className="px-4 py-2">{h.actor}<span className="ml-2 align-middle"><Chip tono={h.origen === 'n8n' ? 'info' : 'gris'}>{h.origen === 'n8n' ? 'chat' : h.origen}</Chip></span></td>
                    <td className="px-4 py-2 text-ink-muted">{h.estado_anterior && h.estado_anterior !== h.estado_nuevo ? `${ESTADO[h.estado_anterior].etiqueta} → ` : ''}{ESTADO[h.estado_nuevo].etiqueta}{h.motivo ? ` · ${h.motivo}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
