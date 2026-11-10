import { ArrowLeft, Eye, EyeSlash } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../components'
import { api, ApiError, type TokenOut, type VerificacionPendienteOut } from '../lib/api'
import { useAuth } from '../lib/auth'

function Marco({ titulo, subtitulo, children }: { titulo: string; subtitulo: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
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
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-end" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_30%_20%,rgba(0,71,167,0.55),transparent_70%)]" />
        <div className="relative max-w-md">
          <p className="font-display text-3xl font-bold leading-tight">Tu agente atiende WhatsApp, Instagram y Facebook. Tú lo controlas desde aquí.</p>
          <p className="mt-4 text-white/70">Bandeja unificada, agenda, CRM y reportes en un solo portal.</p>
        </div>
      </aside>
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

function CampoPassword({ id, autoComplete, minLength }: { id: string; autoComplete: string; minLength?: number }) {
  const [ver, setVer] = useState(false)
  return (
    <div className="relative">
      <input id={id} name="password" type={ver ? 'text' : 'password'} required minLength={minLength} autoComplete={autoComplete} className="field pr-12" />
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

/* ------------------------------------------------------------- Entrar */

export function Entrar() {
  const { estado, entrar } = useAuth()
  const navigate = useNavigate()
  const destino = (useLocation().state as { desde?: string } | null)?.desde ?? '/portal'
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

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
        <div>
          <label htmlFor="l-email" className="field-label">Correo</label>
          <input id="l-email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label htmlFor="l-pass" className="field-label">Contraseña</label>
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

  if (estado === 'autenticado' && !pendiente) return <Navigate to="/portal" replace />

  async function registrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    setEnviando(true)
    setError(null)
    try {
      const r = await api<VerificacionPendienteOut>('/auth/registro', {
        method: 'POST', auth: false,
        body: {
          email: d.get('email'),
          password: d.get('password'),
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
          <CampoPassword id="r-pass" autoComplete="new-password" minLength={8} />
          <p className="mt-1.5 text-sm text-ink-muted">Mínimo 8 caracteres.</p>
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" name="acepta" required className="mt-1 size-4 accent-primary" />
          <span>
            Acepto el <Link to="/avisodeprivacidad" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">aviso de privacidad</Link> y
            los <Link to="/terminosycondiciones" target="_blank" rel="noreferrer" className="font-semibold text-primary hover:underline">términos y condiciones</Link> del servicio.
          </span>
        </label>
        <button type="submit" className="btn-primary h-12 text-base" disabled={enviando}>
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
