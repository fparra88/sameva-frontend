// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ConversacionItem } from '../../lib/tipos'
import { FILTROS_VACIOS, ListaConversaciones } from './ListaConversaciones'

vi.mock('../../lib/auth', () => ({ useAuth: () => ({ usuario: { role: 'owner' } }) }))

afterEach(cleanup)

const base: ConversacionItem = {
  id: 'c1', user_id: null, channel_type: 'whatsapp', status: 'transferred',
  started_at: '2026-11-27T10:00:00', last_message_at: '2026-11-27T10:05:00',
  usuario_nombre: 'Ana', usuario_handle: null, usuario_username: null,
  total_mensajes: 3, ultimo_mensaje: 'quiero hablar con alguien', minutos_restantes_ventana: 1400,
  asignado_a: null, asignado_nombre: null, numero_telefono_visible: null, tiene_varios_numeros: false,
  necesita_humano: false,
}

function pintar(conversaciones: ConversacionItem[]) {
  render(
    <MemoryRouter>
      <ListaConversaciones
        carga={{ datos: conversaciones, cargando: false, error: null, recargar: () => {} }}
        filtros={FILTROS_VACIOS} onFiltros={() => {}} leads={new Map()} hayMas={false} onMas={() => {}}
      />
    </MemoryRouter>,
  )
}

describe('indicador «Necesita atención de humano»', () => {
  it('se muestra cuando la API lo marca', () => {
    pintar([{ ...base, necesita_humano: true }])
    expect(screen.getByText('Necesita atención de humano')).toBeTruthy()
  })

  it('no sale en una transferida que ya atiende alguien', () => {
    pintar([{ ...base, necesita_humano: false, asignado_nombre: 'Luis' }])
    expect(screen.queryByText('Necesita atención de humano')).toBeNull()
  })
})
