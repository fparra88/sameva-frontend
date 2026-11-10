import { PencilSimple, Plus } from '@phosphor-icons/react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Spinner } from '../components'
import { api, ApiError } from '../lib/api'
import { pesos } from '../lib/formato'
import type { CatalogoModelos, PlanGerencia } from '../lib/tipos'
import { useApi } from '../lib/useApi'
import { Aviso, Chip, Dialogo } from '../portal/ui'

const FAMILIAS: Record<string, string> = {
  calendario: 'Calendario', sql_lectura: 'Consulta SQL', http: 'HTTP', google_sheets: 'Google Sheets', google_docs: 'Google Docs',
}
const FAMILIAS_ORDEN = Object.keys(FAMILIAS)
const tope = (v: number | null) => (v === null ? 'Sin tope' : String(v))

/** Estado del formulario: todo como texto para poder distinguir "vacío" de 0. */
interface Form {
  nombre: string; descripcion: string; precio_monthly: string; precio_annual: string; creditos: string
  max_vendedores: string; max_proveedores: string; max_leads: string; max_numeros: string; historial: string
  stripe: string; orden: string
  activo: boolean; agente: boolean; ventas: boolean; coexistencia: boolean; destacado: boolean
  familias: Set<string>; modelos: Set<string>
}

const aForm = (p: PlanGerencia | null): Form => ({
  nombre: p?.nombre ?? '', descripcion: p?.descripcion ?? '',
  precio_monthly: p?.precio_monthly ?? '0', precio_annual: p?.precio_annual ?? '', creditos: p?.creditos_incluidos_mensual ?? '100',
  max_vendedores: p?.max_vendedores?.toString() ?? '', max_proveedores: p?.max_proveedores?.toString() ?? '',
  max_leads: p?.max_leads_mensuales?.toString() ?? '', max_numeros: p?.max_numeros_whatsapp?.toString() ?? '',
  historial: p?.historial_maximo?.toString() ?? '', stripe: p?.stripe_price_id ?? '', orden: String(p?.orden ?? 0),
  activo: p?.activo ?? true, agente: p?.agente_ia_activo ?? true, ventas: p?.gestion_vendedores_activo ?? true,
  coexistencia: p?.coexistencia_activa ?? false, destacado: p?.destacado ?? false,
  familias: new Set(p ? p.herramientas_plan : FAMILIAS_ORDEN), modelos: new Set(p?.modelos_permitidos ?? []),
})

const entero = (v: string) => (v.trim() === '' ? null : Number(v))
const mismoConjunto = (a: Set<string>, b: string[]) => a.size === b.length && b.every((x) => a.has(x))

/** Cuerpo del POST: lo vacío significa "sin tope". */
function cuerpoCrear(f: Form, modelos: string[]) {
  return {
    nombre: f.nombre.trim(), descripcion: f.descripcion.trim() || null,
    precio_monthly: f.precio_monthly || '0', precio_annual: f.precio_annual.trim() || null,
    creditos_incluidos_mensual: f.creditos || '0',
    max_vendedores: entero(f.max_vendedores), max_proveedores: entero(f.max_proveedores), max_leads_mensuales: entero(f.max_leads),
    max_numeros_whatsapp: entero(f.max_numeros), historial_maximo: entero(f.historial),
    modelos_permitidos: f.modelos.size ? modelos.filter((m) => f.modelos.has(m)) : null,
    stripe_price_id: f.stripe.trim() || null, orden: Number(f.orden) || 0, activo: f.activo,
    agente_ia_activo: f.agente, gestion_vendedores_activo: f.ventas, coexistencia_activa: f.coexistencia, destacado: f.destacado,
    herramientas_plan: FAMILIAS_ORDEN.filter((x) => f.familias.has(x)),
  }
}

/**
 * Cuerpo del PATCH: solo lo que cambió (null = "no tocar" en la API). Para quitar un tope se manda 0
 * (números, historial), [] (modelos) o '' (Price de Stripe).
 */
