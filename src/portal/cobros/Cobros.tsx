import { ArrowSquareOut, Copy, Wallet } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { fechaCorta, hora, pesos } from '../../lib/formato'
import type { CobroConnect, ConnectEstado } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip } from '../ui'

const ESTADO: Record<CobroConnect['estado'], { etiqueta: string; tono: 'ok' | 'gris' | 'info' }> = {
  activo: { etiqueta: 'Activo', tono: 'info' },
  pagado: { etiqueta: 'Pagado', tono: 'ok' },
  desactivado: { etiqueta: 'Desactivado', tono: 'gris' },
}
const mensaje = (e: unknown, r: string) => (e instanceof ApiError ? e.message : r)

/**
 * Cobros propios del negocio (Stripe Connect): conectar la cuenta y generar links de pago para
 * los clientes del negocio. Distinto de Suscripción, que es lo que el negocio le paga a OperativAI.
 * El agente de IA también puede generar el link dentro de una conversación (columna "Origen").
 */
export function Cobros() {
  const estado = useApi<ConnectEstado>('/pagos/connect/estado')
  const cobros = useApi<CobroConnect[]>('/pagos/connect/cobros')
  const [conectando, setConectando] = useState(false)
  const [errorConectar, setErrorConectar] = useState<string | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [creando, setCreando] = useState(false)
  const [errorCrear, setErrorCrear] = useState<string | null>(null)
  const [copiado, setCopiado] = useState<string | null>(null)
  const [desactivando, setDesactivando] = useState<string | null>(null)

  const e = estado.datos
  const listo = e?.charges_habilitado === true
  // 503 = la plataforma no tiene Connect activado: no hay nada que hacer desde aquí.
  const apagado = estado.error?.status === 503

  const conectar = async () => {
    setErrorConectar(null); setConectando(true)
    try { const { url } = await api<{ url: string }>('/pagos/connect/onboarding', { method: 'POST' }); window.location.assign(url) }
    catch (err) { setErrorConectar(mensaje(err, 'No se pudo iniciar la conexión con Stripe.')); setConectando(false) }
  }
  const crear = async (ev: FormEvent) => {
    ev.preventDefault()
    setErrorCrear(null); setCreando(true)
    try {
      await api<CobroConnect>('/pagos/connect/cobros', { method: 'POST', body: { descripcion: descripcion.trim(), monto: monto.trim() } })
      setDescripcion(''); setMonto(''); cobros.recargar(true)
    } catch (err) { setErrorCrear(mensaje(err, 'No se pudo generar el cobro.')) }
    finally { setCreando(false) }
  }
  const copiar = async (url: string) => {
    try { await navigator.clipboard.writeText(url); setCopiado(url); setTimeout(() => setCopiado(null), 2000) }
    catch { /* sin permiso de portapapeles: el enlace queda visible para copiarlo a mano */ }
  }
  const desactivar = async (c: CobroConnect) => {
    setErrorCrear(null); setDesactivando(c.id)
    try { await api(`/pagos/connect/cobros/${c.id}/desactivar`, { method: 'POST' }); cobros.recargar(true) }
    catch (err) { setErrorCrear(mensaje(err, 'No se pudo desactivar el cobro.')) }
    finally { setDesactivando(null) }
  }

  if (estado.cargando && !e) return <div className="p-10 text-center"><Spinner /></div>
  if (apagado) return <Aviso tipo="info">Los cobros propios todavía no están activados en la plataforma. Cuando lo estén, podrás conectar tu cuenta de Stripe desde aquí.</Aviso>

  return (
    <div className="space-y-4">
      {estado.error && <Aviso tipo="error">{estado.error.message}</Aviso>}

      {!listo && (
        <section className="card space-y-3 p-5" aria-labelledby="conn-t">
          <header>
            <h2 id="conn-t" className="font-semibold">Conectar con Stripe</h2>
            <p className="text-sm text-ink-muted">Cobra directo a tus clientes con links de pago. El dinero llega a tu propia cuenta de Stripe, no pasa por OperativAI.</p>
          </header>
          {e?.conectado && e.requisitos_pendientes.length > 0 && <Aviso tipo="info">Stripe todavía necesita algunos datos para activar los cobros. Retoma el proceso para terminarlo.</Aviso>}
          {errorConectar && <Aviso tipo="error">{errorConectar}</Aviso>}
          <button type="button" className="btn-primary" onClick={conectar} disabled={conectando}><ArrowSquareOut size={16} aria-hidden /> {conectando ? 'Abriendo Stripe…' : e?.conectado ? 'Terminar de conectar' : 'Conectar con Stripe'}</button>
        </section>
      )}

      {listo && (
        <section className="card space-y-3 p-5" aria-labelledby="gen-t">
          <header>
            <h2 id="gen-t" className="font-semibold">Generar un cobro</h2>
            <p className="text-sm text-ink-muted">Crea un link de pago para mandárselo a un cliente.</p>
          </header>
          {errorCrear && <Aviso tipo="error">{errorCrear}</Aviso>}
          <form onSubmit={crear} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1"><label htmlFor="cb-desc" className="field-label">Concepto</label><input id="cb-desc" className="field" value={descripcion} onChange={(ev) => setDescripcion(ev.target.value)} minLength={2} maxLength={255} required placeholder="Reparación de bomba de agua" /></div>
            <div className="sm:w-36"><label htmlFor="cb-monto" className="field-label">Monto</label><input id="cb-monto" className="field" value={monto} onChange={(ev) => setMonto(ev.target.value)} inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?" required placeholder="500.00" /></div>
            <button type="submit" className="btn-primary" disabled={creando || !descripcion.trim() || !monto.trim()}><Wallet size={16} aria-hidden /> {creando ? 'Generando…' : 'Generar link'}</button>
          </form>
        </section>
      )}

      <section className="card overflow-hidden" aria-labelledby="hist-c">
        <h2 id="hist-c" className="border-b border-line px-5 py-3 font-semibold">Cobros generados</h2>
        {cobros.error && cobros.error.status !== 503 && <div className="p-4"><Aviso tipo="error">{cobros.error.message}</Aviso></div>}
        {cobros.cargando && !cobros.datos ? <div className="p-6 text-center"><Spinner /></div>
          : !cobros.datos?.length ? <p className="p-8 text-center text-sm text-ink-muted">Todavía no generaste ningún cobro.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-muted/60 text-xs text-ink-muted"><tr>
                  <th scope="col" className="px-5 py-2 font-medium">Concepto</th><th scope="col" className="px-3 py-2 font-medium">Monto</th><th scope="col" className="px-3 py-2 font-medium">Estado</th><th scope="col" className="px-3 py-2 font-medium">Origen</th><th scope="col" className="px-3 py-2 font-medium">Creado</th><th scope="col" className="px-5 py-2" />
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {cobros.datos.map((c) => (
                    <tr key={c.id}>
                      <td className="px-5 py-2.5">{c.descripcion}</td>
                      <td className="px-3 py-2.5 tabular-nums">{pesos(c.monto)}</td>
                      <td className="px-3 py-2.5"><Chip tono={ESTADO[c.estado].tono}>{ESTADO[c.estado].etiqueta}</Chip></td>
                      <td className="px-3 py-2.5 text-ink-muted">{c.generado_por_agente ? 'Agente' : 'Tú'}</td>
                      <td className="px-3 py-2.5 tabular-nums text-ink-muted">{fechaCorta(c.creado_en)} {hora(c.creado_en)}</td>
                      <td className="px-5 py-2.5"><div className="flex justify-end gap-2">
                        {c.url_cobro && c.estado === 'activo' && <button type="button" className="btn-ghost min-h-8 px-2.5 text-xs" onClick={() => copiar(c.url_cobro!)}><Copy size={13} aria-hidden /> {copiado === c.url_cobro ? 'Copiado' : 'Copiar link'}</button>}
                        {c.estado === 'activo' && <button type="button" className="btn-ghost min-h-8 px-2.5 text-xs hover:text-danger" disabled={desactivando === c.id} onClick={() => desactivar(c)}>{desactivando === c.id ? '…' : 'Desactivar'}</button>}
                      </div></td>
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
