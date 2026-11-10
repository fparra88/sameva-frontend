import { ArrowClockwise, PencilSimple, Star, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CanalBadge, infoCanal, Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { fechaCorta, hora } from '../../lib/formato'
import { esDeNegocio, esGerencia } from '../../lib/roles'
import type {
  CanalSocial, EstadoConnectInstagram, IniciarConnectOut, ListaNumeros, ModoConexion, NumeroWhatsApp, PausarNumeroOut,
} from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip, Dialogo } from '../ui'
import { ConectarFacebook } from './ConectarFacebook'

const INTERVALO_RETORNO_MS = 3_000
const ESPERA_RETORNO_MS = 90_000

const nombreNumero = (n: Pick<NumeroWhatsApp, 'telefono_visible' | 'phone_number_id'>) => n.telefono_visible?.trim() || n.phone_number_id

function textoPlazas(l: Pick<ListaNumeros, 'tope' | 'plazas_usadas' | 'plazas_libres'>): string {
  if (l.tope === null) return `${l.plazas_usadas} ${l.plazas_usadas === 1 ? 'número activo' : 'números activos'} · sin tope`
  const libres = l.plazas_libres ?? Math.max(0, l.tope - l.plazas_usadas)
  return `${l.plazas_usadas} de ${l.tope} plazas usadas · ${libres === 0 ? 'cupo lleno' : `${libres} ${libres === 1 ? 'libre' : 'libres'}`}`
}

/** Espejo de lo que el servidor permite por rol; él decide de nuevo en cada petición. */
function acciones(n: NumeroWhatsApp, gerencia: boolean, puedeElegirAvisos: boolean) {
  if (!gerencia) return { editar: false, pausar: false, reactivar: false, desvincular: false, principal: false, avisos: false }
  return {
    editar: true,
    pausar: n.estado === 'activo',
    reactivar: n.estado === 'pausado',
    desvincular: true,
    principal: !n.es_linea_avisos && n.estado === 'activo' && !n.es_principal && !n.configuracion_incompleta,
    avisos: puedeElegirAvisos && !n.es_linea_avisos && n.estado === 'activo',
  }
}

/** Pausar el último número activo deja al negocio sin responder por WhatsApp (la línea de avisos no cuenta). */
const esUltimoActivo = (numeros: NumeroWhatsApp[], id: string) =>
  !numeros.find((n) => n.id === id)?.es_linea_avisos && !numeros.some((n) => n.id !== id && n.estado === 'activo' && !n.es_linea_avisos)

const MENSAJE_CODIGO: Record<string, string> = {
  cuenta_instagram_no_encontrada: 'No se pudo vincular esa cuenta de Instagram.',
  cuenta_instagram_no_valida: 'Meta no devolvió una cuenta de Instagram válida. Vuelve a intentarlo.',
  demasiados_intentos: 'Demasiados intentos de vincular cuentas. Inténtalo de nuevo más tarde.',
}

