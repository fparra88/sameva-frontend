import { useMemo, useState, type ReactNode } from 'react'
import { infoCanal, Spinner } from '../../components'
import { dinero, etiquetaEtapa } from '../../lib/formato'
import type { ConversionEmbudo, EmbudoDatos, MetricasEmbudo, TendenciaEmbudo } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso } from '../ui'
import { TONO, duracion } from './etapas'

const PERIODOS = [['30', '30 días'], ['90', '90 días'], ['365', '12 meses'], ['', 'Todo']] as const
const SERIES = [['nuevos', 'Nuevos', 'bg-primary/60'], ['ganados', 'Ganados', 'bg-success'], ['perdidos', 'Perdidos', 'bg-danger']] as const

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v)}%`)
/** "2026-03" → "mar". */
const mesCorto = (p: string) => {
  const [a, m] = p.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString('es-MX', { month: 'short', timeZone: 'UTC' }).replace('.', '')
}

function Panel({ titulo, nota, children, className = '' }: { titulo: string; nota?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 ${className}`} aria-label={titulo}>
      <h2 className="text-base font-semibold">{titulo}</h2>
      {nota && <p className="mt-0.5 text-xs text-ink-muted">{nota}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

const Vacio = ({ children }: { children: ReactNode }) =>
  <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">{children}</p>

/** Barras horizontales simples (CSS, sin librería de gráficos). */
function Barras({ filas }: { filas: { clave: string; etiqueta: string; valor: number; detalle?: string }[] }) {
  const max = Math.max(1, ...filas.map((f) => f.valor))
  return (
    <ul className="space-y-3">
      {filas.map((f) => (
        <li key={f.clave} title={`${f.etiqueta}: ${f.valor}${f.detalle ? ` · ${f.detalle}` : ''}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate first-letter:uppercase">{f.etiqueta}</span>
            <span className="shrink-0 tabular-nums text-ink-muted"><span className="font-semibold text-ink">{f.valor}</span>{f.detalle ? ` · ${f.detalle}` : ''}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary/70" style={{ width: `${(f.valor / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Lectura del embudo por período (leads que ENTRARON en ese lapso): conversión entre etapas, tiempo por etapa,
 * tendencia mensual y vendedores. Canales y motivos de pérdida son históricos (vienen del tablero).
 */
export function Analisis({ tenantId, datos }: { tenantId: string; datos: EmbudoDatos }) {
  const [periodo, setPeriodo] = useState<string>('90')
  // A medianoche local: la ruta no cambia en cada render y useApi no vuelve a pedir.
  const rango = useMemo(() => {
    if (!periodo) return ''
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - Number(periodo))
    return `?desde=${encodeURIComponent(d.toISOString())}`
  }, [periodo])

  const metricas = useApi<MetricasEmbudo>(`/tenants/${tenantId}/metricas${rango}`)
  const conversion = useApi<ConversionEmbudo>(`/tenants/${tenantId}/metricas/conversion${rango}`)
  const tendencia = useApi<TendenciaEmbudo>(`/tenants/${tenantId}/metricas/tendencia?meses=6`)

  const error = metricas.error ?? conversion.error ?? tendencia.error
  const horas = new Map((metricas.datos?.etapas ?? []).map((e) => [e.estado, e.horas_promedio]))
  const conteo = new Map((metricas.datos?.etapas ?? []).map((e) => [e.estado, e.total]))
  const pasos = conversion.datos?.etapas ?? []
  const meses = tendencia.datos?.meses ?? []
  const maxMes = Math.max(1, ...meses.flatMap((m) => [m.nuevos, m.ganados, m.perdidos]))
  const ranking = metricas.datos?.ranking ?? []
  const cargando = (metricas.cargando && !metricas.datos) || (conversion.cargando && !conversion.datos)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-ink-muted">Conversaciones que entraron en</span>
        <div className="flex gap-1 rounded-full bg-muted p-1" role="group" aria-label="Período">
          {PERIODOS.map(([v, l]) => (
            <button key={v} type="button" aria-pressed={periodo === v} onClick={() => setPeriodo(v)}
              className={`min-h-8 cursor-pointer rounded-full px-3 text-xs font-semibold transition ${periodo === v ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {error && <Aviso tipo="error">{error.message}</Aviso>}
      {cargando ? <div className="py-16 text-center"><Spinner /></div> : (
        <div className={`grid grid-cols-1 gap-4 lg:grid-cols-5 ${metricas.cargando || conversion.cargando ? 'opacity-60' : ''} transition-opacity`}>
          <Panel className="lg:col-span-3" titulo="Conversión por etapa"
            nota={`De ${conversion.datos?.total_leads ?? 0} conversaciones del período, cuántos llegaron a cada etapa y cuánto se quedan en ella.`}>
            {(conversion.datos?.total_leads ?? 0) === 0 ? <Vacio>No entraron conversaciones en este período.</Vacio> : (
              <ol className="space-y-1.5">
                {pasos.map((p, i) => {
                  const previo = i > 0 ? pasos[i - 1].alcanzados : null
                  const avance = previo ? Math.round((p.alcanzados / previo) * 100) : null
                  return (
                    <li key={p.estado} className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 sm:grid-cols-[8.5rem_1fr_6rem]"
                      title={`${etiquetaEtapa(p.estado)}: ${p.alcanzados} conversaciones (${Math.round(p.porcentaje)}% del total)${avance !== null ? ` · ${avance}% de la etapa anterior` : ''}`}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{etiquetaEtapa(p.estado)}</p>
                        <p className="text-[11px] text-ink-muted">{p.estado === 'ganado' ? `${conteo.get('ganado') ?? 0} cerrados` : `prom. ${duracion(horas.get(p.estado) ?? null)}`}</p>
                      </div>
                      {/* Barra centrada: la silueta se estrecha como un embudo. */}
                      <div className="flex justify-center rounded-lg bg-muted/60">
                        <div className={`h-9 rounded-lg ${TONO[p.estado]} transition-[width] duration-300`} style={{ width: `${Math.max(p.alcanzados ? 3 : 0, p.porcentaje)}%` }} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{p.alcanzados}</p>
                        <p className="text-[11px] tabular-nums text-ink-muted">{avance !== null ? `${avance}% avanza` : '100%'}</p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
            <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-center">
              <div><dt className="text-xs text-ink-muted">Tasa de cierre</dt><dd className="font-display text-xl font-bold tabular-nums">{pct(metricas.datos?.tasa_conversion_global ?? null)}</dd></div>
              <div><dt className="text-xs text-ink-muted">Ganados</dt><dd className="font-display text-xl font-bold tabular-nums">{conteo.get('ganado') ?? 0}</dd></div>
              <div><dt className="text-xs text-ink-muted">Perdidos</dt><dd className="font-display text-xl font-bold tabular-nums">{conteo.get('perdido') ?? 0}</dd></div>
            </dl>
          </Panel>

          <Panel className="lg:col-span-2" titulo="Últimos 6 meses" nota="Conversaciones nuevas y cierres por mes.">
            <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              {SERIES.map(([k, l, c]) => <li key={k} className="inline-flex items-center gap-1.5"><span className={`size-2.5 rounded-sm ${c}`} aria-hidden />{l}</li>)}
            </ul>
            <div className="flex h-44 items-end gap-2 border-b border-line" role="img"
              aria-label={`Tendencia mensual: ${meses.map((m) => `${mesCorto(m.periodo)} ${m.nuevos} nuevos, ${m.ganados} ganados, ${m.perdidos} perdidos`).join('; ')}`}>
              {meses.map((m) => (
                <div key={m.periodo} className="flex h-full flex-1 items-end justify-center gap-0.5 rounded-t-md transition hover:bg-muted/70"
                  title={`${mesCorto(m.periodo)}: ${m.nuevos} nuevos · ${m.ganados} ganados (${dinero(m.monto_ganado) || '$0'}) · ${m.perdidos} perdidos`}>
                  {SERIES.map(([k, , c]) => (
                    <div key={k} className={`w-full max-w-3 rounded-t ${c}`} style={{ height: `${m[k] ? Math.max(3, (m[k] / maxMes) * 100) : 0}%` }} />
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-1 flex gap-2 text-center text-[11px] text-ink-muted">{meses.map((m) => <span key={m.periodo} className="flex-1">{mesCorto(m.periodo)}</span>)}</div>
          </Panel>

          <Panel className="lg:col-span-3" titulo="Vendedores" nota="Sobre las conversaciones del período.">
            {ranking.length === 0 ? <Vacio>Todavía no hay vendedores registrados.</Vacio> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[30rem] text-left text-sm">
                  <thead className="text-xs text-ink-muted">
                    <tr>
                      <th scope="col" className="pb-2 font-medium">Vendedor</th>
                      <th scope="col" className="pb-2 text-right font-medium">Abiertos</th>
                      <th scope="col" className="pb-2 text-right font-medium">Ganados</th>
                      <th scope="col" className="pb-2 text-right font-medium">Perdidos</th>
                      <th scope="col" className="pb-2 text-right font-medium">Cierre</th>
                      <th scope="col" className="pb-2 text-right font-medium">Vendido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {ranking.map((v) => (
                      <tr key={v.vendedor_id}>
                        <td className="py-2 pr-2 font-medium">{v.nombre}{!v.activo && <span className="ml-1.5 text-xs font-normal text-ink-muted">(inactivo)</span>}</td>
                        <td className="py-2 text-right tabular-nums">{v.abiertos}</td>
                        <td className="py-2 text-right tabular-nums">{v.ganados}</td>
                        <td className="py-2 text-right tabular-nums">{v.perdidos}</td>
                        <td className="py-2 text-right tabular-nums">{pct(v.tasa_cierre)}</td>
                        <td className="py-2 text-right font-semibold tabular-nums">{dinero(v.monto_ganado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <div className="space-y-4 lg:col-span-2">
            <Panel titulo="De dónde llegan" nota="Histórico, por canal del chat.">
              {datos.por_canal.length === 0 ? <Vacio>Sin conversaciones todavía.</Vacio> : (
                <Barras filas={datos.por_canal.map((c) => ({
                  clave: c.canal, etiqueta: c.canal === 'sin_chat' ? 'Alta manual' : infoCanal(c.canal).nombre,
                  valor: c.total, detalle: `${c.ganados} ganados`,
                }))} />
              )}
            </Panel>
            <Panel titulo="Por qué se pierden" nota="Motivos más repetidos al marcar «Perdido».">
              {datos.motivos_perdida.length === 0 ? <Vacio>Aún no hay motivos de pérdida registrados.</Vacio> : (
                <Barras filas={datos.motivos_perdida.map((m) => ({ clave: m.motivo, etiqueta: m.motivo, valor: m.total }))} />
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  )
}
