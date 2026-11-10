import { CaretLeft, CaretRight, Coins } from '@phosphor-icons/react'
import { useState } from 'react'
import { Spinner } from '../../components'
import { useApi } from '../../lib/useApi'
import { Aviso } from '../ui'

interface ConsumoItem { id: string; herramienta: string; creditos: string | number; bolsa: 'plan' | 'comprados' | null; creado_en: string; whatsapp: string | null; canal: string | null }
interface ConsumoPagina { items: ConsumoItem[]; total: number; limite: number; offset: number; zona_horaria: string }
interface ConsumoResumen {
  total_creditos: string | number
  por_herramienta: { herramienta: string; creditos: string | number }[]
  por_dia: { dia: string; creditos: string | number }[]
  zona_horaria: string
}

const POR_PAGINA = 25
const num = (v: string | number) => Number(v).toLocaleString('es-MX')

/** "2026-03-10" → "10 mar". UTC para que el día no se corra por la zona del navegador. */
function etiquetaDia(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d)).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}

const fechaHoraZona = (iso: string, zona: string) => {
  try { return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short', timeZone: zona || undefined }) }
  catch { return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) }
}

/**
 * Auditoría del gasto de créditos por herramienta: resumen, gráficos y tabla
 * paginada (más recientes primero). El negocio lo decide el backend por la
 * sesión; aquí solo se piden fechas y herramienta. Solo el owner (el backend también lo exige).
 */
