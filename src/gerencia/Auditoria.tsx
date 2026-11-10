import { useState } from 'react'
import { Spinner } from '../components'
import { fechaCorta, hora } from '../lib/formato'
import type { EntradaAuditoria } from '../lib/tipos'
import { useApi } from '../lib/useApi'
import { Aviso } from '../portal/ui'

const ACCIONES: Record<string, string> = {
  estado_tenant: 'Cambio de estado', servicios_tenant: 'Módulos', ajuste_creditos: 'Ajuste de créditos', prueba_otorgada: 'Prueba otorgada',
  prueba_revocada: 'Prueba revocada', eliminar_tenant: 'Negocio eliminado', plan_creado: 'Plan creado', plan_actualizado: 'Plan actualizado', incidencia_actualizada: 'Reporte atendido', impersonacion: 'Ver como',
}
const etiqueta = (a: string) => ACCIONES[a] ?? a.replace(/_/g, ' ')

/** Resumen corto del detalle: "antes → despues" cuando existe, si no clave: valor. */
function resumen(d: Record<string, unknown>): string {
  const texto = (v: unknown) => (v !== null && typeof v === 'object' ? JSON.stringify(v) : String(v))
  if ('antes' in d && 'despues' in d && typeof d.antes !== 'object') return `${texto(d.antes)} → ${texto(d.despues)}${d.motivo ? ` · ${texto(d.motivo)}` : ''}`
  return Object.entries(d).filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => `${k}: ${texto(v)}`).join(' · ')
}

/** Bitácora de lo que tocó gerencia. Solo lectura. */
export default function Auditoria() {
  const [accion, setAccion] = useState('')
  const [limite, setLimite] = useState(50)
  const q = new URLSearchParams({ limite: String(limite) })
  if (accion) q.set('accion', accion)
  const datos = useApi<EntradaAuditoria[]>(`/gerencia/auditoria?${q}`)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Auditoría</h1>
          <p className="mt-1 text-ink-muted">Qué tocó gerencia y cuándo. No se puede editar ni borrar.</p>
        </div>
        <select className="field w-auto" aria-label="Acción" value={accion} onChange={(e) => setAccion(e.target.value)}>
          <option value="">Todas las acciones</option>
          {Object.entries(ACCIONES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </div>
      <div className="space-y-4">
        {datos.error && <Aviso tipo="error">{datos.error.message}</Aviso>}
        <section className="card overflow-hidden" aria-label="Bitácora">
          {datos.cargando && !datos.datos ? <div className="p-8 text-center"><Spinner /></div>
            : !datos.datos?.length ? <p className="p-8 text-center text-sm text-ink-muted">Sin movimientos.</p> : (
              <ul className="divide-y divide-line">
                {datos.datos.map((e) => (
                  <li key={e.id} className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-3 text-sm">
                    <span className="w-36 shrink-0 tabular-nums text-ink-muted">{fechaCorta(e.creado_en)} {hora(e.creado_en)}</span>
                    <span className="w-40 shrink-0 font-semibold">{etiqueta(e.accion)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block">{e.tenant_nombre ?? (e.tenant_id ? e.tenant_id : 'Plataforma')} <span className="text-ink-muted">· {e.actor_email}</span></span>
                      <span className="block break-words text-xs text-ink-muted">{resumen(e.detalle)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          {datos.datos && datos.datos.length >= limite && limite < 200 && (
            <div className="border-t border-line p-3 text-center"><button type="button" className="btn-ghost min-h-9 px-4 text-sm" onClick={() => setLimite(200)}>Ver más</button></div>
          )}
        </section>
      </div>
    </div>
  )
}
