import { describe, expect, it } from 'vitest'
import { destinoAlerta } from './alertas'
import { topesPlan } from './planes'

describe('destinoAlerta()', () => {
  it('alertas de conversación abren esa conversación (conversation_id o conversacion_id)', () => {
    expect(destinoAlerta({ tipo: 'nuevo_lead', datos: { conversation_id: 'c1' } })).toBe('/portal/bandeja/c1')
    expect(destinoAlerta({ tipo: 'conversacion_transferida', datos: { conversacion_id: 'c2' } })).toBe('/portal/bandeja/c2')
    expect(destinoAlerta({ tipo: 'cambio_etapa', datos: null })).toBe('/portal/bandeja')
  })
  it.each([
    ['reserva_creada', '/portal/agenda'],
    ['numeros_pausados', '/portal/canales'],
    ['numero_configuracion_incompleta', '/portal/agente'],
    ['perfil_incompleto', '/portal/cuenta'],
    ['solicitud_escritura', '/portal/cuenta?vista=soporte'],
    ['limite_llamadas_ia', '/portal/cuenta?vista=suscripcion'],
    ['cuota_excedida', '/portal/cuenta?vista=suscripcion'],
    ['tipo_desconocido', null],
  ])('%s → %s', (tipo, destino) => {
    expect(destinoAlerta({ tipo, datos: {} })).toBe(destino)
  })
})

describe('topesPlan()', () => {
  const base = { max_vendedores: 3, max_proveedores: null, max_leads_mensuales: null, creditos_incluidos_mensual: 1500 }
  it('sin tope de proveedores ni de llamadas de IA no los menciona', () => {
    expect(topesPlan(base)).toEqual(['Hasta 3 vendedores', '1,500 créditos al mes'])
  })
  it('0 llamadas de IA = sin tope', () => {
    expect(topesPlan({ ...base, max_leads_mensuales: 0 })).toHaveLength(2)
  })
  it('con todos los topes', () => {
    expect(topesPlan({ max_vendedores: null, max_proveedores: 2, max_leads_mensuales: 5000, creditos_incluidos_mensual: 100 })).toEqual([
      'Vendedores ilimitados', 'Hasta 2 proveedores en la agenda', '100 créditos al mes', '5,000 llamadas de IA al mes',
    ])
  })
})
