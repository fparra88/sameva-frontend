import { CalendarCheck, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { DIAS_SEMANA, fechaLegible, fechaLocal, sumarDias } from '../../lib/formato'
import { esGerencia } from '../../lib/roles'
import type { CupoProveedores, Descanso, Excepcion, HorarioSemanal, Proveedor, ReemplazarHorariosOut } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip, Dialogo } from '../ui'

const mensaje = (e: unknown, r: string) => (e instanceof ApiError ? e.message : r)
const hhmm = (t: string | null) => (t ? t.slice(0, 5) : '')
const COLORES = ['#0047a7', '#0891b2', '#16a34a', '#ea580c', '#db2777', '#ca8a04', '#2563eb', '#475569']

export function Proveedores({ base }: { base: string }) {
  const { usuario } = useAuth()
  const gerencia = esGerencia(usuario)
  const lista = useApi<Proveedor[]>(`${base}/proveedores`)
  const cupo = useApi<CupoProveedores>(gerencia ? `${base}/proveedores/cupo` : null)
  const [editando, setEditando] = useState<Proveedor | 'nuevo' | null>(null)
  const [disponibilidad, setDisponibilidad] = useState<Proveedor | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const alternar = async (p: Proveedor) => {
    setError(null); setAviso(null)
    try { await api(`${base}/proveedores/${p.id}`, { method: 'PATCH', body: { activo: !p.activo } }); lista.recargar(true); cupo.recargar(true) }
    catch (e) { setError(mensaje(e, 'No se pudo cambiar el estado.')) }
  }
  const c = cupo.datos
  const lleno = c !== null && c !== undefined && c.maximo !== null && c.activos >= c.maximo

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {gerencia ? 'Quienes atienden las citas: su jornada, descansos y días libres definen cuándo se puede agendar.' : 'Tu disponibilidad: define tus descansos y tus días libres.'}
          {c && <> · {c.activos}{c.maximo !== null ? ` de ${c.maximo}` : ''} activos{c.maximo === null ? ' · sin tope' : ''}</>}
        </p>
        {gerencia && <button type="button" className="btn-primary" onClick={() => setEditando('nuevo')} disabled={lleno} title={lleno ? 'Llegaste al tope de proveedores de tu plan' : undefined}><Plus size={16} aria-hidden /> Nuevo proveedor</button>}
      </div>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {aviso && <Aviso tipo="ok">{aviso}</Aviso>}
      {lista.error && <Aviso tipo="error">{lista.error.message}</Aviso>}
      {lista.cargando && !lista.datos ? <div className="p-8 text-center"><Spinner /></div>
        : lista.datos?.length === 0 ? <p className="card px-6 py-12 text-center text-ink-muted">Todavía no hay proveedores.</p>
        : (
          <ul className="card divide-y divide-line overflow-hidden">
            {lista.datos?.map((p) => (
              <li key={p.id} className={`flex flex-wrap items-center gap-3 p-4 ${p.activo ? '' : 'opacity-60'}`}>
                <span className="size-4 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{p.nombre}</span>{p.activo ? <Chip tono="ok">activo</Chip> : <Chip>inactivo</Chip>}{p.portal_user_id && <Chip tono="info">con acceso al portal</Chip>}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => setDisponibilidad(p)}><CalendarCheck size={15} aria-hidden /> {gerencia ? 'Horarios' : 'Mi disponibilidad'}</button>
                  {gerencia && <>
                    <button type="button" className="btn-ghost size-9 px-0" onClick={() => setEditando(p)} aria-label={`Editar ${p.nombre}`}><PencilSimple size={15} aria-hidden /></button>
                    <button type="button" className="btn-ghost min-h-9 px-3" onClick={() => alternar(p)} disabled={!p.activo && lleno}>{p.activo ? 'Desactivar' : 'Activar'}</button>
                  </>}
                </div>
              </li>
            ))}
          </ul>
        )}
      {editando && <FormProveedor base={base} proveedor={editando === 'nuevo' ? null : editando} onCerrar={() => setEditando(null)}
        onGuardado={(m) => { setEditando(null); setAviso(m); lista.recargar(true); cupo.recargar(true) }} />}
      {disponibilidad && <Disponibilidad base={base} proveedor={disponibilidad} puedeHorario={gerencia} onCerrar={() => setDisponibilidad(null)} />}
    </div>
  )
}

