import { useAuth } from '../../lib/auth'
import type { ServiciosTenant } from '../../lib/tipos'
import { useApi, type Carga } from '../../lib/useApi'

export interface Calendario {
  tenantId: string | null
  servicios: Carga<ServiciosTenant>
  /** null mientras no se sabe; false = módulo apagado. */
  activo: boolean | null
  /** Prefijo de las rutas del módulo; null si todavía no se puede pedir. */
  base: string | null
}

/** Estado del módulo de calendarios del negocio y prefijo de sus rutas. */
export function useCalendario(): Calendario {
  const { usuario } = useAuth()
  const tenantId = usuario?.tenant_id ?? null
  const servicios = useApi<ServiciosTenant>(tenantId ? `/tenants/${tenantId}/servicios` : null)
  const activo = servicios.datos ? servicios.datos.calendario_activo : null
  return { tenantId, servicios, activo, base: activo && tenantId ? `/tenants/${tenantId}/calendario` : null }
}
