import { useState } from 'react'
import { Spinner } from '../components'
import { fechaCorta } from '../lib/formato'
import type { CohorteGerencia, ConsumoGerencia } from '../lib/tipos'
import { useApi } from '../lib/useApi'
import { Aviso } from '../portal/ui'

const num = (v: number | string) => Number(v).toLocaleString('es-MX')
const usd = (v: number | string) => `US$ ${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const MES = new Intl.DateTimeFormat('es-MX', { month: 'short', year: '2-digit', timeZone: 'UTC' })
const mes = (iso: string) => MES.format(new Date(`${iso}T00:00:00Z`))

/** Consumo de modelos de toda la plataforma (gráficas con CSS, sin librería) y retención por cohortes. */
export default function Consumo() {
  const [dias, setDias] = useState(30)
  const consumo = useApi<ConsumoGerencia>(`/gerencia/consumo?dias=${dias}`)
  const cohortes = useApi<{ meses: number; cohortes: CohorteGerencia[] }>('/gerencia/cohortes?meses=12')
  const c = consumo.datos
  const maxDia = Math.max(1, ...(c?.por_dia.map((d) => Number(d.costo_usd)) ?? [1]))
  const maxModelo = Math.max(1, ...(c?.por_modelo.map((m) => Number(m.costo_usd)) ?? [1]))
  const columnas = Math.max(0, ...(cohortes.datos?.cohortes.map((x) => x.retencion.length) ?? [0]))

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Consumo</h1>
          <p className="mt-1 text-ink-muted">Costo de modelos de toda la plataforma y retención de negocios.</p>
        </div>
        <label className="text-sm text-ink-muted">Ventana
          <select className="field ml-2 inline-block w-auto" value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {[7, 30, 90].map((d) => <option key={d} value={d}>{d} días</option>)}
          </select>
        </label>
      </div>

      <div className="space-y-4">
        {(consumo.error || cohortes.error) && <Aviso tipo="error">{(consumo.error ?? cohortes.error)!.message}</Aviso>}
        {consumo.cargando && !c && <div className="p-8 text-center"><Spinner /></div>}

        {c && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[['Costo', usd(c.total.costo_usd)], ['Llamadas', num(c.total.llamadas)], ['Tokens', num(c.total.tokens_total)], ['Entrada / salida', `${num(c.total.tokens_entrada)} / ${num(c.total.tokens_salida)}`]].map(([t, v]) => (
                <div key={t} className="card p-4"><p className="text-xs text-ink-muted">{t}</p><p className="mt-1 text-lg font-bold tabular-nums">{v}</p></div>
              ))}
            </div>

            <section className="card p-5" aria-labelledby="dia-t">
              <h2 id="dia-t" className="font-semibold">Costo por día</h2>
              {c.por_dia.length === 0 ? <p className="mt-3 text-sm text-ink-muted">Sin consumo en la ventana.</p> : (
                <div className="mt-4 flex h-40 items-end gap-1" role="img" aria-label={`Costo diario, máximo ${usd(maxDia)}`}>
                  {c.por_dia.map((d) => (
                    <div key={d.dia} className="group relative flex h-full flex-1 items-end" title={`${fechaCorta(d.dia)}: ${usd(d.costo_usd)} · ${num(d.llamadas)} llamadas`}>
                      <div className="w-full rounded-t bg-primary/80 transition group-hover:bg-primary" style={{ height: `${Math.max(2, (Number(d.costo_usd) / maxDia) * 100)}%` }} />
                    </div>
                  ))}
                </div>
              )}
              {c.por_dia.length > 0 && <div className="mt-1 flex justify-between text-xs text-ink-muted"><span>{fechaCorta(c.por_dia[0].dia)}</span><span>{fechaCorta(c.por_dia[c.por_dia.length - 1].dia)}</span></div>}
            </section>

            <section className="card p-5" aria-labelledby="mod-t">
              <h2 id="mod-t" className="font-semibold">Por modelo</h2>
              <ul className="mt-3 space-y-3">
                {c.por_modelo.map((m) => (
                  <li key={m.modelo}>
                    <div className="flex justify-between gap-3 text-sm"><span className="truncate font-medium">{m.modelo}</span><span className="tabular-nums text-ink-muted">{usd(m.costo_usd)} · {num(m.tokens_total)} tokens · {num(m.llamadas)} llamadas</span></div>
                    <div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-accent" style={{ width: `${(Number(m.costo_usd) / maxModelo) * 100}%` }} /></div>
                  </li>
                ))}
                {c.por_modelo.length === 0 && <li className="text-sm text-ink-muted">Sin consumo en la ventana.</li>}
              </ul>
            </section>
          </>
        )}

        <section className="card overflow-hidden" aria-labelledby="coh-t">
          <div className="border-b border-line px-5 py-3">
            <h2 id="coh-t" className="font-semibold">Retención por cohorte</h2>
            <p className="text-xs text-ink-muted">Porcentaje de los negocios dados de alta cada mes que siguió con mensajes los meses siguientes. El mes en curso va incompleto.</p>
          </div>
          {cohortes.cargando && !cohortes.datos ? <div className="p-6 text-center"><Spinner /></div>
            : !cohortes.datos?.cohortes.length ? <p className="p-6 text-center text-sm text-ink-muted">Todavía no hay cohortes.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-center text-xs">
                  <thead className="text-ink-muted"><tr>
                    <th scope="col" className="px-4 py-2 text-left font-medium">Alta</th><th scope="col" className="px-2 py-2 font-medium">Negocios</th>
                    {Array.from({ length: columnas }, (_, i) => <th key={i} scope="col" className="px-2 py-2 font-medium">Mes {i}</th>)}
                  </tr></thead>
                  <tbody>
                    {cohortes.datos.cohortes.map((x) => (
                      <tr key={x.mes} className="border-t border-line">
                        <th scope="row" className="px-4 py-1.5 text-left font-medium capitalize">{mes(x.mes)}</th>
                        <td className="px-2 py-1.5 tabular-nums">{x.tamano}</td>
                        {Array.from({ length: columnas }, (_, i) => {
                          const r = x.retencion[i]
                          return <td key={i} className="px-1 py-1" title={r === undefined ? '' : `${x.activos[i]} de ${x.tamano}`}>
                            {r === undefined ? null : <span className="block rounded px-1 py-1 tabular-nums" style={{ background: `color-mix(in srgb, var(--color-primary) ${Math.round(r * 0.8)}%, transparent)` }}>{Math.round(r)}%</span>}
                          </td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </div>
    </div>
  )
}