function FormProveedor({ base, proveedor, onCerrar, onGuardado }: { base: string; proveedor: Proveedor | null; onCerrar: () => void; onGuardado: (m: string) => void }) {
  const [nombre, setNombre] = useState(proveedor?.nombre ?? '')
  const [color, setColor] = useState(proveedor?.color ?? COLORES[0])
  const [orden, setOrden] = useState(String(proveedor?.orden ?? 0))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setGuardando(true); setError(null)
    try {
      const cuerpo = { nombre: nombre.trim(), color, orden: Number(orden) || 0 }
      if (proveedor) await api(`${base}/proveedores/${proveedor.id}`, { method: 'PATCH', body: cuerpo })
      else await api(`${base}/proveedores`, { method: 'POST', body: cuerpo })
      onGuardado(proveedor ? `"${cuerpo.nombre}" actualizado.` : `"${cuerpo.nombre}" agregado. Define su horario para que pueda recibir citas.`)
    } catch (err) { setError(mensaje(err, 'No se pudo guardar el proveedor.')) }
    finally { setGuardando(false) }
  }
  return (
    <Dialogo abierto titulo={proveedor ? 'Editar proveedor' : 'Nuevo proveedor'} onCerrar={onCerrar} ocupado={guardando}>
      <form onSubmit={enviar} className="mt-3 space-y-4">
        {error && <Aviso tipo="error">{error}</Aviso>}
        <div><label htmlFor="p-nombre" className="field-label">Nombre</label><input id="p-nombre" className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} minLength={2} maxLength={255} required autoFocus /></div>
        <div><span className="field-label">Color en la agenda</span>
          <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Color">
            {COLORES.map((c) => <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)} className={`size-8 cursor-pointer rounded-full ring-offset-2 transition ${color === c ? 'ring-2 ring-ink' : ''}`} style={{ background: c }} />)}
            <input type="color" aria-label="Otro color" value={color} onChange={(e) => setColor(e.target.value)} className="size-8 cursor-pointer rounded-full border border-line bg-transparent p-0" />
          </div></div>
        <div><label htmlFor="p-orden" className="field-label">Orden en la grilla</label><input id="p-orden" type="number" min={0} max={32767} className="field !w-28" value={orden} onChange={(e) => setOrden(e.target.value)} /></div>
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onCerrar} disabled={guardando}>Cancelar</button><button type="submit" className="btn-primary" disabled={guardando || nombre.trim().length < 2}>{guardando ? 'Guardando…' : 'Guardar'}</button></div>
      </form>
    </Dialogo>
  )
}

// ------------------------------------------------------------
// Horario semanal, descansos y días libres
// ------------------------------------------------------------
type Pestana = 'horario' | 'descansos' | 'libres'
type Bloque = { dia: number; hi: string; hf: string }

function Disponibilidad({ base, proveedor, puedeHorario, onCerrar }: { base: string; proveedor: Proveedor; puedeHorario: boolean; onCerrar: () => void }) {
  const [pestana, setPestana] = useState<Pestana>(puedeHorario ? 'horario' : 'descansos')
  const pestanas: [Pestana, string][] = [...(puedeHorario ? [['horario', 'Horario semanal'] as [Pestana, string]] : []), ['descansos', 'Descansos'], ['libres', 'Días especiales']]
  return (
    <Dialogo abierto titulo={`Disponibilidad de ${proveedor.nombre}`} onCerrar={onCerrar}>
      <div className="mt-3 flex gap-1 overflow-x-auto rounded-full border border-line p-1">
        {pestanas.map(([id, et]) => <button key={id} type="button" onClick={() => setPestana(id)} aria-current={pestana === id ? 'page' : undefined} className={`min-h-8 shrink-0 cursor-pointer rounded-full px-3.5 text-sm font-semibold ${pestana === id ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-muted'}`}>{et}</button>)}
      </div>
      <div className="mt-4 max-h-[60dvh] overflow-y-auto pr-1">
        {pestana === 'horario' && <HorarioSemana base={base} proveedor={proveedor} />}
        {pestana === 'descansos' && <Descansos base={base} proveedor={proveedor} />}
        {pestana === 'libres' && <DiasEspeciales base={base} proveedor={proveedor} />}
      </div>
      <div className="mt-4 flex justify-end"><button type="button" className="btn-ghost" onClick={onCerrar}>Cerrar</button></div>
    </Dialogo>
  )
}

