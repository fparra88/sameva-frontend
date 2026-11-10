/** Espejo mínimo de los schemas de la API (operativ_server/schemas.py) que usa la Bandeja. */

export interface ConversacionItem {
  id: string
  user_id: string | null
  channel_type: string
  status: string
  started_at: string
  last_message_at: string
  usuario_nombre: string | null
  usuario_handle: string | null
  usuario_username: string | null
  total_mensajes: number
  ultimo_mensaje: string | null
  minutos_restantes_ventana: number | null
  asignado_a: string | null
  asignado_nombre: string | null
  numero_telefono_visible: string | null
  tiene_varios_numeros: boolean
}

export interface Adjunto { id: string; mime: string; nombre: string; bytes: number }

export interface Mensaje {
  id: string
  role: 'user' | 'assistant' | 'human' | string
  content: string
  created_at: string
  enviado_por: string | null
  adjuntos: Adjunto[]
}

export interface ConversacionDetalle {
  id: string
  user_id: string | null
  channel_type: string
  status: string
  started_at: string
  usuario_nombre: string | null
  usuario_handle: string | null
  usuario_username: string | null
  minutos_restantes_ventana: number | null
  minutos_restantes_ventana_humana: number | null
  asignado_a: string | null
  asignado_nombre: string | null
  asignacion_nota: string | null
  numero_telefono_visible: string | null
  mensajes: Mensaje[]
}

export interface Lead {
  id: string
  user_id: string
  cliente_nombre: string | null
  cliente_handle: string | null
  vendedor_id: string | null
  vendedor_nombre: string | null
  estado: string
  monto_estimado: string | number | null
  motivo_perdida: string | null
  actualizado_en: string
  transiciones_posibles: string[]
  proximo_seguimiento: string | null
  seguimiento_nota: string | null
}

export interface HistorialLead {
  estado_anterior: string | null
  estado_nuevo: string
  vendedor_nombre: string | null
  nota: string | null
  creado_en: string
}

export interface Vendedor { id: string; nombre: string; activo: boolean; clientes_activos: number; portal_user_id: string | null }

export interface Servicios { gestion_vendedores_activo: boolean }

export interface Asignable { id: string; nombre: string; email: string; role: string }

export interface EstadoConversacion { id: string; status: string; asignado_a: string | null }

// ---------- Agente ----------

export interface LimitesAgente {
  plan: string | null
  modelos_permitidos: string[]
  modelo_por_defecto: string | null
  historial_maximo: number
}

/** GET /agente (Instagram, Facebook y chat web comparten esta configuración). */
export interface AgenteConfig {
  agent_name: string
  system_prompt: string
  model: string | null
  temperature: number
  history_window: number
  is_active: boolean
  limites_plan: LimitesAgente | null
}

/** GET /agente/numeros/{id}. */
export interface NumeroConfig {
  id: string
  phone_number_id: string
  estado: string
  es_principal: boolean
  es_linea_avisos: boolean
  agent_name: string
  system_prompt: string
  model: string | null
  temperature: number
  history_window: number
  agente_activo: boolean
  configuracion_incompleta: boolean
  limites_plan: LimitesAgente | null
}

export type ModoConexion = 'standard' | 'coexistence'

export interface NumeroWhatsApp {
  id: string
  phone_number_id: string
  telefono_visible: string | null
  connection_mode: ModoConexion
  estado: string
  es_principal: boolean
  es_linea_avisos: boolean
  vinculado_en: string | null
  agent_name: string
  agente_activo: boolean
  configuracion_incompleta: boolean
}

export interface ListaNumeros {
  numeros: NumeroWhatsApp[]
  tope: number | null
  plazas_usadas: number
  plazas_libres: number | null
  coexistencia_permitida: boolean
  puede_elegir_avisos: boolean
}

export interface PausarNumeroOut { numero: NumeroWhatsApp; sin_numero_activo: boolean }

export interface CanalSocial {
  channel_type: string
  page_id: string | null
  ig_user_id: string | null
  is_active: boolean
  updated_at: string | null
}

export interface IniciarConnectOut { connect_url: string }

