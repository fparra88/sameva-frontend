import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { waLink } from '../lib/contenido'
import { HeroDex } from './HeroDex'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 h-[520px] bg-[radial-gradient(60%_60%_at_70%_30%,rgba(0,71,167,0.16),transparent_70%)]" />
      <div className="container-page relative grid items-center gap-12 pb-8 pt-16 md:pb-10 md:pt-24 lg:grid-cols-2">
        <div>
          <p className="eyebrow">CONOCE A DEX, TU AGENTE DE IA</p>
          <h1 className="mt-4 text-4xl font-bold text-ink sm:text-5xl lg:text-[3.5rem]">
            Atiende, vende y <span className="text-gradient">opera</span> tu negocio. Sin pausas.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-ink-muted">
            Dex responde, cotiza, agenda y da seguimiento a tus clientes en WhatsApp, Instagram y Facebook. Conectado
            a tus ventas, inventario y cobranza, todo se administra desde un solo portal.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/portal/registro" className="btn-primary h-12 px-6 text-base">
              Crear mi cuenta <ArrowRight size={18} weight="bold" aria-hidden />
            </Link>
            <a href={waLink('Hola, quiero agendar un diagnóstico de OperativAI.')} target="_blank" rel="noopener" className="btn-ghost h-12 px-6 text-base">
              Agendar diagnóstico gratis
            </a>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <HeroDex />
        </div>
      </div>
    </section>
  )
}
