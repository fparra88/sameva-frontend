import { ArrowClockwise, CalendarX, ChatCircleDots, Funnel, MagnifyingGlass, UserMinus, type Icon } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { infoCanal, Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { dinero, etiquetaEtapa, fechaCorta, hace } from '../../lib/formato'
import { esDeNegocio } from '../../lib/roles'
import { useEvento } from '../../lib/tiempoReal'
import type { EmbudoDatos, LeadEmbudo } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Dialogo } from '../ui'
import { Analisis } from './Analisis'
import { CERRADAS, TONO, abierto, autorMensaje, diasEnEtapa, esperaRespuesta, nombreLead, seguimientoVencido } from './etapas'
import { FichaLead } from './FichaLead'
import { Tablero } from './Tablero'

type Vista = 'tablero' | 'lista' | 'analisis'
type Foco = '' | 'espera' | 'vencido' | 'sin_vendedor'
const VISTAS: [Vista, string][] = [['tablero', 'Tablero'], ['lista', 'Lista'], ['analisis', 'Análisis']]
const FOCOS: { id: Exclude<Foco, ''>; etiqueta: string; Icono: Icon; filtro: (l: LeadEmbudo) => boolean }[] = [
  { id: 'espera', etiqueta: 'Esperan respuesta', Icono: ChatCircleDots, filtro: esperaRespuesta },
  { id: 'vencido', etiqueta: 'Seguimiento vencido', Icono: CalendarX, filtro: seguimientoVencido },
  { id: 'sin_vendedor', etiqueta: 'Sin vendedor', Icono: UserMinus, filtro: (l) => abierto(l) && !l.vendedor_id },
]
const SELECT = 'min-h-10 rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-primary'

function Indicador({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-ink-muted">{etiqueta}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{valor}</p>
      <p className="mt-0.5 truncate text-xs text-ink-muted">{detalle}</p>
    </div>
  )
}