function HorarioSemana({ base, proveedor }: { base: string; proveedor: Proveedor }) {
  const actual = useApi<HorarioSemanal[]>(`${base}/proveedores/${proveedor.id}/horarios`)
  const [bloques, setBloques] = useState<Bloque[] | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ReemplazarHorariosOut | null>(null)

  const datos: Bloque[] | null = bloques ?? (actual.datos ? actual.datos.map((h) => ({ dia: h.dia_semana, hi: hhmm(h.hora_inicio), hf: hhmm(h.hora_fin) })) : null)
  if (!datos) return actual.error ? <Aviso tipo="error">{actual.error.message}</Aviso> : <Spinner />
  const set = (fn: (b: Bloque[]) => Bloque[]) => { setBloques(fn(datos)); setResultado(null) }
  const invalido = datos.some((b) => !b.hi || !b.hf || b.hf <= b.hi)

  const guardar = async () => {
    setGuardando(true); setError(null); setResultado(null)
    try {
      const r = await api<ReemplazarHorariosOut>(`${base}/proveedores/${proveedor.id}/horarios`, { method: 'PUT', body: { bloques: datos.map((b) => ({ dia_semana: b.dia, hora_inicio: b.hi, hora_fin: b.hf })) } })
      setResultado(r); setBloques(null); actual.recargar(true)
    } catch (e) { setError(mensaje(e, 'No se pudo guardar el horario.')) }
    finally { setGuardando(false) }
  }

  return (
    <div className="space-y-3">
      {error && <Aviso tipo="error">{error}</Aviso>}
      {resultado && (resultado.reservas_en_conflicto.length > 0
        ? <Aviso tipo="error">Horario guardado, pero {resultado.reservas_en_conflicto.length} cita(s) futuras quedaron fuera del nuevo horario: {resultado.reservas_en_conflicto.slice(0, 5).map((r) => `${r.cliente_nombre ?? 'Cliente'} (${new Date(r.hora_inicio).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })})`).join(', ')}. Reprográmalas o avisa a los clientes.</Aviso>
        : <Aviso tipo="ok">Horario guardado.</Aviso>)}
      {DIAS_SEMANA.map((nombre, dia) => {
        const del = datos.map((b, i) => ({ b, i })).filter((x) => x.b.dia === dia)
        return (
          <div key={dia} className="flex flex-wrap items-start gap-3 border-b border-line pb-3 last:border-0">
            <span className="w-24 pt-2 text-sm font-medium">{nombre}</span>
            <div className="min-w-0 flex-1 space-y-2">
              {del.length === 0 && <p className="pt-2 text-sm text-ink-muted">No atiende</p>}
              {del.map(({ b, i }) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="time" aria-label={`${nombre}: desde`} className="field !min-h-9 !w-auto" value={b.hi} onChange={(e) => set((l) => l.map((x, j) => (j === i ? { ...x, hi: e.target.value } : x)))} />
                  <span className="text-ink-muted">a</span>
                  <input type="time" aria-label={`${nombre}: hasta`} className="field !min-h-9 !w-auto" value={b.hf} onChange={(e) => set((l) => l.map((x, j) => (j === i ? { ...x, hf: e.target.value } : x)))} />
                  <button type="button" className="btn-ghost size-9 px-0 hover:text-danger" aria-label={`Quitar bloque de ${nombre}`} onClick={() => set((l) => l.filter((_, j) => j !== i))}><Trash size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" className="btn-ghost min-h-9 px-3 text-xs" onClick={() => set((l) => [...l, { dia, hi: '09:00', hf: '18:00' }])}><Plus size={13} aria-hidden /> Bloque</button>
          </div>
        )
      })}
      {invalido && <p className="text-xs text-danger">Cada bloque necesita una hora de fin posterior a la de inicio.</p>}
      <div className="flex justify-end"><button type="button" className="btn-primary" onClick={guardar} disabled={guardando || invalido || bloques === null}>{guardando ? 'Guardando…' : 'Guardar horario'}</button></div>
    </div>
  )
}

function Descansos({ base, proveedor }: { base: string; proveedor: Proveedor }) {
  const lista = useApi<Descanso[]>(`${base}/proveedores/${proveedor.id}/descansos`)
  const [tipo, setTipo] = useState<'semanal' | 'fecha'>('semanal')
  const [dia, setDia] = useState(0)
  const [fecha, setFecha] = useState(fechaLocal(new Date()))
  const [hi, setHi] = useState('14:00')
  const [hf, setHf] = useState('15:00')
  const [etiqueta, setEtiqueta] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const agregar = async (e: FormEvent) => {
    e.preventDefault()
    setGuardando(true); setError(null)
    try {
      await api(`${base}/proveedores/${proveedor.id}/descansos`, { method: 'POST', body: { ...(tipo === 'semanal' ? { dia_semana: dia } : { fecha }), hora_inicio: hi, hora_fin: hf, etiqueta: etiqueta.trim() || null } })
      setEtiqueta(''); lista.recargar(true)
    } catch (err) { setError(mensaje(err, 'No se pudo agregar el descanso.')) }
    finally { setGuardando(false) }
  }
  const quitar = async (d: Descanso) => {
    setError(null)
    try { await api(`${base}/descansos/${d.id}`, { method: 'DELETE' }); lista.recargar(true) }
    catch (err) { setError(mensaje(err, 'No se pudo quitar el descanso.')) }
  }
  return (
    <div className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      <p className="text-sm text-ink-muted">Pausas dentro de la jornada (comida, por ejemplo): en ese rato no se agendan citas.</p>
      {lista.cargando && !lista.datos ? <Spinner /> : lista.datos?.length === 0 ? <p className="text-sm text-ink-muted">Sin descansos.</p> : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {lista.datos?.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="flex-1"><strong>{d.fecha ? fechaLegible(d.fecha) : `Todos los ${DIAS_SEMANA[d.dia_semana ?? 0].toLowerCase()}`}</strong> · {hhmm(d.hora_inicio)}–{hhmm(d.hora_fin)}{d.etiqueta ? ` · ${d.etiqueta}` : ''}</span>
              <button type="button" className="btn-ghost size-8 px-0 hover:text-danger" aria-label="Quitar descanso" onClick={() => quitar(d)}><Trash size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={agregar} className="space-y-3 rounded-xl bg-muted/50 p-3">
        <div className="flex flex-wrap gap-3">
          <div><label htmlFor="ds-tipo" className="field-label">Se repite</label><select id="ds-tipo" className="field !min-h-9" value={tipo} onChange={(e) => setTipo(e.target.value as 'semanal' | 'fecha')}><option value="semanal">Cada semana</option><option value="fecha">Un día concreto</option></select></div>
          {tipo === 'semanal'
            ? <div><label htmlFor="ds-dia" className="field-label">Día</label><select id="ds-dia" className="field !min-h-9" value={dia} onChange={(e) => setDia(Number(e.target.value))}>{DIAS_SEMANA.map((n, i) => <option key={i} value={i}>{n}</option>)}</select></div>
            : <div><label htmlFor="ds-fecha" className="field-label">Fecha</label><input id="ds-fecha" type="date" className="field !min-h-9" value={fecha} onChange={(e) => setFecha(e.target.value)} required /></div>}
          <div><label htmlFor="ds-hi" className="field-label">Desde</label><input id="ds-hi" type="time" className="field !min-h-9" value={hi} onChange={(e) => setHi(e.target.value)} required /></div>
          <div><label htmlFor="ds-hf" className="field-label">Hasta</label><input id="ds-hf" type="time" className="field !min-h-9" value={hf} onChange={(e) => setHf(e.target.value)} required /></div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1"><label htmlFor="ds-et" className="field-label">Etiqueta (opcional)</label><input id="ds-et" className="field !min-h-9" value={etiqueta} onChange={(e) => setEtiqueta(e.target.value)} maxLength={100} placeholder="Comida" /></div>
          <button type="submit" className="btn-primary min-h-9" disabled={guardando || hf <= hi}>{guardando ? 'Agregando…' : 'Agregar descanso'}</button>
        </div>
      </form>
    </div>
  )
}

function DiasEspeciales({ base, proveedor }: { base: string; proveedor: Proveedor }) {
  const hoy = fechaLocal(new Date())
  const lista = useApi<Excepcion[]>(`${base}/proveedores/${proveedor.id}/excepciones?desde=${hoy}&hasta=${sumarDias(hoy, 180)}`)
  const [fecha, setFecha] = useState(hoy)
  const [disponible, setDisponible] = useState(false)
  const [hi, setHi] = useState('10:00')
  const [hf, setHf] = useState('14:00')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const agregar = async (e: FormEvent) => {
    e.preventDefault()
    setGuardando(true); setError(null)
    try {
      await api(`${base}/proveedores/${proveedor.id}/excepciones`, { method: 'POST', body: disponible ? { fecha, disponible: true, hora_inicio: hi, hora_fin: hf } : { fecha, disponible: false } })
      lista.recargar(true)
    } catch (err) { setError(mensaje(err, 'No se pudo guardar el día.')) }
    finally { setGuardando(false) }
  }
  const quitar = async (x: Excepcion) => {
    setError(null)
    try { await api(`${base}/excepciones/${x.id}`, { method: 'DELETE' }); lista.recargar(true) }
    catch (err) { setError(mensaje(err, 'No se pudo quitar el día.')) }
  }
  return (
    <div className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      <p className="text-sm text-ink-muted">Un día libre (vacaciones, permiso) o con un horario distinto al habitual. Reemplaza la jornada de ese día.</p>
      {lista.cargando && !lista.datos ? <Spinner /> : lista.datos?.length === 0 ? <p className="text-sm text-ink-muted">Sin días especiales próximos.</p> : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {lista.datos?.map((x) => (
            <li key={x.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="flex-1 capitalize"><strong>{fechaLegible(x.fecha)}</strong> · {x.disponible ? `atiende ${hhmm(x.hora_inicio)}–${hhmm(x.hora_fin)}` : 'día libre'}</span>
              <button type="button" className="btn-ghost size-8 px-0 hover:text-danger" aria-label="Quitar día" onClick={() => quitar(x)}><Trash size={14} /></button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={agregar} className="space-y-3 rounded-xl bg-muted/50 p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div><label htmlFor="de-fecha" className="field-label">Fecha</label><input id="de-fecha" type="date" className="field !min-h-9" value={fecha} min={hoy} onChange={(e) => setFecha(e.target.value)} required /></div>
          <label className="flex min-h-9 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={disponible} onChange={(e) => setDisponible(e.target.checked)} /> Atiende con otro horario</label>
        </div>
        {disponible && (
          <div className="flex flex-wrap gap-3">
            <div><label htmlFor="de-hi" className="field-label">Desde</label><input id="de-hi" type="time" className="field !min-h-9" value={hi} onChange={(e) => setHi(e.target.value)} required /></div>
            <div><label htmlFor="de-hf" className="field-label">Hasta</label><input id="de-hf" type="time" className="field !min-h-9" value={hf} onChange={(e) => setHf(e.target.value)} required /></div>
          </div>
        )}
        <button type="submit" className="btn-primary min-h-9" disabled={guardando || (disponible && hf <= hi)}>{guardando ? 'Guardando…' : disponible ? 'Agregar horario especial' : 'Marcar día libre'}</button>
      </form>
    </div>
  )
}
