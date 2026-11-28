import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  aInputLocal, aIso, aMinutos, deMinutos, etiquetaEtapa, fechaLocal, hace, iniciales, minutosDelDia, nombreContacto, sumarDias,
} from './formato'
import { esDeNegocio, esGerencia, esProveedor, esVendedor } from './roles'
import type { UsuarioOut } from './api'

afterEach(() => { vi.useRealTimers() })

describe('roles (espejo de deps.py)', () => {
  const u = (role: string) => ({ role }) as UsuarioOut
  it.each([
    ['owner', true, true], ['superadmin', true, true], ['member', false, true], ['vendedor', false, false], ['proveedor', false, false],
  ])('%s: gerencia=%s, negocio=%s', (role, gerencia, negocio) => {
    expect(esGerencia(u(role))).toBe(gerencia)
    expect(esDeNegocio(u(role))).toBe(negocio)
  })
  it('vendedor/proveedor y sin sesión', () => {
    expect(esVendedor(u('vendedor'))).toBe(true)
    expect(esProveedor(u('proveedor'))).toBe(true)
    expect(esGerencia(null)).toBe(false)
    expect(esDeNegocio(null)).toBe(false)
  })
})

describe('textos', () => {
  it('nombreContacto: nombre > username > handle > "Sin nombre"', () => {
    expect(nombreContacto({ usuario_nombre: 'Ana', usuario_username: 'ana_', usuario_handle: '+52' })).toBe('Ana')
    expect(nombreContacto({ usuario_nombre: null, usuario_username: 'ana_', usuario_handle: '+52' })).toBe('ana_')
    expect(nombreContacto({ usuario_nombre: null, usuario_handle: '+52' })).toBe('+52')
    expect(nombreContacto({ usuario_nombre: null, usuario_handle: null })).toBe('Sin nombre')
  })
  it('iniciales', () => {
    expect(iniciales('ana maría lópez')).toBe('AM')
    expect(iniciales('  Luis ')).toBe('L')
    expect(iniciales('')).toBe('?')
  })
  it('etiquetaEtapa', () => {
    expect(etiquetaEtapa('en_seguimiento')).toBe('En seguimiento')
  })
})

describe('hace()', () => {
  it.each([
    [0, 'ahora'], [5, '5 min'], [59, '59 min'], [90, '2 h'], [60 * 24 * 3, '3 d'], [-10, 'ahora'],
  ])('%i min → %s', (min, esperado) => {
    vi.useFakeTimers({ now: new Date('2026-06-01T12:00:00Z') })
    expect(hace(new Date(Date.now() - min * 60000).toISOString())).toBe(esperado)
  })
})

describe('fechas del calendario', () => {
  it('sumarDias cruza meses, años bisiestos y valores negativos', () => {
    expect(sumarDias('2026-01-31', 1)).toBe('2026-02-01')
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29')
    expect(sumarDias('2026-01-01', -1)).toBe('2025-12-31')
  })
  it('fechaLocal rellena con ceros', () => {
    expect(fechaLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
  it('aMinutos / deMinutos', () => {
    expect(aMinutos('09:30:00')).toBe(570)
    expect(aMinutos('00:00')).toBe(0)
    expect(deMinutos(570)).toBe('09:30')
    expect(deMinutos(aMinutos('23:59'))).toBe('23:59')
  })
  it('aIso y minutosDelDia son inversos en la zona del navegador', () => {
    const iso = aIso('2026-03-10', '14:45')
    expect(iso).toMatch(/Z$/)
    expect(minutosDelDia(iso)).toBe(14 * 60 + 45)
    expect(aInputLocal(iso)).toBe('2026-03-10T14:45')
  })
  it('aInputLocal vacío', () => {
    expect(aInputLocal(null)).toBe('')
  })
})
