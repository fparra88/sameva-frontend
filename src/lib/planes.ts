import type { Plan } from './tipos'

/** Herramientas del plan que se pintan como incluidas / no incluidas (portal y landing). */
export const HERRAMIENTAS: { columna: keyof Plan; nombre: string }[] = [
  { columna: 'agente_ia_activo', nombre: 'Agente de IA' },
  { columna: 'gestion_vendedores_activo', nombre: 'Ventas y embudo' },
  { columna: 'herramientas_activo', nombre: 'Herramientas del agente' },
  { columna: 'calendario_activo', nombre: 'Calendario de citas' },
  { columna: 'crm_campo_activo', nombre: 'CRM de campo' },
]

const num = (v: string | number) => Number(v).toLocaleString('es-MX')

/** Topes del plan en texto. Misma regla que el portal: null en proveedores/leads = no se menciona. */
export function topesPlan(p: Pick<Plan, 'max_vendedores' | 'max_proveedores' | 'max_leads_mensuales' | 'creditos_incluidos_mensual'>): string[] {
  const t = [p.max_vendedores === null ? 'Vendedores ilimitados' : `Hasta ${num(p.max_vendedores)} vendedores`]
  if (p.max_proveedores != null) t.push(`Hasta ${num(p.max_proveedores)} proveedores en la agenda`)
  t.push(`${num(p.creditos_incluidos_mensual)} créditos al mes`)
  if (p.max_leads_mensuales !== null) t.push(`${num(p.max_leads_mensuales)} leads mensuales`)
  return t
}
