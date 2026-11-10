import {
  CalendarBlank, Gear, Plugs, Robot, SignOut, Tray, Wrench, type Icon,
} from '@phosphor-icons/react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '../components'
import { useAuth } from '../lib/auth'
import { esDeNegocio, esProveedor } from '../lib/roles'
import { useTema } from '../lib/tema'
import { AlertasProvider } from '../lib/alertas'
import { TiempoRealProvider } from '../lib/tiempoReal'
import { Campana } from './Campana'
import { ReportarProblema } from './ReportarProblema'
import { BannerSoporte } from './soporte/BannerSoporte'

interface Seccion { to: string; label: string; Icono: Icon; roles: 'negocio' | 'todos' | 'operativo' }

/** Secciones del dock. `negocio` = owner/superadmin/member; `operativo` = además vendedor; `todos` = también proveedor. */
export const NAV: Seccion[] = [
  { to: '/portal/bandeja', label: 'Bandeja', Icono: Tray, roles: 'operativo' },
  { to: '/portal/agenda', label: 'Agenda', Icono: CalendarBlank, roles: 'todos' },
  { to: '/portal/agente', label: 'Agente', Icono: Robot, roles: 'negocio' },
  { to: '/portal/canales', label: 'Canales', Icono: Plugs, roles: 'negocio' },
  { to: '/portal/herramientas', label: 'Herramientas', Icono: Wrench, roles: 'negocio' },
  { to: '/portal/cuenta', label: 'Ajustes', Icono: Gear, roles: 'todos' },
]

/** Protege /portal/* y pinta el dock flotante (sin sidebar): el canvas es la pantalla. */
export default function PortalLayout() {
  const { estado, usuario, salir } = useAuth()
  const location = useLocation()
  const tema = useTema()
  const soporte = Boolean(usuario?.impersonado_por)

  if (estado === 'cargando') {
    return <div className="grid min-h-dvh place-items-center"><Spinner label="Abriendo tu portal" /></div>
  }
  if (estado === 'anonimo') return <Navigate to="/portal/entrar" replace state={{ desde: location.pathname }} />

  const visibles = NAV.filter((s) =>
    s.roles === 'todos' || (s.roles === 'operativo' ? !esProveedor(usuario) : esDeNegocio(usuario)))
  // Cada rol aterriza en lo suyo: el proveedor en su agenda, el resto en la bandeja.
  if (location.pathname === '/portal') {
    return <Navigate to={esProveedor(usuario) ? '/portal/agenda' : '/portal/bandeja'} replace />
  }

  return (
    <TiempoRealProvider>
     <AlertasProvider>
     <div data-tema={tema} className="min-h-dvh bg-bg text-ink">
      {soporte && <BannerSoporte />}
      <main id="contenido" className="min-h-dvh">
        <Outlet />
      </main>

      <nav aria-label="Portal" className="dock-seguro fixed inset-x-0 bottom-3 z-50 flex justify-center px-3">
        {/* En pantallas angostas (≤ 400 px) los 9 botones no caben: el dock se desplaza en horizontal. */}
        <div className="sin-barra flex max-w-full items-center gap-0 overflow-x-auto sm:gap-1 rounded-full border border-line bg-surface/90 p-1.5 shadow-xl shadow-black/30 backdrop-blur-md [&>*]:shrink-0">
          {visibles.map(({ to, label, Icono }) => (
            <NavLink key={to} to={to} aria-label={label} title={label}
              className={({ isActive }) =>
                `group flex min-h-11 items-center gap-2 rounded-full px-1.5 text-sm min-[400px]:px-3 sm:px-3.5 font-semibold transition ${
                  isActive ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-muted hover:text-ink'}`}>
              {({ isActive }) => (<>
                <Icono size={22} weight={isActive ? 'fill' : 'regular'} aria-hidden />
                <span className={isActive ? 'hidden sm:inline' : 'hidden lg:inline'}>{label}</span>
              </>)}
            </NavLink>
          ))}
          <Campana />
          <ReportarProblema />
          {!soporte && (<>
          <span className="mx-0 h-6 w-px bg-line sm:mx-1" aria-hidden />
          <button type="button" onClick={salir} title={`Cerrar sesión (${usuario?.email ?? ''})`} aria-label="Cerrar sesión"
            className="grid size-9 sm:size-11 cursor-pointer place-items-center rounded-full text-ink-muted transition hover:bg-danger/10 hover:text-danger">
            <SignOut size={22} aria-hidden />
          </button></>)}
        </div>
      </nav>
     </div>
     </AlertasProvider>
    </TiempoRealProvider>
  )
}
