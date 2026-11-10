import { CaretLeft, CaretRight, Plus } from '@phosphor-icons/react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import {
  aIso, aMinutos, deMinutos, fechaLegible, fechaLocal, minutosDelDia, pesos, sumarDias,
} from '../../lib/formato'
import { esDeNegocio, esGerencia } from '../../lib/roles'
import { useEvento } from '../../lib/tiempoReal'
import type {
  AvisoCita, Descanso, Excepcion, HorarioSemanal, Proveedor, Reserva, ReservaAuditoria, ServicioCita, MetodoPago,
} from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip, Dialogo } from '../ui'
import { ESTADO } from './colores'

const PX_HORA = 84
const PASO = 15 // minutos al hacer clic en la grilla
type Ventana = [number, number]

/** Jornada del proveedor ese día (minutos), ya sin descansos. 0 = lunes, como la API. */
function ventanasDelDia(fecha: string, horarios: HorarioSemanal[], excepcion: Excepcion | undefined, descansos: Descanso[]): Ventana[] {
  const dow = (new Date(`${fecha}T00:00:00`).getDay() + 6) % 7
  let v: Ventana[] = excepcion
    ? (excepcion.disponible && excepcion.hora_inicio && excepcion.hora_fin ? [[aMinutos(excepcion.hora_inicio), aMinutos(excepcion.hora_fin)]] : [])
    : horarios.filter((h) => h.dia_semana === dow).map((h) => [aMinutos(h.hora_inicio), aMinutos(h.hora_fin)] as Ventana)
  for (const d of descansos.filter((x) => x.fecha === fecha || (x.fecha === null && x.dia_semana === dow))) {
    const [di, df] = [aMinutos(d.hora_inicio), aMinutos(d.hora_fin)]
    v = v.flatMap(([a, b]) => (df <= a || di >= b ? [[a, b] as Ventana] : [...(di > a ? [[a, di] as Ventana] : []), ...(df < b ? [[df, b] as Ventana] : [])]))
  }
  return v.sort((x, y) => x[0] - y[0])
}

/** Ventanas de atención por proveedor para la fecha (N proveedores → N juegos de llamadas). */
function useVentanas(base: string, ids: string[], fecha: string, version: number) {
  const [datos, setDatos] = useState<Record<string, Ventana[]>>({})
  const clave = ids.join(',')
  useEffect(() => {
    if (ids.length === 0) return
    let cancelado = false
    Promise.all(ids.map(async (id) => {
      const [h, e, d] = await Promise.all([
        api<HorarioSemanal[]>(`${base}/proveedores/${id}/horarios`).catch(() => [] as HorarioSemanal[]),
        api<Excepcion[]>(`${base}/proveedores/${id}/excepciones?desde=${fecha}&hasta=${fecha}`).catch(() => [] as Excepcion[]),
        api<Descanso[]>(`${base}/proveedores/${id}/descansos`).catch(() => [] as Descanso[]),
      ])
      return [id, ventanasDelDia(fecha, h, e[0], d)] as const
    })).then((p) => { if (!cancelado) setDatos(Object.fromEntries(p)) })
    return () => { cancelado = true }
  }, [base, clave, fecha, version]) // eslint-disable-line react-hooks/exhaustive-deps
  return ids.length === 0 ? {} : datos
}

const mensaje = (e: unknown, r: string) => (e instanceof ApiError ? e.message : r)