function Lista({ leads, onAbrir }: { leads: LeadEmbudo[]; onAbrir: (l: LeadEmbudo) => void }) {
  if (leads.length === 0) return <p className="card px-4 py-12 text-center text-sm text-ink-muted">Ninguna conversación coincide con estos filtros.</p>
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[64rem] text-left text-sm">
        <thead className="bg-muted/60 text-xs text-ink-muted">
          <tr>
            {['Contacto', 'Etapa', 'Monto', 'Vendedor', 'Seguimiento', 'Último mensaje', 'Mensajes', 'En etapa', 'Entró'].map((t, i) => (
              <th key={t} scope="col" className={`px-3 py-2.5 font-medium ${i === 2 || i === 6 ? 'text-right' : ''}`}>{t}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {leads.map((l) => {
            const dias = diasEnEtapa(l)
            const vencido = seguimientoVencido(l)
            return (
              <tr key={l.user_id} className="cursor-pointer transition hover:bg-muted/50" onClick={() => onAbrir(l)}>
                <td className="px-3 py-2.5">
                  <button type="button" className="cursor-pointer text-left font-semibold hover:text-primary" onClick={(e) => { e.stopPropagation(); onAbrir(l) }}>{nombreLead(l)}</button>
                  <p className="text-xs text-ink-muted">{l.canal ? infoCanal(l.canal).nombre : 'Alta manual'}{l.cliente_handle ? ` · ${l.cliente_handle}` : ''}</p>
                </td>
                <td className="px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><span className={`size-2 rounded-full ${TONO[l.estado]}`} aria-hidden />{etiquetaEtapa(l.estado)}</span>
                  {l.estado === 'perdido' && l.motivo_perdida && <p className="max-w-40 truncate text-xs text-ink-muted" title={l.motivo_perdida}>{l.motivo_perdida}</p>}
                </td>
                <td className="px-3 py-2.5 text-right font-medium tabular-nums">{dinero(l.monto_estimado) || '—'}</td>
                <td className="px-3 py-2.5">{l.vendedor_nombre ?? <span className="text-ink-muted">Sin vendedor</span>}</td>
                <td className="px-3 py-2.5">
                  {l.proximo_seguimiento ? (
                    <>
                      <span className={vencido ? 'font-medium text-danger' : ''}>{fechaCorta(l.proximo_seguimiento)}{vencido ? ' · vencido' : ''}</span>
                      {l.seguimiento_nota && <p className="max-w-44 truncate text-xs text-ink-muted" title={l.seguimiento_nota}>{l.seguimiento_nota}</p>}
                    </>
                  ) : <span className="text-ink-muted">—</span>}
                </td>
                <td className="max-w-64 px-3 py-2.5">
                  {l.ultimo_mensaje ? (
                    <>
                      <p className="truncate" title={l.ultimo_mensaje}><span className="font-medium">{autorMensaje(l.ultimo_mensaje_rol)}:</span> {l.ultimo_mensaje}</p>
                      <p className={`text-xs ${esperaRespuesta(l) ? 'font-medium text-danger' : 'text-ink-muted'}`}>
                        {l.ultimo_mensaje_en ? `hace ${hace(l.ultimo_mensaje_en)}` : ''}{esperaRespuesta(l) ? ' · espera respuesta' : ''}
                      </p>
                    </>
                  ) : <span className="text-ink-muted">Sin chat</span>}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums" title={`${l.mensajes_cliente} del cliente`}>{l.total_mensajes}</td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{dias === null ? '—' : dias === 0 ? 'Hoy' : `${dias} d`}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-ink-muted">{l.alta_en ? fechaCorta(l.alta_en) : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Embudo del negocio: la vista de conjunto del CRM que vive en cada conversación de la Bandeja.
 * Tablero (arrastrar para mover de etapa) · Lista (todos los datos en tabla) · Análisis (conversión, tendencia, vendedores).
 */
export default function Embudo() {
  const { usuario } = useAuth()
  const tenantId = usuario?.tenant_id ?? null
  const negocio = esDeNegocio(usuario)
  const [params, setParams] = useSearchParams()
  const pedida = params.get('vista') as Vista | null
  const vista: Vista = VISTAS.some(([v]) => v === pedida) ? pedida! : 'tablero'

  const tablero = useApi<EmbudoDatos>(negocio && tenantId ? `/tenants/${tenantId}/embudo` : null)
  const [buscar, setBuscar] = useState('')
  const [vendedor, setVendedor] = useState('')
  const [canal, setCanal] = useState('')
  const [foco, setFoco] = useState<Foco>('')
  const [abiertoId, setAbiertoId] = useState<string | null>(null)
  const [moviendo, setMoviendo] = useState<string | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)
  const [perdida, setPerdida] = useState<LeadEmbudo | null>(null)
  const [motivo, setMotivo] = useState('')

  // En vivo: un mensaje nuevo cambia «último mensaje» y «espera respuesta». Como mucho una recarga cada 10 s.
  const ultima = useRef(0)
  const refrescar = () => { if (Date.now() - ultima.current > 10_000) { ultima.current = Date.now(); tablero.recargar(true) } }
  useEvento('mensaje_nuevo', refrescar)
  useEvento('conversacion_actualizada', refrescar)
  useEffect(() => {
    const t = setInterval(() => tablero.recargar(true), 60_000)
    return () => clearInterval(t)
  }, [tablero.recargar]) // eslint-disable-line react-hooks/exhaustive-deps

  const datos = tablero.datos
  const leads = datos?.leads ?? []

  const vendedores = useMemo(() => {
    const m = new Map<string, string>()
    for (const l of leads) if (l.vendedor_id) m.set(l.vendedor_id, l.vendedor_nombre ?? 'Vendedor')
    return [...m].sort((a, b) => a[1].localeCompare(b[1]))
  }, [leads])
  const canales = useMemo(() => [...new Set(leads.map((l) => l.canal).filter((c): c is string => !!c))], [leads])

  const filtrado = Boolean(buscar.trim() || vendedor || canal || foco)
  const visibles = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    const porFoco = FOCOS.find((f) => f.id === foco)?.filtro
    return leads.filter((l) =>
      (!q || [l.cliente_nombre, l.cliente_handle, l.cliente_username, l.vendedor_nombre, l.seguimiento_nota].some((t) => t?.toLowerCase().includes(q)))
      && (!vendedor || (vendedor === 'ninguno' ? !l.vendedor_id : l.vendedor_id === vendedor))
      && (!canal || l.canal === canal)
      && (!porFoco || porFoco(l)))
  }, [leads, buscar, vendedor, canal, foco])

  const kpi = useMemo(() => {
    const e = datos?.etapas ?? []
    const abiertas = e.filter((x) => !CERRADAS.has(x.estado))
    const ganado = e.find((x) => x.estado === 'ganado')
    const perdido = e.find((x) => x.estado === 'perdido')
    const cierres = (ganado?.total ?? 0) + (perdido?.total ?? 0)
    return {
      abiertos: abiertas.reduce((s, x) => s + x.total, 0),
      valor: abiertas.reduce((s, x) => s + Number(x.monto), 0),
      ganados: ganado?.total ?? 0,
      vendido: Number(ganado?.monto ?? 0),
      perdidos: perdido?.total ?? 0,
      tasa: cierres ? Math.round(((ganado?.total ?? 0) / cierres) * 100) : null,
    }
  }, [datos])

  if (!negocio) return <Navigate to="/portal" replace />

  const leadAbierto = abiertoId ? leads.find((l) => l.user_id === abiertoId) ?? null : null
  const limpiar = () => { setBuscar(''); setVendedor(''); setCanal(''); setFoco('') }

  /** Mueve un lead de etapa. «Perdido» pide antes el motivo (alimenta «Por qué se pierden»). */
  const mover = async (lead: LeadEmbudo, estado: string, motivoPerdida?: string) => {
    if (estado === 'perdido' && motivoPerdida === undefined) { setMotivo(''); setPerdida(lead); return }
    setMoviendo(lead.user_id); setFallo(null)
    try {
      await api(`/pipeline/${lead.user_id}/estado`, {
        method: 'PATCH',
        body: { estado, monto_estimado: lead.monto_estimado != null ? Number(lead.monto_estimado) : null, motivo_perdida: motivoPerdida ?? null },
      })
      setPerdida(null)
      tablero.recargar(true)
    } catch (e) {
      setFallo(e instanceof ApiError ? e.message : 'No se pudo mover la conversación.')
    } finally { setMoviendo(null) }
  }

  const cabecera = (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Embudo</h1>
        <p className="mt-1 text-sm text-ink-muted">Todas tus conversaciones en un solo lugar: lo que dicen los chats y lo que tu equipo registra en cada ficha.</p>
      </div>
      {datos && (
        <div className="flex items-center gap-2">
          <nav aria-label="Vistas del embudo" className="flex gap-1 rounded-full bg-muted p-1">
            {VISTAS.map(([v, l]) => (
              <button key={v} type="button" aria-current={vista === v ? 'page' : undefined}
                onClick={() => setParams(v === 'tablero' ? {} : { vista: v }, { replace: true })}
                className={`min-h-9 cursor-pointer rounded-full px-4 text-sm font-semibold transition ${vista === v ? 'bg-primary text-on-primary' : 'text-ink-muted hover:text-ink'}`}>
                {l}
              </button>
            ))}
          </nav>
          <button type="button" className="btn-ghost size-11 px-0" aria-label="Actualizar" title="Actualizar" disabled={tablero.cargando} onClick={() => tablero.recargar()}>
            <ArrowClockwise size={18} className={tablero.cargando ? 'animate-spin' : ''} aria-hidden />
          </button>
        </div>
      )}
    </header>
  )

  // Sin datos: cargando, módulo apagado (409), plan sin el módulo (402) u otro error.
  if (!datos) {
    const err = tablero.error
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-32 pt-8 sm:px-6">
        {cabecera}
        {tablero.cargando ? <div className="py-20 text-center"><Spinner label="Cargando tu embudo" /></div>
          : err?.status === 409 || err?.status === 402 ? (
            <div className="card px-6 py-12 text-center">
              <Funnel size={44} className="mx-auto text-primary" aria-hidden />
              <p className="mt-3 text-lg font-semibold">{err.status === 409 ? 'El embudo de ventas está apagado' : 'Tu plan no incluye el embudo de ventas'}</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                {err.status === 409
                  ? 'Enciende «Ventas y seguimiento» para que cada contacto que escriba entre al embudo y puedas llevar su etapa, monto y seguimiento.'
                  : 'Mejora tu plan para llevar el seguimiento de tus conversaciones desde el portal.'}
              </p>
              <Link to={`/portal/cuenta?vista=${err.status === 409 ? 'negocio' : 'suscripcion'}`} className="btn-primary mt-5">
                {err.status === 409 ? 'Ir a Ajustes del negocio' : 'Ver planes'}
              </Link>
            </div>
          ) : err ? (
            <div className="space-y-3"><Aviso tipo="error">{err.message}</Aviso><button type="button" className="btn-ghost" onClick={() => tablero.recargar()}>Reintentar</button></div>
          ) : null}
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[110rem] space-y-5 px-4 pb-32 pt-8 sm:px-6">
      {cabecera}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador etiqueta="Conversaciones abiertas" valor={kpi.abiertos.toLocaleString('es-MX')} detalle="En proceso, sin cerrar" />
        <Indicador etiqueta="Valor en juego" valor={dinero(kpi.valor) || '$0'} detalle="Monto estimado de los abiertos" />
        <Indicador etiqueta="Vendido" valor={dinero(kpi.vendido) || '$0'} detalle={`${kpi.ganados} ganados · ${kpi.perdidos} perdidos`} />
        <Indicador etiqueta="Tasa de cierre" valor={kpi.tasa === null ? '—' : `${kpi.tasa}%`} detalle={kpi.tasa === null ? 'Aún sin cierres' : 'Ganados entre cerrados'} />
      </div>

      {vista === 'analisis' ? <Analisis tenantId={tenantId!} datos={datos} /> : (
        <>
          <div className="space-y-3">
            {/* Lo que pide atención hoy: cada botón filtra el tablero. */}
            <div className="flex flex-wrap gap-2" role="group" aria-label="Requieren atención">
              {FOCOS.map(({ id, etiqueta, Icono, filtro }) => {
                const n = leads.filter(filtro).length
                const activo = foco === id
                return (
                  <button key={id} type="button" aria-pressed={activo} disabled={n === 0 && !activo} onClick={() => setFoco(activo ? '' : id)}
                    className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition disabled:cursor-default disabled:opacity-50 ${
                      activo ? 'border-primary bg-primary-soft text-primary-strong' : 'border-line bg-surface text-ink hover:border-primary/40'}`}>
                    <Icono size={16} aria-hidden /> {etiqueta}
                    <span className={`rounded-full px-1.5 text-xs font-bold tabular-nums ${n > 0 ? 'bg-danger/10 text-danger' : 'bg-muted text-ink-muted'}`}>{n}</span>
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-56 flex-1 sm:max-w-xs">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden />
                <input type="search" value={buscar} onChange={(e) => setBuscar(e.target.value)} maxLength={100}
                  placeholder="Buscar nombre, número o nota" aria-label="Buscar conversación" className={`${SELECT} w-full pl-9`} />
              </div>
              <select aria-label="Vendedor" value={vendedor} onChange={(e) => setVendedor(e.target.value)} className={SELECT}>
                <option value="">Todos los vendedores</option>
                <option value="ninguno">Sin vendedor</option>
                {vendedores.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
              </select>
              <select aria-label="Canal" value={canal} onChange={(e) => setCanal(e.target.value)} className={SELECT}>
                <option value="">Todos los canales</option>
                {canales.map((c) => <option key={c} value={c}>{infoCanal(c).nombre}</option>)}
              </select>
              {filtrado && <button type="button" className="btn-ghost min-h-10 px-3" onClick={limpiar}>Quitar filtros</button>}
              {filtrado && <span className="self-center text-xs text-ink-muted" role="status">{visibles.length} de {leads.length}</span>}
            </div>
          </div>

          {fallo && <Aviso tipo="error">{fallo}</Aviso>}
          {leads.length === 0 ? (
            <div className="card px-6 py-14 text-center">
              <Funnel size={44} className="mx-auto text-primary" aria-hidden />
              <p className="mt-3 font-semibold">Tu embudo está vacío</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">Cuando un cliente escriba por un canal conectado entrará aquí como conversación nueva. También puedes agregarlo desde la ficha de su conversación.</p>
              <Link to="/portal/bandeja" className="btn-ghost mt-5">Ir a la Bandeja</Link>
            </div>
          ) : vista === 'tablero' ? (
            <Tablero leads={visibles} resumen={datos.etapas} filtrado={filtrado} moviendo={moviendo} onAbrir={(l) => setAbiertoId(l.user_id)} onMover={mover} />
          ) : (
            <Lista leads={visibles} onAbrir={(l) => setAbiertoId(l.user_id)} />
          )}
        </>
      )}

      {leadAbierto && (
        <FichaLead lead={leadAbierto} tenantId={tenantId} onCambio={() => tablero.recargar(true)} onCerrar={() => setAbiertoId(null)} />
      )}

      <Dialogo abierto={perdida !== null} titulo="Marcar como perdido" ocupado={moviendo !== null} onCerrar={() => setPerdida(null)}>
        <form className="mt-3 space-y-4" onSubmit={(e) => { e.preventDefault(); if (perdida && motivo.trim()) void mover(perdida, 'perdido', motivo.trim()) }}>
          <p className="text-sm text-ink-muted">¿Por qué se perdió {perdida ? nombreLead(perdida) : ''}? El motivo te ayuda a ver qué se repite.</p>
          <div>
            <label htmlFor="motivo-perdida" className="field-label">Motivo</label>
            <input id="motivo-perdida" className="field" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000} placeholder="Precio, ya compró en otro lado, no contestó…" autoFocus />
          </div>
          {fallo && <Aviso tipo="error">{fallo}</Aviso>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" disabled={moviendo !== null} onClick={() => setPerdida(null)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={moviendo !== null || !motivo.trim()}>Marcar perdido</button>
          </div>
        </form>
      </Dialogo>
    </div>
  )
}
