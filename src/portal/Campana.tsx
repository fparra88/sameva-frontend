import { Bell, Checks, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { destinoAlerta, useAlertas, type Alerta } from '../lib/alertas'
import { Portal } from './ui'

const ahora = () => Date.now()
function hace(iso: string): string {
  const s = Math.max(0, Math.round((ahora() - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'ahora'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  return `hace ${Math.floor(s / 86400)} d`
}

/** Botón de campana del dock, su panel de alertas y los avisos emergentes que llegan en vivo. */
export function Campana() {
  const { alertas, noLeidas, toasts, cerrarToast, marcarLeida, marcarTodas } = useAlertas()
  const [abierta, setAbierta] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)
  const navegar = useNavigate()

  useEffect(() => {
    if (!abierta) return
    const fuera = (e: MouseEvent) => { if (!raiz.current?.contains(e.target as Node)) setAbierta(false) }
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAbierta(false) }
    document.addEventListener('mousedown', fuera)
    window.addEventListener('keydown', tecla)
    return () => { document.removeEventListener('mousedown', fuera); window.removeEventListener('keydown', tecla) }
  }, [abierta])

  const abrir = (a: Alerta) => {
    marcarLeida(a.id)
    cerrarToast(a.id)
    setAbierta(false)
    const destino = destinoAlerta(a)
    if (destino) navegar(destino)
  }

  return (
    <div ref={raiz} className="relative">
      <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} aria-haspopup="dialog"
        aria-label={noLeidas > 0 ? `Alertas, ${noLeidas} sin leer` : 'Alertas'} title="Alertas"
        className="relative grid size-9 sm:size-11 cursor-pointer place-items-center rounded-full text-ink-muted transition hover:bg-muted hover:text-ink">
        <Bell size={22} weight={noLeidas > 0 ? 'fill' : 'regular'} aria-hidden />
        {noLeidas > 0 && <span className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[11px] font-bold leading-5 text-white">{noLeidas > 99 ? '99+' : noLeidas}</span>}
      </button>

      {abierta && (
        <Portal><div role="dialog" aria-label="Alertas" className="card fixed inset-x-3 bottom-20 z-[65] mx-auto flex max-h-[70dvh] max-w-md flex-col overflow-hidden shadow-2xl">
          <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="font-semibold">Alertas</h2>
            {noLeidas > 0 && <button type="button" onClick={marcarTodas} className="btn-ghost min-h-8 px-3 text-xs"><Checks size={14} aria-hidden /> Marcar todas</button>}
          </header>
          {alertas.length === 0 ? <p className="p-8 text-center text-sm text-ink-muted">Sin alertas por ahora.</p> : (
            <ul className="divide-y divide-line overflow-y-auto">
              {alertas.map((a) => (
                <li key={a.id}>
                  <button type="button" onClick={() => abrir(a)} className={`flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition hover:bg-muted/60 ${a.leido ? 'opacity-70' : ''}`}>
                    <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full ${a.leido ? 'bg-transparent' : 'bg-primary'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{a.titulo}</span>
                      <span className="line-clamp-3 block text-sm text-ink-muted">{a.mensaje}</span>
                      <span className="mt-0.5 block text-xs text-ink-muted">{hace(a.creado_en)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div></Portal>
      )}

      {/* Avisos en vivo: arriba a la derecha para no tapar el dock ni el hilo. */}
      <Portal><div aria-live="polite" className="pointer-events-none fixed right-3 top-3 z-[80] flex w-[min(24rem,calc(100vw-1.5rem))] flex-col gap-2">
        {toasts.map((a) => (
          <div key={a.id} className="rise card pointer-events-auto flex items-start gap-3 p-3 shadow-xl">
            <button type="button" onClick={() => abrir(a)} className="min-w-0 flex-1 cursor-pointer text-left">
              <span className="block text-sm font-semibold">{a.titulo}</span>
              <span className="line-clamp-2 block text-sm text-ink-muted">{a.mensaje}</span>
            </button>
            <button type="button" onClick={() => cerrarToast(a.id)} aria-label="Descartar aviso" className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-muted"><X size={14} /></button>
          </div>
        ))}
      </div></Portal>
    </div>
  )
}
