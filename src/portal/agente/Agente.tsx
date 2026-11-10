import { ArrowCounterClockwise, Flask } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { esGerencia } from '../../lib/roles'
import type { AgenteConfig, LimitesAgente, ListaNumeros, NumeroConfig, NumeroWhatsApp } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip } from '../ui'
import { PanelProbar } from './PanelProbar'

// Espejo de AgenteConfigIn (schemas.py). La validación real la hace el servidor.
const PROMPT_MAX = 20000
const PROMPT_MIN = 10
const NOMBRE_MAX = 100
const HISTORIAL_MIN = 5
const HISTORIAL_MAX = 200
const SOCIAL = 'social'

interface Formulario {
  agent_name: string
  system_prompt: string
  model: string | null
  temperature: number
  history_window: number
  activo: boolean
}

interface Remoto {
  form: Formulario
  limites: LimitesAgente | null
  /** Datos propios de un número; null en Instagram, Facebook y chat web. */
  numero: Pick<NumeroConfig, 'estado' | 'es_principal' | 'es_linea_avisos'> | null
  incompleta: boolean
}

const esNumero = (d: AgenteConfig | NumeroConfig): d is NumeroConfig => 'agente_activo' in d

function aRemoto(d: AgenteConfig | NumeroConfig): Remoto {
  if (esNumero(d)) {
    return {
      form: { agent_name: d.agent_name, system_prompt: d.system_prompt, model: d.model, temperature: d.temperature, history_window: d.history_window, activo: d.agente_activo },
      limites: d.limites_plan,
      numero: { estado: d.estado, es_principal: d.es_principal, es_linea_avisos: d.es_linea_avisos },
      incompleta: d.configuracion_incompleta,
    }
  }
  return {
    form: { agent_name: d.agent_name, system_prompt: d.system_prompt, model: d.model, temperature: d.temperature, history_window: d.history_window, activo: d.is_active },
    limites: d.limites_plan ?? null,
    numero: null,
    incompleta: !d.agent_name.trim() || !d.system_prompt.trim(),
  }
}

const iguales = (a: Formulario, b: Formulario) =>
  a.agent_name === b.agent_name && a.system_prompt === b.system_prompt && (a.model ?? null) === (b.model ?? null) &&
  a.temperature === b.temperature && a.history_window === b.history_window && a.activo === b.activo

const nombreNumero = (n: Pick<NumeroWhatsApp, 'telefono_visible' | 'phone_number_id'>) => n.telefono_visible?.trim() || n.phone_number_id

/** Página del agente: elige a cuál configurar (un número de WhatsApp, o IG/FB/chat web) y monta el editor. */
export default function Agente() {
  const [params, setParams] = useSearchParams()
  const { usuario } = useAuth()
  const numeros = useApi<ListaNumeros>('/canales/whatsapp/numeros')
  const lista = numeros.datos?.numeros ?? []
  const pedido = params.get('numero')

  // Query (?numero=<id>|social) → si no, el principal → el primero → el social.
  let seleccion = SOCIAL
  if (pedido === SOCIAL) seleccion = SOCIAL
  else if (pedido && lista.some((n) => n.id === pedido)) seleccion = pedido
  else if (lista.length > 0) seleccion = (lista.find((n) => n.es_principal) ?? lista[0]).id

  if (!numeros.datos && numeros.cargando) {
    return <Marco><div className="p-10 text-center"><Spinner label="Cargando configuración" /></div></Marco>
  }

  const selector = (
    <div className="max-w-md">
      <label htmlFor="selector-agente" className="field-label">¿Qué agente configuras?</label>
      <select id="selector-agente" value={seleccion} className="field"
        onChange={(e) => setParams({ numero: e.target.value }, { replace: true })}>
        {lista.map((n) => (
          <option key={n.id} value={n.id}>
            WhatsApp {nombreNumero(n)}{n.es_principal ? ' · principal' : ''}{n.es_linea_avisos ? ' · línea de avisos' : ''}{n.estado === 'pausado' ? ' · pausado' : ''}
          </option>
        ))}
        <option value={SOCIAL}>Instagram, Facebook y chat web</option>
      </select>
      <p className="mt-1.5 text-xs text-ink-muted">Cada número de WhatsApp tiene su propio agente. Instagram, Facebook y el chat web comparten uno.</p>
    </div>
  )

  return (
    // La clave reinicia el estado del formulario al cambiar de agente.
    <Editor key={seleccion} destino={seleccion === SOCIAL ? null : seleccion} soloLectura={!esGerencia(usuario)} selector={selector} />
  )
}

