import { ArrowClockwise, CheckCircle, Clock, XCircle } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { pesos } from '../../lib/formato'
import type { CheckoutEstado, ConnectEstado } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso } from '../ui'

function Tarjeta({ icono, tono, children }: { icono: ReactNode; tono: 'ok' | 'neutro' | 'error'; children: ReactNode }) {
  const c = { ok: 'bg-success/10 text-success', neutro: 'bg-muted text-ink-muted', error: 'bg-danger/10 text-danger' }[tono]
  return (
    <div className="mx-auto w-full max-w-md px-4 pb-32 pt-16">
      <div className="card flex flex-col items-center gap-4 px-6 py-10 text-center">
        <span className={`grid size-14 place-items-center rounded-2xl ${c}`}>{icono}</span>
        {children}
      </div>
    </div>
  )
}

const ENLACE = 'btn-ghost min-h-9 px-4 text-sm'

/**
 * Retorno del checkout de Stripe (success_url). Llegar aquí NO significa que el pago esté
 * acreditado: la URL es pública y la confirma el webhook. Se le pregunta al backend el estado
 * real del checkout; con tarjeta suele tardar segundos, con OXXO o SPEI puede tardar horas.
 */
export function PagoExito() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const pago = useApi<CheckoutEstado>(sessionId ? `/pagos/checkout/${encodeURIComponent(sessionId)}` : null)
  const acreditado = pago.datos?.estado === 'aprobado'

  return (
    <Tarjeta tono={acreditado ? 'ok' : 'neutro'} icono={acreditado ? <CheckCircle size={30} aria-hidden /> : <Clock size={30} aria-hidden />}>
      {!sessionId ? (<>
        <h1 className="text-lg font-bold">Volviste del pago</h1>
        <p className="text-sm text-ink-muted">No pudimos identificar el pago en esta dirección. Revisa el historial en Suscripción para ver cómo quedó.</p>
      </>) : pago.cargando && !pago.datos ? <Spinner label="Consultando el pago" />
        : pago.error ? <Aviso tipo="error">{pago.error.message}</Aviso>
        : acreditado ? (<>
          <h1 className="text-lg font-bold">¡Listo, pago confirmado!</h1>
          <p className="text-sm text-ink-muted">Se acreditaron {pesos(pago.datos?.monto)} a tu cuenta. Ya puedes usar lo que compraste.</p>
        </>) : (<>
          <h1 className="text-lg font-bold">Estamos confirmando tu pago</h1>
          <p className="text-sm text-ink-muted">Stripe todavía no nos confirmó la operación. Con tarjeta suele tardar unos segundos; si pagaste con OXXO o SPEI, se acredita cuando hagas el pago. No hace falta pagar de nuevo.</p>
          <button type="button" className="btn-ghost" onClick={() => pago.recargar()} disabled={pago.cargando}><ArrowClockwise size={16} aria-hidden /> Volver a consultar</button>
        </>)}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link to="/portal/bandeja" className={ENLACE}>Ir a la bandeja</Link>
        <Link to="/portal/cuenta?vista=suscripcion" className={ENLACE}>Ver mi suscripción</Link>
      </div>
    </Tarjeta>
  )
}

/** Retorno de un pago que no prosperó (cancel_url): no hay nada que deshacer, reintentar es crear otro pago. */
export function PagoError() {
  return (
    <Tarjeta tono="error" icono={<XCircle size={30} aria-hidden />}>
      <h1 className="text-lg font-bold">El pago no se completó</h1>
      <p className="text-sm text-ink-muted">Saliste del pago antes de terminar. No se te cobró nada.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link to="/portal/cuenta?vista=suscripcion" className="btn-primary min-h-9 px-4 text-sm">Reintentar</Link>
        <Link to="/portal/bandeja" className={ENLACE}>Ir a la bandeja</Link>
      </div>
    </Tarjeta>
  )
}

/**
 * Retorno del Account Link de Stripe Connect. Llegar aquí tampoco significa que el onboarding haya
 * terminado (puede faltar información, o el enlace venció y Stripe usó refresh_url): se consulta el estado real.
 */
export function CobrosConectar() {
  const [params] = useSearchParams()
  const esRefresh = params.get('refresh') === '1'
  const estado = useApi<ConnectEstado>('/pagos/connect/estado')
  const [reconectando, setReconectando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listo = estado.datos?.charges_habilitado === true

  // El Account Link anterior venció o se invalidó: hay que pedir uno nuevo, no se puede reusar.
  const reconectar = async () => {
    setError(null); setReconectando(true)
    try { const { url } = await api<{ url: string }>('/pagos/connect/onboarding', { method: 'POST' }); window.location.assign(url) }
    catch (e) { setError(e instanceof ApiError ? e.message : 'No se pudo continuar con Stripe.'); setReconectando(false) }
  }

  return (
    <Tarjeta tono={listo ? 'ok' : 'neutro'} icono={listo ? <CheckCircle size={30} aria-hidden /> : <Clock size={30} aria-hidden />}>
      {estado.cargando && !estado.datos ? <Spinner label="Consultando tu cuenta de Stripe" />
        : estado.error ? <Aviso tipo="error">{estado.error.message}</Aviso>
        : listo ? (<>
          <h1 className="text-lg font-bold">¡Listo, tu cuenta ya puede cobrar!</h1>
          <p className="text-sm text-ink-muted">Ya puedes generar links de pago para tus clientes desde Cobros.</p>
        </>) : (<>
          <h1 className="text-lg font-bold">{esRefresh ? 'El enlace anterior venció' : 'Todavía falta terminar el proceso'}</h1>
          <p className="text-sm text-ink-muted">Stripe necesita algunos datos más antes de poder cobrar. Retoma el proceso para terminarlo.</p>
          {error && <Aviso tipo="error">{error}</Aviso>}
          <button type="button" className="btn-primary" onClick={reconectar} disabled={reconectando}><ArrowClockwise size={16} aria-hidden /> {reconectando ? 'Abriendo Stripe…' : 'Continuar con Stripe'}</button>
        </>)}
      <Link to="/portal/cuenta?vista=cobros" className={`${ENLACE} mt-2`}>Ir a Cobros</Link>
    </Tarjeta>
  )
}

/**
 * La API arma enlaces de retorno sobre BASE_URL_FRONTEND con rutas de la versión anterior
 * (/canales, /suscripcion, /pagos/exito, /cobros/conectar): se reenvían al portal conservando la consulta.
 */
export function Reenviar({ a }: { a: string }) {
  const { search } = useLocation()
  return <Navigate to={`${a}${search}`} replace />
}