function cuerpoEditar(f: Form, p: PlanGerencia, modelos: string[]) {
  const c: Record<string, unknown> = {}
  const texto = (k: string, nuevo: string, viejo: string | null) => { if (nuevo.trim() && nuevo.trim() !== (viejo ?? '')) c[k] = nuevo.trim() }
  texto('descripcion', f.descripcion, p.descripcion)
  if (Number(f.precio_monthly) !== Number(p.precio_monthly)) c.precio_monthly = f.precio_monthly
  if (f.precio_annual.trim() && Number(f.precio_annual) !== Number(p.precio_annual)) c.precio_annual = f.precio_annual
  if (Number(f.creditos) !== Number(p.creditos_incluidos_mensual)) c.creditos_incluidos_mensual = f.creditos
  // La API no distingue "quitar" de "no tocar" en estos tres: vacío los deja como están.
  const ent = (k: string, v: string, viejo: number | null) => { const n = entero(v); if (n !== null && n !== viejo) c[k] = n }
  ent('max_vendedores', f.max_vendedores, p.max_vendedores)
  ent('max_proveedores', f.max_proveedores, p.max_proveedores)
  ent('max_leads_mensuales', f.max_leads, p.max_leads_mensuales)
  const quitable = (k: string, v: string, viejo: number | null) => {
    const n = entero(v)
    if (n === null && viejo !== null) c[k] = 0
    else if (n !== null && n !== viejo) c[k] = n
  }
  quitable('max_numeros_whatsapp', f.max_numeros, p.max_numeros_whatsapp)
  quitable('historial_maximo', f.historial, p.historial_maximo)
  if (!mismoConjunto(f.modelos, p.modelos_permitidos ?? [])) c.modelos_permitidos = modelos.filter((m) => f.modelos.has(m))
  if (f.stripe.trim() !== (p.stripe_price_id ?? '')) c.stripe_price_id = f.stripe.trim()
  if ((Number(f.orden) || 0) !== p.orden) c.orden = Number(f.orden) || 0
  if (f.activo !== p.activo) c.activo = f.activo
  if (f.agente !== p.agente_ia_activo) c.agente_ia_activo = f.agente
  if (f.ventas !== p.gestion_vendedores_activo) c.gestion_vendedores_activo = f.ventas
  if (f.coexistencia !== p.coexistencia_activa) c.coexistencia_activa = f.coexistencia
  if (f.destacado !== p.destacado) c.destacado = f.destacado
  if (!mismoConjunto(f.familias, p.herramientas_plan)) c.herramientas_plan = FAMILIAS_ORDEN.filter((x) => f.familias.has(x))
  return c
}

function Campo({ id, etiqueta, ayuda, children }: { id: string; etiqueta: string; ayuda?: string; children: ReactNode }) {
  return <div><label htmlFor={id} className="field-label">{etiqueta}</label>{children}{ayuda && <p className="mt-1 text-xs text-ink-muted">{ayuda}</p>}</div>
}
function Interruptor({ etiqueta, detalle, valor, onCambio }: { etiqueta: string; detalle?: string; valor: boolean; onCambio: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line p-3">
      <input type="checkbox" className="size-4 accent-primary" checked={valor} onChange={(e) => onCambio(e.target.checked)} />
      <span><span className="block text-sm font-semibold">{etiqueta}</span>{detalle && <span className="block text-xs text-ink-muted">{detalle}</span>}</span>
    </label>
  )
}

