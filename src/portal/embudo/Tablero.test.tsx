// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LeadEmbudo } from '../../lib/tipos'
import { Tablero } from './Tablero'

afterEach(cleanup)

const lead = (over: Partial<LeadEmbudo>) => ({
  user_id: 'u1', estado: 'nuevo', transiciones_posibles: ['contactado', 'perdido'],
  cliente_nombre: 'Ana López', cliente_username: null, cliente_handle: null, vendedor_id: null, vendedor_nombre: null,
  monto_estimado: null, proximo_seguimiento: null, seguimiento_nota: null, motivo_perdida: null, etapa_desde: null,
  canal: null, ultimo_mensaje: null, ultimo_mensaje_rol: null, ultimo_mensaje_en: null,
  ...over,
}) as LeadEmbudo

const dataTransfer = () => ({ setData: vi.fn(), effectAllowed: '', dropEffect: '' })
const columna = (nombre: RegExp) => screen.getByRole('listitem', { name: nombre })

function montar(leads: LeadEmbudo[], extra: Partial<Parameters<typeof Tablero>[0]> = {}) {
  const props = { leads, resumen: [], filtrado: false, moviendo: null, onAbrir: vi.fn(), onMover: vi.fn(), ...extra }
  render(<Tablero {...props} />)
  return props
}

describe('Tablero', () => {
  it('pinta una columna por etapa con su total', () => {
    montar([lead({})], { resumen: [{ estado: 'nuevo', total: 12, monto: 0, sin_vendedor: 0, seguimientos_vencidos: 0 }] })
    expect(screen.getAllByRole('listitem')).toHaveLength(7)
    expect(columna(/^Nuevo: 12$/)).toBeTruthy()
    expect(screen.getByText('Últimos 1 de 12')).toBeTruthy()
  })

  it('con filtros, los totales salen de lo visible', () => {
    montar([lead({})], { filtrado: true, resumen: [{ estado: 'nuevo', total: 12, monto: 0, sin_vendedor: 0, seguimientos_vencidos: 0 }] })
    expect(columna(/^Nuevo: 1$/)).toBeTruthy()
  })

  it('solo deja soltar en etapas permitidas por transiciones_posibles', () => {
    const { onMover } = montar([lead({})])
    fireEvent.dragStart(screen.getByRole('button', { name: /Ana López/ }), { dataTransfer: dataTransfer() })

    fireEvent.drop(columna(/^Cotizado/), { dataTransfer: dataTransfer() })
    expect(onMover).not.toHaveBeenCalled()

    fireEvent.dragStart(screen.getByRole('button', { name: /Ana López/ }), { dataTransfer: dataTransfer() })
    fireEvent.drop(columna(/^Contactado/), { dataTransfer: dataTransfer() })
    expect(onMover).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u1' }), 'contactado')
  })

  it('sin transiciones no es arrastrable; Enter abre la ficha', () => {
    const { onAbrir } = montar([lead({ estado: 'ganado', transiciones_posibles: [] })])
    const tarjeta = screen.getByRole('button', { name: /Ana López/ })
    expect(tarjeta.getAttribute('draggable')).toBe('false')
    fireEvent.keyDown(tarjeta, { key: 'Enter' })
    expect(onAbrir).toHaveBeenCalledOnce()
  })
})
