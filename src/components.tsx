import { ChatCircleDots, FacebookLogo, Globe, InstagramLogo, WhatsappLogo, type Icon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'

export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`} aria-label="OperativAI, inicio">
      <img src="/imagenes/OperativAI-logo.png" alt="OperativAI" width={1718} height={436} className="h-9 w-auto sm:h-10" />
    </Link>
  )
}

interface CanalInfo { nombre: string; Icono: Icon; color: string; fondo: string }

/** `channel_type` de la API → cómo se muestra. */
export const CANALES: Record<string, CanalInfo> = {
  whatsapp: { nombre: 'WhatsApp', Icono: WhatsappLogo, color: 'text-whatsapp', fondo: 'bg-whatsapp/10' },
  instagram: { nombre: 'Instagram', Icono: InstagramLogo, color: 'text-instagram', fondo: 'bg-instagram/10' },
  facebook: { nombre: 'Facebook', Icono: FacebookLogo, color: 'text-facebook', fondo: 'bg-facebook/10' },
  messenger: { nombre: 'Messenger', Icono: FacebookLogo, color: 'text-facebook', fondo: 'bg-facebook/10' },
  widget: { nombre: 'Web', Icono: Globe, color: 'text-accent', fondo: 'bg-accent/10' },
}

export const infoCanal = (tipo: string): CanalInfo =>
  CANALES[tipo] ?? { nombre: tipo, Icono: ChatCircleDots, color: 'text-ink-muted', fondo: 'bg-muted' }

export function CanalBadge({ tipo, size = 18 }: { tipo: string; size?: number }) {
  const { nombre, Icono, color, fondo } = infoCanal(tipo)
  return (
    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${fondo} ${color}`} title={nombre}>
      <Icono size={size} weight="fill" aria-label={nombre} />
    </span>
  )
}

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-ink-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden />
      {label}
    </span>
  )
}