export default function Canales() {
  const { usuario } = useAuth()
  const gerencia = esGerencia(usuario)
  const negocio = esDeNegocio(usuario)
  const [params, setParams] = useSearchParams()
  const numeros = useApi<ListaNumeros>('/canales/whatsapp/numeros')
  const canales = useApi<CanalSocial[]>('/canales')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const [aPausar, setAPausar] = useState<NumeroWhatsApp | null>(null)
  const [aDesvincular, setADesvincular] = useState<NumeroWhatsApp | null>(null)
  const [aDesconectar, setADesconectar] = useState<'instagram' | 'facebook' | null>(null)
  const [elegirModo, setElegirModo] = useState(false)
  const [conectarFb, setConectarFb] = useState(false)
  const [modo, setModo] = useState<ModoConexion>('standard')
  const [iniciando, setIniciando] = useState<'whatsapp' | 'instagram' | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  const lista = numeros.datos
  const recargarNumeros = numeros.recargar
  const recargarCanales = canales.recargar
  const mensajeError = (e: unknown, respaldo: string) => (e instanceof ApiError ? e.message : respaldo)

  const limpiar = () => { setError(null); setAviso(null) }
  const ejecutar = async (id: string, accion: () => Promise<string>, respaldo: string) => {
    limpiar(); setOcupado(id)
    try { setAviso(await accion()); recargarNumeros(true) }
    catch (e) { setError(mensajeError(e, respaldo)) }
    finally { setOcupado(null) }
  }

  // ---- Retorno de la vinculación (NeuroAPI): se consulta hasta que llegue el webhook ----
  const retornoWa = params.get('whatsapp_neuroapi') === 'retorno'
  const retornoIg = params.get('instagram_neuroapi') === 'retorno'
  const [base, setBase] = useState<number | null>(null)
  const [esperaAgotada, setEsperaAgotada] = useState(false)
  const total = lista?.numeros.length ?? null
  useEffect(() => { if (total !== null && base === null) setBase(total) }, [total, base])
  const llegoNumero = base !== null && total !== null && total > base
  useEffect(() => {
    if (!retornoWa || llegoNumero) return
    const i = setInterval(() => recargarNumeros(true), INTERVALO_RETORNO_MS)
    const l = setTimeout(() => { clearInterval(i); setEsperaAgotada(true) }, ESPERA_RETORNO_MS)
    return () => { clearInterval(i); clearTimeout(l) }
  }, [retornoWa, llegoNumero, recargarNumeros])

  const cerrarRetorno = () => setParams({}, { replace: true })
  const alVincularInstagram = useCallback(() => recargarCanales(true), [recargarCanales])

  // ---- Acciones sobre números ----
  const iniciarWhatsApp = async () => {
    limpiar(); setIniciando('whatsapp')
    try {
      const d = await api<IniciarConnectOut>('/canales/whatsapp/neuroapi/iniciar', { method: 'POST', body: { connection_mode: modo } })
      window.location.assign(d.connect_url)
    } catch (e) { setError(mensajeError(e, 'No se pudo iniciar la vinculación con WhatsApp.')); setIniciando(null); setElegirModo(false) }
  }
  const iniciarInstagram = async () => {
    limpiar(); setIniciando('instagram')
    try {
      const d = await api<IniciarConnectOut>('/canales/instagram/neuroapi/iniciar', { method: 'POST' })
      window.location.assign(d.connect_url)
    } catch (e) { setError(mensajeError(e, 'No se pudo iniciar la vinculación con Instagram.')); setIniciando(null) }
  }
  const reactivar = (n: NumeroWhatsApp) => ejecutar(n.id, async () => {
    await api(`/canales/whatsapp/numeros/${n.id}/reactivar`, { method: 'POST' }); return `${nombreNumero(n)} reactivado.`
  }, 'No se pudo reactivar el número.')
  const hacerPrincipal = (n: NumeroWhatsApp) => ejecutar(n.id, async () => {
    await api('/canales/whatsapp/principal', { method: 'PUT', body: { numero_id: n.id } }); return `${nombreNumero(n)} es ahora el número principal.`
  }, 'No se pudo cambiar el número principal.')
  const usarParaAvisos = (n: NumeroWhatsApp) => ejecutar(n.id, async () => {
    await api('/canales/whatsapp/avisos', { method: 'PUT', body: { numero_id: n.id } }); return `${nombreNumero(n)} es ahora la línea de avisos de la plataforma.`
  }, 'No se pudo cambiar la línea de avisos.')
  const confirmarPausa = async () => {
    if (!aPausar) return
    const n = aPausar; setConfirmando(true)
    await ejecutar(n.id, async () => {
      const r = await api<PausarNumeroOut>(`/canales/whatsapp/numeros/${n.id}/pausar`, { method: 'POST' })
      return r.sin_numero_activo
        ? `${nombreNumero(n)} pausado. Tu negocio no responderá por WhatsApp mientras no tenga un número activo.`
        : `${nombreNumero(n)} pausado. Libera una plaza de tu plan.`
    }, 'No se pudo pausar el número.')
    setConfirmando(false); setAPausar(null)
  }
  const confirmarDesvinculacion = async () => {
    if (!aDesvincular) return
    const n = aDesvincular; setConfirmando(true)
    await ejecutar(n.id, async () => {
      await api(`/canales/whatsapp/numeros/${n.id}`, { method: 'DELETE' })
      return `${nombreNumero(n)} desvinculado. Sus conversaciones quedan ocultas, en solo lectura.`
    }, 'No se pudo desvincular el número.')
    setConfirmando(false); setADesvincular(null)
  }
  const confirmarDesconexion = async () => {
    if (!aDesconectar) return
    setConfirmando(true); limpiar()
    try {
      const r = await api<{ proveedor: string | null }>(`/canales/${aDesconectar}`, { method: 'DELETE' })
      const nombre = infoCanal(aDesconectar).nombre
      setAviso(r?.proveedor === 'neuroapi'
        ? `${nombre} desconectado: tu agente ya no responde ahí. Para desvincularlo por completo, retira el acceso de la app en tu Meta Business Manager.`
        : `${nombre} desconectado.`)
      setADesconectar(null); recargarCanales(true)
    } catch (e) { setError(mensajeError(e, 'No se pudo desconectar el canal.')) }
    finally { setConfirmando(false) }
  }

  const porTipo = new Map((canales.datos ?? []).map((c) => [c.channel_type, c]))

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Canales</h1>
          <p className="mt-1 text-ink-muted">Dónde responde tu agente.</p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => { recargarNumeros(); recargarCanales() }}>
          <ArrowClockwise size={16} aria-hidden /> Actualizar
        </button>
      </div>

      <div className="space-y-4">
        {(numeros.error || canales.error) && <Aviso tipo="error">{(numeros.error ?? canales.error)!.message}</Aviso>}
        {error && <Aviso tipo="error">{error}</Aviso>}
        {aviso && <Aviso tipo="ok">{aviso}</Aviso>}
        {retornoWa && (
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {llegoNumero ? <Aviso tipo="ok">Número de WhatsApp vinculado. Configura su agente para que empiece a responder.</Aviso>
                : esperaAgotada ? <Aviso tipo="error">No recibimos la confirmación de WhatsApp. Pulsa Actualizar o vuelve a intentarlo.</Aviso>
                : <Aviso tipo="info">Estamos terminando de vincular tu número. Esto puede tardar unos segundos.</Aviso>}
            </div>
            <button type="button" className="btn-ghost size-9 px-0" onClick={cerrarRetorno} aria-label="Cerrar aviso"><X size={16} /></button>
          </div>
        )}
        {retornoIg && <RetornoInstagram params={params} onVinculado={alVincularInstagram} onCerrar={cerrarRetorno} />}

        {/* ---------------- WhatsApp ---------------- */}
        <section className="card overflow-hidden" aria-labelledby="wa-t">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <div className="flex items-center gap-3">
              <CanalBadge tipo="whatsapp" />
              <div>
                <h2 id="wa-t" className="font-semibold">Números de WhatsApp</h2>
                <p className="text-xs text-ink-muted">Cada número tiene su propio agente y sus propias herramientas.</p>
              </div>
            </div>
            {gerencia && (
              <button type="button" className="btn-primary" onClick={() => { limpiar(); setModo('standard'); setElegirModo(true) }} disabled={iniciando !== null}>
                Conectar WhatsApp
              </button>
            )}
          </header>
          {lista && <p className="border-b border-line bg-muted/50 px-4 py-2 text-xs text-ink-muted" data-testid="plazas">{textoPlazas(lista)}</p>}
          {!lista && numeros.cargando && <div className="p-6 text-center"><Spinner /></div>}
          {lista && lista.numeros.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">Todavía no hay ningún número de WhatsApp vinculado.</p>
          )}
          <ul className="divide-y divide-line">
            {lista?.numeros.map((n) => {
              const a = acciones(n, gerencia, lista.puede_elegir_avisos)
              const trabajando = ocupado === n.id
              return (
                <li key={n.id} className={`flex flex-wrap items-start gap-3 p-4 ${n.estado === 'pausado' ? 'opacity-70' : ''}`}>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-semibold">{nombreNumero(n)}</span>
                      {n.estado === 'activo' ? <Chip tono="ok">activo</Chip> : <Chip tono="aviso">pausado</Chip>}
                      {n.es_principal && <Chip tono="info"><Star size={11} weight="fill" aria-hidden /> principal</Chip>}
                      {n.connection_mode === 'coexistence' && <Chip tono="info">coexistencia</Chip>}
                      {n.es_linea_avisos && <Chip tono="info">línea de avisos de plataforma</Chip>}
                      {n.configuracion_incompleta && <Chip tono="aviso">configuración incompleta</Chip>}
                      {!n.agente_activo && <Chip>agente apagado</Chip>}
                    </div>
                    <p className="break-all text-xs text-ink-muted">
                      id {n.phone_number_id}{n.agent_name && <> · agente {n.agent_name}</>}
                      {n.vinculado_en && <> · vinculado {fechaCorta(n.vinculado_en)} {hora(n.vinculado_en)}</>}
                    </p>
                    {n.es_linea_avisos && <p className="text-xs text-ink-muted">Línea de avisos de la plataforma: no cuenta para el cupo ni puede ser la principal.</p>}
                    {n.configuracion_incompleta && <p className="text-xs text-danger">No responde hasta que le pongas nombre al agente e instrucciones.</p>}
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
                    {a.editar && (
                      <Link to={`/portal/agente?numero=${encodeURIComponent(n.id)}`} className="btn-ghost min-h-9 px-3" aria-label={`Configurar el agente de ${nombreNumero(n)}`}>
                        <PencilSimple size={14} aria-hidden /> Configurar
                      </Link>
                    )}
                    {a.principal && <button type="button" className="btn-ghost min-h-9 px-3" disabled={trabajando} onClick={() => hacerPrincipal(n)}>Hacer principal</button>}
                    {a.avisos && <button type="button" className="btn-ghost min-h-9 px-3" disabled={trabajando} onClick={() => usarParaAvisos(n)}>Usar para avisos</button>}
                    {a.pausar && <button type="button" className="btn-ghost min-h-9 px-3" disabled={trabajando} onClick={() => setAPausar(n)}>Pausar</button>}
                    {a.reactivar && <button type="button" className="btn-ghost min-h-9 px-3" disabled={trabajando} onClick={() => reactivar(n)}>{trabajando ? 'Reactivando…' : 'Reactivar'}</button>}
                    {a.desvincular && <button type="button" className="btn-ghost min-h-9 px-3 hover:text-danger" disabled={trabajando} onClick={() => setADesvincular(n)}>Desvincular</button>}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        {/* ---------------- Instagram y Facebook ---------------- */}
        {negocio && (
          <section className="card divide-y divide-line overflow-hidden" aria-label="Instagram y Facebook">
            {(['instagram', 'facebook'] as const).map((tipo) => {
              const c = porTipo.get(tipo)
              const conectado = Boolean(c?.is_active)
              const identificador = tipo === 'instagram' ? c?.ig_user_id : c?.page_id
              const { nombre } = infoCanal(tipo)
              return (
                <div key={tipo} className="flex flex-wrap items-center gap-3 p-4">
                  <CanalBadge tipo={tipo} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{nombre}</span>
                      {canales.cargando && !canales.datos ? <Chip>cargando…</Chip>
                        : conectado ? <Chip tono="ok">conectado</Chip>
                        : c ? <Chip tono="aviso">desconectado</Chip> : <Chip>sin conectar</Chip>}
                    </div>
                    <p className="text-sm text-ink-muted">
                      {tipo === 'instagram' ? 'Mensajes directos a tu cuenta de Instagram profesional.' : 'Mensajes por Messenger a tu página de Facebook.'}
                    </p>
                    {c && (identificador || c.updated_at) && (
                      <p className="text-xs text-ink-muted">
                        {identificador && <>id {identificador}</>}{identificador && c.updated_at && ' · '}
                        {c.updated_at && <>actualizado {fechaCorta(c.updated_at)} {hora(c.updated_at)}</>}
                      </p>
                    )}
                  </div>
                  {gerencia && (conectado
                    ? <button type="button" className="btn-ghost hover:text-danger" onClick={() => setADesconectar(tipo)}>Desconectar</button>
                    : tipo === 'instagram'
                      ? <button type="button" className="btn-primary" onClick={iniciarInstagram} disabled={iniciando !== null}>{iniciando === 'instagram' ? 'Abriendo Meta…' : 'Vincular Instagram Direct'}</button>
                      : <button type="button" className="btn-primary" onClick={() => { limpiar(); setConectarFb(true) }}>Conectar Facebook</button>)}
                </div>
              )
            })}
          </section>
        )}
      </div>

      {/* ---------------- Diálogos ---------------- */}
      <ConectarFacebook abierto={conectarFb} onCerrar={() => setConectarFb(false)} onTerminado={() => recargarCanales(true)} />
      <Dialogo abierto={elegirModo} titulo="Conectar WhatsApp" onCerrar={() => setElegirModo(false)} ocupado={iniciando === 'whatsapp'}>
        <p className="mt-1 text-sm text-ink-muted">Elige cómo quieres conectar tu número. Después te llevamos a Meta para autorizarlo.</p>
        <div role="radiogroup" aria-label="Modo de conexión" className="mt-4 space-y-2">
          {([
            ['standard', 'Modo exclusivo API', 'El número opera 100% por la integración y el agente de IA. Es el modo recomendado si nadie va a usar la app del móvil con esa línea.'],
            ['coexistence', 'Modo coexistencia', 'El número funciona a la vez en la app de WhatsApp Business del móvil y en la API. Tu equipo puede responder desde el móvil.'],
          ] as const).map(([valor, titulo, desc]) => {
            const bloqueada = valor === 'coexistence' && !lista?.coexistencia_permitida
            return (
              <label key={valor} className={`flex gap-3 rounded-xl border p-3 transition ${modo === valor ? 'border-primary bg-primary-soft/40' : 'border-line'} ${bloqueada ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-muted/50'}`}>
                <input type="radio" name="modo" className="mt-1 accent-primary" checked={modo === valor} disabled={bloqueada} onChange={() => setModo(valor)} />
                <span>
                  <span className="block text-sm font-semibold">{titulo}</span>
                  <span className="block text-xs text-ink-muted">{desc}{bloqueada && ' Tu plan actual no la incluye.'}</span>
                </span>
              </label>
            )
          })}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => setElegirModo(false)} disabled={iniciando === 'whatsapp'}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={iniciarWhatsApp} disabled={iniciando === 'whatsapp'}>{iniciando === 'whatsapp' ? 'Abriendo Meta…' : 'Continuar'}</button>
        </div>
      </Dialogo>

      <Dialogo abierto={aPausar !== null} titulo={`¿Pausar ${aPausar ? nombreNumero(aPausar) : ''}?`} onCerrar={() => setAPausar(null)} ocupado={confirmando}>
        <p className="mt-2 text-sm text-ink-muted">
          Un número pausado no responde ni envía nada, pero conserva su configuración y libera una plaza de tu plan.
          {aPausar && lista && esUltimoActivo(lista.numeros, aPausar.id) && <strong className="mt-2 block text-danger">Es tu último número activo: tu negocio no responderá por WhatsApp hasta que reactives uno.</strong>}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => setAPausar(null)} disabled={confirmando}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={confirmarPausa} disabled={confirmando}>{confirmando ? 'Pausando…' : 'Pausar'}</button>
        </div>
      </Dialogo>

      <Dialogo abierto={aDesvincular !== null} titulo={`¿Desvincular ${aDesvincular ? nombreNumero(aDesvincular) : ''}?`} onCerrar={() => setADesvincular(null)} ocupado={confirmando}>
        <p className="mt-2 text-sm text-ink-muted">El número deja de estar vinculado a tu negocio. Sus conversaciones quedan ocultas, en solo lectura.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => setADesvincular(null)} disabled={confirmando}>Cancelar</button>
          <button type="button" className="btn-primary !bg-danger" onClick={confirmarDesvinculacion} disabled={confirmando}>{confirmando ? 'Desvinculando…' : 'Desvincular'}</button>
        </div>
      </Dialogo>

      <Dialogo abierto={aDesconectar !== null} titulo={`¿Desconectar ${aDesconectar ? infoCanal(aDesconectar).nombre : ''}?`} onCerrar={() => setADesconectar(null)} ocupado={confirmando}>
        <p className="mt-2 text-sm text-ink-muted">Tu agente dejará de recibir y responder mensajes por este canal. Puedes volver a conectarlo cuando quieras.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={() => setADesconectar(null)} disabled={confirmando}>Cancelar</button>
          <button type="button" className="btn-primary !bg-danger" onClick={confirmarDesconexion} disabled={confirmando}>{confirmando ? 'Desconectando…' : 'Desconectar'}</button>
        </div>
      </Dialogo>
    </div>
  )
}

