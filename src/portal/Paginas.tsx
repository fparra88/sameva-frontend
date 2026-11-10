import { Robot } from '@phosphor-icons/react'
import { useLocation } from 'react-router-dom'
import { NAV } from './PortalLayout'

/** Marcador de las secciones que todavía no tienen pantalla en el portal nuevo. */
export function Proximamente() {
  const { pathname } = useLocation()
  const item = NAV.find((n) => n.to === pathname)
  const Icono = item?.Icono ?? Robot
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-32 pt-8 sm:px-8">
      <h1 className="mb-8 text-2xl font-bold sm:text-3xl">{item?.label ?? 'Sección'}</h1>
      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <Icono size={40} className="text-primary" aria-hidden />
        <h2 className="text-lg font-semibold">Estamos construyendo esta sección</h2>
        <p className="max-w-sm text-ink-muted">Muy pronto podrás administrarla desde aquí.</p>
      </div>
    </div>
  )
}
