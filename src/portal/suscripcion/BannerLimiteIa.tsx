import { WarningCircle } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { waLink } from '../../lib/contenido'
import { fechaCorta } from '../../lib/formato'
import { esDeNegocio } from '../../lib/roles'
import type { Alerta } from '../../lib/alertas'
import type { SuscripcionEstado } from '../../lib/tipos'
import { useEvento } from '../../lib/tiempoReal'
import { useApi } from '../../lib/useApi'

/**
 * Aviso permanente cuando el negocio agotó las llamadas de IA de su plan en el ciclo:
 * el agente dejó de responder hasta que el ciclo se reinicie o suba de plan.
 */
export function BannerLimiteIa() {
  const { usuario } = useAuth()
  const { pathname, search } = useLocation()
  const aplica = esDeNegocio(usuario) && !usuario?.onboarding_pendiente
  const { datos: s, recargar } = useApi<SuscripcionEstado>(aplica ? '/pagos/suscripcion' : null)

  // El tope se alcanza (o el ciclo se reinicia) sin que el usuario haga nada: se vuelve a pedir el uso.
  useEvento<Alerta>('nueva_alerta', (a) => { if (a.tipo === 'limite_llamadas_ia') recargar(true) })
  useEvento('datos_actualizados', () => recargar(true))

  const uso = s?.uso_ia
  if (!aplica || !uso?.agotado) return null
  // En la propia pantalla de planes el aviso sobra.
  if (pathname === '/portal/cuenta' && search.includes('suscripcion')) return null

  const puedeContratar = usuario?.role === 'owner' || usuario?.role === 'superadmin'
  const plan = s?.plan ? ` ${s.plan}` : ''

  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-danger px-4 py-2 text-center text-sm font-medium text-white">
      <WarningCircle size={18} aria-hidden />
      <span className="min-w-0 break-words">
        {`Llegaste al límite de llamadas de IA de tu plan${plan}. El agente dejó de responder; tus clientes reciben «En un momento un asesor se pondrá en contacto».`}
        {uso.ciclo_fin ? ` Se reinicia el ${fechaCorta(uso.ciclo_fin)}.` : ''}
      </span>
      {puedeContratar
        ? (uso.plan_siguiente
          ? <Link to="/portal/cuenta?vista=suscripcion" className="font-bold underline underline-offset-2">Subir a {uso.plan_siguiente}</Link>
          : <a href={waLink('Hola, llegué al límite de llamadas de IA de mi plan y quiero ampliarlo.')} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2">Contáctanos</a>)
        : <span>Pídele al dueño del negocio que suba de plan.</span>}
    </div>
  )
}
