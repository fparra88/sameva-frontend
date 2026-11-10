import { Check, Coins, CreditCard, Minus, ArrowSquareOut } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { fechaCorta, hora, pesos } from '../../lib/formato'
import { HERRAMIENTAS } from '../../lib/planes'
import { esGerencia } from '../../lib/roles'
import type { CatalogoPagos, EstadoPago, SuscripcionEstado, Transaccion } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip } from '../ui'

const LEYENDA_NETOS = 'IVA incluido'
const LEYENDA_CREDITOS = 'Créditos: se usan al ejecutar herramientas y funciones del agente de IA.'
const LEYENDA_LEADS = 'Leads: son las conversaciones recibidas a través de Meta.'

const ESTADO_PAGO: Record<EstadoPago, { etiqueta: string; tono: 'ok' | 'aviso' | 'info' | 'gris' }> = {
  aprobado: { etiqueta: 'Aprobado', tono: 'ok' },
  pendiente: { etiqueta: 'Pendiente', tono: 'info' },
  rechazado: { etiqueta: 'Rechazado', tono: 'aviso' },
  cancelado: { etiqueta: 'Cancelado', tono: 'gris' },
  reembolsado: { etiqueta: 'Reembolsado', tono: 'gris' },
}

const mensaje = (e: unknown, r: string) => (e instanceof ApiError ? e.message : r)
const num = (v: string | number) => Number(v).toLocaleString('es-MX')

/** Texto y habilitación del botón de una tarjeta de plan. */
function botonPlan(esActual: boolean, recurrente: boolean, cancelaAlVencer: boolean, puedeComprar: boolean) {
  // Con una suscripción recurrente viva el backend responde 409 a cualquier contratación: se evita el error.
  if (recurrente) {
    if (esActual) return cancelaAlVencer
      ? { texto: 'Cancelación programada', title: 'Sigue vigente hasta la fecha de renovación y después se pausa', ok: false }
      : { texto: 'Se renueva automáticamente', title: 'Stripe cobra este plan cada mes, no hace falta renovarlo a mano', ok: false }
    return { texto: 'Contratar ahora', title: cancelaAlVencer ? 'Podrás contratar otro plan cuando termine el período de tu suscripción actual' : 'Ya tienes una suscripción con renovación automática. Para cambiar de plan, escríbenos', ok: false }
  }
  return { texto: esActual ? 'Renovar ahora' : 'Contratar ahora', title: puedeComprar ? 'Ir al pago seguro de Stripe' : 'Solo el dueño del negocio puede contratar', ok: puedeComprar }
}

function Dato({ etiqueta, valor, pista, tono }: { etiqueta: string; valor: ReactNode; pista?: string; tono?: 'ok' | 'aviso' }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs text-ink-muted">{etiqueta}</p>
      <p className={`text-2xl font-bold capitalize tabular-nums ${tono === 'ok' ? 'text-success' : tono === 'aviso' ? 'text-danger' : ''}`}>{valor}</p>
      {pista && <p className="text-xs text-ink-muted">{pista}</p>}
    </div>
  )
}

