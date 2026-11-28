import { ArrowLeft, Check, Eye, EyeSlash, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../components'
import { api, ApiError, type TokenOut, type VerificacionPendienteOut } from '../lib/api'
import { useAuth } from '../lib/auth'
import { enmascararCorreo } from '../lib/formato'
import { PASSWORD_MAX, passwordValida, requisitosPassword } from '../lib/password'
import { EscenarioPortal } from './EscenarioPortal'

function Marco({ titulo, subtitulo, children }: { titulo: string; subtitulo: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[5fr_7fr]">
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft size={16} aria-hidden /> Volver al sitio
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold">{titulo}</h1>
          <p className="mt-2 text-ink-muted">{subtitulo}</p>
          <div className="mt-8">{children}</div>
        </div>
        <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-ink-muted">
          <Link to="/terminosycondiciones" className="inline-flex min-h-8 items-center hover:text-ink hover:underline">Términos y condiciones</Link>
          <Link to="/avisodeprivacidad" className="inline-flex min-h-8 items-center hover:text-ink hover:underline">Aviso de privacidad</Link>
        </nav>
      </main>
      <EscenarioPortal />
    </div>
  )
}

function ErrorForm({ mensaje }: { mensaje: string | null }) {
  return (
    <p role="alert" className={mensaje ? 'rounded-xl border border-danger/30 bg-danger/5 px-3.5 py-2.5 text-sm text-danger' : 'sr-only'}>
      {mensaje}
    </p>
  )
}

function CampoPassword({ id, autoComplete, name = 'password', valor, onValor, describe, invalido }: {
  id: string
  autoComplete: string
  name?: string
  /** Controlado (registro: la lista de requisitos se actualiza al escribir). */
  valor?: string
  onValor?: (v: string) => void
  describe?: string
  invalido?: boolean
}) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <input
        id={id} name={name} type={ver ? 'text' : 'password'} required autoComplete={autoComplete} className="field pr-12"
        maxLength={onValor ? PASSWORD_MAX : undefined}
        {...(onValor ? { value: valor ?? '', onChange: (e: ChangeEvent<HTMLInputElement>) => onValor(e.target.value) } : {})}
        aria-describedby={describe} aria-invalid={invalido || undefined}
      />
      <button
        type="button" onClick={() => setVer((v) => !v)}
        className="absolute inset-y-0 right-0 grid w-11 cursor-pointer place-items-center text-ink-muted hover:text-ink"
        aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {ver ? <EyeSlash size={20} /> : <Eye size={20} />}
      </button>
    </div>
  )
}

/**
 * Contraseña nueva + confirmación, con la lista de requisitos en vivo (registro y recuperar).
 * La etiqueta del primer campo la pone quien lo usa (id `${prefijo}-pass`).
 */
function PasswordNueva({ prefijo, password, onPassword, confirmacion, onConfirmacion }: {
  prefijo: string
  password: string
  onPassword: (v: string) => void
  confirmacion: string
  onConfirmacion: (v: string) => void
}) {
  const coinciden = confirmacion !== '' && confirmacion === password
  return (
    <>
      <CampoPassword id={`${prefijo}-pass`} autoComplete="new-password" valor={password} onValor={onPassword} describe={`${prefijo}-pass-reglas`} />
      <ul id={`${prefijo}-pass-reglas`} className="mt-2 grid gap-1 text-sm" aria-label="Requisitos de la contraseña">
        {requisitosPassword(password).map((r) => (
          <li key={r.clave} className={`flex items-center gap-1.5 ${r.cumple ? 'text-success' : 'text-ink-muted'}`}>
            {r.cumple ? <Check size={14} weight="bold" aria-hidden /> : <X size={14} aria-hidden />}
            {r.texto}<span className="sr-only">{r.cumple ? ': cumple' : ': falta'}</span>
          </li>
        ))}
      </ul>
      <div className="mt-5">
        <label htmlFor={`${prefijo}-pass2`} className="field-label">Confirma la contraseña <span className="text-danger" aria-hidden>*</span></label>
        <CampoPassword
          id={`${prefijo}-pass2`} name="password_confirmacion" autoComplete="new-password" valor={confirmacion} onValor={onConfirmacion}
          describe={`${prefijo}-pass2-estado`} invalido={confirmacion !== '' && !coinciden}
        />
        <p id={`${prefijo}-pass2-estado`} aria-live="polite" className={`mt-1.5 text-sm ${confirmacion === '' ? 'text-ink-muted' : coinciden ? 'text-success' : 'text-danger'}`}>
          {confirmacion === '' ? 'Escríbela otra vez.' : coinciden ? 'Las contraseñas coinciden.' : 'Las contraseñas no coinciden.'}
        </p>
      </div>
    </>
  )
}

