import { ArrowSquareOut, ChatCircleDots } from '@phosphor-icons/react'
import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { infoCanal } from '../../components'
import { fechaCorta, hace } from '../../lib/formato'
import type { LeadEmbudo } from '../../lib/tipos'
import { FichaCrm, type ContactoFicha } from '../bandeja/FichaCrm'
import { Chip, Portal } from '../ui'
import { autorMensaje, diasEnEtapa, esperaRespuesta } from './etapas'

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{etiqueta}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

/**
 * Panel lateral de un lead: arriba lo que se sabe por su chat, debajo la misma ficha CRM de la Bandeja
 * (etapa, monto, vendedor, seguimiento, historial), editable sin salir del tablero.
 */
export function FichaLead({ lead, tenantId, onCambio, onCerrar }: {
  lead: LeadEmbudo
  tenantId: string | null
  onCambio: () => void
  onCerrar: () => void
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onCerrar])

  const contacto: ContactoFicha = {
    id: lead.conversation_id,
    user_id: lead.user_id,
    channel_type: lead.canal ?? '',
    started_at: lead.cliente_desde ?? lead.alta_en ?? lead.actualizado_en,
    usuario_nombre: lead.cliente_nombre,
    usuario_handle: lead.cliente_handle,
    usuario_username: lead.cliente_username,
    asignado_a: lead.chat_asignado_a,
    asignacion_nota: null,
  }
  const dias = diasEnEtapa(lead)

  return (
    <Portal>
      <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Ficha de la conversación">
        <button type="button" aria-label="Cerrar ficha" className="absolute inset-0 cursor-default bg-black/40" onClick={onCerrar} />
        <div className="rise absolute inset-y-0 right-0 w-full max-w-md border-l border-line bg-surface shadow-2xl">
          <FichaCrm key={lead.user_id} conversacion={contacto} tenantId={tenantId} crmActivo onCambio={onCambio} onCerrar={onCerrar}>
            <section className="border-b border-line px-4 py-4">
              <h3 className="mb-2.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">Conversación</h3>
              {lead.conversation_id ? (
                <>
                  {lead.ultimo_mensaje && (
                    <div className="mb-3 rounded-xl bg-muted/70 p-3">
                      <p className="mb-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                        <ChatCircleDots size={14} aria-hidden />
                        {autorMensaje(lead.ultimo_mensaje_rol)}{lead.ultimo_mensaje_en ? ` · hace ${hace(lead.ultimo_mensaje_en)}` : ''}
                        {esperaRespuesta(lead) && <Chip tono="aviso">Espera respuesta</Chip>}
                      </p>
                      <p className="line-clamp-3 break-words text-sm">{lead.ultimo_mensaje}</p>
                    </div>
                  )}
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Dato etiqueta="Canal">{infoCanal(lead.canal ?? '').nombre}</Dato>
                    <Dato etiqueta="Mensajes">{lead.total_mensajes} <span className="font-normal text-ink-muted">({lead.mensajes_cliente} del cliente)</span></Dato>
                    <Dato etiqueta="Atiende el chat">{lead.chat_estado === 'transferred' ? (lead.chat_asignado_nombre ?? 'Una persona') : 'La IA'}</Dato>
                    <Dato etiqueta="En esta etapa">{dias === null ? '—' : dias === 0 ? 'Desde hoy' : `${dias} d`}</Dato>
                    <Dato etiqueta="Entró al embudo">{lead.alta_en ? fechaCorta(lead.alta_en) : '—'}</Dato>
                    <Dato etiqueta="Último movimiento">{fechaCorta(lead.actualizado_en)}</Dato>
                  </dl>
                  <Link to={`/portal/bandeja/${lead.conversation_id}`} className="btn-ghost mt-4 w-full">
                    <ArrowSquareOut size={16} aria-hidden /> Abrir conversación
                  </Link>
                </>
              ) : (
                <p className="text-sm text-ink-muted">Esta conversación se agregó a mano y todavía no tiene una conversación.</p>
              )}
            </section>
          </FichaCrm>
        </div>
      </div>
    </Portal>
  )
}