/** Plan vigente, planes y paquetes de créditos para comprar, y el historial de pagos. */
export function Suscripcion() {
  const { usuario } = useAuth()
  const gerencia = esGerencia(usuario)
  const [params] = useSearchParams()
  const destacado = params.get('plan')

  const catalogo = useApi<CatalogoPagos>('/pagos/catalogo')
  const suscripcion = useApi<SuscripcionEstado>('/pagos/suscripcion')
  const historial = useApi<Transaccion[]>('/pagos/historial')
  // Qué botón espera a la pasarela ("plan:pro" / "creditos:500"): gira solo el que se pulsó.
  const [comprando, setComprando] = useState<string | null>(null)
  const [abriendoPortal, setAbriendoPortal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const s = suscripcion.datos

  // No se marca nada como pagado aquí: el estado real lo escribe el webhook cuando Stripe confirma.
  const comprar = async (clave: string, cuerpo: object) => {
    setError(null); setComprando(clave)
    try {
      const pago = await api<{ checkout_url: string }>('/pagos/crear-pago', { method: 'POST', body: cuerpo })
      window.location.assign(pago.checkout_url)
    } catch (e) { setError(mensaje(e, 'No se pudo iniciar el pago.')); setComprando(null) }
  }
  const abrirPortal = async () => {
    setError(null); setAbriendoPortal(true)
    try { const { url } = await api<{ url: string }>('/pagos/portal-cliente', { method: 'POST' }); window.location.assign(url) }
    catch (e) { setError(mensaje(e, 'No se pudo abrir el portal de Stripe.')); setAbriendoPortal(false) }
  }

  if (suscripcion.cargando && !s) return <div className="p-10 text-center"><Spinner /></div>

  return (
    <div className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      {(suscripcion.error || catalogo.error) && <Aviso tipo="error">{(suscripcion.error ?? catalogo.error)!.message}</Aviso>}
      {!gerencia && <Aviso tipo="info">Solo el dueño del negocio puede contratar un plan o comprar créditos.</Aviso>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Dato etiqueta="Plan" valor={s?.plan ?? '—'} tono={s?.estado_suscripcion === 'activa' ? 'ok' : undefined} pista={s?.precio_monthly ? `${pesos(s.precio_monthly)} / mes` : 'sin contratar'} />
        <Dato etiqueta="Estado" valor={s?.estado_suscripcion ?? '—'} tono={s?.estado_suscripcion === 'activa' ? 'ok' : s?.estado_suscripcion === 'pausada' ? 'aviso' : undefined}
          pista={!s?.fecha_renovacion ? '—' : s.cancela_al_vencer ? `cancelada · vigente hasta ${fechaCorta(s.fecha_renovacion)}` : s.suscripcion_recurrente ? `se cobra sola el ${fechaCorta(s.fecha_renovacion)}` : `renueva ${fechaCorta(s.fecha_renovacion)}`} />
        <Dato etiqueta="Créditos" valor={s ? num(s.creditos_disponibles) : '—'} tono={s && Number(s.creditos_disponibles) > 0 ? 'ok' : 'aviso'} pista="disponibles" />
        <Dato etiqueta="Consumidos" valor={s ? num(s.creditos_gastados) : '—'} pista="histórico" />
      </div>

      {usuario?.role === 'owner' && s?.portal_disponible && (
        <section className="card space-y-3 p-5" aria-labelledby="gest-t">
          <header>
            <h2 id="gest-t" className="font-semibold">Gestionar suscripción</h2>
            <p className="text-sm text-ink-muted">Cancela el plan, cambia la tarjeta o consulta tus facturas en el portal seguro de Stripe.</p>
          </header>
          {s.fecha_renovacion && (
            <p className="text-sm text-ink-muted">
              {s.cancela_al_vencer
                ? <>Ya cancelaste tu plan: lo sigues usando hasta el <strong className="text-ink">{fechaCorta(s.fecha_renovacion)}</strong> y no se vuelve a cobrar.</>
                : <>Si cancelas, no se reembolsa lo ya pagado: conservas el plan hasta el <strong className="text-ink">{fechaCorta(s.fecha_renovacion)}</strong>. Si además piensas borrar tu cuenta, espera a esa fecha: al borrarla antes, los días pagados se pierden.</>}
            </p>
          )}
          <button type="button" className="btn-ghost" onClick={abrirPortal} disabled={abriendoPortal}><ArrowSquareOut size={16} aria-hidden /> {abriendoPortal ? 'Abriendo…' : 'Gestionar / Cancelar suscripción'}</button>
        </section>
      )}

      <section className="card p-5" aria-labelledby="planes-t">
        <header className="mb-4">
          <h2 id="planes-t" className="font-semibold">Planes</h2>
          <p className="text-sm text-ink-muted">Cada plan define las herramientas disponibles, el número de vendedores y los créditos mensuales incluidos.</p>
          <p className="mt-1 text-xs text-ink-muted">{LEYENDA_CREDITOS} {LEYENDA_LEADS}</p>
        </header>
        {catalogo.cargando && !catalogo.datos ? <div className="py-6 text-center"><Spinner /></div> : (
          <div className="grid gap-3 md:grid-cols-3">
            {(catalogo.datos?.planes ?? []).map((plan) => {
              const esActual = s?.plan === plan.nombre && s?.estado_suscripcion === 'activa'
              const boton = botonPlan(esActual, s?.suscripcion_recurrente ?? false, s?.cancela_al_vencer ?? false, gerencia)
              const clave = `plan:${plan.nombre}`
              return (
                <div key={plan.nombre} className={`flex flex-col gap-3 rounded-2xl border p-4 ${esActual ? 'border-success' : destacado === plan.nombre ? 'border-primary' : 'border-line'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold capitalize">{plan.nombre}</h3>
                    {esActual ? <span className="flex flex-wrap justify-end gap-1"><Chip tono="ok">actual</Chip>{plan.disponible === false && <Chip tono="aviso">ya no se ofrece</Chip>}</span> : destacado === plan.nombre && <Chip tono="info">incluye lo que buscas</Chip>}
                  </div>
                  <div><p className="text-3xl font-bold tabular-nums">{pesos(plan.precio_monthly)}<span className="text-sm font-normal text-ink-muted"> / mes</span></p><p className="text-xs text-ink-muted">{LEYENDA_NETOS}</p></div>
                  {plan.descripcion && <p className="text-sm text-ink-muted">{plan.descripcion}</p>}
                  <ul className="space-y-1.5 text-sm">
                    <Item>{plan.max_vendedores === null ? 'Vendedores ilimitados' : `Hasta ${num(plan.max_vendedores)} vendedores`}</Item>
                    {/* Solo cuando el plan lo limita: sin tope definido, "ilimitados" prometería algo no decidido. */}
                    {plan.max_proveedores != null && <Item>Hasta {num(plan.max_proveedores)} proveedores en la agenda</Item>}
                    <Item>{num(plan.creditos_incluidos_mensual)} créditos al mes</Item>
                    {plan.max_leads_mensuales !== null && <Item>{num(plan.max_leads_mensuales)} leads mensuales</Item>}
                  </ul>
                  <ul className="space-y-1.5 border-t border-line pt-3 text-sm" aria-label="Herramientas">
                    {HERRAMIENTAS.map((h) => <Item key={h.columna} incluida={Boolean(plan[h.columna])}>{h.nombre}</Item>)}
                  </ul>
                  <button type="button" className={`mt-auto ${esActual ? 'btn-ghost' : 'btn-primary'}`} title={boton.title}
                    disabled={!boton.ok || comprando !== null} onClick={() => comprar(clave, { tipo: 'subscription', plan: plan.nombre })}>
                    {comprando === clave ? 'Abriendo…' : boton.texto}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="card p-5" aria-labelledby="cred-t">
        <header className="mb-4 flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-strong"><Coins size={20} aria-hidden /></span>
          <div><h2 id="cred-t" className="font-semibold">Comprar créditos</h2><p className="text-sm text-ink-muted">Se suman al saldo y no vencen. {LEYENDA_CREDITOS}</p></div>
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(catalogo.datos?.paquetes ?? []).map((p) => {
            const cantidad = Number(p.creditos), clave = `creditos:${cantidad}`
            return (
              <button key={clave} type="button" disabled={!gerencia || comprando !== null} onClick={() => comprar(clave, { tipo: 'credit_purchase', creditos: cantidad })}
                className={`flex cursor-pointer flex-col items-center gap-0.5 rounded-xl border px-3 py-4 transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50 ${comprando === clave ? 'border-primary' : 'border-line'}`}>
                <span className="text-xl font-bold tabular-nums">{num(cantidad)}</span>
                <span className="text-xs text-ink-muted">créditos</span>
                <span className="mt-1 text-sm font-semibold tabular-nums">{pesos(p.precio)}</span>
                <span className="text-[11px] text-ink-muted">{comprando === clave ? 'abriendo…' : LEYENDA_NETOS}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="card overflow-hidden" aria-labelledby="hist-t">
        <header className="flex items-center gap-3 border-b border-line px-5 py-3">
          <CreditCard size={18} className="text-ink-muted" aria-hidden />
          <div><h2 id="hist-t" className="font-semibold">Historial de pagos</h2><p className="text-xs text-ink-muted">Los últimos movimientos del negocio.</p></div>
        </header>
        {historial.error && <div className="p-4"><Aviso tipo="error">{historial.error.message}</Aviso></div>}
        {!historial.datos ? <div className="p-6 text-center"><Spinner /></div>
          : historial.datos.length === 0 ? <p className="p-8 text-center text-sm text-ink-muted">Todavía no hay pagos.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-muted/60 text-xs text-ink-muted"><tr>
                  <th scope="col" className="px-5 py-2 font-medium">Concepto</th><th scope="col" className="px-3 py-2 font-medium">Método</th><th scope="col" className="px-3 py-2 text-right font-medium">Monto</th><th scope="col" className="px-3 py-2 font-medium">Estado</th><th scope="col" className="px-5 py-2 text-right font-medium">Fecha</th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {historial.datos.map((t) => (
                    <tr key={t.id}>
                      <td className="px-5 py-2.5">{t.concepto ?? t.tipo}</td>
                      <td className="px-3 py-2.5 text-ink-muted">{t.metodo_pago ?? '—'}{t.ultimos_4_digitos && <span className="ml-1 tabular-nums">····{t.ultimos_4_digitos}</span>}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{pesos(t.monto)}</td>
                      <td className="px-3 py-2.5"><Chip tono={ESTADO_PAGO[t.estado_pago].tono}>{ESTADO_PAGO[t.estado_pago].etiqueta}</Chip></td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-ink-muted">{fechaCorta(t.creado_en)} {hora(t.creado_en)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </section>
    </div>
  )
}

function Item({ children, incluida = true }: { children: ReactNode; incluida?: boolean }) {
  return (
    <li className={`flex items-start gap-2 ${incluida ? '' : 'text-ink-muted/70'}`}>
      {incluida ? <Check size={15} className="mt-0.5 shrink-0 text-success" aria-hidden /> : <Minus size={15} className="mt-0.5 shrink-0" aria-hidden />}
      <span>{children}{!incluida && <span className="sr-only"> (no incluido)</span>}</span>
    </li>
  )
}
