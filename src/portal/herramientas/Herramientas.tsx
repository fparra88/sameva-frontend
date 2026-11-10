import {
  ArrowClockwise, CalendarDots, Copy, Table, FileText, PencilSimple, Plus, ShieldCheck, Trash, Wrench, type Icon,
} from '@phosphor-icons/react'
import { useState } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { fechaCorta, hora } from '../../lib/formato'
import type { Herramienta, HerramientaNumero, ListaNumeros } from '../../lib/tipos'
import { useAuth } from '../../lib/auth'
import { esGerencia } from '../../lib/roles'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip, Dialogo } from '../ui'
import { ConsumoCreditos } from './ConsumoCreditos'

type TipoGoogle = 'google_sheets' | 'google_docs'

const TIPO: Record<TipoGoogle, { Icono: Icon; etiqueta: string; recurso: string; endpoint: string; ejemplo: string }> = {
  google_sheets: { Icono: Table, etiqueta: 'Google Sheet', recurso: 'hoja de cálculo', endpoint: '/herramientas/google-sheets', ejemplo: 'https://docs.google.com/spreadsheets/d/…' },
  google_docs: { Icono: FileText, etiqueta: 'Google Doc', recurso: 'documento', endpoint: '/herramientas/google-docs', ejemplo: 'https://docs.google.com/document/d/…' },
}
const metaTipo = (t: string) => TIPO[t as TipoGoogle] ?? TIPO.google_docs
const meta = (h: Herramienta) => (h.gestionada ? { Icono: CalendarDots, etiqueta: 'Calendario' } : metaTipo(h.tool_type))

// Mínimos del backend (schemas.py): si no se cumplen, la API responde 422.
const MIN = { url: 10, nombre: 2, descripcion: 5 }

type Formulario = { modo: 'crear'; tipo: TipoGoogle } | { modo: 'editar'; herramienta: Herramienta }

/** Solo http(s): la URL viene de la base y se pinta como enlace. */
const urlSegura = (u: string | null) => { try { return u && /^https?:$/.test(new URL(u).protocol) ? u : null } catch { return null } }
const mensaje = (e: unknown, respaldo: string) => (e instanceof ApiError ? e.message : respaldo)
const nombreNumero = (n: { telefono_visible: string | null; phone_number_id: string }) => n.telefono_visible?.trim() || n.phone_number_id

function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" className="btn-ghost min-h-8 px-2.5 text-xs" aria-label="Copiar correo"
      onClick={() => { void navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 1800) }) }}>
      <Copy size={13} aria-hidden /> {ok ? 'Copiado' : 'Copiar'}
    </button>
  )
}