/** Plan del catálogo tal como lo ve gerencia (activos e inactivos). */
export interface PlanGerencia {
  nombre: string
  descripcion: string | null
  precio_monthly: string
  precio_annual: string | null
  max_vendedores: number | null
  max_proveedores: number | null
  max_leads_mensuales: number | null
  creditos_incluidos_mensual: string
  agente_ia_activo: boolean
  gestion_vendedores_activo: boolean
  herramientas_activo: boolean
  crm_campo_activo: boolean
  calendario_activo: boolean
  activo: boolean
  orden: number
  stripe_price_id: string | null
  modelos_permitidos: string[] | null
  historial_maximo: number | null
  max_numeros_whatsapp: number | null
  coexistencia_activa: boolean
  destacado: boolean
  herramientas_plan: string[]
}
export interface UsuarioGerencia {
  id: string; email: string; full_name: string; cargo: string; creado_en: string
  tiene_cuenta_portal: boolean; ultimo_acceso: string | null; es_yo: boolean
  es_principal: boolean; puede_administrar: boolean
}
export type EstadoTenant = 'activo' | 'prueba' | 'suspendido' | 'baja'
export interface ConsumoTenant { tokens_entrada: number; tokens_salida: number; tokens_total: number; costo_usd: string; llamadas: number }
export interface TenantGerencia {
  tenant_id: string; nombre: string; email: string | null; alta: string | null
  estado: EstadoTenant; estado_motivo: string | null; estado_actualizado_en: string | null; estado_actualizado_por: string | null
  agente_ia_activo: boolean; gestion_vendedores_activo: boolean; calendario_activo: boolean; agente_operando: boolean
  plan: string | null; estado_suscripcion: string | null; origen_suscripcion: string | null
  fecha_renovacion: string | null; precio_monthly: string | null
  creditos_disponibles: string; creditos_gastados: string
  usuarios_portal: number; vendedores_activos: number; canales_activos: number; ultimo_mensaje: string | null
  consumo: ConsumoTenant
  ingreso_periodo: string; costo_moneda: string | null; margen: string | null; tipo_cambio_fuente: string
}
export interface ListaTenantsGerencia { total: number; dias: number; moneda: string; tipo_cambio_configurado: boolean; tipo_cambio_fuente: string; items: TenantGerencia[] }
export interface ResumenGerencia {
  dias: number; tenants_total: number; tenants_activos: number; tenants_prueba: number; tenants_suspendidos: number; tenants_baja: number
  tenants_nuevos: number; tenants_con_actividad: number; tenants_en_riesgo: number
  suscripciones_activas: number; mrr: string; mensajes: number; consumo: ConsumoTenant; ingresos_periodo: string
  moneda: string; ingreso_estimado: string; costo_moneda: string | null; margen: string | null
}
export interface EliminacionTenant {
  eliminable: boolean; bloqueos: { codigo: string; mensaje: string }[]
  creditos_disponibles: string; usuarios_portal: number; conversaciones: number; transacciones: number
}
export interface EntradaAuditoria {
  id: string; actor_email: string; accion: string; tenant_id: string | null; tenant_nombre: string | null
  detalle: Record<string, unknown>; creado_en: string
}
export interface ProblemaSalud { tipo: string; severidad: 'alta' | 'media' | 'baja'; tenant_id: string | null; tenant_nombre: string | null; detalle: string; fecha: string | null; datos: Record<string, unknown> }
export interface AlertaGerencia { id: string; tipo: string; tenant_id: string | null; tenant_nombre: string | null; titulo: string; detalle: Record<string, unknown>; creada_en: string; revisada_en: string | null; revisada_por: string | null }
export interface SaludGerencia { generado_en: string; problemas: ProblemaSalud[]; alertas_abiertas: AlertaGerencia[] }
export interface ConsumoGerencia {
  desde: string; hasta: string; total: ConsumoTenant
  por_dia: { dia: string; tokens_total: number; costo_usd: string; llamadas: number }[]
  por_modelo: { modelo: string; tokens_total: number; costo_usd: string; llamadas: number }[]
}
export interface CohorteGerencia { mes: string; tamano: number; activos: number[]; retencion: number[] }
export type EstadoAccesoSoporte = 'pendiente' | 'aprobada' | 'rechazada' | 'revocada' | 'cancelada' | 'vencida' | 'terminada'
export interface SolicitudSoporte {
  id: string; gerente_email: string; motivo: string; estado: EstadoAccesoSoporte
  creada_en: string; expira_en: string; resuelta_en: string | null
  canal: 'portal' | 'correo' | null; duracion_min: number | null; concede_hasta: string | null
}
export interface InfoEnlaceSoporte { tenant_nombre: string; gerente_email: string; motivo: string; estado: EstadoAccesoSoporte; expira_en: string }
export type EstadoReporte = 'abierto' | 'en_revision' | 'resuelto'
/** Reporte de «Reportar un problema» tal como lo ve gerencia. */
export interface ReporteIncidencia {
  id: string; tenant_id: string | null; nombre_negocio: string | null; email: string
  resumen: string; descripcion: string; contexto: Record<string, unknown>
  estado: EstadoReporte; creado_en: string; atendido_por: string | null; atendido_en: string | null; tiene_adjunto: boolean
}
export interface CatalogoModelos { modelos: string[]; historial_min: number; historial_max: number }

