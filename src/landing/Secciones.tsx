import {
  ArrowRight, ArrowsLeftRight, Buildings, CalendarCheck, ChartLineUp, Check, CreditCard, Cube,
  Handshake, Lightning, QrCode, Quotes, Receipt, Robot, Tray,
  UserPlus, UsersThree, WhatsappLogo, X, type Icon,
} from '@phosphor-icons/react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components'
import { EscenarioCanales } from './EscenarioCanales'
import { FAQ, PAQUETES_CREDITOS, UBICACION, formatoMXN, waLink } from '../lib/contenido'
import { HERRAMIENTAS, topesPlan } from '../lib/planes'
import type { PlanPublico } from '../lib/tipos'
import { useApi } from '../lib/useApi'

function Encabezado({ eyebrow, titulo, children, id }: { eyebrow?: string; titulo: ReactNode; children?: ReactNode; id: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 id={id} className={`${eyebrow ? 'mt-3 ' : ''}text-3xl font-bold sm:text-4xl`}>{titulo}</h2>
      {children && <p className="mt-4 text-lg text-ink-muted">{children}</p>}
    </div>
  )
}

/* ---------------------------------------------------------------- Canales */

export function Canales() {
  return (
    <section id="canales" aria-labelledby="canales-t" className="scroll-mt-16 pb-20 pt-8 md:pb-28 md:pt-10">
      <div className="container-page">
        <Encabezado id="canales-t" titulo="Un agente. Tres canales. Una sola bandeja.">
          Tus clientes escriben por donde prefieren. Tú lo ves todo junto.
        </Encabezado>
        <div className="mx-auto mt-10 max-w-[1120px]">
          <EscenarioCanales />
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------- Integración fácil */

const PASOS: { Icono: Icon; titulo: string; texto: string }[] = [
  { Icono: UserPlus, titulo: 'Crea tu cuenta', texto: 'Registra tu negocio con tu correo. Te mandamos un código para confirmar y listo.' },
  { Icono: QrCode, titulo: 'Conecta tus canales', texto: 'Vincula WhatsApp con QR o API, y Facebook e Instagram con tu inicio de sesión de Meta.' },
  { Icono: Robot, titulo: 'Configura tu agente', texto: 'Responde un cuestionario corto: qué vendes, precios, horarios y tono. El agente arranca con eso.' },
  { Icono: Lightning, titulo: 'Empieza a vender', texto: 'El agente atiende 24/7. Tú supervisas, tomas conversaciones cuando quieras y ves resultados.' },
]

export function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="como-t" className="scroll-mt-20 bg-ink py-20 text-white md:py-28">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="como-t" className="text-3xl font-bold sm:text-4xl">Operando en días, no en meses</h2>
          <p className="mt-4 text-lg text-white/75">
            No necesitas equipo técnico ni cambiar cómo trabajas. Nuestro equipo te acompaña en la implementación.
          </p>
        </div>
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PASOS.map(({ Icono, titulo, texto }, i) => (
            <li key={titulo} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-primary text-on-primary"><Icono size={22} aria-hidden /></span>
                <span className="font-display text-3xl font-bold text-white/20" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">
                <span className="sr-only">Paso {i + 1}: </span>{titulo}
              </h3>
              <p className="mt-2 text-white/75">{texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- Operación */

const CAPACIDADES: { Icono: Icon; titulo: string; texto: string }[] = [
  { Icono: Receipt, titulo: 'Cotiza en el chat', texto: 'Genera cotizaciones automáticas con tus precios reales, sin esperar a un vendedor.' },
  { Icono: CalendarCheck, titulo: 'Agenda y recuerda', texto: 'Consulta disponibilidad, reserva, reagenda y manda recordatorios de cita.' },
  { Icono: Cube, titulo: 'Consulta inventario', texto: 'Responde con existencias y datos actualizados de tu sistema de gestión.' },
  { Icono: CreditCard, titulo: 'Cobra por link', texto: 'Envía ligas de pago dentro de la conversación y registra el cobro.' },
  { Icono: UsersThree, titulo: 'Reparte leads', texto: 'Asigna cada lead al vendedor correcto y da seguimiento en el CRM.' },
  { Icono: ArrowsLeftRight, titulo: 'Pasa a una persona', texto: 'Cuando hace falta, transfiere la conversación a tu equipo con todo el contexto.' },
]

export function Operacion() {
  return (
    <section aria-labelledby="op-t" className="py-20 md:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <h2 id="op-t" className="text-3xl font-bold sm:text-4xl">De la conversación a la operación</h2>
          <p className="mt-4 text-lg text-ink-muted">
            La IA no solo contesta: cotiza, agenda y actualiza tu sistema de gestión en tiempo real. Cada mensaje se
            convierte en una venta, una cita o un lead con dueño.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {CAPACIDADES.map(({ Icono, titulo, texto }) => (
            <li key={titulo} className="card p-5">
              <Icono size={26} className="text-primary" aria-hidden />
              <h3 className="mt-3 font-semibold">{titulo}</h3>
              <p className="mt-1 text-sm text-ink-muted">{texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* --------------------------------------------------- Portal todo en uno */

const MODULOS: { Icono: Icon; titulo: string; texto: string }[] = [
  { Icono: Tray, titulo: 'Bandeja unificada', texto: 'WhatsApp, Instagram y Facebook en un solo lugar. Toma o devuelve conversaciones a la IA.' },
  { Icono: Robot, titulo: 'Tu agente', texto: 'Ajusta instrucciones, tono y herramientas. Pruébalo antes de publicarlo.' },
  { Icono: CalendarCheck, titulo: 'Agenda', texto: 'Servicios, proveedores y citas, sincronizados con lo que agenda el agente.' },
  { Icono: Handshake, titulo: 'CRM y vendedores', texto: 'Pipeline de leads, asignación automática y visitas de campo.' },
  { Icono: ChartLineUp, titulo: 'Reportes', texto: 'Mensajes, conversaciones por canal, consumo de créditos y resultados.' },
  { Icono: Buildings, titulo: 'Tu cuenta', texto: 'Plan, pagos, equipo e invitaciones, sin tener que pedírnoslo.' },
]

export function Portal() {
  return (
    <section id="portal" aria-labelledby="portal-t" className="scroll-mt-20 border-y border-line bg-surface py-20 md:py-28">
      <div className="container-page">
        <Encabezado id="portal-t" titulo="Todo tu servicio en un solo portal">
          La misma página donde nos conociste es donde administras tu agente. Entra con tu cuenta y controla todo.
        </Encabezado>
        <ul className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map(({ Icono, titulo, texto }) => (
            <li key={titulo} className="bg-surface p-6">
              <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary"><Icono size={22} aria-hidden /></span>
              <h3 className="mt-4 font-semibold">{titulo}</h3>
              <p className="mt-1 text-sm text-ink-muted">{texto}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex justify-center">
          <Link to="/portal/entrar" className="btn-ghost">Ya tengo cuenta — entrar al portal <ArrowRight size={16} aria-hidden /></Link>
        </div>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------- Caso */

export function Caso() {
  return (
    <section aria-labelledby="caso-t" className="py-20 md:py-28">
      <div className="container-page">
        <div className="card grid overflow-hidden md:grid-cols-[1.3fr_1fr]">
          <div className="p-8 md:p-12">
            <p className="eyebrow">Caso de éxito</p>
            <h2 id="caso-t" className="mt-3 text-2xl font-bold sm:text-3xl">Zeutica: ventas 24 horas por WhatsApp</h2>
            <p className="mt-3 text-ink-muted">Distribuidora de materiales desechables para la industria farmacéutica, alimentaria y de manufactura.</p>
            <blockquote className="mt-8 border-l-4 border-primary pl-5">
              <Quotes size={28} weight="fill" className="text-primary/30" aria-hidden />
              <p className="mt-2 text-lg text-ink">
                Me ayudó a enfocar mis esfuerzos y tiempo en buscar la expansión de mi empresa, delegando gran parte de la
                carga de atención a clientes y ventas a nuestro agente de IA.
              </p>
              <footer className="mt-3 text-sm font-semibold text-ink-muted">— Zeutica</footer>
            </blockquote>
          </div>
          <ul className="grid content-center gap-6 bg-primary p-8 text-on-primary md:p-12">
            <li>
              <p className="font-display text-xl font-bold">Más ventas</p>
              <p className="mt-1 text-white/85">con el agente atendiendo por WhatsApp las 24 horas.</p>
            </li>
            <li className="border-t border-white/20 pt-6">
              <p className="font-display text-xl font-bold">Menos tiempo de atención</p>
              <p className="mt-1 text-white/85">generando cotizaciones en automático dentro del chat.</p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------- Precios */

function TarjetaPlan({ p }: { p: PlanPublico }) {
  return (
    <li className={`card relative flex flex-col p-6 ${p.destacado ? 'border-2 border-primary shadow-xl shadow-primary/10' : ''}`}>
      {p.destacado && (
        <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-primary">Recomendado</span>
      )}
      <h3 className="text-lg font-semibold capitalize">{p.nombre}</h3>
      <p className="mt-1 min-h-12 text-sm text-ink-muted">{p.descripcion}</p>
      <p className="mt-5 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold tabular-nums">{formatoMXN(Number(p.precio_monthly))}</span>
        <span className="text-sm text-ink-muted">/mes</span>
      </p>
      <ul className="mt-5 space-y-1.5 border-b border-line pb-5 text-sm font-medium">
        {topesPlan(p).map((l) => <li key={l}>{l}</li>)}
      </ul>
      <ul className="mt-5 flex-1 space-y-2 text-sm">
        {HERRAMIENTAS.map((h) => p[h.columna as keyof PlanPublico] ? (
          <li key={h.columna} className="flex gap-2"><Check size={18} weight="bold" className="shrink-0 text-success" aria-label="Incluido" />{h.nombre}</li>
        ) : (
          <li key={h.columna} className="flex gap-2 text-ink-muted/80"><X size={18} className="shrink-0" aria-label="No incluido" /><span className="line-through decoration-ink-muted/40">{h.nombre}</span></li>
        ))}
      </ul>
      <Link
        to={`/portal/registro?plan=${encodeURIComponent(p.nombre)}`}
        className={`${p.destacado ? 'btn-primary' : 'btn-ghost'} mt-6 w-full`}
      >
        Contratar <span className="capitalize">{p.nombre}</span>
      </Link>
    </li>
  )
}

function EsqueletoPlanes() {
  return (
    <ul className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Cargando planes">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="card h-96 animate-pulse p-6"><div className="h-5 w-1/3 rounded bg-line" /><div className="mt-4 h-10 w-1/2 rounded bg-line" /><div className="mt-6 space-y-2"><div className="h-3 rounded bg-line" /><div className="h-3 rounded bg-line" /><div className="h-3 w-2/3 rounded bg-line" /></div></li>
      ))}
    </ul>
  )
}

export function Precios() {
  const planes = useApi<{ planes: PlanPublico[] }>('/planes/publicos')
  const lista = planes.datos?.planes ?? []
  return (
    <section id="precios" aria-labelledby="precios-t" className="scroll-mt-20 bg-muted/60 py-20 md:py-28">
      <div className="container-page">
        <Encabezado id="precios-t" titulo={<>Precios claros, <span className="text-gradient">en pesos</span> y sin letras chiquitas</>}>
          Pago mensual, IVA incluido. Sin plazo forzoso: cambia o cancela cuando quieras.
        </Encabezado>

        {planes.cargando && !planes.datos ? <EsqueletoPlanes /> : planes.error ? (
          <div role="alert" className="card mt-14 p-8 text-center">
            <p className="font-semibold">No pudimos cargar los precios.</p>
            <p className="mt-1 text-sm text-ink-muted">Reintenta en unos segundos o escríbenos por WhatsApp.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button type="button" className="btn-ghost" onClick={() => planes.recargar()}>Reintentar</button>
              <a className="btn-primary" href={waLink('Hola, quiero conocer los planes de OperativAI.')} target="_blank" rel="noreferrer">Escribir por WhatsApp</a>
            </div>
          </div>
        ) : lista.length === 0 ? (
          <div className="card mt-14 p-8 text-center">
            <p className="font-semibold">Estamos actualizando nuestros planes.</p>
            <a className="btn-primary mt-4 inline-flex" href={waLink('Hola, quiero conocer los planes de OperativAI.')} target="_blank" rel="noreferrer">Consultar por WhatsApp</a>
          </div>
        ) : (
          <ul className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {lista.map((p) => <TarjetaPlan key={p.nombre} p={p} />)}
          </ul>
        )}

        <div className="card mt-8 flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold">Paquetes de créditos extra</h3>
            <p className="text-sm text-ink-muted">Para meses de más movimiento. No vencen.</p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PAQUETES_CREDITOS.map((c) => (
              <li key={c.creditos} className="rounded-xl border border-line px-4 py-2 text-center">
                <p className="font-semibold tabular-nums">{c.creditos.toLocaleString('es-MX')}</p>
                <p className="text-xs text-ink-muted tabular-nums">{formatoMXN(c.precio)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ FAQ */

export function Preguntas() {
  return (
    <section id="preguntas" aria-labelledby="faq-t" className="scroll-mt-20 py-20 md:py-28">
      <div className="container-page max-w-3xl">
        <Encabezado id="faq-t" eyebrow="Preguntas frecuentes" titulo="Lo que más nos preguntan" />
        <div className="mt-12 divide-y divide-line rounded-2xl border border-line bg-surface">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold">
                {f.q}
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-primary transition group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="pb-5 text-ink-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------- Contacto */

export function Contacto() {
  const [enviado, setEnviado] = useState(false)

  // Aún no hay endpoint público de contacto en la API: el formulario arma el
  // mensaje y abre WhatsApp con él ya escrito.
  function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const texto = [
      'Hola, quiero agendar un diagnóstico de OperativAI.',
      `Nombre: ${d.get('nombre')}`,
      `Empresa: ${d.get('empresa')}`,
      `Canales: ${d.getAll('canal').join(', ') || 'Por definir'}`,
      d.get('comentarios') ? `Comentarios: ${d.get('comentarios')}` : '',
    ].filter(Boolean).join('\n')
    window.open(waLink(texto), '_blank', 'noopener')
    setEnviado(true)
  }

  return (
    <section id="contacto" aria-labelledby="contacto-t" className="scroll-mt-20 pb-20 md:pb-28">
      <div className="container-page">
        <div className="grid gap-10 overflow-hidden rounded-3xl bg-ink p-8 text-white md:grid-cols-2 md:p-14">
          <div>
            <h2 id="contacto-t" className="text-3xl font-bold sm:text-4xl">Agenda una reunión y hacemos el <span className="text-accent-soft">diagnóstico</span></h2>
            <p className="mt-4 text-lg text-white/75">
              En la primera sesión revisamos cómo atiendes hoy, qué canales usas y qué debería resolver tu agente. De ahí armamos el plan.
            </p>
            <p className="mt-6 text-sm text-white/60">Sin costo · Sin compromiso · Respuesta en menos de 24 horas</p>
          </div>

          <form onSubmit={enviar} className="grid gap-4 rounded-2xl bg-surface p-6 text-ink" noValidate={false}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="c-nombre" className="field-label">Nombre <span className="text-danger" aria-hidden>*</span></label>
                <input id="c-nombre" name="nombre" required autoComplete="name" className="field" />
              </div>
              <div>
                <label htmlFor="c-empresa" className="field-label">Empresa <span className="text-danger" aria-hidden>*</span></label>
                <input id="c-empresa" name="empresa" required autoComplete="organization" className="field" />
              </div>
            </div>
            <fieldset>
              <legend className="field-label">¿Qué canales quieres atender?</legend>
              <div className="flex flex-wrap gap-2">
                {['WhatsApp', 'Instagram', 'Facebook'].map((c) => (
                  <label key={c} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line px-3.5 text-sm has-checked:border-primary has-checked:bg-primary-soft">
                    <input type="checkbox" name="canal" value={c} className="size-4 accent-primary" /> {c}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="c-com" className="field-label">Comentarios</label>
              <textarea id="c-com" name="comentarios" rows={3} className="field py-2.5" placeholder="Ej. vendemos refacciones y recibimos 80 mensajes al día" />
            </div>
            <button type="submit" className="btn-primary h-12 text-base">
              <WhatsappLogo size={20} weight="fill" aria-hidden /> Enviar por WhatsApp
            </button>
            <p aria-live="polite" className="text-sm text-success">{enviado && 'Listo. Abrimos WhatsApp con tu mensaje; solo dale enviar.'}</p>
          </form>
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- Footer */

export function Footer() {
  return (
    <footer className="border-t border-line py-12">
      <div className="container-page flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-ink-muted">
            Agentes de IA que atienden, venden y operan tu negocio por WhatsApp, Instagram y Facebook.
          </p>
        </div>
        <nav aria-label="Pie de página" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
          <a href="#canales" className="text-ink-muted hover:text-ink">Canales</a>
          <Link to="/portal/entrar" className="text-ink-muted hover:text-ink">Iniciar sesión</Link>
          <a href="#precios" className="text-ink-muted hover:text-ink">Precios</a>
          <Link to="/portal/registro" className="text-ink-muted hover:text-ink">Crear cuenta</Link>
          <a href="#preguntas" className="text-ink-muted hover:text-ink">Preguntas</a>
          <a href="#contacto" className="text-ink-muted hover:text-ink">Contacto</a>
        </nav>
      </div>
      <div className="container-page mt-10 flex flex-col gap-2 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} OperativAI. {UBICACION}</p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link to="/terminosycondiciones" className="hover:text-ink hover:underline">Términos y condiciones</Link>
          <Link to="/avisodeprivacidad" className="hover:text-ink hover:underline">Aviso de privacidad</Link>
        </nav>
      </div>
    </footer>
  )
}
