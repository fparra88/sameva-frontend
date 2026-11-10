import { MagnifyingGlass } from '@phosphor-icons/react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Spinner } from '../components'
import { api, ApiError } from '../lib/api'
import { fechaCorta, hora, pesos } from '../lib/formato'
import type { EliminacionTenant, EstadoTenant, ListaTenantsGerencia, PlanGerencia, ResumenGerencia, TenantGerencia } from '../lib/tipos'
import { useApi, useDebounce } from '../lib/useApi'
import { Aviso, Chip, Dialogo } from '../portal/ui'
import { verComoNegocio } from './verComo'

const ESTADOS: { id: EstadoTenant; etiqueta: string; tono: 'ok' | 'info' | 'aviso' | 'gris' }[] = [
  { id: 'activo', etiqueta: 'Activo', tono: 'ok' },
  { id: 'prueba', etiqueta: 'Prueba', tono: 'info' },
  { id: 'suspendido', etiqueta: 'Suspendido', tono: 'aviso' },
  { id: 'baja', etiqueta: 'Baja', tono: 'gris' },
]
const ORDENES = [['consumo', 'Más consumo'], ['gasto', 'Más gasto'], ['alta', 'Más recientes'], ['actividad', 'Última actividad'], ['ingreso', 'Mayor ingreso'], ['nombre', 'Nombre']]
const infoEstado = (e: EstadoTenant) => ESTADOS.find((x) => x.id === e)!
const num = (v: number | string) => Number(v).toLocaleString('es-MX')
const mensaje = (e: unknown, r: string) => (e instanceof ApiError ? e.message : r)

function Dato({ titulo, valor, detalle }: { titulo: string; valor: ReactNode; detalle?: string }) {
  return <div className="card p-4"><p className="text-xs text-ink-muted">{titulo}</p><p className="mt-1 text-xl font-bold tabular-nums">{valor}</p>{detalle && <p className="text-xs text-ink-muted">{detalle}</p>}</div>
}

