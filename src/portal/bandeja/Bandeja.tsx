import { Tray } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { esDeNegocio, esVendedor } from '../../lib/roles'
import { useEvento } from '../../lib/tiempoReal'
import type { ConversacionDetalle, ConversacionItem, Lead, Servicios } from '../../lib/tipos'
import { useApi, useDebounce } from '../../lib/useApi'
import { FichaCrm } from './FichaCrm'
import { FILTROS_VACIOS, ListaConversaciones, type Filtros } from './ListaConversaciones'
import { Hilo } from './Hilo'

const PAGINA = 40

/**
 * Bandeja: lista | chat | ficha CRM. El CRM (etapa, vendedor, seguimiento)
 * vive en la ficha de la conversación abierta, no en una sección aparte.
 * La selección va en la URL (/portal/bandeja/:id) para poder enlazarla.
 */
export default function Bandeja() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const tenantId = usuario?.tenant_id ?? null
  const negocio = esDeNegocio(usuario)

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VACIOS)
  const [limite, setLimite] = useState(PAGINA)
  const [ficha, setFicha] = useState(true)
  const buscar = useDebounce(filtros.buscar.trim(), 300)

  const ruta = useMemo(() => {
    const qs = new URLSearchParams({ limite: String(limite) })
    if (filtros.canal) qs.set('canal', filtros.canal)
    if (filtros.estado) qs.set('estado', filtros.estado)
    if (filtros.asignada) qs.set('asignada', filtros.asignada)
    if (buscar) qs.set('buscar', buscar)
    return `/conversaciones?${qs}`
  }, [filtros.canal, filtros.estado, filtros.asignada, buscar, limite])

  const lista = useApi<ConversacionItem[]>(ruta)
  const detalle = useApi<ConversacionDetalle>(id ? `/conversaciones/${id}` : null)

  // ¿El negocio usa el embudo? Si sí, se pintan etapa y vendedor en cada fila.
  const servicios = useApi<Servicios>(negocio && tenantId ? `/tenants/${tenantId}/servicios` : null)
  const crmActivo = servicios.datos?.gestion_vendedores_activo ?? esVendedor(usuario)
  const pipeline = useApi<Lead[]>(negocio && tenantId && servicios.datos?.gestion_vendedores_activo ? `/tenants/${tenantId}/pipeline?limite=500` : null)
  const leads = useMemo(() => new Map((pipeline.datos ?? []).map((l) => [l.user_id, l])), [pipeline.datos])

  const recargarTodo = () => { lista.recargar(true); detalle.recargar(true); pipeline.recargar(true) }

  // Tiempo real: un mensaje o un cambio de responsable refresca lo que se ve.
  useEvento<{ conversation_id: string }>('mensaje_nuevo', (d) => {
    lista.recargar(true)
    if (d.conversation_id === id) detalle.recargar(true)
  })
  useEvento<{ conversation_id: string }>('conversacion_actualizada', (d) => {
    lista.recargar(true)
    if (d.conversation_id === id) detalle.recargar(true)
  })
  useEvento<{ recurso: string }>('datos_actualizados', (d) => {
    if (d.recurso === 'conversaciones') lista.recargar(true)
  })
  // Respaldo por si el socket está caído.
  useEffect(() => {
    const t = setInterval(() => { lista.recargar(true) }, 60_000)
    return () => clearInterval(t)
  }, [lista.recargar]) // eslint-disable-line react-hooks/exhaustive-deps

  const cambiarFiltros = (f: Filtros) => { setFiltros(f); setLimite(PAGINA) }
  const hayMas = (lista.datos?.length ?? 0) >= limite
  const hayDetalle = id && detalle.datos && detalle.datos.id === id

  return (
    <div className="flex h-dvh min-h-0 pb-24 md:pb-28">
      {/* Lista: en móvil se oculta al abrir una conversación. */}
      <div className={`${id ? 'hidden md:block' : 'block'} w-full shrink-0 border-r border-line bg-surface md:w-[22rem]`}>
        <ListaConversaciones carga={lista} filtros={filtros} onFiltros={cambiarFiltros} leads={leads}
          idActivo={id} hayMas={hayMas} onMas={() => setLimite((l) => l + PAGINA)} />
      </div>

      <div className={`${id ? 'block' : 'hidden md:grid'} min-w-0 flex-1 place-items-center`}>
        {id ? (
          <Hilo carga={detalle} onCambio={recargarTodo} fichaAbierta={ficha} onFicha={() => setFicha((f) => !f)}
            puedeTomar={usuario?.role !== 'proveedor'} />
        ) : (
          <div className="px-6 text-center">
            <Tray size={44} className="mx-auto text-primary" aria-hidden />
            <p className="mt-3 font-semibold">Elige una conversación</p>
            <p className="mt-1 text-sm text-ink-muted">Verás el chat y, a un lado, la ficha del cliente con su etapa en el embudo.</p>
          </div>
        )}
      </div>

      {/* Ficha CRM: columna fija en pantallas anchas, hoja a pantalla completa en móvil. */}
      {hayDetalle && ficha && (
        <div className="fixed inset-0 z-40 bg-surface pb-24 md:static md:pb-0 md:z-auto md:w-80 md:shrink-0 md:border-l md:border-line xl:w-96">
          <FichaCrm conversacion={detalle.datos!} tenantId={tenantId} crmActivo={crmActivo}
            onCambio={recargarTodo} onCerrar={() => setFicha(false)} />
        </div>
      )}
    </div>
  )
}