function Marco({ children, acciones, sub }: { children: ReactNode; acciones?: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Agente</h1>
          {sub && <div className="mt-2 flex flex-wrap items-center gap-2">{sub}</div>}
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
      {children}
    </div>
  )
}

function Editor({ destino, soloLectura, selector }: { destino: string | null; soloLectura: boolean; selector: ReactNode }) {
  const ruta = destino ? `/agente/numeros/${destino}` : '/agente'
  const remoto = useApi<AgenteConfig | NumeroConfig>(ruta)
  const modelos = useApi<{ modelos: string[] }>('/agente/modelos')

  // `guardado` = último guardado; `local` = ediciones sin guardar (null si no tocó nada).
  const [guardado, setGuardado] = useState<Remoto | null>(null)
  const [local, setLocal] = useState<Formulario | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [probando, setProbando] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  const original: Remoto | null = guardado ?? (remoto.datos ? aRemoto(remoto.datos) : null)
  const form = local ?? original?.form ?? null
  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current) }, [])

  const set = <K extends keyof Formulario>(k: K, v: Formulario[K]) =>
    setLocal((f) => { const base = f ?? original?.form ?? null; return base ? { ...base, [k]: v } : f })
  const sucio = Boolean(local && original && !iguales(local, original.form))

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form || guardando || soloLectura) return
    setGuardando(true); setError(null); setExito(null)
    try {
      const comun = { agent_name: form.agent_name.trim(), system_prompt: form.system_prompt, model: form.model || null, temperature: form.temperature, history_window: form.history_window }
      const r = await api<AgenteConfig | NumeroConfig>(ruta, {
        method: 'PUT',
        body: destino ? { ...comun, agente_activo: form.activo } : { ...comun, is_active: form.activo },
      })
      setGuardado(aRemoto(r)); setLocal(null)
      setExito('Configuración guardada. Los próximos mensajes ya usan estos ajustes.')
      if (temporizador.current) clearTimeout(temporizador.current)
      temporizador.current = setTimeout(() => setExito(null), 5000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la configuración.')
    } finally { setGuardando(false) }
  }

  if (remoto.error && !form) {
    return <Marco><div className="space-y-4">{selector}<Aviso tipo="error">{remoto.error.message}</Aviso></div></Marco>
  }
  if (!form || !original) {
    return <Marco><div className="space-y-4">{selector}<Spinner label="Cargando configuración" /></div></Marco>
  }

  const listaModelos = modelos.datos?.modelos ?? []
  const modeloFueraDeLista = form.model && !listaModelos.includes(form.model) ? form.model : null
  const promptLen = form.system_prompt.length
  const promptExcedido = promptLen > PROMPT_MAX
  const limites = original.limites
  const modelosDelPlan = limites?.modelos_permitidos ?? listaModelos
  const planLimitaModelos = limites?.modelo_por_defecto != null
  const historialTope = limites?.historial_maximo ?? HISTORIAL_MAX
  const historialExcedido = form.history_window > historialTope
  const modeloFueraDelPlan = Boolean(form.model) && !modelosDelPlan.includes(form.model as string)
  const nombrePlan = limites?.plan ? limites.plan.charAt(0).toUpperCase() + limites.plan.slice(1) : null
  const bloqueado = guardando || soloLectura
  const numero = original.numero
  const incompleto = !form.agent_name.trim() || !form.system_prompt.trim()

  return (
    <>
      <Marco
        sub={<>
          {form.activo ? <Chip tono="ok">activo</Chip> : <Chip tono="aviso">apagado</Chip>}
          {numero?.estado === 'pausado' && <Chip tono="aviso">número pausado</Chip>}
          {numero?.es_principal && <Chip tono="info">principal</Chip>}
          {numero?.es_linea_avisos && <Chip tono="info">línea de avisos de plataforma</Chip>}
          {original.incompleta && <Chip tono="aviso">configuración incompleta</Chip>}
          {sucio && <Chip tono="info">cambios sin guardar</Chip>}
          {soloLectura && <Chip>solo lectura</Chip>}
        </>}
        acciones={!soloLectura && <>
          <button type="button" className="btn-ghost" onClick={() => setProbando(true)} aria-haspopup="dialog"><Flask size={16} aria-hidden /> Probar agente</button>
          <button type="button" className="btn-ghost" onClick={() => { setLocal(null); setError(null) }} disabled={!sucio || guardando}><ArrowCounterClockwise size={16} aria-hidden /> Descartar</button>
          <button type="submit" form="form-agente" className="btn-primary" disabled={guardando || !sucio || promptExcedido || historialExcedido || modeloFueraDelPlan}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </>}
      >
        <form id="form-agente" onSubmit={guardar} noValidate className="space-y-4">
          {selector}
          {error && <Aviso tipo="error">{error}</Aviso>}
          {exito && <Aviso tipo="ok">{exito}</Aviso>}
          {original.incompleta && <Aviso tipo="error">Configuración incompleta: falta el nombre del agente o sus instrucciones. Este agente no responde (ni tampoco las respuestas humanas desde el portal) hasta que lo completes.</Aviso>}
          {numero?.estado === 'pausado' && <Aviso tipo="info">Este número está pausado: no responde ni envía nada. Puedes editar su configuración; se conserva al reactivarlo desde Canales.</Aviso>}
          {numero?.es_linea_avisos && <Aviso tipo="info">Línea de avisos de la plataforma: no cuenta para el cupo ni puede ser el número principal. Por lo demás es un agente como cualquier otro.</Aviso>}
          {soloLectura && <Aviso tipo="info">Puedes ver esta configuración, pero solo la gerencia puede editarla.</Aviso>}

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="card space-y-4 p-5 lg:col-span-2">
              <div>
                <label htmlFor="agent_name" className="field-label">Nombre del agente</label>
                <input id="agent_name" type="text" className="field" value={form.agent_name} maxLength={NOMBRE_MAX} required disabled={bloqueado}
                  onChange={(e) => set('agent_name', e.target.value)} />
                <p className="mt-1 text-xs text-ink-muted">Cómo se presenta ante tus clientes.</p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="system_prompt" className="text-sm font-medium">Instrucciones del agente</label>
                  <span aria-live="polite" className={`text-xs tabular-nums ${promptExcedido ? 'text-danger' : promptLen > PROMPT_MAX * 0.9 ? 'text-accent' : 'text-ink-muted'}`}>
                    {promptLen.toLocaleString('es-MX')} / {PROMPT_MAX.toLocaleString('es-MX')}
                  </span>
                </div>
                <textarea id="system_prompt" value={form.system_prompt} rows={20} spellCheck required minLength={PROMPT_MIN} disabled={bloqueado}
                  aria-invalid={promptExcedido || undefined} onChange={(e) => set('system_prompt', e.target.value)}
                  className={`w-full min-h-64 resize-y rounded-xl border bg-surface p-3.5 font-mono text-[13px] leading-relaxed outline-none focus:ring-4 focus:ring-primary/15 ${promptExcedido ? 'border-danger' : 'border-ink-muted/35 focus:border-primary'}`} />
                <p className="mt-1 text-xs text-ink-muted">Tono, reglas, qué puede y qué no puede decir. Mínimo {PROMPT_MIN} caracteres. Puedes pedirle a tu IA favorita que te ayude a redactarlas y pegarlas aquí.</p>
              </div>
            </section>

            <section className="card space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span id="lbl-activo" className="text-sm font-medium">Agente activo</span>
                  <p className="text-xs text-ink-muted">{form.activo ? 'Responde mensajes' : 'No responde; los mensajes se guardan'}</p>
                </div>
                <button type="button" role="switch" aria-checked={form.activo} aria-labelledby="lbl-activo" disabled={bloqueado} onClick={() => set('activo', !form.activo)}
                  className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors disabled:opacity-50 ${form.activo ? 'bg-success' : 'bg-ink-muted/40'}`}>
                  <span className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform ${form.activo ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              <div>
                <label htmlFor="model" className="field-label">Modelo</label>
                <select id="model" className="field" value={form.model ?? ''} disabled={bloqueado || modelos.cargando} onChange={(e) => set('model', e.target.value || null)}>
                  {!planLimitaModelos && <option value="">Predeterminado del sistema</option>}
                  {modeloFueraDeLista && <option value={modeloFueraDeLista}>{modeloFueraDeLista} (no listado)</option>}
                  {listaModelos.map((m) => {
                    const incluido = modelosDelPlan.includes(m)
                    return <option key={m} value={m} disabled={!incluido && m !== form.model}>{incluido ? m : `${m} (requiere otro plan)`}</option>
                  })}
                </select>
                <p className={`mt-1 text-xs ${modeloFueraDelPlan ? 'text-danger' : 'text-ink-muted'}`}>
                  {modeloFueraDelPlan ? 'Este modelo no está en tu plan. Elige uno incluido.'
                    : modelos.error ? `No se pudo cargar la lista: ${modelos.error.message}`
                    : planLimitaModelos && nombrePlan ? `Tu plan ${nombrePlan} incluye ${modelosDelPlan.length} de ${listaModelos.length} modelos`
                    : 'Lista permitida por el servidor'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="temperature" className="text-sm font-medium">Temperatura</label>
                  <span className="text-xs tabular-nums text-ink-muted">{form.temperature.toFixed(2)}</span>
                </div>
                <input id="temperature" type="range" min={0} max={1} step={0.05} value={form.temperature} disabled={bloqueado}
                  onChange={(e) => set('temperature', Number(e.target.value))} className="mt-2 w-full cursor-pointer accent-primary" />
                <div className="flex justify-between text-xs text-ink-muted"><span>0 · preciso</span><span>1 · creativo</span></div>
              </div>

              <div>
                <label htmlFor="history_window" className="field-label">Mensajes de contexto</label>
                <input id="history_window" type="number" inputMode="numeric" className="field tabular-nums" min={HISTORIAL_MIN} max={historialTope} step={1}
                  value={form.history_window} disabled={bloqueado} aria-invalid={historialExcedido || undefined}
                  onChange={(e) => { const n = Number.parseInt(e.target.value, 10); set('history_window', Number.isNaN(n) ? HISTORIAL_MIN : n) }} />
                <p className={`mt-1 text-xs ${historialExcedido ? 'text-danger' : 'text-ink-muted'}`}>
                  {historialExcedido
                    ? `Tu plan permite hasta ${historialTope} mensajes. Mejora tu plan para dar más contexto.`
                    : `Cuántos mensajes previos recuerda (${HISTORIAL_MIN}–${historialTope}${historialTope < HISTORIAL_MAX && nombrePlan ? `, tope de tu plan ${nombrePlan}` : ''})`}
                </p>
              </div>
            </section>
          </div>
        </form>
      </Marco>

      {!soloLectura && (
        <PanelProbar abierto={probando} onCerrar={() => setProbando(false)} numeroId={destino} sucio={sucio} incompleto={incompleto}
          borrador={{ agent_name: form.agent_name, system_prompt: form.system_prompt, model: form.model || null, temperature: form.temperature, history_window: form.history_window }} />
      )}
    </>
  )
}