export default function Negocios() {
  const [urlParams] = useSearchParams()
  const [q, setQ] = useState(urlParams.get('q') ?? '')
  const [estado, setEstado] = useState('')
  const [orden, setOrden] = useState('consumo')
  const [dias, setDias] = useState(30)
  const busqueda = useDebounce(q, 300)
  const resumen = useApi<ResumenGerencia>(`/gerencia/resumen?dias=${dias}`)
  const params = new URLSearchParams({ dias: String(dias), orden, limite: '50' })
  if (busqueda.trim()) params.set('q', busqueda.trim())
  if (estado) params.set('estado', estado)
  const lista = useApi<ListaTenantsGerencia>(`/gerencia/tenants?${params}`)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const r = resumen.datos
  const moneda = lista.datos?.moneda ?? r?.moneda ?? 'mxn'
  const elegido = lista.datos?.items.find((t) => t.tenant_id === abierto) ?? null

  const alCambiar = (m: string) => { setAviso(m); lista.recargar(true); resumen.recargar(true) }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Negocios</h1>
          <p className="mt-1 text-ink-muted">Todos los negocios de la plataforma: estado, plan, consumo y margen.</p>
        </div>
        <label className="text-sm text-ink-muted">Ventana
          <select className="field ml-2 inline-block w-auto" value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            {[7, 30, 90].map((d) => <option key={d} value={d}>{d} días</option>)}
          </select>
        </label>
      </div>

      {r && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Dato titulo="Negocios" valor={num(r.tenants_total)} detalle={`${r.tenants_activos} activos · ${r.tenants_prueba} en prueba · ${r.tenants_nuevos} nuevos`} />
          <Dato titulo="MRR" valor={pesos(r.mrr)} detalle={`${r.suscripciones_activas} suscripciones activas`} />
          <Dato titulo="Mensajes" valor={num(r.mensajes)} detalle={`${r.tenants_con_actividad} negocios con actividad`} />
          <Dato titulo="En riesgo" valor={num(r.tenants_en_riesgo)} detalle="Pagan y no usan" />
          <Dato titulo="Ingreso estimado" valor={pesos(r.ingreso_estimado)} detalle={`Cobrado ${pesos(r.ingresos_periodo)}`} />
          <Dato titulo="Costo de modelos" valor={r.costo_moneda === null ? '—' : pesos(r.costo_moneda)} detalle={`US$ ${Number(r.consumo.costo_usd).toFixed(2)}`} />
          <Dato titulo="Margen" valor={r.margen === null ? '—' : pesos(r.margen)} detalle={r.margen === null ? 'Falta tipo de cambio' : undefined} />
          <Dato titulo="Suspendidos / baja" valor={`${r.tenants_suspendidos} / ${r.tenants_baja}`} />
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1">
          <MagnifyingGlass size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input className="field pl-9" placeholder="Nombre, correo o UUID" aria-label="Buscar negocio" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="field w-auto" aria-label="Estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.etiqueta}</option>)}
        </select>
        <select className="field w-auto" aria-label="Orden" value={orden} onChange={(e) => setOrden(e.target.value)}>
          {ORDENES.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {(lista.error || resumen.error) && <Aviso tipo="error">{(lista.error ?? resumen.error)!.message}</Aviso>}
        {aviso && <Aviso tipo="ok">{aviso}</Aviso>}
        <section className="card overflow-hidden" aria-label="Negocios">
          {lista.cargando && !lista.datos ? <div className="p-8 text-center"><Spinner /></div>
            : !lista.datos?.items.length ? <p className="p-8 text-center text-sm text-ink-muted">Ningún negocio coincide.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-muted/60 text-xs text-ink-muted"><tr>
                    <th scope="col" className="px-5 py-2 font-medium">Negocio</th><th scope="col" className="px-3 py-2 font-medium">Estado</th>
                    <th scope="col" className="px-3 py-2 font-medium">Plan</th><th scope="col" className="px-3 py-2 font-medium">Créditos</th>
                    <th scope="col" className="px-3 py-2 font-medium">Tokens</th><th scope="col" className="px-3 py-2 font-medium">Margen</th>
                    <th scope="col" className="px-3 py-2 font-medium">Último mensaje</th>
                  </tr></thead>
                  <tbody className="divide-y divide-line">
                    {lista.datos.items.map((t) => (
                      <tr key={t.tenant_id} tabIndex={0} className="cursor-pointer hover:bg-muted/40 focus:bg-muted/40 focus:outline-none"
                        onClick={() => { setAviso(null); setAbierto(t.tenant_id) }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { setAviso(null); setAbierto(t.tenant_id) } }}>
                        <td className="px-5 py-2.5"><span className="font-semibold">{t.nombre}</span><span className="block text-xs text-ink-muted">{t.email ?? 'sin usuario activo'}</span></td>
                        <td className="px-3 py-2.5"><Chip tono={infoEstado(t.estado).tono}>{infoEstado(t.estado).etiqueta}</Chip>{!t.agente_operando && t.estado !== 'baja' && <span className="ml-1"><Chip tono="aviso">agente apagado</Chip></span>}</td>
                        <td className="px-3 py-2.5">{t.plan ?? '—'}{t.origen_suscripcion === 'prueba' && <span className="ml-1 text-xs text-ink-muted">(prueba)</span>}</td>
                        <td className="px-3 py-2.5 tabular-nums">{num(t.creditos_disponibles)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{num(t.consumo.tokens_total)}</td>
                        <td className="px-3 py-2.5 tabular-nums">{t.margen === null ? '—' : pesos(t.margen)}</td>
                        <td className="px-3 py-2.5 tabular-nums text-ink-muted">{t.ultimo_mensaje ? fechaCorta(t.ultimo_mensaje) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          {lista.datos && <p className="border-t border-line px-5 py-2 text-xs text-ink-muted">Mostrando {lista.datos.items.length} de {lista.datos.total} · valores en {moneda.toUpperCase()}</p>}
        </section>
      </div>

      {elegido && <FichaNegocio key={elegido.tenant_id} t={elegido} onCerrar={() => setAbierto(null)} onCambio={alCambiar} onEliminado={(m) => { setAbierto(null); alCambiar(m) }} />}
    </div>
  )
}

/** Acciones de plataforma sobre un negocio. Cada una cae en la bitácora. */
function FichaNegocio({ t, onCerrar, onCambio, onEliminado }: { t: TenantGerencia; onCerrar: () => void; onCambio: (m: string) => void; onEliminado: (m: string) => void }) {
  const base = `/gerencia/tenants/${t.tenant_id}`
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const ejecutar = async (accion: () => Promise<unknown>, mensajeOk: string, respaldo: string) => {
    setError(null); setOk(null); setOcupado(true)
    try { await accion(); setOk(mensajeOk); onCambio(`${t.nombre}: ${mensajeOk}`); return true }
    catch (e) { setError(mensaje(e, respaldo)); return false }
    finally { setOcupado(false) }
  }

  return (
    <Dialogo abierto titulo={t.nombre} onCerrar={onCerrar} ocupado={ocupado} ancho="max-w-2xl">
      <div className="mt-3 space-y-5">
        <p className="text-sm text-ink-muted">
          {t.email ?? 'Sin usuario activo'} · alta {t.alta ? fechaCorta(t.alta) : '—'} · {t.usuarios_portal} usuarios · {t.canales_activos} canales · {t.vendedores_activos} vendedores
          {t.ultimo_mensaje && <> · último mensaje {fechaCorta(t.ultimo_mensaje)} {hora(t.ultimo_mensaje)}</>}
        </p>
        {error && <Aviso tipo="error">{error}</Aviso>}
        {ok && <Aviso tipo="ok">{ok}</Aviso>}

        <VerComo t={t} ocupado={ocupado} />
        <Estado t={t} base={base} ocupado={ocupado} ejecutar={ejecutar} />
        <Servicios t={t} base={base} ocupado={ocupado} ejecutar={ejecutar} />
        <Creditos t={t} base={base} ocupado={ocupado} ejecutar={ejecutar} />
        <Prueba t={t} base={base} ocupado={ocupado} ejecutar={ejecutar} />
        {t.estado === 'baja' && <Eliminar t={t} base={base} onEliminado={onEliminado} />}
      </div>
    </Dialogo>
  )
}

interface Props { t: TenantGerencia; base: string; ocupado: boolean; ejecutar: (a: () => Promise<unknown>, ok: string, r: string) => Promise<boolean> }
const Seccion = ({ titulo, children }: { titulo: string; children: ReactNode }) => <section className="space-y-2 rounded-xl border border-line p-4"><h3 className="text-sm font-semibold">{titulo}</h3>{children}</section>

function VerComo({ t, ocupado }: { t: TenantGerencia; ocupado: boolean }) {
  const [motivo, setMotivo] = useState('')
  const [abriendo, setAbriendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abrir = (e: FormEvent) => {
    e.preventDefault()
    setError(null); setAbriendo(true)
    // window.open ocurre dentro de verComoNegocio, en el mismo tick del clic.
    verComoNegocio(t.tenant_id, motivo.trim()).then(() => setMotivo('')).catch((err) => setError(mensaje(err, 'No se pudo abrir la vista del negocio.'))).finally(() => setAbriendo(false))
  }
  return (
    <Seccion titulo="Ver como el negocio">
      <p className="text-xs text-ink-muted">Abre su portal en otra pestaña, como su dueño y en solo lectura, por tiempo limitado. Queda registrado con el motivo.</p>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <form onSubmit={abrir} className="flex flex-col gap-2 sm:flex-row">
        <input className="field flex-1" aria-label="Motivo de la revisión" placeholder="Motivo (mínimo 5 caracteres)" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} />
        <button type="submit" className="btn-primary" disabled={ocupado || abriendo || motivo.trim().length < 5}>{abriendo ? 'Abriendo…' : 'Ver como'}</button>
      </form>
    </Seccion>
  )
}

function Estado({ t, base, ocupado, ejecutar }: Props) {
  const [nuevo, setNuevo] = useState<EstadoTenant>(t.estado)
  const [motivo, setMotivo] = useState('')
  const exigeMotivo = nuevo !== 'activo'
  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (await ejecutar(() => api(`${base}/estado`, { method: 'PATCH', body: { estado: nuevo, motivo: motivo.trim() || null } }), `estado cambiado a ${infoEstado(nuevo).etiqueta.toLowerCase()}.`, 'No se pudo cambiar el estado.')) setMotivo('')
  }
  return (
    <Seccion titulo="Estado del negocio">
      <p className="text-xs text-ink-muted">Suspendido y baja apagan el agente. {t.estado_motivo && <>Motivo actual: «{t.estado_motivo}»{t.estado_actualizado_por && <> · {t.estado_actualizado_por}</>}.</>}</p>
      <form onSubmit={enviar} className="flex flex-col gap-2 sm:flex-row">
        <select className="field sm:w-40" aria-label="Nuevo estado" value={nuevo} onChange={(e) => setNuevo(e.target.value as EstadoTenant)}>
          {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.etiqueta}</option>)}
        </select>
        <input className="field flex-1" aria-label="Motivo" placeholder={exigeMotivo ? 'Motivo (obligatorio)' : 'Motivo (opcional)'} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000} />
        <button type="submit" className="btn-primary" disabled={ocupado || nuevo === t.estado || (exigeMotivo && !motivo.trim())}>Aplicar</button>
      </form>
    </Seccion>
  )
}

function Servicios({ t, base, ocupado, ejecutar }: Props) {
  const filas = [
    ['agente_ia_activo', 'Agente de IA', t.agente_ia_activo], ['gestion_vendedores_activo', 'Ventas y seguimiento', t.gestion_vendedores_activo], ['calendario_activo', 'Calendario', t.calendario_activo],
  ] as const
  return (
    <Seccion titulo="Módulos">
      {!t.agente_operando && t.agente_ia_activo && <Aviso tipo="info">El agente está encendido pero no opera (negocio suspendido o sin pago vigente).</Aviso>}
      <div className="grid gap-2 sm:grid-cols-3">
        {filas.map(([clave, nombre, valor]) => (
          <label key={clave} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-3 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={valor} disabled={ocupado}
              onChange={(e) => ejecutar(() => api(`${base}/servicios`, { method: 'PATCH', body: { [clave]: e.target.checked } }), `${nombre} ${e.target.checked ? 'encendido' : 'apagado'}.`, 'No se pudo cambiar el módulo.')} />
            {nombre}
          </label>
        ))}
      </div>
      <p className="text-xs text-ink-muted">Plataforma puede encender un módulo que el plan no incluye; el portal del cliente lo seguirá bloqueando sin plan.</p>
    </Seccion>
  )
}

function Creditos({ t, base, ocupado, ejecutar }: Props) {
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const valida = cantidad.trim() !== '' && Number(cantidad) !== 0 && !Number.isNaN(Number(cantidad)) && motivo.trim().length >= 3
  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (await ejecutar(() => api(`${base}/creditos`, { method: 'POST', body: { cantidad: cantidad.trim(), motivo: motivo.trim() } }), 'créditos ajustados.', 'No se pudo ajustar el saldo.')) { setCantidad(''); setMotivo('') }
  }
  return (
    <Seccion titulo="Créditos">
      <p className="text-xs text-ink-muted">Disponibles: <strong>{num(t.creditos_disponibles)}</strong> · gastados: {num(t.creditos_gastados)}. Positivo suma, negativo resta.</p>
      <form onSubmit={enviar} className="flex flex-col gap-2 sm:flex-row">
        <input className="field sm:w-32" inputMode="decimal" aria-label="Cantidad" placeholder="+100 / -20" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <input className="field flex-1" aria-label="Motivo del ajuste" placeholder="Motivo (obligatorio)" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} />
        <button type="submit" className="btn-primary" disabled={ocupado || !valida}>Ajustar</button>
      </form>
    </Seccion>
  )
}

