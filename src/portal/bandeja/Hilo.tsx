import { ArrowLeft, Paperclip, Robot, SidebarSimple, User, Warning, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { CanalBadge, Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { fechaCorta, hora, nombreContacto } from '../../lib/formato'
import type { ConversacionDetalle, EstadoConversacion, Mensaje } from '../../lib/tipos'
import type { Carga } from '../../lib/useApi'
import { ACEPTA, AdjuntoVista, errorArchivo, esImagen, tamano } from './Adjuntos'

function Burbuja({ m, conversacionId }: { m: Mensaje; conversacionId: string }) {
  const cliente = m.role === 'user'
  const humano = m.role === 'human'
  return (
    <div className={`flex ${cliente ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
        cliente ? 'rounded-bl-md border border-line bg-surface' : humano ? 'rounded-br-md bg-accent text-white' : 'rounded-br-md bg-primary text-on-primary'}`}>
        {!cliente && (
          <p className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold opacity-80">
            {humano ? <User size={11} aria-hidden /> : <Robot size={11} aria-hidden />}
            {humano ? (m.enviado_por ?? 'Equipo') : 'Agente IA'}
          </p>
        )}
        {m.adjuntos.length > 0 && (
          <div className="mb-1 space-y-1">{m.adjuntos.map((a) => <AdjuntoVista key={a.id} conversacionId={conversacionId} a={a} />)}</div>
        )}
        {m.content.trim() !== '' && <p className="whitespace-pre-wrap break-words">{m.content}</p>}
        <time dateTime={m.created_at} className="mt-1 block text-right text-[10px] opacity-70">{hora(m.created_at)}</time>
      </div>
    </div>
  )
}

export function Hilo({ carga, onCambio, onFicha, fichaAbierta, puedeTomar }: {
  carga: Carga<ConversacionDetalle>
  onCambio: () => void
  onFicha: () => void
  fichaAbierta: boolean
  puedeTomar: boolean
}) {
  const fin = useRef<HTMLDivElement>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [vista, setVista] = useState<string | null>(null)
  const selector = useRef<HTMLInputElement>(null)
  const c = carga.datos
  const total = c?.mensajes.length ?? 0

  useEffect(() => { fin.current?.scrollIntoView({ block: 'end' }) }, [total, c?.id])
  useEffect(() => { setTexto(''); setFallo(null); setArchivo(null) }, [c?.id])
  // Miniatura local del archivo elegido (se libera al cambiarlo o quitarlo).
  useEffect(() => {
    if (!archivo || !esImagen(archivo.name)) { setVista(null); return }
    const u = URL.createObjectURL(archivo)
    setVista(u)
    return () => URL.revokeObjectURL(u)
  }, [archivo])

  const elegir = (f: File | undefined | null) => {
    if (!f) return
    const motivo = errorArchivo(f)
    if (motivo) { setFallo(motivo); return }
    setFallo(null); setArchivo(f)
  }

  const accion = async (ruta: string) => {
    if (!c) return
    setFallo(null)
    try { await api<EstadoConversacion>(`/conversaciones/${c.id}/${ruta}`, { method: 'POST' }); onCambio() }
    catch (e) { setFallo(e instanceof ApiError ? e.message : 'No se pudo completar la acción.') }
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!c || (!texto.trim() && !archivo) || enviando) return
    setEnviando(true); setFallo(null)
    try {
      if (archivo) {
        // El texto escrito acompaña al archivo como leyenda.
        const datos = new FormData()
        datos.append('archivo', archivo)
        if (texto.trim()) datos.append('leyenda', texto.trim().slice(0, 1024))
        await api(`/conversaciones/${c.id}/adjuntos`, { method: 'POST', body: datos })
        setArchivo(null)
      } else {
        await api(`/conversaciones/${c.id}/mensajes`, { method: 'POST', body: { texto: texto.trim() } })
      }
      setTexto(''); onCambio()
    } catch (err) { setFallo(err instanceof ApiError ? err.message : 'No se pudo enviar.') }
    finally { setEnviando(false) }
  }

  if (!c) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        {carga.error ? <p role="alert" className="text-danger">{carga.error.message}</p> : <Spinner />}
      </div>
    )
  }

  const humano = c.status === 'transferred'
  const ventanaCerrada = c.channel_type !== 'widget' && c.minutos_restantes_ventana !== null && c.minutos_restantes_ventana <= 0
  let dia = ''

  return (
    <section aria-label="Conversación" className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2.5">
        <Link to="/portal/bandeja" className="btn-ghost size-10 px-0 md:hidden" aria-label="Volver a la lista"><ArrowLeft size={18} /></Link>
        <CanalBadge tipo={c.channel_type} />
        <button type="button" onClick={onFicha} className="min-w-0 flex-1 cursor-pointer text-left" aria-label="Abrir ficha del contacto">
          <span className="block truncate font-semibold">{nombreContacto(c)}</span>
          <span className="block truncate text-xs text-ink-muted">
            {humano ? `Con ${c.asignado_nombre ?? 'una persona'}` : 'La IA está atendiendo'}{c.numero_telefono_visible ? ` · ${c.numero_telefono_visible}` : ''}
          </span>
        </button>
        {puedeTomar && (humano
          ? <button type="button" className="btn-ghost" onClick={() => accion('volver-a-ia')} aria-label="Devolver a la IA"><Robot size={16} aria-hidden /> <span className="hidden sm:inline">Devolver a la IA</span></button>
          : <button type="button" className="btn-primary" onClick={() => accion('tomar')}><User size={16} aria-hidden /> Tomar</button>)}
        <button type="button" onClick={onFicha} aria-pressed={fichaAbierta} aria-label="Ficha del contacto" className="btn-ghost size-10 px-0"><SidebarSimple size={18} mirrored /></button>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-bg px-4 py-4">
        {c.mensajes.map((m) => {
          const d = fechaCorta(m.created_at)
          const sep = d !== dia
          dia = d
          return (
            <div key={m.id}>
              {sep && <p className="my-3 text-center text-[11px] font-medium uppercase tracking-wider text-ink-muted">{d}</p>}
              <Burbuja m={m} conversacionId={c.id} />
            </div>
          )
        })}
        <div ref={fin} />
      </div>

      {fallo && <p role="alert" className="flex items-center gap-2 bg-danger/10 px-4 py-2 text-sm text-danger"><Warning size={16} aria-hidden /> {fallo}</p>}
      {ventanaCerrada && (
        <p className="bg-accent-soft px-4 py-2 text-xs text-accent">Pasaron más de 24 h desde el último mensaje del cliente: solo se pueden enviar plantillas aprobadas.</p>
      )}
      {humano ? (
        <form onSubmit={enviar} className="border-t border-line bg-surface p-3"
          onDragOver={(e) => { if (e.dataTransfer.types.includes('Files')) e.preventDefault() }}
          onDrop={(e) => { if (e.dataTransfer.files.length) { e.preventDefault(); elegir(e.dataTransfer.files[0]) } }}>
          {archivo && (
            <div className="mb-2 flex items-center gap-3 rounded-xl border border-line bg-muted/50 p-2">
              {vista ? <img src={vista} alt="" className="size-14 rounded-lg object-cover" /> : <span className="grid size-14 place-items-center rounded-lg bg-surface"><Paperclip size={22} aria-hidden /></span>}
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{archivo.name}</span><span className="block text-xs text-ink-muted">{tamano(archivo.size)} · el texto de abajo va como leyenda</span></span>
              <button type="button" onClick={() => setArchivo(null)} disabled={enviando} aria-label="Quitar archivo" className="btn-ghost size-9 px-0"><X size={16} /></button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <input ref={selector} type="file" accept={ACEPTA} className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { elegir(e.target.files?.[0]); e.target.value = '' }} />
            <button type="button" onClick={() => selector.current?.click()} disabled={ventanaCerrada || enviando} aria-label="Adjuntar imagen o documento" title="Adjuntar imagen o documento" className="btn-ghost size-11 shrink-0 px-0"><Paperclip size={20} aria-hidden /></button>
            <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={1} maxLength={archivo ? 1024 : 4000} aria-label={archivo ? 'Leyenda del archivo' : 'Escribir mensaje'}
              placeholder={archivo ? 'Leyenda (opcional)…' : 'Escribe una respuesta…'} disabled={ventanaCerrada}
              onPaste={(e) => { const f = [...e.clipboardData.files][0]; if (f) { e.preventDefault(); elegir(f) } }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.form?.requestSubmit() } }}
              className="field max-h-32 min-h-11 flex-1 resize-none py-2.5" />
            <button type="submit" className="btn-primary px-4" disabled={(!texto.trim() && !archivo) || enviando || ventanaCerrada}>{enviando ? 'Enviando…' : 'Enviar'}</button>
          </div>
        </form>
      ) : (
        <p className="border-t border-line bg-surface px-4 py-3 text-center text-sm text-ink-muted">
          La IA responde sola. {puedeTomar ? 'Pulsa «Tomar» para escribirle tú.' : ''}
        </p>
      )}
    </section>
  )
}
