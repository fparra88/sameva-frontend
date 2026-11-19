import { CheckCircle, Gift } from '@phosphor-icons/react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { fechaCorta, pesos } from '../../lib/formato'
import { esGerencia } from '../../lib/roles'
import type {
  CanalOnboarding, GiroNegocio, OnboardingAplicadoOut, OnboardingOut, OnboardingRespuestas, TonoAgente,
} from '../../lib/tipos'
import { Aviso } from '../ui'

const GIROS: { v: GiroNegocio; t: string }[] = [
  { v: 'salon_belleza', t: 'Barbería, salón de belleza o spa' },
  { v: 'salud', t: 'Consultorio o clínica' },
  { v: 'restaurante', t: 'Restaurante o comida' },
  { v: 'tienda', t: 'Tienda' },
  { v: 'inmobiliaria', t: 'Inmobiliaria' },
  { v: 'servicios_profesionales', t: 'Servicios profesionales' },
  { v: 'educacion', t: 'Educación o cursos' },
  { v: 'otro', t: 'Otro' },
]
const CANALES: { v: CanalOnboarding; t: string }[] = [
  { v: 'whatsapp', t: 'WhatsApp' }, { v: 'instagram', t: 'Instagram' }, { v: 'facebook', t: 'Facebook' },
]
const TONOS: { v: TonoAgente; t: string }[] = [
  { v: 'cercano', t: 'Cercano' }, { v: 'formal', t: 'Formal' }, { v: 'juvenil', t: 'Juvenil' },
]
const NOMBRE_MODULO: Record<string, string> = {
  agente: 'Agente de IA', vendedores: 'Ventas y embudo', herramientas: 'Herramientas del agente',
  crm_campo: 'CRM de campo', calendario: 'Calendario de citas',
}

const VACIAS: OnboardingRespuestas = {
  giro: 'otro', descripcion: '', agenda_citas: false, vende_por_chat: false, visitas_campo: false,
  consulta_sistemas: false, num_vendedores: 0, num_proveedores: 0, canales: [], tono: 'cercano', horario: '',
}
const mensaje = (e: unknown, r: string) => (e instanceof ApiError ? e.message : r)

/**
 * Cuestionario de bienvenida (API: /onboarding). Al aplicarlo, el servidor arma el prompt del agente y otorga
 * 14 días de prueba del plan recomendado, sin tarjeta. Al vencer, el servicio se pausa hasta que se contrate un plan.
 */
