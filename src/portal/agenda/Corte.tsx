import { useState } from 'react'
import { Spinner } from '../../components'
import { fechaLegible, fechaLocal, hora, pesos } from '../../lib/formato'
import type { CorteDiario, Proveedor } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso } from '../ui'

/** Resumen de caja de un día: servicios completados y total cobrado (solo lectura). */
export function Corte({ base }: { base: string }) {
  const [fecha, setFecha] = useState(fechaLocal(new Date()))
  const [proveedor, setProveedor] = useState('')
  const proveedores = useApi<Proveedor[]>(`${base}/proveedores`)
  const corte = useApi<CorteDiario>(`${base}/corte-diario?fecha=${fecha}${proveedor ? `&proveedor_id=${proveedor}` : ''}`)
  const d = corte.datos

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div><label htmlFor="c-fecha" className="field-label">Fecha</label><input id="c-fecha" type="date" className="field !w-auto" value={fecha} max={fechaLocal(new Date())} onChange={(e) => e.target.value && setFecha(e.target.value)} /></div>
        <div><label htmlFor="c-prov" className="field-label">Proveedor</label>
          <select id="c-prov" className="field !w-auto" value={proveedor} onChange={(e) => setProveedor(e.target.value)}><option value="">Todos</option>{proveedores.datos?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
      </div>
      {corte.error && <Aviso tipo="error">{corte.error.message}</Aviso>}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card px-5 py-4"><p className="text-xs text-ink-muted">Servicios completados</p><p className="text-3xl font-bold tabular-nums">{d ? d.total_servicios : '—'}</p></div>
        <div className="card px-5 py-4"><p className="text-xs text-ink-muted">Total cobrado</p><p className="text-3xl font-bold tabular-nums">{d ? pesos(d.total_cobrado) : '—'}</p></div>
      </div>
      {corte.cargando && !d ? <div className="p-6 text-center"><Spinner /></div>
        : d && d.servicios.length === 0 ? <p className="card px-6 py-10 text-center text-ink-muted">No hubo servicios completados el {fechaLegible(d.fecha)}.</p>
        : d && (
          <div className={`card overflow-x-auto ${corte.cargando ? 'opacity-60' : ''}`}>
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/60 text-xs text-ink-muted"><tr>
                <th scope="col" className="px-4 py-2 font-medium">Hora</th><th scope="col" className="px-4 py-2 font-medium">Cliente</th><th scope="col" className="px-4 py-2 font-medium">Servicio</th><th scope="col" className="px-4 py-2 font-medium">Proveedor</th><th scope="col" className="px-4 py-2 text-right font-medium">Cobrado</th><th scope="col" className="px-4 py-2 font-medium">Pago</th>
              </tr></thead>
              <tbody className="divide-y divide-line">
                {d.servicios.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2 tabular-nums">{hora(r.hora_inicio)}</td><td className="px-4 py-2">{r.cliente_nombre ?? '—'}</td><td className="px-4 py-2">{r.servicio_nombre}</td>
                    <td className="px-4 py-2"><span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ background: r.proveedor_color }} aria-hidden />{r.proveedor_nombre}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{pesos(r.precio_cobrado)}</td><td className="px-4 py-2 capitalize text-ink-muted">{r.metodo_pago ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  )
}