function Prueba({ t, base, ocupado, ejecutar }: Props) {
  const planes = useApi<PlanGerencia[]>('/gerencia/planes')
  const [plan, setPlan] = useState('')
  const [unidad, setUnidad] = useState<'dias' | 'semanas'>('dias')
  const [cantidad, setCantidad] = useState('14')
  const [motivo, setMotivo] = useState('')
  const enPrueba = t.origen_suscripcion === 'prueba' && t.estado_suscripcion === 'activa'
  const otorgar = async (e: FormEvent) => {
    e.preventDefault()
    if (await ejecutar(() => api(`${base}/prueba`, { method: 'POST', body: { plan, unidad, cantidad: Number(cantidad), motivo: motivo.trim() } }), `prueba del plan ${plan} otorgada.`, 'No se pudo otorgar la prueba.')) setMotivo('')
  }
  const revocar = () => {
    if (motivo.trim().length < 3) return
    return ejecutar(() => api(`${base}/prueba/revocar`, { method: 'POST', body: { motivo: motivo.trim() } }), 'prueba revocada.', 'No se pudo revocar la prueba.')
  }
  return (
    <Seccion titulo="Plan de prueba">
      <p className="text-xs text-ink-muted">
        Plan actual: <strong>{t.plan ?? 'ninguno'}</strong>{t.origen_suscripcion === 'prueba' && ' (prueba)'}{t.fecha_renovacion && <> · {t.origen_suscripcion === 'prueba' ? 'termina' : 'renueva'} {fechaCorta(t.fecha_renovacion)}</>}. Máximo 3 meses.
      </p>
      <form onSubmit={otorgar} className="grid gap-2 sm:grid-cols-[1fr_6rem_8rem]">
        <select className="field" aria-label="Plan" value={plan} onChange={(e) => setPlan(e.target.value)} required>
          <option value="">Elige un plan…</option>
          {planes.datos?.filter((p) => p.activo).map((p) => <option key={p.nombre} value={p.nombre}>{p.nombre}</option>)}
        </select>
        <input className="field" inputMode="numeric" aria-label="Duración" value={cantidad} onChange={(e) => setCantidad(e.target.value)} required />
        <select className="field" aria-label="Unidad" value={unidad} onChange={(e) => setUnidad(e.target.value as 'dias' | 'semanas')}><option value="dias">días</option><option value="semanas">semanas</option></select>
        <input className="field sm:col-span-3" aria-label="Motivo de la prueba" placeholder="Motivo (obligatorio)" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={500} />
        <div className="flex justify-end gap-2 sm:col-span-3">
          {enPrueba && <button type="button" className="btn-ghost hover:text-danger" disabled={ocupado || motivo.trim().length < 3} onClick={revocar}>Revocar prueba</button>}
          <button type="submit" className="btn-primary" disabled={ocupado || !plan || motivo.trim().length < 3}>Otorgar prueba</button>
        </div>
      </form>
    </Seccion>
  )
}

