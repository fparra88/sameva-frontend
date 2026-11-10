import { ArrowLeft, Bug, Buildings, ChartBar, ClipboardText, Heartbeat, SignOut, Stack, UsersThree } from '@phosphor-icons/react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '../components'
import { useAuth } from '../lib/auth'
import { useTema } from '../lib/tema'

const SECCIONES = [
  { to: '/gerencia/negocios', etiqueta: 'Negocios', Icono: Buildings },
  { to: '/gerencia/salud', etiqueta: 'Salud', Icono: Heartbeat },
  { to: '/gerencia/consumo', etiqueta: 'Consumo', Icono: ChartBar },
  { to: '/gerencia/incidencias', etiqueta: 'Reportes', Icono: Bug },
  { to: '/gerencia/planes', etiqueta: 'Planes', Icono: Stack },
  { to: '/gerencia/equipo', etiqueta: 'Equipo', Icono: UsersThree },
  { to: '/gerencia/auditoria', etiqueta: 'Auditoría', Icono: ClipboardText },
]

/**
 * Panel de la plataforma (equipo de OperativAI). Es una app aparte dentro del mismo front:
 * otra audiencia y otra forma (navegación lateral, tablas), no el dock del portal del cliente.
 * El servidor decide de verdad con `gerencia_plataforma_actual`; esto solo evita mostrar lo que daría 403.
 */
export default function GerenciaLayout() {
  const { estado, usuario, salir } = useAuth()
  const location = useLocation()
  const tema = useTema()

  if (estado === 'cargando') return <div className="grid min-h-dvh place-items-center"><Spinner label="Abriendo gerencia" /></div>
  if (estado === 'anonimo') return <Navigate to="/portal/entrar" replace state={{ desde: location.pathname }} />
  if (!usuario?.es_gerencia_plataforma) return <Navigate to="/portal" replace />
  if (location.pathname === '/gerencia') return <Navigate to="/gerencia/negocios" replace />

  return (
    <div data-tema={tema} className="min-h-dvh bg-bg text-ink md:flex">
      <aside className="flex items-center gap-2 border-b border-line bg-surface p-3 md:sticky md:top-0 md:h-dvh md:w-56 md:flex-col md:items-stretch md:border-b-0 md:border-r md:p-4">
        <p className="shrink-0 px-2 text-sm font-bold md:mb-3">Gerencia <span className="hidden font-normal text-ink-muted sm:inline">· plataforma</span></p>
        <nav aria-label="Gerencia" className="sin-barra flex min-w-0 flex-1 gap-1 overflow-x-auto md:flex-col md:overflow-visible">
          {SECCIONES.map(({ to, etiqueta, Icono }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) => `flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${isActive ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-muted hover:text-ink'}`}>
              <Icono size={18} aria-hidden /> {etiqueta}
            </NavLink>
          ))}
        </nav>
        <div className="flex shrink-0 gap-1 md:flex-col">
          <NavLink to="/portal" aria-label="Mi portal" className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm text-ink-muted transition hover:bg-muted hover:text-ink"><ArrowLeft size={18} aria-hidden /> <span className="hidden sm:inline">Mi portal</span></NavLink>
          <button type="button" onClick={salir} title={usuario.email} aria-label="Salir" className="flex min-h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-sm text-ink-muted transition hover:bg-danger/10 hover:text-danger"><SignOut size={18} aria-hidden /> <span className="hidden sm:inline">Salir</span></button>
        </div>
      </aside>
      <main id="contenido" className="min-w-0 flex-1"><Outlet /></main>
    </div>
  )
}
