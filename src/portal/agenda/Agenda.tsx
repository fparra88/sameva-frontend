import { CalendarBlank } from '@phosphor-icons/react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { esGerencia, esProveedor } from '../../lib/roles'
import { Aviso } from '../ui'
import { Auditoria } from './Auditoria'
import { Corte } from './Corte'
import { Dia } from './Dia'
import { Proveedores } from './Proveedores'
import { Servicios } from './Servicios'
import { useCalendario } from './useCalendario'

const VISTAS = [
  { id: 'dia', etiqueta: 'Día', roles: 'todos' },
  { id: 'proveedores', etiqueta: 'Proveedores', roles: 'todos' },
  { id: 'servicios', etiqueta: 'Servicios', roles: 'negocio' },
  { id: 'corte', etiqueta: 'Corte diario', roles: 'negocio' },
  { id: 'auditoria', etiqueta: 'Auditoría', roles: 'negocio' },
] as const

type Vista = (typeof VISTAS)[number]['id']

/**
 * Agenda: calendario de citas (reservas) del negocio. Vistas: Día (grilla por
 * proveedor), Proveedores (horarios, descansos, días libres), Servicios,
 * Corte diario y Auditoría. El proveedor con cuenta solo ve y maneja lo suyo.
 */
export default function Agenda() {
  const { usuario } = useAuth()
  const gerencia = esGerencia(usuario)
  const proveedor = esProveedor(usuario)
  const cal = useCalendario()
  const [params, setParams] = useSearchParams()
  const [encendiendo, setEncendiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visibles = VISTAS.filter((v) => v.roles === 'todos' || !proveedor)
  const pedida = params.get('vista') as Vista | null
  const vista: Vista = visibles.some((v) => v.id === pedida) ? (pedida as Vista) : 'dia'

  const encender = async () => {
    if (!cal.tenantId) return
    setEncendiendo(true); setError(null)
    try {
      await api(`/tenants/${cal.tenantId}/servicios`, { method: 'PATCH', body: { calendario_activo: true } })
      cal.servicios.recargar()
    } catch (e) { setError(e instanceof ApiError ? e.message : 'No se pudo activar el calendario.') }
    finally { setEncendiendo(false) }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-8 sm:px-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold sm:text-3xl">Agenda</h1>
        <p className="mt-1 text-ink-muted">Citas, proveedores y servicios de tu negocio.</p>
      </div>

      {cal.servicios.cargando && !cal.servicios.datos ? <div className="p-10 text-center"><Spinner label="Cargando agenda" /></div>
        : cal.servicios.error ? <Aviso tipo="error">{cal.servicios.error.message}</Aviso>
        : cal.activo === false ? (
          <section className="card flex flex-col items-center gap-3 p-12 text-center">
            <CalendarBlank size={40} className="text-primary" aria-hidden />
            <h2 className="text-lg font-semibold">El calendario de citas está apagado</h2>
            <p className="max-w-md text-ink-muted">Actívalo para que tu agente pueda agendar citas con tus proveedores y tú las administres desde aquí.</p>
            {error && <Aviso tipo="error">{error}</Aviso>}
            {gerencia
              ? <button type="button" className="btn-primary" onClick={encender} disabled={encendiendo}>{encendiendo ? 'Activando…' : 'Activar calendario'}</button>
              : <p className="text-sm text-ink-muted">Pídele a la gerencia de tu negocio que lo active.</p>}
          </section>
        ) : cal.base && (
          <>
            <nav aria-label="Vistas de la agenda" className="mb-5 flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
              {visibles.map((v) => (
                <button key={v.id} type="button" aria-current={vista === v.id ? 'page' : undefined}
                  onClick={() => setParams(v.id === 'dia' ? {} : { vista: v.id }, { replace: true })}
                  className={`min-h-9 shrink-0 cursor-pointer rounded-full px-4 text-sm font-semibold transition ${vista === v.id ? 'bg-primary text-on-primary' : 'text-ink-muted hover:bg-muted hover:text-ink'}`}>
                  {v.etiqueta}
                </button>
              ))}
            </nav>
            {vista === 'dia' && <Dia base={cal.base} />}
            {vista === 'proveedores' && <Proveedores base={cal.base} />}
            {vista === 'servicios' && <Servicios base={cal.base} />}
            {vista === 'corte' && <Corte base={cal.base} />}
            {vista === 'auditoria' && <Auditoria base={cal.base} />}
          </>
        )}
    </div>
  )
}