export interface PaginaMeta { page_id: string; nombre: string; ig_user_id: string | null; ig_username: string | null; ya_conectada: boolean }
export interface ResultadoPagina { page_id: string; nombre?: string; ok: boolean; detalle?: string; canales?: string[] }

export interface EstadoConnectInstagram {
  session_id: string
  estado: 'pendiente' | 'completado' | 'fallido' | string
  resultado: string | null
  codigo: string | null
  username: string | null
}

export interface TurnoPrueba { role: 'user' | 'assistant'; content: string }

export interface ProbarAgenteOut {
  texto: string
  modelo: string
  transferida: boolean
  herramientas: { tool_key: string; parametros: Record<string, unknown> }[]
  tokens_entrada: number
  tokens_salida: number
  restantes_hoy: number
}

// ---------- Herramientas ----------

export interface Herramienta {
  tool_key: string
  tool_type: string
  display_name: string
  description: string
  is_enabled: boolean
  last_verified_at: string | null
  nombre_documento: string | null
  url_original: string | null
  /** La crea y mantiene el sistema (calendario): se pausa o edita, no se borra. */
  gestionada: boolean
}

export interface HerramientaNumero {
  tool_key: string
  tool_type: string | null
  display_name: string | null
  activa: boolean
  permitida_por_plan: boolean
}

// ---------- Agenda (calendario de citas) ----------

export type EstadoReserva = 'confirmada' | 'cancelada' | 'completada' | 'no_asistio'
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'

export interface ServiciosTenant { tenant_id: string; agente_ia_activo: boolean; calendario_activo: boolean; gestion_vendedores_activo: boolean; zona_horaria: string }

export interface Proveedor { id: string; nombre: string; color: string; activo: boolean; orden: number; portal_user_id: string | null }
export interface CupoProveedores { plan: string | null; maximo: number | null; activos: number }

export interface ServicioCita {
  id: string
  nombre: string
  duracion_minutos: number
  precio: string | number | null
  activo: boolean
  antelacion_cancelacion_horas: number | null
}

export interface Reserva {
  id: string
  proveedor_id: string
  proveedor_nombre: string
  proveedor_color: string
  servicio_id: string
  servicio_nombre: string
  hora_inicio: string
  hora_fin: string
  estado: EstadoReserva
  user_id: string | null
  cliente_nombre: string | null
  cliente_telefono: string | null
  notas: string | null
  precio_cobrado: string | number | null
  metodo_pago: MetodoPago | null
  creado_en: string
  cancelacion_tardia: boolean
  cancelada_por: 'cliente' | 'equipo' | null
  antelacion_aplicada_horas: number | null
}

export interface HorarioSemanal { id: string; proveedor_id: string; dia_semana: number; hora_inicio: string; hora_fin: string }
export interface Descanso { id: string; proveedor_id: string; dia_semana: number | null; fecha: string | null; hora_inicio: string; hora_fin: string; etiqueta: string | null }
export interface Excepcion { id: string; proveedor_id: string; fecha: string; disponible: boolean; hora_inicio: string | null; hora_fin: string | null }
export interface ReemplazarHorariosOut { horarios: HorarioSemanal[]; reservas_en_conflicto: Reserva[] }

export interface CorteDiario { fecha: string; total_servicios: number; total_cobrado: string | number; servicios: Reserva[] }

export interface AvisoCita {
  id: string
  reserva_id: string
  tipo: 'cancelacion' | 'recordatorio'
  hora_inicio: string
  estado: 'en_curso' | 'enviado' | 'omitido' | 'fallido'
  motivo: string | null
  sin_conversacion: boolean
  creado_en: string
  cerrado_en: string | null
}