export default function Bienvenida() {
  const { usuario, recargarUsuario } = useAuth()
  const ir = useNavigate()
  const [info, setInfo] = useState<OnboardingOut | null>(null)
  const [r, setR] = useState<OnboardingRespuestas>(VACIAS)
  const [fase, setFase] = useState<'cuestionario' | 'resumen' | 'listo'>('cuestionario')
  const [resultado, setResultado] = useState<OnboardingAplicadoOut | null>(null)
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<OnboardingOut>('/onboarding')
      .then((o) => {
        setInfo(o)
        if (o.respuestas) setR(o.respuestas)
        if (o.recomendacion) setFase('resumen')
      })
      .catch((e) => setError(mensaje(e, 'No se pudo cargar el cuestionario.')))
      .finally(() => setCargando(false))
  }, [])

  if (!usuario) return null
  if (!esGerencia(usuario) || usuario.impersonado_por) return <Navigate to="/portal" replace />
  if (cargando) return <div className="grid min-h-dvh place-items-center"><Spinner label="Preparando tu bienvenida" /></div>

  const set = <K extends keyof OnboardingRespuestas>(k: K, v: OnboardingRespuestas[K]) => setR((x) => ({ ...x, [k]: v }))
  const alternarCanal = (c: CanalOnboarding) => set('canales', r.canales.includes(c) ? r.canales.filter((x) => x !== c) : [...r.canales, c])

  const guardar = async (e: FormEvent) => {
    e.preventDefault(); setError(null); setOcupado(true)
    try {
      const o = await api<OnboardingOut>('/onboarding', { method: 'PUT', body: r })
      setInfo(o); setFase('resumen'); window.scrollTo({ top: 0 })
    } catch (err) { setError(mensaje(err, 'No se pudieron guardar tus respuestas.')) }
    finally { setOcupado(false) }
  }

  const aplicar = async () => {
    setError(null); setOcupado(true)
    try {
      const o = await api<OnboardingAplicadoOut>('/onboarding/aplicar', { method: 'POST', body: { sobrescribir_prompt: false } })
      setResultado(o); setFase('listo'); window.scrollTo({ top: 0 })
    } catch (err) { setError(mensaje(err, 'No se pudo aplicar la configuración.')) }
    finally { setOcupado(false) }
  }

  const terminar = async (destino: string) => { await recargarUsuario(); ir(destino, { replace: true }) }

  const plan = info?.recomendacion?.plan ?? null

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 pb-32 pt-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Te damos la bienvenida</h1>
        <p className="text-ink-muted">Cuéntanos de tu negocio y dejamos listo tu agente. Son 2 minutos.</p>
      </header>

      {error && <Aviso tipo="error">{error}</Aviso>}

      {fase === 'cuestionario' && (
        <form onSubmit={guardar} className="card space-y-5 p-5">
          {info?.prueba_disponible && (
            <p className="flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
              <Gift size={18} aria-hidden /> Al terminar activamos {info.dias_prueba} días de prueba gratis. No pedimos tarjeta.
            </p>
          )}
          <div>
            <label htmlFor="b-giro" className="field-label">¿Qué tipo de negocio es?</label>
            <select id="b-giro" className="field" value={r.giro} onChange={(e) => set('giro', e.target.value as GiroNegocio)}>
              {GIROS.map((g) => <option key={g.v} value={g.v}>{g.t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="b-desc" className="field-label">Descríbelo en una frase (opcional)</label>
            <input id="b-desc" className="field" maxLength={300} value={r.descripcion} onChange={(e) => set('descripcion', e.target.value)} placeholder="Ej. Barbería con 3 sillones en el centro" />
          </div>
          <fieldset className="space-y-2">
            <legend className="field-label">¿Qué necesitas que haga?</legend>
            {([
              ['agenda_citas', 'Agendar citas'], ['vende_por_chat', 'Vender y dar seguimiento por chat'],
              ['visitas_campo', 'Visitas a clientes en campo'], ['consulta_sistemas', 'Consultar mis sistemas o bases de datos'],
            ] as const).map(([k, t]) => (
              <label key={k} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={r[k]} onChange={(e) => set(k, e.target.checked)} /> {t}
              </label>
            ))}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="b-vend" className="field-label">Vendedores</label>
              <input id="b-vend" type="number" min={0} max={1000} className="field" value={r.num_vendedores} onChange={(e) => set('num_vendedores', Math.max(0, Number(e.target.value) || 0))} />
            </div>
            <div>
              <label htmlFor="b-prov" className="field-label">Proveedores en agenda</label>
              <input id="b-prov" type="number" min={0} max={1000} className="field" value={r.num_proveedores} onChange={(e) => set('num_proveedores', Math.max(0, Number(e.target.value) || 0))} />
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="field-label">¿Por dónde te escriben tus clientes?</legend>
            <div className="flex flex-wrap gap-4">
              {CANALES.map((c) => (
                <label key={c.v} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={r.canales.includes(c.v)} onChange={() => alternarCanal(c.v)} /> {c.t}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="b-tono" className="field-label">Tono del agente</label>
              <select id="b-tono" className="field" value={r.tono} onChange={(e) => set('tono', e.target.value as TonoAgente)}>
                {TONOS.map((t) => <option key={t.v} value={t.v}>{t.t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="b-hor" className="field-label">Horario de atención (opcional)</label>
              <input id="b-hor" className="field" maxLength={200} value={r.horario} onChange={(e) => set('horario', e.target.value)} placeholder="Lun a Sáb 9:00–19:00" />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <button type="submit" className="btn-primary" disabled={ocupado}>{ocupado ? 'Guardando…' : 'Continuar'}</button>
          </div>
        </form>
      )}

      {fase === 'resumen' && info && (
        <section className="card space-y-4 p-5" aria-labelledby="b-reco">
          <h2 id="b-reco" className="text-lg font-semibold">Esto es lo que te recomendamos</h2>
          {plan ? (
            <>
              <div className="rounded-xl border border-line p-4">
                <p className="text-sm text-ink-muted">Plan recomendado</p>
                <p className="text-xl font-bold">{plan.nombre} <span className="text-sm font-normal text-ink-muted">· {pesos(plan.precio_monthly)} / mes (IVA incluido)</span></p>
                <ul className="mt-2 flex flex-wrap gap-2 text-xs">
                  {plan.herramientas.map((h) => <li key={h} className="rounded-full bg-accent-soft px-2.5 py-0.5 font-semibold text-accent">{NOMBRE_MODULO[h] ?? h}</li>)}
                </ul>
              </div>
              {!plan.cubre_todo && <Aviso tipo="info">Ningún plan cubre todo lo que pediste ({plan.faltantes.map((f) => NOMBRE_MODULO[f] ?? f).join(', ')}). Escríbenos y lo vemos.</Aviso>}
            </>
          ) : <Aviso tipo="info">Por ahora no hay un plan disponible. Igual dejamos listo tu agente.</Aviso>}

          {info.prueba_disponible && plan ? (
            <p className="flex items-start gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
              <Gift size={18} className="mt-0.5 shrink-0" aria-hidden />
              <span><strong>{info.dias_prueba} días gratis</strong> del plan {plan.nombre}, sin tarjeta. Al terminar, el servicio se pausa hasta que contrates un plan: no se cobra nada solo.</span>
            </p>
          ) : (
            <Aviso tipo="info">Tu negocio ya tuvo un plan o una prueba, así que no se activa una nueva. Puedes contratar desde Ajustes → Suscripción.</Aviso>
          )}
          {info.prompt_editado && <Aviso tipo="info">Ya editaste las instrucciones de tu agente: no las vamos a cambiar.</Aviso>}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" className="btn-ghost" onClick={() => setFase('cuestionario')} disabled={ocupado}>Cambiar respuestas</button>
            <button type="button" className="btn-primary" onClick={aplicar} disabled={ocupado}>
              {ocupado ? 'Configurando…' : info.prueba_disponible && plan ? `Empezar mi prueba de ${info.dias_prueba} días` : 'Configurar mi agente'}
            </button>
          </div>
        </section>
      )}

      {fase === 'listo' && resultado && (
        <section className="card space-y-4 p-5" aria-labelledby="b-ok">
          <h2 id="b-ok" className="flex items-center gap-2 text-lg font-semibold"><CheckCircle size={22} weight="fill" className="text-success" aria-hidden /> Todo listo</h2>
          {resultado.prueba
            ? <p>Tu prueba gratuita del plan <strong>{resultado.prueba.plan}</strong> dura hasta el <strong>{fechaCorta(resultado.prueba.vence)}</strong>. Úsala sin límites del plan; no se te cobra nada.</p>
            : <p>Dejamos configurado tu agente.</p>}
          <ul className="list-inside list-disc text-sm text-ink-muted">
            {resultado.prompt_actualizado && <li>Escribimos las instrucciones de tu agente (puedes ajustarlas en Agente).</li>}
            {resultado.modulos_encendidos.length > 0 && <li>Activamos: {resultado.modulos_encendidos.map((m) => NOMBRE_MODULO[m] ?? m).join(', ')}.</li>}
            {resultado.modulos_pendientes.length > 0 && <li>Se activan al contratar un plan que los incluya: {resultado.modulos_pendientes.map((m) => NOMBRE_MODULO[m] ?? m).join(', ')}.</li>}
          </ul>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={() => terminar('/portal/canales')}>Conectar mis canales</button>
            <button type="button" className="btn-ghost" onClick={() => terminar('/portal/bandeja')}>Ir a mi bandeja</button>
            <Link to="/portal/cuenta?vista=suscripcion" className="btn-ghost" onClick={() => void recargarUsuario()}>Ver planes</Link>
          </div>
        </section>
      )}
    </div>
  )
}