function Eliminar({ t, base, onEliminado }: { t: TenantGerencia; base: string; onEliminado: (m: string) => void }) {
  const rev = useApi<EliminacionTenant>(`${base}/eliminacion`)
  const [texto, setTexto] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const r = rev.datos
  const borrar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null); setBorrando(true)
    try { await api(`${base}/eliminar`, { method: 'POST', body: { confirmacion: texto } }); onEliminado(`${t.nombre} eliminado.`) }
    catch (err) { setError(mensaje(err, 'No se pudo eliminar el negocio.')); setBorrando(false) }
  }
  return (
    <Seccion titulo="Eliminar definitivamente">
      {!r ? <Spinner label="Revisando" /> : r.bloqueos.length > 0 ? (
        <ul className="space-y-2">{r.bloqueos.map((b) => <li key={b.codigo}><Aviso tipo="info">{b.mensaje}</Aviso></li>)}</ul>
      ) : (
        <form onSubmit={borrar} className="space-y-2">
          <p className="text-sm text-ink-muted">Se borran {num(r.conversaciones)} conversaciones, {r.usuarios_portal} cuentas y {num(r.transacciones)} transacciones. No se puede deshacer.</p>
          {error && <Aviso tipo="error">{error}</Aviso>}
          <input className="field" aria-label="Nombre exacto del negocio" placeholder={`Escribe «${t.nombre}» para confirmar`} value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" />
          <div className="flex justify-end"><button type="submit" className="btn-primary !bg-danger" disabled={borrando || texto !== t.nombre}>{borrando ? 'Eliminando…' : 'Eliminar negocio'}</button></div>
        </form>
      )}
    </Seccion>
  )
}
