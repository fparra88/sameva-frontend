import { ArrowCounterClockwise, PaperPlaneRight, Wrench, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { api, ApiError } from '../../lib/api'
import type { ProbarAgenteOut, TurnoPrueba } from '../../lib/tipos'

export interface Borrador {
  agent_name: string
  system_prompt: string
  model: string | null
  temperature: number
  history_window: number
}

interface Turno extends TurnoPrueba {
  herramientas?: ProbarAgenteOut['herramientas']
  transferida?: boolean
}

const MENSAJE_MAX = 4000
const TURNOS_MAX = 40 // espejo de services/agente_tester.MAX_TURNOS

/**
 * Chat de prueba: el dueño escribe como cliente y ve la respuesta con el
 * borrador del formulario (guardado o no). El servidor no guarda nada y limita
 * los mensajes por día. Se queda montado cerrado para conservar la conversación.
 */
export function PanelProbar({ abierto, onCerrar, borrador, numeroId, sucio, incompleto }: {
  abierto: boolean
  onCerrar: () => void
  borrador: Borrador
  /** Número de WhatsApp que se prueba; null = Instagram, Facebook y chat web. */
  numeroId: string | null
  sucio: boolean
  incompleto: boolean
}) {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restantes, setRestantes] = useState<number | null>(null)
  const fin = useRef<HTMLDivElement>(null)
  const entrada = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { fin.current?.scrollIntoView?.({ block: 'end' }) }, [turnos, enviando])
  useEffect(() => { if (abierto) entrada.current?.focus() }, [abierto])
  useEffect(() => {
    if (!abierto) return
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [abierto, onCerrar])

  const sinCupo = restantes === 0
  const lleno = turnos.length >= TURNOS_MAX
  const puedeEnviar = Boolean(texto.trim()) && !enviando && !incompleto && !sinCupo && !lleno

  const enviar = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!puedeEnviar) return
    const nuevo: Turno = { role: 'user', content: texto.trim() }
    const conversacion = [...turnos, nuevo]
    setTurnos(conversacion); setTexto(''); setError(null); setEnviando(true)
    try {
      const ruta = numeroId ? `/agente/probar?numero_id=${encodeURIComponent(numeroId)}` : '/agente/probar'
      const r = await api<ProbarAgenteOut>(ruta, {
        method: 'POST',
        body: { ...borrador, agent_name: borrador.agent_name.trim(), mensajes: conversacion.map(({ role, content }) => ({ role, content })) },
      })
      setTurnos([...conversacion, { role: 'assistant', content: r.texto, herramientas: r.herramientas, transferida: r.transferida }])
      setRestantes(r.restantes_hoy)
    } catch (err) {
      // No se contestó: el mensaje vuelve al cuadro para reintentar.
      setTurnos(turnos); setTexto(nuevo.content)
      if (err instanceof ApiError && err.status === 429) setRestantes(0)
      setError(err instanceof ApiError ? err.message : 'No se pudo probar el agente. Inténtalo de nuevo.')
    } finally { setEnviando(false) }
  }

  const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void enviar() }
  }

  return (
    <aside role="dialog" aria-label="Probar agente" aria-hidden={!abierto}
      className={`fixed inset-0 z-[60] flex flex-col bg-surface lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[26rem] lg:border-l lg:border-line lg:shadow-2xl ${abierto ? '' : 'hidden'}`}>
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-semibold">Probar agente</h2>
          <p className="truncate text-xs text-ink-muted">
            {sucio ? 'con tus cambios sin guardar' : 'con la configuración guardada'}{restantes !== null && ` · ${restantes} mensajes hoy`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="btn-ghost min-h-9 px-3" disabled={enviando || turnos.length === 0}
            onClick={() => { setTurnos([]); setError(null); setTexto('') }}>
            <ArrowCounterClockwise size={14} aria-hidden /> Reiniciar
          </button>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="btn-ghost size-9 px-0"><X size={16} aria-hidden /></button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-bg px-4 py-3" aria-live="polite">
        <p className="mb-3 rounded-xl bg-accent-soft p-3 text-xs text-accent">
          Modo prueba: no se envía nada a clientes reales. Lo que cambia datos (reservas, avisos, transferencias) se simula; las consultas de solo lectura sí corren de verdad.
        </p>
        {incompleto && <p role="alert" className="mb-3 rounded-xl bg-danger/10 p-3 text-xs text-danger">Completa el nombre y las instrucciones del agente para poder probarlo.</p>}
        {turnos.length === 0 && !incompleto && (
          <p className="py-8 text-center text-sm text-ink-muted">Escribe como lo haría un cliente, por ejemplo «hola, ¿qué servicios ofrecen?».</p>
        )}
        <ul className="flex flex-col gap-3">
          {turnos.map((t, i) => (
            <li key={i} className={`flex flex-col gap-1 ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm ${
                t.role === 'user' ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md border border-line bg-surface'}`}>
                {t.content}
              </div>
              {t.herramientas && t.herramientas.length > 0 && (
                <details className="max-w-[85%] text-xs text-ink-muted">
                  <summary className="flex cursor-pointer items-center gap-1">
                    <Wrench size={12} aria-hidden /> Usó {t.herramientas.length === 1 ? '1 herramienta' : `${t.herramientas.length} herramientas`}
                  </summary>
                  <ul className="mt-1 space-y-1 font-mono text-[11px]">
                    {t.herramientas.map((h, j) => (
                      <li key={j} className="break-all rounded bg-muted px-2 py-1">
                        {h.tool_key}{Object.keys(h.parametros).length > 0 && ` ${JSON.stringify(h.parametros)}`}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {t.transferida && <span className="text-xs text-accent">El agente habría pasado esta conversación a una persona (no se transfirió nada).</span>}
            </li>
          ))}
          {enviando && <li className="flex items-start"><div className="rounded-2xl border border-line bg-surface px-3.5 py-2 text-sm text-ink-muted">escribiendo…</div></li>}
        </ul>
        <div ref={fin} />
      </div>

      <form onSubmit={enviar} className="space-y-2 border-t border-line px-4 py-3">
        {error && <p role="alert" className="rounded-xl bg-danger/10 p-2.5 text-sm text-danger">{error}</p>}
        {sinCupo && !error && <p className="text-xs text-ink-muted">Llegaste al límite de mensajes de prueba de hoy. Mañana se renueva.</p>}
        {lleno && <p className="text-xs text-ink-muted">La conversación de prueba es muy larga: reiníciala para seguir.</p>}
        <div className="flex items-end gap-2">
          <label htmlFor="mensaje-prueba" className="sr-only">Mensaje de prueba</label>
          <textarea id="mensaje-prueba" ref={entrada} value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={alTeclear}
            maxLength={MENSAJE_MAX} rows={2} placeholder="Escribe un mensaje de prueba…" disabled={enviando || incompleto || sinCupo || lleno}
            className="field min-h-11 flex-1 resize-none py-2.5 text-sm" />
          <button type="submit" className="btn-primary size-11 px-0" disabled={!puedeEnviar} aria-label="Enviar"><PaperPlaneRight size={18} weight="fill" aria-hidden /></button>
        </div>
        <p className="text-[11px] text-ink-muted">Enter envía · Mayús+Enter salto de línea</p>
      </form>
    </aside>
  )
}
