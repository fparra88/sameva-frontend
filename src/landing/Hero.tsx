import { ArrowRight, CalendarCheck, Robot } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CanalBadge } from '../components'
import { waLink } from '../lib/contenido'

const DATOS = [
  { k: 'Canales', v: 'WhatsApp, Instagram y Facebook' },
  { k: 'Integración', v: 'Ventas, inventario y cobranza' },
  { k: 'Implementación', v: 'Acompañada, ~2 semanas' },
  { k: 'Para quién', v: 'Pymes y distribuidores' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] bg-[radial-gradient(60%_60%_at_70%_30%,rgba(0,71,167,0.16),transparent_70%)]" />
      <div className="container-page relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="eyebrow">Atención con IA · 24/7</p>
          <h1 className="mt-4 text-4xl font-bold text-ink sm:text-5xl lg:text-[3.5rem]">
            El agente de IA que atiende, vende y <span className="text-gradient">opera</span> tu negocio
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">
            Responde, cotiza, agenda y da seguimiento en WhatsApp, Instagram y Facebook — conectado a tus ventas,
            inventario y cobranza. Todo se administra desde un solo portal.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/portal/registro" className="btn-primary h-12 px-6 text-base">
              Crear mi cuenta <ArrowRight size={18} weight="bold" aria-hidden />
            </Link>
            <a href={waLink('Hola, quiero agendar un diagnóstico de OperativAI.')} target="_blank" rel="noopener" className="btn-ghost h-12 px-6 text-base">
              Agendar diagnóstico gratis
            </a>
          </div>
          <p className="mt-3 text-sm text-ink-muted">Sin costo · Sin compromiso · Respuesta en menos de 24 horas</p>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 sm:grid-cols-4">
            {DATOS.map((d) => (
              <div key={d.k}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink-muted">{d.k}</dt>
                <dd className="mt-1 text-sm font-medium text-ink">{d.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <ChatDemo />
      </div>
    </section>
  )
}

/** Vista de muestra: bandeja unificada + conversación atendida por el agente. */
function ChatDemo() {
  return (
    <figure className="card relative mx-auto w-full max-w-md shadow-xl shadow-primary/10" aria-label="Ejemplo de conversación atendida por el agente">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <CanalBadge tipo="whatsapp" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">María González</p>
          <p className="flex items-center gap-1 text-xs text-success"><Robot size={14} weight="fill" aria-hidden /> Atendido por IA</p>
        </div>
        <div className="flex -space-x-1.5" aria-label="Otras conversaciones activas en Instagram y Facebook">
          <CanalBadge tipo="instagram" size={16} />
          <CanalBadge tipo="facebook" size={16} />
        </div>
      </div>

      <div className="space-y-3 bg-muted/50 px-4 py-5 text-sm">
        <Burbuja de="cliente">Hola, ¿cuánto cuesta el servicio y tienen lugar esta semana?</Burbuja>
        <Burbuja de="agente">Son $850. Tengo espacio el jueves a las 4 pm o el sábado a las 11 am, ¿cuál te acomoda?</Burbuja>
        <Burbuja de="cliente">El sábado me queda mejor.</Burbuja>
        <Burbuja de="agente">
          Listo, te aparté el sábado a las 11:00 am. Te llega la confirmación por aquí.
        </Burbuja>
        <div className="ml-auto flex w-fit items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink-muted">
          <CalendarCheck size={16} className="text-primary" aria-hidden /> Cita creada en el calendario
        </div>
        <div className="flex w-fit gap-1 rounded-2xl rounded-bl-sm bg-surface px-3 py-3" aria-label="El cliente está escribiendo">
          <span className="typing-dot size-1.5 rounded-full bg-ink-muted" />
          <span className="typing-dot size-1.5 rounded-full bg-ink-muted" />
          <span className="typing-dot size-1.5 rounded-full bg-ink-muted" />
        </div>
      </div>
      <figcaption className="sr-only">El agente responde precio y disponibilidad y agenda la cita automáticamente.</figcaption>
    </figure>
  )
}

function Burbuja({ de, children }: { de: 'cliente' | 'agente'; children: ReactNode }) {
  return de === 'cliente' ? (
    <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface px-3.5 py-2.5 text-ink shadow-sm">{children}</p>
  ) : (
    <p className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-on-primary">{children}</p>
  )
}
