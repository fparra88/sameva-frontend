import { useState } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import type { ServiciosTenant } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso } from '../ui'

type Modulo = 'agente_ia_activo' | 'gestion_vendedores_activo' | 'calendario_activo'

const MODULOS: { id: Modulo; nombre: string; detalle: string }[] = [
  { id: 'agente_ia_activo', nombre: 'Agente de IA', detalle: 'Responde solo a tus clientes en todos tus canales. Apagado, las conversaciones esperan a una persona.' },
  { id: 'gestion_vendedores_activo', nombre: 'Ventas y seguimiento', detalle: 'Embudo, vendedor asignado y seguimientos dentro de cada conversación de la bandeja.' },
  { id: 'calendario_activo', nombre: 'Calendario de citas', detalle: 'Agenda de proveedores, servicios y reservas; el agente puede agendar por chat.' },
]

const ZONAS = [
  'America/Mexico_City', 'America/Monterrey', 'America/Merida', 'America/Cancun', 'America/Chihuahua', 'America/Mazatlan',
  'America/Hermosillo', 'America/Tijuana', 'America/Bogota', 'America/Lima', 'America/Santiago', 'America/Argentina/Buenos_Aires',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/Madrid', 'UTC',
]

/** Qué módulos usa el negocio y en qué zona horaria opera. Lo decide el dueño o el superadmin. */
export function Negocio() {
  const { usuario } = useAuth()
  const tenantId = usuario?.tenant_id ?? null
  const ruta = tenantId ? `/tenants/${tenantId}/servicios` : null
  const servicios = useApi<ServiciosTenant>(ruta)
  const [guardando, setGuardando] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const s = servicios.datos

  const guardar = async (clave: string, cambio: Partial<Record<Modulo | 'zona_horaria', boolean | string>>, mensaje: string) => {
    if (!ruta) return
    setError(null); setOk(null); setGuardando(clave)
    try { await api<ServiciosTenant>(ruta, { method: 'PATCH', body: cambio }); servicios.recargar(true); setOk(mensaje) }
    // 402/403: el plan no incluye el módulo; el servidor explica cuál y por qué.
    catch (e) { setError(e instanceof ApiError ? e.message : 'No se pudo guardar el cambio.') }
    finally { setGuardando(null) }
  }

  if (servicios.cargando && !s) return <div className="p-10 text-center"><Spinner /></div>
  const zonas = s && !ZONAS.includes(s.zona_horaria) ? [s.zona_horaria, ...ZONAS] : ZONAS

  return (
    <div className="space-y-4">
      {servicios.error && <Aviso tipo="error">{servicios.error.message}</Aviso>}
      {error && <Aviso tipo="error">{error}</Aviso>}
      {ok && <Aviso tipo="ok">{ok}</Aviso>}

      {s && (
        <>
          <section className="card divide-y divide-line overflow-hidden" aria-labelledby="mod-t">
            <header className="p-5">
              <h2 id="mod-t" className="font-semibold">Módulos</h2>
              <p className="text-sm text-ink-muted">Enciende solo lo que usa tu negocio. Algunos dependen de tu plan.</p>
            </header>
            {MODULOS.map((m) => {
              const activo = s[m.id]
              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{m.nombre}</p>
                    <p className="text-sm text-ink-muted">{m.detalle}</p>
                  </div>
                  <button type="button" role="switch" aria-checked={activo} aria-label={m.nombre} disabled={guardando !== null}
                    onClick={() => guardar(m.id, { [m.id]: !activo }, `${m.nombre} ${activo ? 'apagado' : 'encendido'}.`)}
                    className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition disabled:opacity-50 ${activo ? 'bg-primary' : 'bg-line'}`}>
                    <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform ${activo ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              )
            })}
          </section>

          <section className="card space-y-2 p-5" aria-labelledby="zh-t">
            <h2 id="zh-t" className="font-semibold">Zona horaria</h2>
            <p className="text-sm text-ink-muted">Define las horas de la agenda, los avisos y el corte diario.</p>
            <select id="zona" aria-labelledby="zh-t" className="field max-w-sm" value={s.zona_horaria} disabled={guardando !== null}
              onChange={(e) => guardar('zona', { zona_horaria: e.target.value }, 'Zona horaria actualizada.')}>
              {zonas.map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
            </select>
          </section>
        </>
      )}
    </div>
  )
}
