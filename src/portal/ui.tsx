import { Warning } from '@phosphor-icons/react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

/**
 * Pinta `children` fuera de su lugar en el árbol, dentro del contenedor del tema (`[data-tema]`, que define las
 * variables de color) y no en <body>. Hace falta para todo lo `fixed` que nace dentro del dock: su `backdrop-blur`
 * crea un bloque contenedor y el elemento se posicionaría respecto al dock, no a la pantalla.
 */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.querySelector('[data-tema]') ?? document.body)
}

/** Piezas compartidas por las pantallas del portal. */
export function Aviso({ tipo, children }: { tipo: 'error' | 'ok' | 'info'; children: ReactNode }) {
  return (
    <p role={tipo === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl p-3 text-sm ${
      tipo === 'error' ? 'bg-danger/10 text-danger' : tipo === 'ok' ? 'bg-success/10 text-success' : 'bg-accent-soft text-accent'}`}>
      {tipo === 'error' && <Warning size={16} className="mt-0.5 shrink-0" aria-hidden />}<span>{children}</span>
    </p>
  )
}

export function Chip({ children, tono = 'gris' }: { children: ReactNode; tono?: 'gris' | 'ok' | 'aviso' | 'info' }) {
  const c = { gris: 'bg-muted text-ink-muted', ok: 'bg-success/10 text-success', aviso: 'bg-danger/10 text-danger', info: 'bg-accent-soft text-accent' }[tono]
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{children}</span>
}

/** Diálogo modal mínimo (Escape y clic fuera cierran, salvo que esté ocupado). */
export function Dialogo({ abierto, titulo, onCerrar, ocupado = false, ancho = 'max-w-lg', children }: {
  abierto: boolean; titulo: string; onCerrar: () => void; ocupado?: boolean; ancho?: string; children: ReactNode
}) {
  useEffect(() => {
    if (!abierto) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && !ocupado) onCerrar() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [abierto, ocupado, onCerrar])
  if (!abierto) return null
  return (
    // El overlay hace el scroll: en ventanas bajas el diálogo empieza arriba y se recorre completo; en altas queda centrado.
    <Portal>
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" aria-label="Cerrar" className="fixed inset-0 cursor-default bg-black/50" onClick={() => !ocupado && onCerrar()} />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className={`rise card relative w-full p-4 shadow-2xl sm:p-6 ${ancho}`}>
          <h2 className="text-lg font-bold">{titulo}</h2>
          {children}
        </div>
      </div>
    </div>
    </Portal>
  )
}

