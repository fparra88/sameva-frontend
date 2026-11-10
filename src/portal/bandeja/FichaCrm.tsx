import { CalendarCheck, Check, UserCircle, X } from '@phosphor-icons/react'
import { useEffect, useState, type ReactNode } from 'react'
import { CanalBadge, Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { aInputLocal, dinero, etiquetaEtapa, fechaCorta, hora, iniciales, nombreContacto } from '../../lib/formato'
import { esDeNegocio, esGerencia } from '../../lib/roles'
import type { Asignable, ConversacionDetalle, EstadoConversacion, HistorialLead, Lead, Vendedor } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-b border-line px-4 py-4">
      <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">{titulo}</h3>
      {children}
    </section>
  )
}

const SELECT = 'min-h-10 w-full rounded-lg border border-line bg-surface px-2.5 text-sm outline-none focus:border-primary disabled:opacity-60'

/** Ficha CRM del contacto de la conversación abierta: embudo, vendedor, seguimiento e historial. */
export function FichaCrm({ conversacion, tenantId, crmActivo, onCambio, onCerrar }: {
  conversacion: ConversacionDetalle
  tenantId: string | null
  crmActivo: boolean
  onCambio: () => void
  onCerrar: () => void
}) {
  const { usuario } = useAuth()
  const userId = conversacion.user_id
  const negocio = esDeNegocio(usuario)
  const gerencia = esGerencia(usuario)

  const lead = useApi<Lead>(crmActivo && userId ? `/pipeline/${userId}` : null)
  const historial = useApi<HistorialLead[]>(crmActivo && userId && lead.datos ? `/pipeline/${userId}/historial` : null)
  const vendedores = useApi<Vendedor[]>(crmActivo && negocio && tenantId ? `/tenants/${tenantId}/vendedores` : null)
  const asignables = useApi<Asignable[]>(gerencia ? '/conversaciones/asignables' : null)

  const [ocupado, setOcupado] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)
  const [monto, setMonto] = useState('')
  const [motivo, setMotivo] = useState('')
  const [fecha, setFecha] = useState('')
  const [nota, setNota] = useState('')
  const l = lead.datos

  useEffect(() => {
    setMonto(l?.monto_estimado != null ? String(l.monto_estimado) : '')
    setMotivo(l?.motivo_perdida ?? '')
    setFecha(aInputLocal(l?.proximo_seguimiento ?? null))
    setNota(l?.seguimiento_nota ?? '')
  }, [l])

  /** Ejecuta una escritura, refresca ficha y lista, y muestra el error de la API si lo hay. */
  const ejecutar = async (fn: () => Promise<unknown>) => {
    setOcupado(true); setFallo(null)
    try { await fn(); lead.recargar(true); historial.recargar(true); onCambio() }
    catch (e) { setFallo(e instanceof ApiError ? e.message : 'No se pudo guardar.') }
    finally { setOcupado(false) }
  }

  const entrarAlEmbudo = () => ejecutar(() => api(`/pipeline/${userId}/asignar`, { method: 'POST', body: {} }))
  const asignarVendedor = (id: string) => ejecutar(() =>
    api(`/pipeline/${userId}/asignar`, { method: 'POST', body: { vendedor_id: id || null } }))
  const cambiarEtapa = (estado: string) => {
    if (!estado) return
    if (estado === 'perdido' && !motivo.trim()) { setFallo('Escribe el motivo de la pérdida y vuelve a elegir «Perdido».'); return }
    return ejecutar(() => api(`/pipeline/${userId}/estado`, {
      method: 'PATCH',
      body: { estado, monto_estimado: monto ? Number(monto) : null, motivo_perdida: estado === 'perdido' ? motivo.trim() : null },
    }))
  }
  const guardarMonto = () => l && ejecutar(() => api(`/pipeline/${userId}/estado`, {
    method: 'PATCH', body: { estado: l.estado, monto_estimado: monto ? Number(monto) : null },
  }))
  const agendar = (conFecha: boolean) => ejecutar(() => api(`/agenda/seguimientos/${userId}`, {
    method: 'PUT', body: conFecha ? { fecha: new Date(fecha).toISOString(), nota: nota.trim() } : { fecha: null },
  }))
  const asignarChat = (id: string) => ejecutar(() => id
    ? api<EstadoConversacion>(`/conversaciones/${conversacion.id}/asignacion`, { method: 'PUT', body: { asignado_a: id } })
    : api<EstadoConversacion>(`/conversaciones/${conversacion.id}/asignacion`, { method: 'DELETE' }))

  const nombre = nombreContacto(conversacion)

  return (
    <aside aria-label="Ficha del contacto" className="flex h-full min-h-0 flex-col bg-surface">
      <header className="flex items-start gap-3 border-b border-line px-4 py-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-soft font-bold text-primary-strong" aria-hidden>{iniciales(nombre)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{nombre}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-ink-muted">
            <CanalBadge tipo={conversacion.channel_type} size={12} />
            {conversacion.usuario_handle ?? conversacion.usuario_username ?? '—'}
          </p>
          <p className="text-xs text-ink-muted">Cliente desde {fechaCorta(conversacion.started_at)}</p>
        </div>
        <button type="button" onClick={onCerrar} className="btn-ghost size-9 px-0" aria-label="Cerrar ficha"><X size={16} /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {fallo && <p role="alert" className="m-3 rounded-xl bg-danger/10 p-3 text-sm text-danger">{fallo}</p>}

        {gerencia && (
          <Seccion titulo="Responsable del chat">
            <select aria-label="Responsable del chat" className={SELECT} disabled={ocupado} value={conversacion.asignado_a ?? ''}
              onChange={(e) => asignarChat(e.target.value)}>
              <option value="">Sin asignar (la IA atiende)</option>
              {asignables.datos?.map((a) => <option key={a.id} value={a.id}>{a.nombre || a.email}</option>)}
            </select>
            {conversacion.asignacion_nota && <p className="mt-1.5 text-xs text-ink-muted">{conversacion.asignacion_nota}</p>}
          </Seccion>
        )}

        {!crmActivo ? (
          <Seccion titulo="Embudo de ventas">
            <p className="text-sm text-ink-muted">El módulo de ventas no está activo en este negocio{gerencia ? '; puedes encenderlo desde Equipo.' : '.'}</p>
          </Seccion>
        ) : !userId ? (
          <Seccion titulo="Embudo de ventas"><p className="text-sm text-ink-muted">No se pudo identificar al contacto.</p></Seccion>
        ) : lead.cargando && !l ? (
          <div className="p-6 text-center"><Spinner /></div>
        ) : !l ? (
          <Seccion titulo="Embudo de ventas">
            {lead.error && lead.error.status !== 404
              ? <p className="text-sm text-danger">{lead.error.message}</p>
              : <>
                  <p className="mb-3 text-sm text-ink-muted">Este contacto todavía no está en el embudo.</p>
                  {negocio && <button type="button" className="btn-primary" disabled={ocupado} onClick={entrarAlEmbudo}>Agregar al embudo</button>}
                </>}
          </Seccion>
        ) : (
          <>
            <Seccion titulo="Etapa">
              <select aria-label="Etapa del embudo" className={SELECT} disabled={ocupado} value=""
                onChange={(e) => cambiarEtapa(e.target.value)}>
                <option value="">{etiquetaEtapa(l.estado)} (actual)</option>
                {l.transiciones_posibles.map((t) => <option key={t} value={t}>→ {etiquetaEtapa(t)}</option>)}
              </select>
              <label className="mt-3 block text-xs font-medium text-ink-muted" htmlFor="monto">Monto estimado (MXN)</label>
              <div className="mt-1 flex gap-2">
                <input id="monto" inputMode="decimal" type="number" min="0" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)}
                  className="min-h-10 min-w-0 flex-1 rounded-lg border border-line px-2.5 text-sm outline-none focus:border-primary" />
                <button type="button" className="btn-ghost min-h-10 px-3" disabled={ocupado} onClick={guardarMonto} aria-label="Guardar monto"><Check size={16} /></button>
              </div>
              {l.monto_estimado != null && <p className="mt-1 text-xs text-ink-muted">Actual: {dinero(l.monto_estimado)}</p>}
              {l.transiciones_posibles.includes('perdido') && (
                <input aria-label="Motivo si se pierde" placeholder="Motivo si se pierde (para «Perdido»)" value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={1000}
                  className="mt-3 min-h-10 w-full rounded-lg border border-line px-2.5 text-sm outline-none focus:border-primary" />
              )}
              {l.estado === 'perdido' && l.motivo_perdida && <p className="mt-2 text-xs text-ink-muted">Motivo: {l.motivo_perdida}</p>}
            </Seccion>

            <Seccion titulo="Vendedor">
              {negocio ? (
                <select aria-label="Vendedor asignado" className={SELECT} disabled={ocupado} value={l.vendedor_id ?? ''}
                  onChange={(e) => asignarVendedor(e.target.value)}>
                  <option value="">Sin vendedor (repartir automático)</option>
                  {vendedores.datos?.filter((v) => v.activo || v.id === l.vendedor_id).map((v) =>
                    <option key={v.id} value={v.id}>{v.nombre} · {v.clientes_activos} activos</option>)}
                </select>
              ) : (
                <p className="flex items-center gap-2 text-sm"><UserCircle size={18} aria-hidden /> {l.vendedor_nombre ?? 'Sin vendedor'}</p>
              )}
            </Seccion>

            <Seccion titulo="Próximo seguimiento">
              <input type="datetime-local" aria-label="Fecha del seguimiento" value={fecha} onChange={(e) => setFecha(e.target.value)}
                className="min-h-10 w-full rounded-lg border border-line px-2.5 text-sm outline-none focus:border-primary" />
              <input aria-label="Nota del seguimiento" placeholder="Nota (opcional)" value={nota} maxLength={500} onChange={(e) => setNota(e.target.value)}
                className="mt-2 min-h-10 w-full rounded-lg border border-line px-2.5 text-sm outline-none focus:border-primary" />
              <div className="mt-2 flex gap-2">
                <button type="button" className="btn-primary min-h-10 flex-1" disabled={ocupado || !fecha} onClick={() => agendar(true)}>
                  <CalendarCheck size={16} aria-hidden /> Agendar
                </button>
                {l.proximo_seguimiento && (
                  <button type="button" className="btn-ghost min-h-10" disabled={ocupado} onClick={() => agendar(false)}>Hecho</button>
                )}
              </div>
            </Seccion>

            <Seccion titulo="Historial">
              {historial.datos?.length ? (
                <ol className="space-y-3 border-l-2 border-line pl-4">
                  {[...historial.datos].reverse().map((h, i) => (
                    <li key={i} className="relative text-sm">
                      <span className="absolute -left-[1.4rem] top-1.5 size-2 rounded-full bg-primary" aria-hidden />
                      <p className="font-medium">
                        {h.estado_anterior && h.estado_anterior !== h.estado_nuevo ? `${etiquetaEtapa(h.estado_anterior)} → ` : ''}{etiquetaEtapa(h.estado_nuevo)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {fechaCorta(h.creado_en)} {hora(h.creado_en)}{h.vendedor_nombre ? ` · ${h.vendedor_nombre}` : ''}
                      </p>
                      {h.nota && <p className="text-xs text-ink-muted">{h.nota}</p>}
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-ink-muted">Sin movimientos todavía.</p>}
            </Seccion>
          </>
        )}
      </div>
    </aside>
  )
}