/**
 * Retorno de Meta tras vincular Instagram. Llegar aquí no significa que ya esté
 * vinculado: lo decide el webhook, que suele llegar DESPUÉS que el navegador.
 */
function RetornoInstagram({ params, onVinculado, onCerrar }: { params: URLSearchParams; onVinculado: () => void; onCerrar: () => void }) {
  const status = params.get('status')
  const cancelado = status !== null && status !== 'success'
  const sessionId = params.get('session_id')
  const sesion = useApi<EstadoConnectInstagram>(
    cancelado ? null : `/canales/instagram/neuroapi/estado${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''}`,
  )
  const [agotada, setAgotada] = useState(false)
  const pendiente = !sesion.datos || sesion.datos.estado === 'pendiente'
  const recargar = sesion.recargar

  useEffect(() => {
    if (cancelado || !pendiente) return
    const i = setInterval(() => recargar(true), INTERVALO_RETORNO_MS)
    const l = setTimeout(() => { clearInterval(i); setAgotada(true) }, ESPERA_RETORNO_MS)
    return () => { clearInterval(i); clearTimeout(l) }
  }, [cancelado, pendiente, recargar])

  const vinculado = sesion.datos?.estado === 'completado' && sesion.datos.resultado === 'vinculado'
  useEffect(() => { if (vinculado) onVinculado() }, [vinculado, onVinculado])

  const d = sesion.datos
  let cuerpo: ReactNode
  if (cancelado) cuerpo = <Aviso tipo="error">No se completó la autorización de Instagram en Meta. Vuelve a intentarlo cuando quieras.</Aviso>
  else if (d && d.estado !== 'pendiente') {
    cuerpo = d.resultado === 'vinculado' ? <Aviso tipo="ok">Instagram vinculado{d.username ? ` (@${d.username})` : ''}. Tu agente ya responde los mensajes directos.</Aviso>
      : d.resultado === 'propio' ? <Aviso tipo="info">Esa cuenta de Instagram ya estaba vinculada a tu negocio.</Aviso>
      : <Aviso tipo="error">{(d.codigo && MENSAJE_CODIGO[d.codigo]) ?? 'La vinculación de Instagram no se completó. Vuelve a intentarlo.'}</Aviso>
  } else if (agotada) cuerpo = <Aviso tipo="error">No recibimos la confirmación de Instagram. Recarga la página o vuelve a intentarlo.</Aviso>
  else cuerpo = <Aviso tipo="info">Estamos terminando de vincular tu Instagram. Esto puede tardar unos segundos.</Aviso>

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">{cuerpo}</div>
      <button type="button" className="btn-ghost size-9 px-0" onClick={onCerrar} aria-label="Cerrar aviso"><X size={16} /></button>
    </div>
  )
}
