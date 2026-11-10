import { MagnifyingGlass, Robot, User } from '@phosphor-icons/react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { CANALES, CanalBadge, Spinner } from '../../components'
import { esDeNegocio } from '../../lib/roles'
import { useAuth } from '../../lib/auth'
import { etiquetaEtapa, hace, iniciales, nombreContacto } from '../../lib/formato'
import type { ConversacionItem, Lead } from '../../lib/tipos'
import type { Carga } from '../../lib/useApi'

export interface Filtros { buscar: string; canal: string; estado: string; asignada: string }
export const FILTROS_VACIOS: Filtros = { buscar: '', canal: '', estado: '', asignada: '' }

const SELECT = 'min-h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 text-sm outline-none focus:border-primary'

export function ListaConversaciones({
  carga, filtros, onFiltros, leads, idActivo, hayMas, onMas,
}: {
  carga: Carga<ConversacionItem[]>
  filtros: Filtros
  onFiltros: (f: Filtros) => void
  leads: Map<string, Lead>
  idActivo?: string
  hayMas: boolean
  onMas: () => void
}) {
  const { usuario } = useAuth()
  const [abiertos, setAbiertos] = useState(false)
  const set = (k: keyof Filtros) => (v: string) => onFiltros({ ...filtros, [k]: v })
  const hayFiltros = Object.values(filtros).some(Boolean)

  return (
    <section aria-label="Conversaciones" className="flex h-full min-h-0 flex-col">
      <div className="space-y-2 border-b border-line p-3">
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="search" value={filtros.buscar} onChange={(e) => set('buscar')(e.target.value)}
            placeholder="Buscar nombre o número" aria-label="Buscar conversación" maxLength={100}
            className="min-h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1.5 text-xs">
          {([['', 'Todas'], ['mias', 'Mías'], ['sin_asignar', 'Sin asignar']] as const).map(([v, l]) => (
            <button key={v} type="button" onClick={() => set('asignada')(v)} aria-pressed={filtros.asignada === v}
              className={`cursor-pointer rounded-full px-3 py-1.5 font-medium transition ${filtros.asignada === v ? 'bg-primary text-on-primary' : 'bg-muted text-ink-muted hover:text-ink'}`}>
              {l}
            </button>
          ))}
          <button type="button" onClick={() => setAbiertos((x) => !x)} aria-expanded={abiertos}
            className="ml-auto cursor-pointer rounded-full bg-muted px-3 py-1.5 font-medium text-ink-muted hover:text-ink">Filtros</button>
        </div>
        {abiertos && (
          <div className="flex gap-2">
            <select aria-label="Canal" value={filtros.canal} onChange={(e) => set('canal')(e.target.value)} className={SELECT}>
              <option value="">Todos los canales</option>
              {Object.entries(CANALES).map(([k, c]) => <option key={k} value={k}>{c.nombre}</option>)}
            </select>
            <select aria-label="Estado" value={filtros.estado} onChange={(e) => set('estado')(e.target.value)} className={SELECT}>
              <option value="">Cualquier estado</option>
              <option value="active">IA atendiendo</option>
              <option value="transferred">Con una persona</option>
            </select>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {carga.error && <p role="alert" className="m-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">{carga.error.message}</p>}
        {!carga.datos && carga.cargando && <div className="p-6 text-center"><Spinner /></div>}
        {carga.datos?.length === 0 && (
          <div className="px-6 py-14 text-center">
            <p className="font-semibold">{hayFiltros ? 'Sin resultados' : 'Todavía no hay conversaciones'}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {hayFiltros ? 'Prueba con otro nombre, número o filtro.' : 'Cuando un cliente escriba por un canal conectado, aparecerá aquí.'}
            </p>
            {hayFiltros && <button type="button" className="btn-ghost mt-4" onClick={() => onFiltros(FILTROS_VACIOS)}>Quitar filtros</button>}
          </div>
        )}
        <ul className={carga.cargando && carga.datos ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          {carga.datos?.map((c) => {
            const nombre = nombreContacto(c)
            const lead = c.user_id ? leads.get(c.user_id) : undefined
            const humano = c.status === 'transferred'
            return (
              <li key={c.id}>
                <NavLink to={`/portal/bandeja/${c.id}`} aria-current={c.id === idActivo ? 'true' : undefined}
                  className={`flex gap-3 border-b border-line/60 px-3 py-3 transition hover:bg-muted/60 ${c.id === idActivo ? 'bg-primary-soft/60' : ''}`}>
                  <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-strong" aria-hidden>
                    {iniciales(nombre)}
                    <span className="absolute -bottom-1 -right-1"><CanalBadge tipo={c.channel_type} size={12} /></span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold">{nombre}</span>
                      <time dateTime={c.last_message_at} className="shrink-0 text-xs text-ink-muted">{hace(c.last_message_at)}</time>
                    </span>
                    <span className="block truncate text-sm text-ink-muted">{c.ultimo_mensaje ?? '—'}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] font-medium">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${humano ? 'bg-accent-soft text-accent' : 'bg-muted text-ink-muted'}`}>
                        {humano ? <User size={11} aria-hidden /> : <Robot size={11} aria-hidden />}
                        {humano ? (c.asignado_nombre ?? 'Persona') : 'IA'}
                      </span>
                      {lead && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-primary-strong">{etiquetaEtapa(lead.estado)}</span>}
                      {lead?.vendedor_nombre && esDeNegocio(usuario) && <span className="truncate text-ink-muted">· {lead.vendedor_nombre}</span>}
                    </span>
                  </span>
                </NavLink>
              </li>
            )
          })}
        </ul>
        {hayMas && <div className="p-3 text-center"><button type="button" className="btn-ghost" onClick={onMas} disabled={carga.cargando}>Cargar más</button></div>}
      </div>
    </section>
  )
}
