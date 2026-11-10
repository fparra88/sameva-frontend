import { List, X } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components'
import { useAuth } from '../lib/auth'

const LINKS = [
  { href: '#canales', label: 'Canales' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#portal', label: 'Portal' },
  { href: '#precios', label: 'Precios' },
  { href: '#preguntas', label: 'Preguntas' },
]

export function Navbar() {
  const [abierto, setAbierto] = useState(false)
  const { estado } = useAuth()
  const dentro = estado === 'autenticado'

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Principal">
        <Logo className="shrink-0" />
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-primary-soft hover:text-ink">{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-2 lg:flex">
          {dentro ? (
            <Link to="/portal" className="btn-primary whitespace-nowrap">Ir a mi portal</Link>
          ) : (
            <>
              <Link to="/portal/entrar" className="btn-ghost whitespace-nowrap">Iniciar sesión</Link>
              <Link to="/portal/registro" className="btn-primary whitespace-nowrap">Crear cuenta</Link>
            </>
          )}
        </div>
        <button
          type="button"
          className="btn-ghost size-11 shrink-0 px-0 lg:hidden"
          aria-expanded={abierto}
          aria-controls="menu-movil"
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? <X size={22} /> : <List size={22} />}
        </button>
      </nav>
      {abierto && (
        <div id="menu-movil" className="rise border-t border-line bg-bg lg:hidden">
          <ul className="container-page flex flex-col py-3">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} onClick={() => setAbierto(false)} className="block rounded-lg px-2 py-3 font-medium text-ink">{l.label}</a>
              </li>
            ))}
            <li className="mt-2 grid grid-cols-2 gap-2">
              {dentro ? (
                <Link to="/portal" className="btn-primary col-span-2">Ir a mi portal</Link>
              ) : (
                <>
                  <Link to="/portal/entrar" className="btn-ghost whitespace-nowrap">Iniciar sesión</Link>
                  <Link to="/portal/registro" className="btn-primary whitespace-nowrap">Crear cuenta</Link>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}