/* ------------------------------------------------------------- Entrar */

export function Entrar() {
  const { estado, entrar } = useAuth()
  const navigate = useNavigate()
  // `aviso`/`email` llegan de Recuperar al cambiar la contraseña.
  const llegada = useLocation().state as { desde?: string; aviso?: string; email?: string } | null
  const destino = llegada?.desde ?? '/portal'
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const correo = useRef<HTMLInputElement>(null)

  if (estado === 'autenticado') return <Navigate to={destino} replace />

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setEnviando(true)
    setError(null)
    try {
      await entrar(String(d.get('email')), String(d.get('password')))
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Marco titulo="Inicia sesión" subtitulo={<>¿Aún no tienes cuenta? <Link to="/portal/registro" className="font-semibold text-primary hover:underline">Crea una</Link></>}>
      <form onSubmit={onSubmit} className="grid gap-5">
        <ErrorForm mensaje={error} />
        {llegada?.aviso && !error && (
          <p role="status" className="rounded-xl border border-success/30 bg-success/5 px-3.5 py-2.5 text-sm text-success">{llegada.aviso}</p>
        )}
        <div>
          <label htmlFor="l-email" className="field-label">Correo</label>
          <input ref={correo} id="l-email" name="email" type="email" required autoComplete="email" defaultValue={llegada?.email ?? ''} className="field" />
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="l-pass" className="field-label">Contraseña</label>
            {/* Lleva el correo ya escrito para no pedirlo dos veces. */}
            <Link
              to="/portal/recuperar"
              onClick={(e) => { e.preventDefault(); navigate('/portal/recuperar', { state: { email: correo.current?.value.trim() ?? '' } }) }}
              className="inline-flex min-h-8 items-center text-sm font-semibold text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <CampoPassword id="l-pass" autoComplete="current-password" />
        </div>
        <button type="submit" className="btn-primary h-12 text-base" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </Marco>
  )
}

/* ----------------------------------------------------------- Registro */

export function Registro() {
  const { estado, iniciarConToken } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const plan = params.get('plan')
  const [pendiente, setPendiente] = useState<VerificacionPendienteOut | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const listo = passwordValida(password) && confirmacion === password

  if (estado === 'autenticado' && !pendiente) return <Navigate to="/portal" replace />

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    // El botón ya está desactivado; esto cubre un Enter con el formulario incompleto.
    if (!listo) {
      setError(passwordValida(password) ? 'Las contraseñas no coinciden.' : 'La contraseña no cumple los requisitos.')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const r = await api<VerificacionPendienteOut>('/auth/registro', {
        method: 'POST', auth: false,
        body: {
          email: d.get('email'),
          password,
          password_confirmacion: confirmacion,
          full_name: d.get('full_name') || null,
          nombre_negocio: d.get('nombre_negocio'),
          acepta_terminos: d.get('acepta') === 'on',
        },
      })
      setPendiente(r)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos crear tu cuenta.')
    } finally {
      setEnviando(false)
    }
  }

  if (pendiente) {
    return (
      <Verificar
        pendiente={pendiente}
        onVerificado={async (t) => { await iniciarConToken(t); navigate('/portal', { replace: true }) }}
        onCambiarCorreo={() => setPendiente(null)}
      />
    )
  }

  return (
    <Marco
      titulo="Crea tu cuenta"
      subtitulo={<>{plan ? <>Plan elegido: <strong className="capitalize text-ink">{plan}</strong>. </> : null}¿Ya tienes cuenta? <Link to="/portal/entrar" className="font-semibold text-primary hover:underline">Inicia sesión</Link></>}
    >
      <form onSubmit={registrar} className="grid gap-5">
        <ErrorForm mensaje={error} />
        <div>
          <label htmlFor="r-negocio" className="field-label">Nombre de tu negocio <span className="text-danger" aria-hidden>*</span></label>
          <input id="r-negocio" name="nombre_negocio" required minLength={2} maxLength={255} autoComplete="organization" className="field" />
        </div>
        <div>
          <label htmlFor="r-nombre" className="field-label">Tu nombre</label>
          <input id="r-nombre" name="full_name" autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="r-email" className="field-label">Correo <span className="text-danger" aria-hidden>*</span></label>
          <input id="r-email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label htmlFor="r-pass" className="field-label">Contraseña <span className="text-danger" aria-hidden>*</span></label>
          <PasswordNueva prefijo="r" password={password} onPassword={setPassword} confirmacion={confirmacion} onConfirmacion={setConfirmacion} />
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" name="acepta" required className="mt-1 size-4 accent-primary" />
          <span>
            Acepto el <Link to="/avisodeprivacidad" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">aviso de privacidad</Link> y
            los <Link to="/terminosycondiciones" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">términos y condiciones</Link> del servicio.
          </span>
        </label>
        <button type="submit" className="btn-primary h-12 text-base" disabled={enviando || !listo}>
          {enviando ? 'Enviando código…' : 'Continuar'}
        </button>
      </form>
    </Marco>
  )
}