export interface ReservaAuditoria {
  id: string
  reserva_id: string
  evento: 'creada' | 'reprogramada' | 'cambio_barbero' | 'cancelada' | 'completada' | 'no_asistio'
  estado_anterior: EstadoReserva | null
  estado_nuevo: EstadoReserva
  motivo: string | null
  origen: 'portal' | 'n8n' | 'sistema'
  actor: string
  creado_en?: string
  proveedor_nombre: string
  servicio_nombre: string
  cliente_nombre: string | null
}

// ---------- Ajustes (perfil, usuarios del negocio, cuenta) ----------

export type GeneroPerfil = 'femenino' | 'masculino' | 'prefiero_no_decirlo'
export type CampoPerfil = 'nombres' | 'apellido_paterno' | 'fecha_nacimiento' | 'genero'

export interface Perfil {
  nombres: string | null
  apellido_paterno: string | null
  apellido_materno: string | null
  fecha_nacimiento: string | null
  genero: GeneroPerfil | null
  empresa: string | null
  completo: boolean
  faltantes: CampoPerfil[]
  tiene_foto: boolean
  foto_version: string | null
  recordatorio_dias_restantes: number | null
}

export type RolInvitable = 'member' | 'vendedor' | 'proveedor'

export interface UsuarioEquipo {
  id: string
  email: string
  role: string
  activo: boolean
  nombre: string | null
  vendedor_nombre: string | null
  proveedor_nombre: string | null
  ultimo_acceso: string | null
  es_tu_cuenta: boolean
}

export interface Invitacion {
  id: string
  email: string
  role: RolInvitable
  vendedor_nombre: string | null
  proveedor_nombre: string | null
  creada_en: string
  expira_en: string
  vencida: boolean
}

export interface InvitacionCreada extends Invitacion { enlace: string; correo_enviado: boolean }

export interface EliminacionCuenta {
  eliminable: boolean
  bloqueos: { codigo: string; mensaje: string }[]
  pagado_hasta: string | null
  creditos_disponibles: string | number
  usuarios_portal: number
  conversaciones: number
  verificacion: 'password' | 'google'
}

// ---------- Suscripción y cobros ----------

export type EstadoPago = 'pendiente' | 'aprobado' | 'rechazado' | 'cancelado' | 'reembolsado'

export interface Plan {
  nombre: string
  descripcion: string | null
  precio_monthly: string | number
  max_vendedores: number | null
  max_proveedores: number | null
  max_leads_mensuales: number | null
  creditos_incluidos_mensual: string | number
  agente_ia_activo: boolean
  gestion_vendedores_activo: boolean
  herramientas_activo: boolean
  crm_campo_activo: boolean
  calendario_activo: boolean
  /** false = gerencia lo apagó pero este negocio aún lo tiene contratado. */
  disponible?: boolean
}

/** Plan tal como lo ve la landing (`GET /planes/publicos`, sin sesión). */
export interface PlanPublico extends Omit<Plan, 'disponible'> {
  destacado: boolean
}

export interface CatalogoPagos { planes: Plan[]; paquetes: { creditos: string | number; precio: string | number }[] }

export interface SuscripcionEstado {
  plan: string | null
  estado_suscripcion: string | null
  fecha_renovacion: string | null
  precio_monthly: string | number | null
  creditos_disponibles: string | number
  creditos_gastados: string | number
  suscripcion_recurrente: boolean
  cancela_al_vencer: boolean
  portal_disponible: boolean
}

export interface Transaccion {
  id: string
  tipo: string
  concepto: string | null
  monto: string | number
  estado_pago: EstadoPago
  metodo_pago: string | null
  ultimos_4_digitos: string | null
  creado_en: string
}

export interface CheckoutEstado { id: string; tipo: string; monto: string | number; estado: EstadoPago; fecha: string }

export interface ConnectEstado {
  conectado: boolean
  charges_habilitado: boolean
  payouts_habilitado: boolean
  detalles_enviados: boolean
  requisitos_pendientes: string[]
}

export interface CobroConnect {
  id: string
  descripcion: string
  monto: string | number
  moneda: string
  url_cobro: string | null
  estado: 'activo' | 'pagado' | 'desactivado'
  generado_por_agente: boolean
  creado_en: string
  pagado_en: string | null
}
