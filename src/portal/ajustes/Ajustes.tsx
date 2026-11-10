import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { esDeNegocio, esGerencia } from '../../lib/roles'
import { Cobros } from '../cobros/Cobros'
import { Suscripcion } from '../suscripcion/Suscripcion'
import { BorrarCuenta } from './BorrarCuenta'
import { Negocio } from './Negocio'
import { SolicitudesSoporte } from '../soporte/SolicitudesSoporte'
import { Perfil } from './Perfil'
import { Usuarios } from './Usuarios'

type Vista = 'perfil' | 'negocio' | 'usuarios' | 'suscripcion' | 'cobros' | 'soporte' | 'cuenta'

/**
 * Ajustes: tu perfil y apariencia (todos), las cuentas del negocio y las invitaciones
 * (owner y superadmin) y borrar la cuenta (solo el dueño).
 */
export default function Ajustes() {
  const { usuario } = useAuth()
  const [params, setParams] = useSearchParams()
  const gerencia = esGerencia(usuario)
  const vistas: { id: Vista; etiqueta: string }[] = [
    { id: 'perfil', etiqueta: 'Perfil' },
    ...(gerencia ? [{ id: 'negocio' as const, etiqueta: 'Negocio' }, { id: 'usuarios' as const, etiqueta: 'Usuarios' }] : []),
    ...(esDeNegocio(usuario) ? [{ id: 'suscripcion' as const, etiqueta: 'Suscripción' }] : []),
    ...(gerencia ? [{ id: 'cobros' as const, etiqueta: 'Cobros' }] : []),
    ...(gerencia && !usuario?.impersonado_por ? [{ id: 'soporte' as const, etiqueta: 'Soporte' }] : []),
    ...(usuario?.role === 'owner' ? [{ id: 'cuenta' as const, etiqueta: 'Cuenta' }] : []),
  ]
  const pedida = params.get('vista') as Vista | null
  const vista = vistas.some((v) => v.id === pedida) ? (pedida as Vista) : 'perfil'

  return (
    <div className={`mx-auto w-full px-4 pb-32 pt-8 sm:px-8 ${vista === 'suscripcion' ? 'max-w-5xl' : 'max-w-3xl'}`}>
      <div className="mb-5">
        <h1 className="text-2xl font-bold sm:text-3xl">Ajustes</h1>
        <p className="mt-1 text-ink-muted">{gerencia ? 'Tu perfil, tu equipo, tu plan y tus cobros.' : 'Tu perfil y la apariencia del portal.'}</p>
        {usuario?.es_gerencia_plataforma && <Link to="/gerencia" className="btn-ghost mt-3 min-h-9 px-4 text-sm">Abrir panel de gerencia</Link>}
      </div>
      {vistas.length > 1 && (
        <nav aria-label="Secciones de ajustes" className="mb-5 flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
          {vistas.map((v) => (
            <button key={v.id} type="button" aria-current={vista === v.id ? 'page' : undefined} onClick={() => setParams(v.id === 'perfil' ? {} : { vista: v.id }, { replace: true })}
              className={`min-h-9 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold transition ${vista === v.id ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-muted hover:text-ink'}`}>
              {v.etiqueta}
            </button>
          ))}
        </nav>
      )}
      {vista === 'perfil' && <Perfil />}
      {vista === 'negocio' && <Negocio />}
      {vista === 'usuarios' && <Usuarios />}
      {vista === 'suscripcion' && <Suscripcion />}
      {vista === 'cobros' && <Cobros />}
      {vista === 'soporte' && <SolicitudesSoporte />}
      {vista === 'cuenta' && <BorrarCuenta />}
    </div>
  )
}
