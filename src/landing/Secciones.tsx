import {
  ArrowRight, ArrowsLeftRight, Buildings, CalendarCheck, ChartLineUp, Check, CreditCard, Cube,
  Handshake, Quotes, Receipt, Robot, Tray,
  UsersThree, WhatsappLogo, X, type Icon,
} from '@phosphor-icons/react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components'
import './ComoFunciona.css'
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

/* ------------------------------------------------------- Cómo funciona */

const IconoCheck = ({ s, w }: { s: number; w: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
)

export function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="cf-title" className="scroll-mt-20">
      <div className="cf-wrap">
        <header className="cf-head">
          <h2 id="cf-title">Tu negocio evoluciona. Nosotros te acompañamos.</h2>
          <p className="cf-sub">Simplificamos la implementación y te guiamos durante todo el proceso.</p>
        </header>

        <ol className="cf-steps">
          <li className="cf-step">
            <span className="cf-node" aria-hidden="true">1</span>
            <div className="cf-panel" aria-hidden="true">
              <div className="cf-field">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></svg>
                <span>tu@negocio.com</span>
              </div>
              <div className="cf-code">
                <b className="on">4</b><b className="on">8</b><b className="on">2</b><b className="on">9</b><b className="cur"></b><b></b>
              </div>
              <div className="cf-btn"><IconoCheck s={16} w={3} />Confirmar</div>
            </div>
            <h3>Crea tu cuenta</h3>
            <p>Tu correo y un código. Nada más.</p>
          </li>

          <li className="cf-step">
            <span className="cf-node" aria-hidden="true">2</span>
            <div className="cf-panel hubpanel" aria-hidden="true">
              <svg className="cf-hub" viewBox="0 0 260 190" role="img" aria-label="">
                <defs>
                  <radialGradient id="cf-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#2d6df0" stopOpacity=".55" /><stop offset="1" stopColor="#2d6df0" stopOpacity="0" /></radialGradient>
                </defs>
                <circle cx="205" cy="95" r="58" fill="url(#cf-glow)" />
                <g fill="none" stroke="#6ea2ff" strokeWidth="2" strokeLinecap="round">
                  <path className="flow" d="M114 35 C140 35 140 95 173 95" />
                  <path className="flow" d="M114 95 H173" />
                  <path className="flow" d="M114 155 C140 155 140 95 173 95" />
                </g>
                <circle cx="205" cy="95" r="32" fill="#2d6df0" />
                <polygon points="212,78 195,99 205,99 198,113 216,90 206,90" fill="#fff" />
                <g fontFamily="Plus Jakarta Sans, system-ui, sans-serif" fontSize="11.5" fontWeight="700" fill="#f3f7ff">
                  <rect x="10" y="18" width="104" height="34" rx="17" fill="#0a1a3f" stroke="#2a427f" />
                  <circle cx="28" cy="35" r="10" fill="#17306f" />
                  <path d="M23.5 38.5 25 34a5 5 0 1 1 2 2z" fill="none" stroke="#6ea2ff" strokeWidth="1.6" strokeLinejoin="round" />
                  <text x="44" y="39">WhatsApp</text>
                  <rect x="10" y="78" width="104" height="34" rx="17" fill="#0a1a3f" stroke="#2a427f" />
                  <circle cx="28" cy="95" r="10" fill="#17306f" />
                  <rect x="23" y="90" width="10" height="10" rx="3" fill="none" stroke="#6ea2ff" strokeWidth="1.6" />
                  <circle cx="28" cy="95" r="2.3" fill="none" stroke="#6ea2ff" strokeWidth="1.6" />
                  <text x="44" y="99">Instagram</text>
                  <rect x="10" y="138" width="104" height="34" rx="17" fill="#0a1a3f" stroke="#2a427f" />
                  <circle cx="28" cy="155" r="10" fill="#17306f" />
                  <text x="24.6" y="160" fontSize="14" fill="#6ea2ff">f</text>
                  <text x="44" y="159">Facebook</text>
                </g>
              </svg>
            </div>
            <h3>Conecta tus canales</h3>
            <p>WhatsApp con QR o API. Facebook e Instagram con tu cuenta de Meta.</p>
          </li>

          <li className="cf-step">
            <span className="cf-node" aria-hidden="true">3</span>
            <div className="cf-panel" aria-hidden="true">
              {([['Productos', '88%'], ['Precios', '64%'], ['Horarios', '76%']] as const).map(([et, w]) => (
                <div className="cf-row" key={et}>
                  <span className="cf-check"><IconoCheck s={12} w={4} /></span>
                  <label>{et}</label>
                  <div className="cf-bar" style={{ '--w': w } as React.CSSProperties}></div>
                </div>
              ))}
              <div className="cf-seg"><span>Formal</span><span className="sel">Cercano</span><span>Divertido</span></div>
            </div>
            <h3>Configura tu agente</h3>
            <p>Cuéntale qué vendes, a qué precio, cuándo atiendes y cómo hablar.</p>
          </li>

          <li className="cf-step">
            <span className="cf-node" aria-hidden="true">4</span>
            <div className="cf-panel" aria-hidden="true">
              <div className="cf-chat">
                <div className="cf-msg in">¿Tienen talla M?</div>
                <div className="cf-msg out">Sí, quedan 3. ¿Te lo enviamos hoy?</div>
                <div className="cf-typing"><i></i><i></i><i></i></div>
              </div>
              <div className="cf-foot">
                <div className="cf-spark">
                  {['30%', '42%', '38%', '58%', '72%', '100%'].map(h => <i key={h} style={{ '--h': h } as React.CSSProperties}></i>)}
                </div>
                <span className="cf-pill"><i></i>Atendiendo 24/7</span>
              </div>
            </div>
            <h3>Empieza a vender</h3>
            <p>Tu agente atiende todo el día. Tú supervisas y tomas el control cuando quieras.</p>
          </li>
        </ol>

        <div className="cf-cta">
          <Link className="btn" to="/portal/registro">
            Crear cuenta
            <ArrowRight size={18} weight="bold" aria-hidden />
          </Link>
          <span>Empieza hoy y conecta tu primer canal.</span>
        </div>
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
  { Icono: UsersThree, titulo: 'Reparte conversaciones', texto: 'Asigna cada conversación al vendedor correcto y da seguimiento en el CRM.' },
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
            convierte en una venta, una cita o una conversación con dueño.
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
  { Icono: Handshake, titulo: 'CRM y vendedores', texto: 'Pipeline de conversaciones, asignación automática y visitas de campo.' },
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
            <h2 id="caso-t" className="mt-3 text-2xl font-bold sm:text-3xl">Casa Rogelio: ventas 24 horas por WhatsApp</h2>
            <p className="mt-3 text-ink-muted">Fabrica de muebles finos para el hogar.</p>
            <blockquote className="mt-8 border-l-4 border-primary pl-5">
              <Quotes size={28} weight="fill" className="text-primary/30" aria-hidden />
              <p className="mt-2 text-lg text-ink">
                Me ayudó a enfocar mis esfuerzos y tiempo en buscar la expansión de mi empresa, delegando gran parte de la
                carga de atención a clientes y ventas a nuestro agente de IA.
              </p>
              <footer className="mt-3 text-sm font-semibold text-ink-muted">— Casa Rogelio</footer>
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
          <Link to="/eliminacion-datos" className="hover:text-ink hover:underline">Eliminación de datos</Link>
        </nav>
      </div>
    </footer>
  )
}