function Verificar({ pendiente, onVerificado, onCambiarCorreo }: {
  pendiente: VerificacionPendienteOut
  onVerificado: (t: TokenOut) => Promise<void>
  onCambiarCorreo: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [espera, setEspera] = useState(pendiente.reenviar_en_segundos)
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  async function verificar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const codigo = String(new FormData(e.currentTarget).get('codigo')).trim()
    setEnviando(true)
    setError(null)
    try {
      const t = await api<TokenOut>('/auth/verificar', { method: 'POST', auth: false, body: { email: pendiente.email, codigo } })
      await onVerificado(t)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos verificar el código.')
      input.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  async function reenviar() {
    setError(null)
    try {
      const r = await api<VerificacionPendienteOut>('/auth/reenviar-codigo', { method: 'POST', auth: false, body: { email: pendiente.email } })
      setEspera(r.reenviar_en_segundos)
      setAviso('Te mandamos un código nuevo.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos reenviar el código.')
    }
  }

  return (
    <Marco titulo="Revisa tu correo" subtitulo={<>Enviamos un código de 6 dígitos a <strong className="text-ink">{pendiente.email}</strong>. Vence en {pendiente.expira_en_minutos} minutos.</>}>
      <form onSubmit={verificar} className="grid gap-5">
        <ErrorForm mensaje={error} />
        <div>
          <label htmlFor="v-codigo" className="field-label">Código de verificación</label>
          <input
            ref={input} id="v-codigo" name="codigo" required inputMode="numeric" pattern="\d{6}" maxLength={6}
            autoComplete="one-time-code" className="field text-center font-display text-2xl tracking-[0.5em]"
          />
        </div>
        <button type="submit" className="btn-primary h-12 text-base" disabled={enviando}>
          {enviando ? 'Verificando…' : 'Verificar y crear cuenta'}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button type="button" onClick={reenviar} disabled={espera > 0} className="min-h-11 cursor-pointer font-semibold text-primary disabled:cursor-not-allowed disabled:text-ink-muted">
            {espera > 0 ? `Reenviar código en ${espera}s` : 'Reenviar código'}
          </button>
          <button type="button" onClick={onCambiarCorreo} className="min-h-11 cursor-pointer text-ink-muted hover:text-ink">Cambiar correo</button>
        </div>
        <p aria-live="polite" className="text-sm text-success">{aviso}</p>
      </form>
    </Marco>
  )
}

/* ---------------------------------------------------------- Recuperar */

interface RecuperacionSolicitadaOut { expira_en_minutos: number; reenviar_en_segundos: number }

/**
 * Recuperar contraseña: correo → código de 6 dígitos + contraseña nueva.
 * La API responde lo mismo exista o no la cuenta (POST /auth/recuperar/solicitar), así que aquí
 * tampoco se dice: solo se repite enmascarado el correo que la persona escribió. Un código
 * incorrecto, vencido o de un correo sin cuenta da el mismo error (400).
 */
export function Recuperar() {
  const { estado } = useAuth()
  const navigate = useNavigate()
  const inicial = (useLocation().state as { email?: string } | null)?.email ?? ''
  const [email, setEmail] = useState(inicial)
  const [solicitud, setSolicitud] = useState<RecuperacionSolicitadaOut | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (estado === 'autenticado') return <Navigate to="/portal" replace />

  async function solicitar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      setSolicitud(await api<RecuperacionSolicitadaOut>('/auth/recuperar/solicitar', { method: 'POST', auth: false, body: { email: email.trim() } }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos enviar el código.')
    } finally {
      setEnviando(false)
    }
  }

  if (solicitud) {
    return (
      <Restablecer
        email={email.trim()} solicitud={solicitud}
        onCambiarCorreo={() => setSolicitud(null)}
        onListo={() => navigate('/portal/entrar', { replace: true, state: { email: email.trim(), aviso: 'Listo, ya cambiaste tu contraseña. Entra con la nueva.' } })}
      />
    )
  }

  return (
    <Marco
      titulo="Recupera tu contraseña"
      subtitulo={<>Escribe el correo completo con el que te registraste y te enviaremos un código. <Link to="/portal/entrar" className="font-semibold text-primary hover:underline">Volver a iniciar sesión</Link></>}
    >
      <form onSubmit={solicitar} className="grid gap-5">
        <ErrorForm mensaje={error} />
        <div>
          <label htmlFor="rc-email" className="field-label">Correo</label>
          <input
            id="rc-email" name="email" type="email" required autoComplete="email" autoFocus className="field"
            value={email} onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary h-12 text-base" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar código'}
        </button>
      </form>
    </Marco>
  )
}

function Restablecer({ email, solicitud, onCambiarCorreo, onListo }: {
  email: string
  solicitud: RecuperacionSolicitadaOut
  onCambiarCorreo: () => void
  onListo: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [espera, setEspera] = useState(solicitud.reenviar_en_segundos)
  const [vence, setVence] = useState(solicitud.expira_en_minutos * 60)
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const listo = /^\d{6}$/.test(codigo) && passwordValida(password) && confirmacion === password && vence > 0

  useEffect(() => { input.current?.focus() }, [])
  // Un solo reloj para las dos cuentas regresivas (reenviar y vigencia del código).
  useEffect(() => {
    if (espera <= 0 && vence <= 0) return
    const t = setTimeout(() => { setEspera((s) => Math.max(0, s - 1)); setVence((s) => Math.max(0, s - 1)) }, 1000)
    return () => clearTimeout(t)
  }, [espera, vence])

  async function restablecer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!listo) {
      setError(
        vence <= 0 ? 'El código ya venció. Pide uno nuevo.'
          : !passwordValida(password) ? 'La contraseña no cumple los requisitos.'
            : 'Revisa el código y que las contraseñas coincidan.',
      )
      return
    }
    setEnviando(true)
    setError(null)
    setAviso(null)
    try {
      await api<void>('/auth/recuperar/restablecer', {
        method: 'POST', auth: false,
        body: { email, codigo, password, password_confirmacion: confirmacion },
      })
      onListo()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cambiar tu contraseña.')
      input.current?.focus()
    } finally {
      setEnviando(false)
    }
  }

  async function reenviar() {
    setError(null)
    try {
      const r = await api<RecuperacionSolicitadaOut>('/auth/recuperar/solicitar', { method: 'POST', auth: false, body: { email } })
      setEspera(r.reenviar_en_segundos)
      setVence(r.expira_en_minutos * 60)
      setCodigo('')
      setAviso('Si el correo tiene cuenta, te llegará un código nuevo. El anterior deja de servir.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos reenviar el código.')
    }
  }

  const reloj = `${Math.floor(vence / 60)}:${String(vence % 60).padStart(2, '0')}`

  return (
    <Marco
      titulo="Revisa tu correo"
      subtitulo={<>Si <strong className="text-ink">{enmascararCorreo(email)}</strong> tiene una cuenta, te enviamos un código de 6 dígitos. Vence en {solicitud.expira_en_minutos} minutos.</>}
    >
      <form onSubmit={restablecer} className="grid gap-5">
        <ErrorForm mensaje={error} />
        <div>
          <label htmlFor="rc-codigo" className="field-label">Código</label>
          <input
            ref={input} id="rc-codigo" name="codigo" required inputMode="numeric" pattern="\d{6}" maxLength={6}
            autoComplete="one-time-code" className="field text-center font-display text-2xl tracking-[0.5em]"
            value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} aria-describedby="rc-vence"
          />
          <p id="rc-vence" className={`mt-1.5 text-sm ${vence > 0 ? 'text-ink-muted' : 'text-danger'}`}>
            {vence > 0 ? `Vence en ${reloj}` : 'El código ya venció. Pide uno nuevo.'}
          </p>
        </div>
        <div>
          <label htmlFor="rc-pass" className="field-label">Contraseña nueva <span className="text-danger" aria-hidden>*</span></label>
          <PasswordNueva prefijo="rc" password={password} onPassword={setPassword} confirmacion={confirmacion} onConfirmacion={setConfirmacion} />
        </div>
        <button type="submit" className="btn-primary h-12 text-base" disabled={enviando || !listo}>
          {enviando ? 'Cambiando…' : 'Cambiar contraseña'}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <button
            type="button" onClick={reenviar} disabled={espera > 0}
            className="min-h-11 cursor-pointer font-semibold text-primary disabled:cursor-not-allowed disabled:text-ink-muted"
          >
            {espera > 0 ? `Reenviar código en ${espera}s` : 'Reenviar código'}
          </button>
          <button type="button" onClick={onCambiarCorreo} className="min-h-11 cursor-pointer text-ink-muted hover:text-ink">Cambiar correo</button>
        </div>
        <p aria-live="polite" className="text-sm text-success">{aviso}</p>
      </form>
    </Marco>
  )
}