export default function Herramientas() {
  const { usuario } = useAuth()
  const gerencia = esGerencia(usuario)
  const herramientas = useApi<Herramienta[]>('/herramientas')
  const info = useApi<{ correo_servicio: string }>(gerencia ? '/herramientas/info' : null)

  const [formulario, setFormulario] = useState<Formulario | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [aEliminar, setAEliminar] = useState<Herramienta | null>(null)
  const [eliminando, setEliminando] = useState(false)
  // Sube cuando cambia el catálogo, para que el panel por número lo vuelva a pedir.
  const [version, setVersion] = useState(0)

  const lista = herramientas.datos ?? []
  const correo = info.datos?.correo_servicio ?? null
  const sinCredencial = gerencia && info.error !== null

  const accion = async (h: Herramienta, fn: () => Promise<string | void>, respaldo: string) => {
    setError(null); setAviso(null); setOcupada(h.tool_key)
    try { const m = await fn(); if (m) setAviso(m); herramientas.recargar(true) }
    catch (e) { setError(mensaje(e, respaldo)) }
    finally { setOcupada(null) }
  }
  const verificar = (h: Herramienta) => accion(h, async () => {
    await api(`/herramientas/${h.tool_key}/verificar`, { method: 'POST' }); return `"${h.display_name}" sigue accesible.`
  }, 'No se pudo verificar la herramienta.')
  const alternar = (h: Herramienta) => accion(h, async () => {
    await api(`/herramientas/${h.tool_key}`, { method: 'PATCH', body: { is_enabled: !h.is_enabled } })
  }, 'No se pudo cambiar el estado.')

  const confirmarEliminar = async () => {
    if (!aEliminar) return
    setEliminando(true); setError(null)
    try {
      await api(`/herramientas/${aEliminar.tool_key}`, { method: 'DELETE' })
      setAviso(`"${aEliminar.display_name}" se quitó de las herramientas del agente.`)
      setAEliminar(null); herramientas.recargar(true); setVersion((v) => v + 1)
    } catch (e) { setError(mensaje(e, 'No se pudo eliminar la herramienta.')) }
    finally { setEliminando(false) }
  }
  const alGuardar = (m: string) => { setFormulario(null); setError(null); setAviso(m); herramientas.recargar(true); setVersion((v) => v + 1) }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Herramientas</h1>
          <p className="mt-1 text-ink-muted">Lo que tu agente puede consultar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-ghost" onClick={() => herramientas.recargar()}><ArrowClockwise size={16} aria-hidden /> Actualizar</button>
          {gerencia && <>
            <button type="button" className="btn-ghost" disabled={sinCredencial} onClick={() => setFormulario({ modo: 'crear', tipo: 'google_docs' })}><FileText size={16} aria-hidden /> Conectar Doc</button>
            <button type="button" className="btn-primary" disabled={sinCredencial} onClick={() => setFormulario({ modo: 'crear', tipo: 'google_sheets' })}><Plus size={16} aria-hidden /> Conectar Sheet</button>
          </>}
        </div>
      </div>

      <div className="space-y-4">
        {herramientas.error && <Aviso tipo="error">{herramientas.error.message}</Aviso>}
        {error && <Aviso tipo="error">{error}</Aviso>}
        {aviso && <Aviso tipo="ok">{aviso}</Aviso>}

        {gerencia && (
          <section className="card flex items-start gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-strong"><ShieldCheck size={20} aria-hidden /></span>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="font-semibold">Antes de conectar: comparte el documento</h2>
              <p className="text-sm text-ink-muted">
                Abre tu Sheet o Doc en Google, pulsa <strong>Compartir</strong> y agrega este correo con permiso de <strong>Lector</strong>.
                Es el mismo paso que harías con cualquier colaborador; no hace falta que inicies sesión aquí.
              </p>
              {info.cargando && !info.datos ? <Spinner />
                : correo ? (
                  <div className="flex items-center gap-2 rounded-xl border border-line bg-muted/50 px-3 py-1.5">
                    <span className="min-w-0 flex-1 truncate font-mono text-sm">{correo}</span><Copiar texto={correo} />
                  </div>
                ) : <Aviso tipo="error">{info.error?.message ?? 'El portal todavía no tiene configurada la cuenta de servicio de Google.'} Sin ella no se pueden conectar documentos.</Aviso>}
            </div>
          </section>
        )}

        {herramientas.cargando && !herramientas.datos ? <div className="p-6 text-center"><Spinner /></div>
          : lista.length === 0 ? (
            <section className="card flex flex-col items-center gap-3 border-dashed px-6 py-12 text-center">
              <Wrench size={28} className="text-primary" aria-hidden />
              <p className="font-semibold">Tu agente todavía no tiene herramientas</p>
              <p className="max-w-md text-sm text-ink-muted">
                Conecta una hoja de cálculo con tus precios, tu stock o tus horarios, o un documento con las preguntas frecuentes. El agente la consulta cuando la conversación lo pide.
              </p>
              {gerencia && <button type="button" className="btn-primary" disabled={sinCredencial} onClick={() => setFormulario({ modo: 'crear', tipo: 'google_sheets' })}><Plus size={16} aria-hidden /> Conectar un Sheet</button>}
            </section>
          ) : (
            <section className="card divide-y divide-line overflow-hidden" aria-label="Herramientas conectadas">
              {lista.map((h) => {
                const { Icono, etiqueta } = meta(h)
                const trabajando = ocupada === h.tool_key
                const enlace = urlSegura(h.url_original)
                return (
                  <article key={h.tool_key} className={`flex flex-wrap items-start gap-3 p-4 ${h.is_enabled ? '' : 'opacity-60'}`}>
                    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${h.is_enabled ? 'bg-success/10 text-success' : 'bg-muted text-ink-muted'}`}><Icono size={20} aria-hidden /></span>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{h.display_name}</span>
                        <Chip>{etiqueta}</Chip>
                        {h.is_enabled ? <Chip tono="ok">activa</Chip> : <Chip tono="aviso">pausada</Chip>}
                      </div>
                      <p className="break-words text-sm text-ink-muted">{h.description}</p>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 break-all text-xs text-ink-muted">
                        {enlace ? <a href={enlace} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">{h.nombre_documento ?? 'abrir documento'} ↗</a>
                          : h.nombre_documento && <span>{h.nombre_documento}</span>}
                        <span>clave {h.tool_key}</span>
                        {h.last_verified_at && <span>verificada {fechaCorta(h.last_verified_at)} {hora(h.last_verified_at)}</span>}
                      </p>
                    </div>
                    {gerencia && (
                      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                        {!h.gestionada && <button type="button" className="btn-ghost min-h-9 px-3" disabled={trabajando} onClick={() => verificar(h)} title="Comprobar que el documento sigue compartido"><ArrowClockwise size={14} aria-hidden /> Verificar</button>}
                        <button type="button" className="btn-ghost size-9 px-0" disabled={trabajando} onClick={() => setFormulario({ modo: 'editar', herramienta: h })} aria-label={`Editar ${h.display_name}`}><PencilSimple size={15} aria-hidden /></button>
                        <button type="button" className="btn-ghost min-h-9 px-3" disabled={trabajando} onClick={() => alternar(h)}>{h.is_enabled ? 'Pausar' : 'Activar'}</button>
                        {!h.gestionada && <button type="button" className="btn-ghost size-9 px-0 hover:text-danger" disabled={trabajando} onClick={() => setAEliminar(h)} aria-label={`Eliminar ${h.display_name}`}><Trash size={15} aria-hidden /></button>}
                      </div>
                    )}
                  </article>
                )
              })}
            </section>
          )}

        {lista.length > 0 && <ActivacionPorNumero key={version} soloLectura={!gerencia} />}

        {/* Auditoría de créditos: solo el propietario (el backend también lo exige). */}
        {usuario?.role === 'owner' && <ConsumoCreditos herramientas={lista.map((h) => ({ clave: h.tool_key, nombre: h.display_name }))} />}
      </div>

      {formulario && <FormularioHerramienta formulario={formulario} correoServicio={correo} onCerrar={() => setFormulario(null)} onGuardado={alGuardar} />}

      <Dialogo abierto={aEliminar !== null} titulo={`¿Eliminar "${aEliminar?.display_name ?? ''}"?`} onCerrar={() => setAEliminar(null)} ocupado={eliminando}>
        <p className="mt-2 text-sm text-ink-muted">Tu agente dejará de consultar este documento. El documento en Google no se toca; puedes volver a conectarlo cuando quieras.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => setAEliminar(null)} disabled={eliminando}>Cancelar</button>
          <button type="button" className="btn-primary !bg-danger" onClick={confirmarEliminar} disabled={eliminando}>{eliminando ? 'Eliminando…' : 'Eliminar'}</button>
        </div>
      </Dialogo>
    </div>
  )
}

// ------------------------------------------------------------
// Alta / edición
// ------------------------------------------------------------
function FormularioHerramienta({ formulario, correoServicio, onCerrar, onGuardado }: {
  formulario: Formulario; correoServicio: string | null; onCerrar: () => void; onGuardado: (m: string) => void
}) {
  const editando = formulario.modo === 'editar'
  const tipo: TipoGoogle = editando ? ((formulario.herramienta.tool_type as TipoGoogle) in TIPO ? (formulario.herramienta.tool_type as TipoGoogle) : 'google_docs') : formulario.tipo
  const t = TIPO[tipo]
  const esSheet = tipo === 'google_sheets'

  const [url, setUrl] = useState(editando ? (formulario.herramienta.url_original ?? '') : '')
  const [nombre, setNombre] = useState(editando ? formulario.herramienta.display_name : '')
  const [descripcion, setDescripcion] = useState(editando ? formulario.herramienta.description : '')
  const [rango, setRango] = useState('A:Z')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completo = nombre.trim().length >= MIN.nombre && descripcion.trim().length >= MIN.descripcion && (editando || url.trim().length >= MIN.url)

  const guardar = async () => {
    if (!completo || guardando) return
    setGuardando(true); setError(null)
    try {
      if (formulario.modo === 'editar') {
        await api(`/herramientas/${formulario.herramienta.tool_key}`, { method: 'PATCH', body: { display_name: nombre.trim(), description: descripcion.trim() } })
        onGuardado(`"${nombre.trim()}" actualizada.`)
        return
      }
      const creada = await api<Herramienta>(t.endpoint, {
        method: 'POST',
        body: { url: url.trim(), display_name: nombre.trim(), description: descripcion.trim(), ...(esSheet ? { rango: rango.trim() || 'A:Z' } : {}) },
      })
      onGuardado(`"${creada.display_name}" conectada${creada.nombre_documento ? ` a ${creada.nombre_documento}` : ''}.`)
    } catch (e) {
      // El 403 del backend ya trae el correo y qué hacer: se muestra tal cual.
      setError(mensaje(e, 'No se pudo guardar la herramienta.'))
    } finally { setGuardando(false) }
  }

  return (
    <Dialogo abierto titulo={editando ? 'Editar herramienta' : `Conectar un ${t.etiqueta}`} onCerrar={onCerrar} ocupado={guardando}>
      <p className="mt-1 text-xs text-ink-muted">
        {editando ? (formulario.herramienta.gestionada ? 'Herramienta del calendario: solo cambian el nombre y las instrucciones.' : 'El documento y su enlace no cambian.') : 'Se comprueba el acceso antes de guardar.'}
      </p>
      <div className="mt-4 max-h-[60dvh] space-y-4 overflow-y-auto px-0.5 pb-0.5">
        {error && <Aviso tipo="error">{error}</Aviso>}
        {!editando && (
          <div>
            <label htmlFor="h-url" className="field-label">Enlace del {t.recurso}</label>
            <input id="h-url" type="url" className="field" value={url} onChange={(e) => setUrl(e.target.value)} disabled={guardando} placeholder={t.ejemplo} autoFocus />
          </div>
        )}
        <div>
          <label htmlFor="h-nombre" className="field-label">Nombre</label>
          <input id="h-nombre" type="text" className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={guardando} maxLength={255} placeholder={esSheet ? 'Lista de precios' : 'Preguntas frecuentes'} />
          <p className="mt-1 text-xs text-ink-muted">Cómo lo vas a reconocer tú en esta lista.</p>
        </div>
        <div>
          <label htmlFor="h-desc" className="field-label">Cuándo debe consultarlo el agente</label>
          <textarea id="h-desc" rows={3} maxLength={1000} disabled={guardando} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
            placeholder={esSheet ? 'Cuando el cliente pregunte por el precio o la disponibilidad de un producto.' : 'Cuando el cliente pregunte por horarios, garantías o formas de pago.'}
            className="w-full resize-y rounded-xl border border-ink-muted/35 bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15" />
          <p className="mt-1 text-xs text-ink-muted">Esto lo lee la IA para decidir si usar la herramienta: sé concreto.</p>
        </div>
        {!editando && esSheet && (
          <div>
            <label htmlFor="h-rango" className="field-label">Rango</label>
            <input id="h-rango" type="text" className="field" value={rango} onChange={(e) => setRango(e.target.value)} disabled={guardando} maxLength={100} placeholder="A:Z" />
            <p className="mt-1 text-xs text-ink-muted">Notación A1. Déjalo así para leer toda la hoja.</p>
          </div>
        )}
        {!editando && correoServicio && (
          <p className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">Debe estar compartido con <span className="font-mono text-ink">{correoServicio}</span><Copiar texto={correoServicio} /></p>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCerrar} disabled={guardando}>Cancelar</button>
        <button type="button" className="btn-primary" onClick={guardar} disabled={!completo || guardando}>
          {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Comprobar y conectar'}
        </button>
      </div>
    </Dialogo>
  )
}

// ------------------------------------------------------------
// Activación por número (RF-6, RF-9, RF-17)
// ------------------------------------------------------------
const SOCIAL = 'social'

/**
 * Qué herramientas usa cada número de WhatsApp (y, aparte, Instagram, Facebook y el chat web).
 * Una herramienta nueva nace desactivada en todos y se activa aquí. Solo se activan las que el
 * plan incluye (402 `herramienta_no_incluida_en_plan`).
 */
function ActivacionPorNumero({ soloLectura }: { soloLectura: boolean }) {
  const numeros = useApi<ListaNumeros>('/canales/whatsapp/numeros')
  const [elegido, setElegido] = useState<string | null>(null)
  const lista = numeros.datos?.numeros ?? []
  const seleccion = elegido && (elegido === SOCIAL || lista.some((n) => n.id === elegido)) ? elegido : (lista.find((n) => n.es_principal) ?? lista[0])?.id ?? SOCIAL

  const ruta = seleccion === SOCIAL ? '/herramientas/social' : `/herramientas/numeros/${seleccion}`
  const filas = useApi<HerramientaNumero[]>(ruta)
  const [ocupada, setOcupada] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const alternar = async (h: HerramientaNumero) => {
    setError(null); setOcupada(h.tool_key)
    try {
      await api(ruta, { method: 'PUT', body: h.activa ? { activar: [], desactivar: [h.tool_key] } : { activar: [h.tool_key], desactivar: [] } })
      filas.recargar(true)
    } catch (e) { setError(mensaje(e, 'No se pudo cambiar la herramienta.')) }
    finally { setOcupada(null) }
  }

  return (
    <section className="card space-y-3 p-5" aria-labelledby="hn-t">
      <header>
        <h2 id="hn-t" className="font-semibold">Herramientas por número</h2>
        <p className="text-sm text-ink-muted">Cada número de WhatsApp usa solo las herramientas que actives aquí. Las herramientas nuevas empiezan desactivadas en todos.</p>
      </header>
      <div className="max-w-md">
        <label htmlFor="sel-herr" className="field-label">Número</label>
        <select id="sel-herr" className="field" value={seleccion} onChange={(e) => { setError(null); setElegido(e.target.value) }}>
          {lista.map((n) => <option key={n.id} value={n.id}>WhatsApp {nombreNumero(n)}{n.es_principal ? ' · principal' : ''}{n.estado === 'pausado' ? ' · pausado' : ''}</option>)}
          <option value={SOCIAL}>Instagram, Facebook y chat web</option>
        </select>
      </div>
      {numeros.error && <Aviso tipo="error">{numeros.error.message}</Aviso>}
      {filas.error && <Aviso tipo="error">{filas.error.message}</Aviso>}
      {error && <Aviso tipo="error">{error}</Aviso>}
      {!filas.datos && filas.cargando ? <Spinner /> : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {(filas.datos ?? []).map((h) => (
            <li key={h.tool_key} className={`flex flex-wrap items-center gap-3 px-3 py-2.5 ${h.permitida_por_plan ? '' : 'opacity-60'}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{h.display_name ?? h.tool_key}</p>
                <p className="break-all text-xs text-ink-muted">clave {h.tool_key}</p>
                {!h.permitida_por_plan && <p className="text-xs text-danger">Tu plan no incluye esta herramienta.</p>}
              </div>
              <button type="button" role="switch" aria-checked={h.activa} aria-label={`${h.display_name ?? h.tool_key} en este número`}
                // Se puede apagar siempre; encender solo si el plan la incluye.
                disabled={soloLectura || ocupada !== null || (!h.activa && !h.permitida_por_plan)} onClick={() => alternar(h)}
                className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${h.activa ? 'bg-success' : 'bg-ink-muted/40'}`}>
                <span className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform ${h.activa ? 'translate-x-5' : ''}`} />
              </button>
            </li>
          ))}
          {filas.datos?.length === 0 && <li className="px-3 py-4 text-center text-sm text-ink-muted">Conecta una herramienta para poder activarla aquí.</li>}
        </ul>
      )}
    </section>
  )
}
