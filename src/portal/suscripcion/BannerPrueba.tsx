import { Gift, WarningCircle } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { fechaCorta } from '../../lib/formato'
import { esDeNegocio } from '../../lib/roles'
import type { SuscripcionEstado } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'

const DIA_MS = 86_400_000

/**
 * Aviso permanente sobre la prueba gratuita: cuántos días quedan y, al vencer, que el servicio está pausado.
 * Solo se pinta mientras la suscripción es de origen «prueba» (un plan contratado no muestra nada).
 */
export function BannerPrueba() {
  const { usuario } = useAuth()
  const { pathname, search } = useLocation()
  const aplica = esDeNegocio(usuario) && !usuario?.onboarding_pendiente
  const { datos: s } = useApi<SuscripcionEstado>(aplica ? '/pagos/suscripcion' : null)

  if (!aplica || !s || s.origen !== 'prueba' || !s.fecha_renovacion) return null
  // En la propia pantalla de planes el aviso sobra.
  if (pathname === '/portal/cuenta' && search.includes('suscripcion')) return null

  const dias = Math.ceil((new Date(s.fecha_renovacion).getTime() - Date.now()) / DIA_MS)
  const vencida = s.estado_suscripcion !== 'activa' || dias <= 0
  const puedeContratar = usuario?.role === 'owner' || usuario?.role === 'superadmin'

  return (
    <div role="status" className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-sm font-medium ${
      vencida ? 'bg-danger text-white' : dias <= 3 ? 'bg-amber-400 text-black' : 'bg-accent-soft text-accent'}`}>
      {vencida ? <WarningCircle size={18} aria-hidden /> : <Gift size={18} aria-hidden />}
      <span>
        {vencida
          ? 'Tu prueba gratuita terminó y el servicio está pausado.'
          : `Prueba gratuita: te ${dias === 1 ? 'queda 1 día' : `quedan ${dias} días`} (hasta el ${fechaCorta(s.fecha_renovacion)}).`}
      </span>
      {puedeContratar
        ? <Link to="/portal/cuenta?vista=suscripcion" className="font-bold underline underline-offset-2">{vencida ? 'Contratar un plan para reactivar' : 'Elegir un plan'}</Link>
        : <span>Pídele al dueño del negocio que elija un plan.</span>}
    </div>
  )
}