export function ConsumoCreditos({ herramientas }: { herramientas: { clave: string; nombre: string }[] }) {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [herramienta, setHerramienta] = useState('')
  const [pagina, setPagina] = useState(0)

  const filtros = new URLSearchParams()
  if (desde) filtros.set('desde', desde)
  if (hasta) filtros.set('hasta', hasta)
  if (herramienta) filtros.set('herramienta', herramienta)
  const base = filtros.toString()
  const q = new URLSearchParams(base)
  q.set('limite', String(POR_PAGINA)); q.set('offset', String(pagina * POR_PAGINA))

  const rangoInvalido = desde !== '' && hasta !== '' && desde > hasta
  // Con el rango invertido no se pregunta: el backend respondería 422.
  const lista = useApi<ConsumoPagina>(rangoInvalido ? null : `/herramientas/consumo?${q}`)
  const resumen = useApi<ConsumoResumen>(rangoInvalido ? null : `/herramientas/consumo/resumen${base ? `?${base}` : ''}`)
  const cambiar = (fn: () => void) => { fn(); setPagina(0) }

  const datos = lista.datos
  const total = datos?.total ?? 0
  const ultima = Math.max(0, Math.ceil(total / POR_PAGINA) - 1)
  const zona = datos?.zona_horaria ?? resumen.datos?.zona_horaria ?? ''
  const porDia = resumen.datos?.por_dia ?? []
  const porHerr = resumen.datos?.por_herramienta ?? []
  const maxDia = Math.max(1, ...porDia.map((d) => Number(d.creditos)))
  const maxHerr = Math.max(1, ...porHerr.map((h) => Number(h.creditos)))

  return (
    <section className="card space-y-4 p-5" aria-label="Consumo de créditos">
      <header className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-strong"><Coins size={20} aria-hidden /></span>
        <div>
          <h2 className="font-semibold">Consumo de créditos</h2>
          <p className="text-sm text-ink-muted">Cada vez que tu agente usa una herramienta se descuenta 1 crédito. Aquí queda el detalle.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="c-desde" className="field-label">Desde</label>
          <input id="c-desde" type="date" className="field" value={desde} max={hasta || undefined} onChange={(e) => cambiar(() => setDesde(e.target.value))} />
        </div>
        <div>
          <label htmlFor="c-hasta" className="field-label">Hasta</label>
          <input id="c-hasta" type="date" className="field" value={hasta} min={desde || undefined} onChange={(e) => cambiar(() => setHasta(e.target.value))} />
        </div>
        <div>
          <label htmlFor="c-herr" className="field-label">Herramienta</label>
          <select id="c-herr" className="field" value={herramienta} onChange={(e) => cambiar(() => setHerramienta(e.target.value))}>
            <option value="">Todas</option>
            {herramientas.map((h) => <option key={h.clave} value={h.clave}>{h.nombre}</option>)}
          </select>
        </div>
      </div>

      {rangoInvalido && <Aviso tipo="error">La fecha inicial no puede ser posterior a la final.</Aviso>}
      {!rangoInvalido && (lista.error || resumen.error) && <Aviso tipo="error">{(lista.error ?? resumen.error)!.message}</Aviso>}

      {!rangoInvalido && resumen.datos && porDia.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs text-ink-muted">
              {num(resumen.datos.total_creditos)} créditos en el periodo{porHerr[0] ? ` · más usada: ${porHerr[0].herramienta}` : ''}
            </p>
            {/* Barras por día con CSS: sin librería de gráficos. */}
            <div className="flex h-44 items-end gap-1 overflow-x-auto border-b border-line pb-px" role="img" aria-label="Créditos gastados por día">
              {porDia.map((d) => (
                <div key={d.dia} className="group flex h-full min-w-5 flex-1 flex-col justify-end" title={`${etiquetaDia(d.dia)}: ${num(d.creditos)} créditos`}>
                  <span className="mb-0.5 text-center text-[10px] tabular-nums text-ink-muted opacity-0 group-hover:opacity-100">{num(d.creditos)}</span>
                  <div className="w-full rounded-t bg-primary transition-opacity group-hover:opacity-80" style={{ height: `${Math.max(3, (Number(d.creditos) / maxDia) * 100)}%` }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-ink-muted"><span>{etiquetaDia(porDia[0].dia)}</span><span>{etiquetaDia(porDia[porDia.length - 1].dia)}</span></div>
          </div>
          <div>
            <p className="mb-2 text-xs text-ink-muted">Por herramienta</p>
            <ul className="space-y-2">
              {porHerr.slice(0, 8).map((h) => (
                <li key={h.herramienta}>
                  <div className="flex justify-between text-sm"><span className="truncate">{h.herramienta}</span><span className="tabular-nums text-ink-muted">{num(h.creditos)}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-accent" style={{ width: `${(Number(h.creditos) / maxHerr) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {lista.cargando && !datos ? <div className="text-center"><Spinner /></div>
        : datos && datos.items.length === 0 ? <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">No hay consumo de créditos en este periodo.</p>
        : datos ? (
          <div className={lista.cargando ? 'opacity-60' : undefined}>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-muted/60 text-xs text-ink-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">Herramienta</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Créditos</th>
                    <th scope="col" className="px-3 py-2 font-medium">Fecha y hora{zona ? ` (${zona})` : ''}</th>
                    <th scope="col" className="px-3 py-2 font-medium">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {datos.items.map((c) => (
                    <tr key={c.id}>
                      <td className="px-3 py-2">{c.herramienta}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(c.creditos)}</td>
                      <td className="px-3 py-2 tabular-nums text-ink-muted">{fechaHoraZona(c.creado_en, datos.zona_horaria)}</td>
                      <td className="px-3 py-2 tabular-nums text-ink-muted">{c.whatsapp ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-xs text-ink-muted">{datos.offset + 1}–{datos.offset + datos.items.length} de {total.toLocaleString('es-MX')}</span>
              <div className="flex gap-2">
                <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => setPagina((p) => Math.max(0, p - 1))} disabled={pagina === 0 || lista.cargando} aria-label="Página anterior"><CaretLeft size={14} aria-hidden /> Anterior</button>
                <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => setPagina((p) => Math.min(ultima, p + 1))} disabled={pagina >= ultima || lista.cargando} aria-label="Página siguiente">Siguiente <CaretRight size={14} aria-hidden /></button>
              </div>
            </div>
          </div>
        ) : null}
    </section>
  )
}
