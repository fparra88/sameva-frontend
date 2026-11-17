import { CalendarCheck, ChatCircleDots, Clock, UserCircle } from '@phosphor-icons/react'
import { useState } from 'react'
import { infoCanal } from '../../components'
import { dinero, etiquetaEtapa, fechaCorta, hace, iniciales } from '../../lib/formato'
import type { EtapaResumen, LeadEmbudo } from '../../lib/tipos'
import { CERRADAS, ETAPAS, TONO, autorMensaje, diasEnEtapa, esperaRespuesta, nombreLead, seguimientoVencido } from './etapas'

function Tarjeta({ lead, ocupada, onAbrir, onArrastre }: {
  lead: LeadEmbudo
  ocupada: boolean
  onAbrir: () => void
  onArrastre: (l: LeadEmbudo | null) => void
}) {
  const nombre = nombreLead(lead)
  const canal = lead.canal ? infoCanal(lead.canal) : null
  const dias = diasEnEtapa(lead)
  const vencido = seguimientoVencido(lead)
  const movible = lead.transiciones_posibles.length > 0

  return (
    <div
      role="button" tabIndex={0} aria-label={`${nombre}, ${etiquetaEtapa(lead.estado)}. Abrir ficha`}
      draggable={movible && !ocupada}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', lead.user_id); onArrastre(lead) }}
      onDragEnd={() => onArrastre(null)}
      onClick={onAbrir}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAbrir() } }}
      className={`card cursor-pointer p-3 text-left shadow-sm transition duration-200 hover:border-primary/50 hover:shadow-md ${ocupada ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-strong" aria-hidden>
          {iniciales(nombre)}
          {canal && (
            <span className={`absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-surface ${canal.color}`} title={canal.nombre}>
              <canal.Icono size={12} weight="fill" />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{nombre}</span>
          <span className="block truncate text-xs text-ink-muted">{lead.vendedor_nombre ?? 'Sin vendedor'}</span>
        </span>
        {lead.monto_estimado != null && <span className="shrink-0 text-sm font-semibold tabular-nums">{dinero(lead.monto_estimado)}</span>}
      </div>

      {lead.ultimo_mensaje && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-ink-muted">
          <ChatCircleDots size={13} className="mt-0.5 shrink-0" aria-hidden />
          <span className="line-clamp-2 break-words"><span className="font-medium text-ink">{autorMensaje(lead.ultimo_mensaje_rol)}:</span> {lead.ultimo_mensaje}</span>
        </p>
      )}
      {lead.estado === 'perdido' && lead.motivo_perdida && <p className="mt-2 line-clamp-2 text-xs text-ink-muted">Motivo: {lead.motivo_perdida}</p>}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
        {esperaRespuesta(lead) && <span className="rounded-full bg-danger/10 px-2 py-0.5 text-danger">Espera respuesta</span>}
        {lead.proximo_seguimiento && !CERRADAS.has(lead.estado) && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${vencido ? 'bg-danger/10 text-danger' : 'bg-accent-soft text-accent'}`}
            title={lead.seguimiento_nota ?? undefined}>
            <CalendarCheck size={11} aria-hidden /> {vencido ? 'Vencido · ' : ''}{fechaCorta(lead.proximo_seguimiento)}
          </span>
        )}
        {!lead.vendedor_id && !CERRADAS.has(lead.estado) && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-ink-muted"><UserCircle size={11} aria-hidden /> Sin asignar</span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-ink-muted" title="Tiempo en esta etapa · último mensaje">
          <Clock size={11} aria-hidden />
          {dias === null ? '—' : dias === 0 ? 'hoy' : `${dias} d`}
          {lead.ultimo_mensaje_en && <span aria-hidden>· {hace(lead.ultimo_mensaje_en)}</span>}
        </span>
      </div>
    </div>
  )
}

/**
 * Tablero por etapas. Arrastrar una tarjeta la mueve de etapa (solo a las que la máquina de estados permite:
 * las demás columnas se atenúan); en táctil o con teclado se abre la ficha y se cambia ahí.
 */
export function Tablero({ leads, resumen, filtrado, moviendo, onAbrir, onMover }: {
  leads: LeadEmbudo[]
  resumen: EtapaResumen[]
  /** Con filtros activos los totales salen de lo visible, no del resumen del servidor. */
  filtrado: boolean
  moviendo: string | null
  onAbrir: (l: LeadEmbudo) => void
  onMover: (l: LeadEmbudo, estado: string) => void
}) {
  const [arrastrado, setArrastrado] = useState<LeadEmbudo | null>(null)
  const [sobre, setSobre] = useState<string | null>(null)

  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6" role="list" aria-label="Etapas del embudo">
      {ETAPAS.map((etapa) => {
        const tarjetas = leads.filter((l) => l.estado === etapa)
        const real = resumen.find((r) => r.estado === etapa)
        const total = filtrado ? tarjetas.length : (real?.total ?? tarjetas.length)
        const monto = filtrado ? tarjetas.reduce((s, l) => s + Number(l.monto_estimado ?? 0), 0) : Number(real?.monto ?? 0)
        const destino = arrastrado !== null && arrastrado.transiciones_posibles.includes(etapa)
        const atenuada = arrastrado !== null && !destino && arrastrado.estado !== etapa

        return (
          <section key={etapa} role="listitem" aria-label={`${etiquetaEtapa(etapa)}: ${total}`}
            onDragOver={(e) => { if (destino) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setSobre(etapa) } }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSobre((s) => (s === etapa ? null : s)) }}
            onDrop={(e) => { e.preventDefault(); setSobre(null); if (arrastrado && destino) onMover(arrastrado, etapa); setArrastrado(null) }}
            className={`flex max-h-[calc(100dvh-13rem)] min-h-64 w-[17.5rem] shrink-0 snap-start flex-col rounded-2xl border transition duration-200 ${
              sobre === etapa ? 'border-primary bg-primary-soft' : destino ? 'border-dashed border-primary/60 bg-muted/50' : 'border-line bg-muted/50'} ${atenuada ? 'opacity-40' : ''}`}>
            <header className="px-3 pb-2 pt-3">
              <div className="flex items-center gap-2">
                <span className={`size-2.5 shrink-0 rounded-full ${TONO[etapa]}`} aria-hidden />
                <h2 className="truncate font-sans text-sm font-semibold tracking-normal">{etiquetaEtapa(etapa)}</h2>
                <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-muted">{total}</span>
              </div>
              <p className="mt-0.5 pl-[1.125rem] text-xs tabular-nums text-ink-muted">{monto > 0 ? dinero(monto) : 'Sin monto estimado'}</p>
            </header>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-2">
              {tarjetas.map((l) => (
                <Tarjeta key={l.user_id} lead={l} ocupada={moviendo === l.user_id} onAbrir={() => onAbrir(l)} onArrastre={setArrastrado} />
              ))}
              {tarjetas.length === 0 && (
                <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-ink-muted">
                  {destino ? 'Suelta aquí' : filtrado ? 'Nada con estos filtros' : 'Sin conversaciones en esta etapa'}
                </p>
              )}
              {!filtrado && tarjetas.length > 0 && tarjetas.length < total && (
                <p className="px-2 py-1 text-center text-[11px] text-ink-muted">Últimos {tarjetas.length} de {total.toLocaleString('es-MX')}</p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