export function Dia({ base }: { base: string }) {
  const { usuario } = useAuth()
  const gerencia = esGerencia(usuario)
  const [params, setParams] = useSearchParams()
  const [fecha, setFecha] = useState(() => params.get('fecha') || fechaLocal(new Date()))
  const [version, setVersion] = useState(0)
  const [nueva, setNueva] = useState<{ proveedor_id?: string; hora?: string } | null>(null)
  const [abierta, setAbierta] = useState<Reserva | null>(null)
  const [mostrarCanceladas, setMostrarCanceladas] = useState(false)

  const desde = new Date(`${fecha}T00:00:00`).toISOString()
  const hasta = new Date(`${fecha}T23:59:59`).toISOString()
  const proveedores = useApi<Proveedor[]>(`${base}/proveedores?activo=true`)
  const catalogo = useApi<ServicioCita[]>(`${base}/servicios?activo=true`)
  const reservas = useApi<Reserva[]>(`${base}/reservas?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}`)
  const lista = proveedores.datos ?? []
  const ventanas = useVentanas(base, lista.map((p) => p.id), fecha, version)

  const refrescar = () => { reservas.recargar(true); proveedores.recargar(true); setVersion((v) => v + 1) }
  useEvento<{ recurso: string }>('datos_actualizados', (d) => { if (d.recurso === 'reservas') reservas.recargar(true) })
  useEffect(() => { const t = setInterval(() => reservas.recargar(true), 60_000); return () => clearInterval(t) }, [reservas.recargar]) // eslint-disable-line react-hooks/exhaustive-deps

  const irA = (f: string) => { setFecha(f); if (params.has('fecha') || params.has('reserva')) setParams({}, { replace: true }) }
  const todas = reservas.datos ?? []
  const visibles = todas.filter((r) => mostrarCanceladas || r.estado !== 'cancelada')
  const conteo = (e: Reserva['estado']) => todas.filter((r) => r.estado === e).length

  // Rango horario de la grilla: 8–20 por defecto, ampliado a las ventanas y citas del día.
  const [ini, fin] = useMemo(() => {
    let a = 8 * 60, b = 20 * 60
    for (const w of Object.values(ventanas)) for (const [x, y] of w) { a = Math.min(a, x); b = Math.max(b, y) }
    for (const r of visibles) { a = Math.min(a, minutosDelDia(r.hora_inicio)); b = Math.max(b, minutosDelDia(r.hora_fin) || 24 * 60) }
    return [Math.floor(a / 60) * 60, Math.min(24 * 60, Math.ceil(b / 60) * 60)]
  }, [ventanas, visibles])
  const horas = Array.from({ length: (fin - ini) / 60 }, (_, i) => ini + i * 60)
  const alto = ((fin - ini) / 60) * PX_HORA

  // Cita llegada desde una notificación (?reserva=): se abre sola cuando carga el día.
  const buscada = params.get('reserva')
  useEffect(() => {
    if (!buscada) return
    const r = todas.find((x) => x.id === buscada)
    if (r) { setAbierta(r); setParams({}, { replace: true }) }
  }, [buscada, todas]) // eslint-disable-line react-hooks/exhaustive-deps

  const clicColumna = (e: React.MouseEvent<HTMLDivElement>, p: Proveedor) => {
    if (!gerencia || e.target !== e.currentTarget) return
    const y = e.clientY - e.currentTarget.getBoundingClientRect().top
    const min = Math.floor((ini + (y / PX_HORA) * 60) / PASO) * PASO
    setNueva({ proveedor_id: p.id, hora: deMinutos(min) })
  }

  const error = proveedores.error ?? reservas.error ?? catalogo.error

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-ghost size-10 px-0" onClick={() => irA(sumarDias(fecha, -1))} aria-label="Día anterior"><CaretLeft size={16} /></button>
        <input type="date" aria-label="Fecha" value={fecha} onChange={(e) => e.target.value && irA(e.target.value)} className="field !w-auto" />
        <button type="button" className="btn-ghost size-10 px-0" onClick={() => irA(sumarDias(fecha, 1))} aria-label="Día siguiente"><CaretRight size={16} /></button>
        <button type="button" className="btn-ghost" onClick={() => irA(fechaLocal(new Date()))} disabled={fecha === fechaLocal(new Date())}>Hoy</button>
        <p className="ml-1 hidden text-sm font-medium capitalize text-ink-muted md:block">{fechaLegible(fecha)}</p>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" className="accent-primary" checked={mostrarCanceladas} onChange={(e) => setMostrarCanceladas(e.target.checked)} /> Ver canceladas
          </label>
          {gerencia && <button type="button" className="btn-primary" disabled={lista.length === 0 || !catalogo.datos?.length} onClick={() => setNueva({})}><Plus size={16} aria-hidden /> Nueva cita</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([['Confirmadas', conteo('confirmada')], ['Completadas', conteo('completada')], ['No asistieron', conteo('no_asistio')], ['Canceladas', conteo('cancelada')]] as const).map(([l, n]) => (
          <div key={l} className="card px-4 py-3"><p className="text-xs text-ink-muted">{l}</p><p className="text-2xl font-bold tabular-nums">{n}</p></div>
        ))}
      </div>

      {error && <Aviso tipo="error">{error.message}</Aviso>}
      {gerencia && !proveedores.cargando && lista.length === 0 && <Aviso tipo="info">Aún no tienes proveedores activos. Agrégalos en la pestaña Proveedores para empezar a agendar.</Aviso>}
      {gerencia && !catalogo.cargando && catalogo.datos?.length === 0 && lista.length > 0 && <Aviso tipo="info">Aún no tienes servicios activos. Agrégalos en la pestaña Servicios para poder crear citas.</Aviso>}

      {proveedores.cargando && !proveedores.datos ? <div className="p-10 text-center"><Spinner /></div> : lista.length > 0 && (
        <div className={`card overflow-x-auto ${reservas.cargando ? 'opacity-70' : ''}`}>
          <div className="flex min-w-full">
            <div className="sticky left-0 z-20 w-16 shrink-0 border-r border-line bg-surface">
              <div className="h-11 border-b border-line" />
              <div className="relative mt-3" style={{ height: alto }}>
                {horas.map((h) => <span key={h} className="absolute right-3 -translate-y-1/2 text-xs tabular-nums text-ink-muted" style={{ top: ((h - ini) / 60) * PX_HORA }}>{deMinutos(h)}</span>)}
              </div>
            </div>
            {lista.map((p) => {
              const w = ventanas[p.id]
              return (
                <div key={p.id} className="min-w-[12rem] flex-1 border-r border-line last:border-r-0">
                  <div className="flex h-11 items-center gap-2 border-b border-line bg-surface px-4">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                    <span className="truncate text-sm font-semibold">{p.nombre}</span>
                  </div>
                  <div className={`relative mt-3 ${gerencia ? 'cursor-pointer' : ''}`} style={{ height: alto }} onClick={(e) => clicColumna(e, p)}>
                    {horas.map((h) => <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-line/70" style={{ top: ((h - ini) / 60) * PX_HORA }} />)}
                    {/* Fuera de jornada: rayado gris */}
                    {w && [[ini, fin]].flatMap(([a, b]) => {
                      const libres: Ventana[] = []; let cur = a
                      for (const [x, y] of w) { if (x > cur) libres.push([cur, x]); cur = Math.max(cur, y) }
                      if (cur < b) libres.push([cur, b])
                      return libres
                    }).map(([x, y], i) => (
                      <div key={i} className="pointer-events-none absolute inset-x-0 bg-ink/[0.04]" style={{ top: ((x - ini) / 60) * PX_HORA, height: ((y - x) / 60) * PX_HORA }} aria-hidden />
                    ))}
                    {visibles.filter((r) => r.proveedor_id === p.id).map((r) => {
                      const a = minutosDelDia(r.hora_inicio), b = (minutosDelDia(r.hora_fin) || 24 * 60)
                      const est = ESTADO[r.estado]
                      const alto = Math.max(30, ((b - a) / 60) * PX_HORA - 4)
                      const corta = alto < 52
                      return (
                        <button key={r.id} type="button" onClick={() => setAbierta(r)}
                          className={`absolute inset-x-1.5 cursor-pointer overflow-hidden rounded-lg border-l-4 bg-surface px-2.5 py-1 text-left text-xs shadow-sm ring-1 ring-line transition hover:shadow-md hover:ring-primary ${r.estado === 'cancelada' ? 'opacity-50' : ''}`}
                          style={{ top: ((a - ini) / 60) * PX_HORA + 2, height: alto, borderLeftColor: p.color, backgroundColor: `${p.color}14` }}
                          aria-label={`${r.cliente_nombre ?? 'Cliente'}, ${r.servicio_nombre}, ${deMinutos(a)}, ${est.etiqueta}`}>
                          {corta ? (
                            <span className="flex items-center gap-1.5">
                              <span className="shrink-0 tabular-nums text-ink-muted">{deMinutos(a)}</span>
                              <span className={`truncate font-semibold ${r.estado === 'cancelada' ? 'line-through' : ''}`}>{r.cliente_nombre ?? 'Cliente'}</span>
                            </span>
                          ) : (
                            <>
                              <span className={`block truncate text-sm font-semibold ${r.estado === 'cancelada' ? 'line-through' : ''}`}>{r.cliente_nombre ?? 'Cliente'}</span>
                              <span className="block truncate text-ink-muted">{deMinutos(a)}–{deMinutos(b)} · {r.servicio_nombre}</span>
                              {r.estado !== 'confirmada' && <span className="mt-1 inline-block rounded-full bg-surface/80 px-1.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{est.etiqueta}</span>}
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {gerencia && lista.length > 0 && <p className="text-xs text-ink-muted">Toca un espacio libre de la grilla para crear una cita ahí. Las franjas grises están fuera del horario del proveedor.</p>}

      {nueva && <ReservaForm base={base} fecha={fecha} proveedores={lista} servicios={catalogo.datos ?? []} inicial={nueva} onCerrar={() => setNueva(null)} onCreada={() => { setNueva(null); refrescar() }} />}
      {abierta && <ReservaDetalle key={abierta.id} base={base} reserva={abierta} proveedores={lista} onCerrar={() => setAbierta(null)} onCambio={(r) => { setAbierta(r); refrescar() }} />}
    </div>
  )
}

// ------------------------------------------------------------
// Nueva cita (walk-in / telefónica)
// ------------------------------------------------------------
function ReservaForm({ base, fecha, proveedores, servicios, inicial, onCerrar, onCreada }: {
  base: string; fecha: string; proveedores: Proveedor[]; servicios: ServicioCita[]
  inicial: { proveedor_id?: string; hora?: string }; onCerrar: () => void; onCreada: () => void
}) {
  const [proveedor, setProveedor] = useState(inicial.proveedor_id ?? proveedores[0]?.id ?? '')
  const [servicio, setServicio] = useState(servicios[0]?.id ?? '')
  const [dia, setDia] = useState(fecha)
  const [hora, setHora] = useState(inicial.hora ?? '10:00')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [notas, setNotas] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (guardando || !nombre.trim()) return
    setGuardando(true); setError(null)
    try {
      await api(`${base}/reservas`, {
        method: 'POST',
        body: { proveedor_id: proveedor, servicio_id: servicio, hora_inicio: aIso(dia, hora), cliente_nombre: nombre.trim(), cliente_telefono: telefono.trim() || null, notas: notas.trim() || null },
      })
      onCreada()
    } catch (err) { setError(mensaje(err, 'No se pudo crear la cita.')) }
    finally { setGuardando(false) }
  }

  return (
    <Dialogo abierto titulo="Nueva cita" onCerrar={onCerrar} ocupado={guardando}>
      <form onSubmit={enviar} className="mt-3 space-y-3">
        {error && <Aviso tipo="error">{error}</Aviso>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="r-prov" className="field-label">Proveedor</label>
            <select id="r-prov" className="field" value={proveedor} onChange={(e) => setProveedor(e.target.value)}>{proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
          <div><label htmlFor="r-serv" className="field-label">Servicio</label>
            <select id="r-serv" className="field" value={servicio} onChange={(e) => setServicio(e.target.value)}>{servicios.map((s) => <option key={s.id} value={s.id}>{s.nombre} · {s.duracion_minutos} min</option>)}</select></div>
          <div><label htmlFor="r-dia" className="field-label">Fecha</label>
            <input id="r-dia" type="date" className="field" value={dia} onChange={(e) => setDia(e.target.value)} required /></div>
          <div><label htmlFor="r-hora" className="field-label">Hora</label>
            <input id="r-hora" type="time" step={PASO * 60} className="field" value={hora} onChange={(e) => setHora(e.target.value)} required /></div>
          <div><label htmlFor="r-nom" className="field-label">Cliente</label>
            <input id="r-nom" className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={255} required autoFocus /></div>
          <div><label htmlFor="r-tel" className="field-label">Teléfono (opcional)</label>
            <input id="r-tel" type="tel" className="field" value={telefono} onChange={(e) => setTelefono(e.target.value)} maxLength={50} /></div>
        </div>
        <div><label htmlFor="r-notas" className="field-label">Notas (opcional)</label>
          <textarea id="r-notas" rows={2} maxLength={1000} value={notas} onChange={(e) => setNotas(e.target.value)} className="w-full resize-y rounded-xl border border-ink-muted/35 bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15" /></div>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando || !nombre.trim() || !proveedor || !servicio}>{guardando ? 'Creando…' : 'Crear cita'}</button>
        </div>
      </form>
    </Dialogo>
  )
}

// ------------------------------------------------------------
// Detalle y acciones de una cita
// ------------------------------------------------------------
type Accion = 'reprogramar' | 'reasignar' | 'cancelar' | 'completar' | null

function ReservaDetalle({ base, reserva, proveedores, onCerrar, onCambio }: {
  base: string; reserva: Reserva; proveedores: Proveedor[]; onCerrar: () => void; onCambio: (r: Reserva) => void
}) {
  const { usuario } = useAuth()
  const gerencia = esGerencia(usuario)
  const negocio = esDeNegocio(usuario)
  const abierta = reserva.estado === 'confirmada'
  const est = ESTADO[reserva.estado]
  const [accion, setAccion] = useState<Accion>(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hi = new Date(reserva.hora_inicio)
  const [dia, setDia] = useState(fechaLocal(hi))
  const [hora, setHora] = useState(deMinutos(minutosDelDia(reserva.hora_inicio)))
  const [nuevoProv, setNuevoProv] = useState(reserva.proveedor_id)
  const [motivo, setMotivo] = useState('')
  const [precio, setPrecio] = useState('')
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo')

  const servicios = useApi<ServicioCita[]>(accion === 'completar' ? `${base}/servicios` : null)
  useEffect(() => {
    const s = servicios.datos?.find((x) => x.id === reserva.servicio_id)
    if (s?.precio != null && !precio) setPrecio(String(s.precio))
  }, [servicios.datos]) // eslint-disable-line react-hooks/exhaustive-deps

  const avisos = useApi<AvisoCita[]>(gerencia ? `${base}/reservas/${reserva.id}/avisos` : null)
  const historial = useApi<ReservaAuditoria[]>(negocio ? `${base}/reservas/${reserva.id}/auditoria` : null)

  const ejecutar = async (fn: () => Promise<Reserva>) => {
    setOcupado(true); setError(null)
    try { const r = await fn(); setAccion(null); onCambio(r) }
    catch (e) { setError(mensaje(e, 'No se pudo completar la acción.')) }
    finally { setOcupado(false) }
  }
  const ruta = `${base}/reservas/${reserva.id}`

  return (
    <Dialogo abierto titulo="Detalle de la cita" onCerrar={onCerrar} ocupado={ocupado}>
      <div className="mt-3 max-h-[68dvh] space-y-4 overflow-y-auto pr-1">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tono={est.tono}>{est.etiqueta}</Chip>
          {reserva.cancelacion_tardia && <Chip tono="aviso">cancelación tardía</Chip>}
          {reserva.cancelada_por && <Chip>cancelada por {reserva.cancelada_por}</Chip>}
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-ink-muted">Cliente</dt><dd className="font-medium">{reserva.cliente_nombre ?? '—'}{reserva.cliente_telefono ? ` · ${reserva.cliente_telefono}` : ''}</dd>
          <dt className="text-ink-muted">Servicio</dt><dd>{reserva.servicio_nombre}</dd>
          <dt className="text-ink-muted">Proveedor</dt><dd className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: reserva.proveedor_color }} aria-hidden />{reserva.proveedor_nombre}</dd>
          <dt className="text-ink-muted">Horario</dt><dd className="capitalize">{fechaLegible(fechaLocal(hi))}, {deMinutos(minutosDelDia(reserva.hora_inicio))}–{deMinutos(minutosDelDia(reserva.hora_fin))}</dd>
          {reserva.notas && <><dt className="text-ink-muted">Notas</dt><dd className="whitespace-pre-wrap">{reserva.notas}</dd></>}
          {reserva.precio_cobrado != null && <><dt className="text-ink-muted">Cobrado</dt><dd>{pesos(reserva.precio_cobrado)}{reserva.metodo_pago ? ` · ${reserva.metodo_pago}` : ''}</dd></>}
        </dl>

        {error && <Aviso tipo="error">{error}</Aviso>}

        {abierta && accion === null && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary min-h-10" onClick={() => setAccion('completar')}>Completar</button>
            <button type="button" className="btn-ghost min-h-10" disabled={ocupado} onClick={() => ejecutar(() => api<Reserva>(`${ruta}/estado`, { method: 'PATCH', body: { estado: 'no_asistio' } }))}>No asistió</button>
            {gerencia && <button type="button" className="btn-ghost min-h-10" onClick={() => setAccion('reprogramar')}>Reprogramar</button>}
            {gerencia && <button type="button" className="btn-ghost min-h-10" onClick={() => setAccion('reasignar')}>Cambiar proveedor</button>}
            <button type="button" className="btn-ghost min-h-10 hover:text-danger" onClick={() => setAccion('cancelar')}>Cancelar cita</button>
          </div>
        )}

        {accion === 'reprogramar' && (
          <form className="space-y-3 rounded-xl border border-line p-3" onSubmit={(e) => { e.preventDefault(); void ejecutar(() => api<Reserva>(`${ruta}/reprogramar`, { method: 'PATCH', body: { hora_inicio: aIso(dia, hora) } })) }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="d-dia" className="field-label">Nueva fecha</label><input id="d-dia" type="date" className="field" value={dia} onChange={(e) => setDia(e.target.value)} required /></div>
              <div><label htmlFor="d-hora" className="field-label">Nueva hora</label><input id="d-hora" type="time" step={PASO * 60} className="field" value={hora} onChange={(e) => setHora(e.target.value)} required /></div>
            </div>
            <Botones ocupado={ocupado} etiqueta="Reprogramar" onCancelar={() => setAccion(null)} />
          </form>
        )}
        {accion === 'reasignar' && (
          <form className="space-y-3 rounded-xl border border-line p-3" onSubmit={(e) => { e.preventDefault(); void ejecutar(() => api<Reserva>(`${ruta}/reasignar`, { method: 'PATCH', body: { proveedor_id: nuevoProv } })) }}>
            <div><label htmlFor="d-prov" className="field-label">Nuevo proveedor</label>
              <select id="d-prov" className="field" value={nuevoProv} onChange={(e) => setNuevoProv(e.target.value)}>{proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
            <Botones ocupado={ocupado} etiqueta="Cambiar" onCancelar={() => setAccion(null)} deshabilitado={nuevoProv === reserva.proveedor_id} />
          </form>
        )}
        {accion === 'cancelar' && (
          <form className="space-y-3 rounded-xl border border-line p-3" onSubmit={(e) => { e.preventDefault(); void ejecutar(() => api<Reserva>(`${ruta}/cancelar`, { method: 'POST', body: { motivo: motivo.trim() || null } })) }}>
            <div><label htmlFor="d-motivo" className="field-label">Motivo (opcional)</label><input id="d-motivo" className="field" value={motivo} maxLength={500} onChange={(e) => setMotivo(e.target.value)} /></div>
            <p className="text-xs text-ink-muted">Si el cliente tiene el aviso por WhatsApp activo, se le notificará la cancelación.</p>
            <Botones ocupado={ocupado} etiqueta="Cancelar la cita" peligro onCancelar={() => setAccion(null)} />
          </form>
        )}
        {accion === 'completar' && (
          <form className="space-y-3 rounded-xl border border-line p-3" onSubmit={(e) => { e.preventDefault(); void ejecutar(() => api<Reserva>(`${ruta}/estado`, { method: 'PATCH', body: { estado: 'completada', precio_cobrado: Number(precio), metodo_pago: metodo } })) }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="d-precio" className="field-label">Cobrado (MXN)</label><input id="d-precio" type="number" min="0" step="0.01" inputMode="decimal" className="field" value={precio} onChange={(e) => setPrecio(e.target.value)} required /></div>
              <div><label htmlFor="d-metodo" className="field-label">Método de pago</label>
                <select id="d-metodo" className="field" value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option></select></div>
            </div>
            <Botones ocupado={ocupado} etiqueta="Marcar completada" onCancelar={() => setAccion(null)} deshabilitado={precio === ''} />
          </form>
        )}

        {gerencia && avisos.datos && avisos.datos.length > 0 && (
          <section><h3 className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">Avisos por WhatsApp</h3>
            <ul className="space-y-1 text-sm">{avisos.datos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-2"><Chip tono={a.estado === 'enviado' ? 'ok' : a.estado === 'fallido' ? 'aviso' : 'gris'}>{a.estado.replace('_', ' ')}</Chip><span className="capitalize">{a.tipo}</span>{a.motivo && <span className="text-xs text-ink-muted">{a.motivo}</span>}{a.sin_conversacion && <span className="text-xs text-ink-muted">· sin conversación</span>}</li>
            ))}</ul></section>
        )}
        {negocio && historial.datos && historial.datos.length > 0 && (
          <section><h3 className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">Historial</h3>
            <ol className="space-y-1.5 border-l-2 border-line pl-3 text-sm">{historial.datos.map((h) => (
              <li key={h.id}><span className="font-medium capitalize">{h.evento.replace('_', ' ')}</span>{h.motivo && <span className="text-ink-muted"> · {h.motivo}</span>}
                <span className="block text-xs text-ink-muted">{h.actor} · {h.origen}{h.creado_en ? ` · ${new Date(h.creado_en).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}` : ''}</span></li>
            ))}</ol></section>
        )}
      </div>
      <div className="mt-4 flex justify-end"><button type="button" className="btn-ghost" onClick={onCerrar} disabled={ocupado}>Cerrar</button></div>
    </Dialogo>
  )
}

function Botones({ ocupado, etiqueta, onCancelar, peligro, deshabilitado }: { ocupado: boolean; etiqueta: string; onCancelar: () => void; peligro?: boolean; deshabilitado?: boolean }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" className="btn-ghost min-h-10" onClick={onCancelar} disabled={ocupado}>Volver</button>
      <button type="submit" className={`btn-primary min-h-10 ${peligro ? '!bg-danger' : ''}`} disabled={ocupado || deshabilitado}>{ocupado ? 'Guardando…' : etiqueta}</button>
    </div>
  )
}