export default function Planes() {
  const planes = useApi<PlanGerencia[]>('/gerencia/planes')
  const catalogo = useApi<CatalogoModelos>('/gerencia/planes/modelos-agente')
  const [editando, setEditando] = useState<PlanGerencia | 'nuevo' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const alGuardar = (mensaje: string) => { setEditando(null); setAviso(mensaje); planes.recargar(true) }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Planes</h1>
          <p className="mt-1 text-ink-muted">Precios, límites y qué incluye cada plan. Los cambios se ven en el portal y, si el plan está activo y tiene Price de Stripe, en la landing (hasta 60 s). Cada cambio queda en la bitácora.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => { setAviso(null); setEditando('nuevo') }}><Plus size={16} aria-hidden /> Nuevo plan</button>
      </div>

      <div className="space-y-4">
        {planes.error && <Aviso tipo="error">{planes.error.message}</Aviso>}
        {aviso && <Aviso tipo="ok">{aviso}</Aviso>}
        <section className="card overflow-hidden" aria-label="Planes">
          {planes.cargando && !planes.datos ? <div className="p-8 text-center"><Spinner /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-muted/60 text-xs text-ink-muted"><tr>
                  <th scope="col" className="px-5 py-2 font-medium">Plan</th><th scope="col" className="px-3 py-2 font-medium">Mensual</th>
                  <th scope="col" className="px-3 py-2 font-medium">Créditos</th><th scope="col" className="px-3 py-2 font-medium">Números WA</th>
                  <th scope="col" className="px-3 py-2 font-medium">Incluye</th><th scope="col" className="px-3 py-2 font-medium">Estado</th><th scope="col" className="px-5 py-2" />
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {planes.datos?.map((p) => (
                    <tr key={p.nombre} className={p.activo ? '' : 'opacity-60'}>
                      <td className="px-5 py-2.5"><span className="font-semibold">{p.nombre}</span>{p.descripcion && <span className="block max-w-[260px] truncate text-xs text-ink-muted">{p.descripcion}</span>}</td>
                      <td className="px-3 py-2.5 tabular-nums">{pesos(p.precio_monthly)}</td>
                      <td className="px-3 py-2.5 tabular-nums">{Number(p.creditos_incluidos_mensual).toLocaleString('es-MX')}</td>
                      <td className="px-3 py-2.5">{tope(p.max_numeros_whatsapp)}</td>
                      <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">
                        {p.agente_ia_activo && <Chip>Agente</Chip>}{p.gestion_vendedores_activo && <Chip>Ventas</Chip>}{p.calendario_activo && <Chip>Calendario</Chip>}
                        {p.coexistencia_activa && <Chip tono="info">Coexistencia</Chip>}
                      </div></td>
                      <td className="px-3 py-2.5">{p.activo ? <Chip tono="ok">activo</Chip> : <Chip>apagado</Chip>}{!p.stripe_price_id && <span className="ml-1"><Chip tono="aviso" >sin Stripe: oculto en landing</Chip></span>}{p.destacado && <span className="ml-1"><Chip tono="info">recomendado</Chip></span>}</td>
                      <td className="px-5 py-2.5 text-right"><button type="button" className="btn-ghost min-h-8 px-3 text-xs" onClick={() => { setAviso(null); setEditando(p) }}><PencilSimple size={13} aria-hidden /> Editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {editando && <EditorPlan key={editando === 'nuevo' ? 'nuevo' : editando.nombre} plan={editando === 'nuevo' ? null : editando} modelos={catalogo.datos} onCerrar={() => setEditando(null)} onGuardado={alGuardar} />}
    </div>
  )
}

function EditorPlan({ plan, modelos, onCerrar, onGuardado }: { plan: PlanGerencia | null; modelos: CatalogoModelos | null; onCerrar: () => void; onGuardado: (m: string) => void }) {
  const [f, setF] = useState<Form>(() => aForm(plan))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
  const alternar = (k: 'familias' | 'modelos', v: string) => setF((x) => { const n = new Set(x[k]); if (n.has(v)) n.delete(v); else n.add(v); return { ...x, [k]: n } })
  const lista = modelos?.modelos ?? []

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    let cuerpo: Record<string, unknown>
    if (plan) {
      cuerpo = cuerpoEditar(f, plan, lista)
      if (Object.keys(cuerpo).length === 0) { onCerrar(); return }
    } else cuerpo = cuerpoCrear(f, lista)
    setGuardando(true)
    try {
      await api(plan ? `/gerencia/planes/${encodeURIComponent(plan.nombre)}` : '/gerencia/planes', { method: plan ? 'PATCH' : 'POST', body: cuerpo })
      onGuardado(plan ? `Plan ${plan.nombre} actualizado.` : `Plan ${f.nombre.trim()} creado.`)
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo guardar el plan.'); setGuardando(false) }
  }

  return (
    <Dialogo abierto titulo={plan ? `Editar plan ${plan.nombre}` : 'Nuevo plan'} onCerrar={onCerrar} ocupado={guardando} ancho="max-w-2xl">
      <form onSubmit={guardar} className="mt-4 space-y-5">
        {error && <Aviso tipo="error">{error}</Aviso>}
        {!plan && <Campo id="p-nombre" etiqueta="Nombre" ayuda="Identificador estable (minúsculas, números y guiones). No se puede cambiar después."><input id="p-nombre" className="field" value={f.nombre} onChange={(e) => set('nombre', e.target.value)} required maxLength={50} /></Campo>}
        <Campo id="p-desc" etiqueta="Descripción"><textarea id="p-desc" className="field min-h-16" value={f.descripcion} onChange={(e) => set('descripcion', e.target.value)} maxLength={2000} /></Campo>

        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="mb-2 text-sm font-semibold">Precio y créditos</legend>
          <Campo id="p-pm" etiqueta="Mensual (MXN)"><input id="p-pm" className="field" inputMode="decimal" value={f.precio_monthly} onChange={(e) => set('precio_monthly', e.target.value)} required /></Campo>
          <Campo id="p-pa" etiqueta="Anual (MXN)"><input id="p-pa" className="field" inputMode="decimal" value={f.precio_annual} onChange={(e) => set('precio_annual', e.target.value)} /></Campo>
          <Campo id="p-cr" etiqueta="Créditos al mes"><input id="p-cr" className="field" inputMode="decimal" value={f.creditos} onChange={(e) => set('creditos', e.target.value)} required /></Campo>
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="mb-2 text-sm font-semibold">Topes <span className="font-normal text-ink-muted">(vacío = sin tope)</span></legend>
          <Campo id="p-nu" etiqueta="Números de WhatsApp"><input id="p-nu" className="field" inputMode="numeric" value={f.max_numeros} onChange={(e) => set('max_numeros', e.target.value)} /></Campo>
          <Campo id="p-hi" etiqueta="Historial del agente" ayuda={modelos ? `${modelos.historial_min}–${modelos.historial_max} mensajes` : undefined}><input id="p-hi" className="field" inputMode="numeric" value={f.historial} onChange={(e) => set('historial', e.target.value)} /></Campo>
          <Campo id="p-le" etiqueta="Leads al mes"><input id="p-le" className="field" inputMode="numeric" value={f.max_leads} onChange={(e) => set('max_leads', e.target.value)} /></Campo>
          <Campo id="p-ve" etiqueta="Vendedores"><input id="p-ve" className="field" inputMode="numeric" value={f.max_vendedores} onChange={(e) => set('max_vendedores', e.target.value)} /></Campo>
          <Campo id="p-pr" etiqueta="Proveedores"><input id="p-pr" className="field" inputMode="numeric" value={f.max_proveedores} onChange={(e) => set('max_proveedores', e.target.value)} /></Campo>
          {plan && <p className="self-end text-xs text-ink-muted">En vendedores, proveedores y leads, vacío deja el valor como está.</p>}
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Qué incluye</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <Interruptor etiqueta="Agente de IA" valor={f.agente} onCambio={(v) => set('agente', v)} />
            <Interruptor etiqueta="Ventas y seguimiento" detalle="Embudo y CRM en la bandeja" valor={f.ventas} onCambio={(v) => set('ventas', v)} />
            <Interruptor etiqueta="Modo coexistencia" detalle="WhatsApp en la app móvil y la API a la vez" valor={f.coexistencia} onCambio={(v) => set('coexistencia', v)} />
            <Interruptor etiqueta="Plan activo" detalle="Apagado deja de ofrecerse en la landing y el portal; no afecta a quien ya lo tiene" valor={f.activo} onCambio={(v) => set('activo', v)} />
            <Interruptor etiqueta="Recomendado" detalle="Insignia en la landing. Solo un plan a la vez" valor={f.destacado} onCambio={(v) => set('destacado', v)} />
          </div>
          <p className="mb-1 mt-3 text-xs font-medium text-ink-muted">Herramientas del agente</p>
          <div className="flex flex-wrap gap-2">
            {FAMILIAS_ORDEN.map((x) => (
              <label key={x} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${f.familias.has(x) ? 'border-primary bg-primary-soft/40' : 'border-line'}`}>
                <input type="checkbox" className="accent-primary" checked={f.familias.has(x)} onChange={() => alternar('familias', x)} />{FAMILIAS[x]}
              </label>
            ))}
          </div>
          {lista.length > 0 && (<>
            <p className="mb-1 mt-3 text-xs font-medium text-ink-muted">Modelos permitidos <span className="font-normal">(ninguno marcado = todos)</span></p>
            <div className="flex flex-wrap gap-2">
              {lista.map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${f.modelos.has(m) ? 'border-primary bg-primary-soft/40' : 'border-line'}`}>
                  <input type="checkbox" className="accent-primary" checked={f.modelos.has(m)} onChange={() => alternar('modelos', m)} />{m}
                </label>
              ))}
            </div>
          </>)}
        </fieldset>

        <fieldset className="grid gap-3 sm:grid-cols-3">
          <legend className="mb-2 text-sm font-semibold">Cobro y orden</legend>
          <div className="sm:col-span-2"><Campo id="p-st" etiqueta="Price de Stripe" ayuda="price_… recurrente mensual. Sin él el plan no se contrata en línea ni aparece en la landing."><input id="p-st" className="field" value={f.stripe} onChange={(e) => set('stripe', e.target.value)} placeholder="price_…" /></Campo></div>
          <Campo id="p-or" etiqueta="Orden"><input id="p-or" className="field" inputMode="numeric" value={f.orden} onChange={(e) => set('orden', e.target.value)} /></Campo>
        </fieldset>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando || (!plan && !f.nombre.trim())}>{guardando ? 'Guardando…' : plan ? 'Guardar cambios' : 'Crear plan'}</button>
        </div>
      </form>
    </Dialogo>
  )
}
