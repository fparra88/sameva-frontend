import type { MotorDb } from '../../lib/tipos'

/** Textos y scripts del asistente «Conectar base de datos». Todo en un sitio para poder revisarlo con calma. */

export const MOTORES: Record<MotorDb, { nombre: string; puerto: number; descripcion: string }> = {
  postgresql: { nombre: 'PostgreSQL', puerto: 5432, descripcion: 'Supabase, Neon, Railway, AWS RDS, DigitalOcean y la mayoría de sistemas a medida.' },
  mysql: { nombre: 'MySQL / MariaDB', puerto: 3306, descripcion: 'Hostinger, cPanel, WordPress, WooCommerce, PrestaShop y muchos hostings compartidos.' },
}

export const NOMBRE_USUARIO = 'operativai_lectura'

export interface DatosScript { motor: MotorDb; base: string; esquema: string; ipSalida: string | null }

/**
 * Script que crea un usuario de SOLO LECTURA y una vista de ejemplo. La contraseña va como marcador:
 * nunca generamos ni vemos la contraseña por el cliente.
 */
export function scriptSoloLectura({ motor, base, esquema, ipSalida }: DatosScript): string {
  const b = base.trim() || 'TU_BASE'
  const host = ipSalida ?? '%'
  if (motor === 'postgresql') {
    const e = esquema.trim() || 'public'
    return `-- 1) Crea un usuario que SOLO puede leer (cambia la contraseña por una larga y única)
CREATE ROLE ${NOMBRE_USUARIO} LOGIN PASSWORD 'CAMBIA_ESTA_CONTRASEÑA';
GRANT CONNECT ON DATABASE ${b} TO ${NOMBRE_USUARIO};
GRANT USAGE ON SCHEMA ${e} TO ${NOMBRE_USUARIO};

-- 2) (Recomendado) Crea una VISTA con solo lo que el agente necesita ver.
--    Ejemplo: no incluye datos personales ni columnas internas. Adáptala a tu tabla.
CREATE VIEW ${e}.vista_agente_productos AS
  SELECT id, nombre, precio, stock
  FROM ${e}.productos
  WHERE activo = true;

-- 3) Dale permiso de lectura SOLO a esa vista
GRANT SELECT ON ${e}.vista_agente_productos TO ${NOMBRE_USUARIO};

-- Para agregar otra vista más adelante, repite los pasos 2 y 3.`
  }
  return `-- 1) Crea un usuario que SOLO puede leer (cambia la contraseña por una larga y única)
CREATE USER '${NOMBRE_USUARIO}'@'${host}' IDENTIFIED BY 'CAMBIA_ESTA_CONTRASEÑA';

-- 2) (Recomendado) Crea una VISTA con solo lo que el agente necesita ver.
--    Ejemplo: no incluye datos personales ni columnas internas. Adáptala a tu tabla.
CREATE VIEW ${b}.vista_agente_productos AS
  SELECT id, nombre, precio, stock
  FROM ${b}.productos
  WHERE activo = 1;

-- 3) Dale permiso de lectura SOLO a esa vista
GRANT SELECT ON ${b}.vista_agente_productos TO '${NOMBRE_USUARIO}'@'${host}';
FLUSH PRIVILEGES;

-- Para agregar otra vista más adelante, repite los pasos 2 y 3.`
}

/** Mensaje que un no técnico puede reenviar a quien le administra la base. */
export function mensajeParaProveedor({ motor, base, esquema, ipSalida }: DatosScript, negocio: string): string {
  return `Hola, necesito conectar la base de datos de ${negocio || 'mi negocio'} a OperativAI (un asistente de IA para atender clientes). Para eso necesito que me ayuden con lo siguiente:

1. Crear un usuario de SOLO LECTURA (que no pueda modificar ni borrar nada) en la base ${MOTORES[motor].nombre} "${base.trim() || '(nombre de la base)'}".
2. De preferencia, crear una "vista" con únicamente la información que el asistente debe consultar (por ejemplo productos, precios y existencias), sin datos personales, y darle permiso de lectura SOLO a esa vista.
3. Permitir conexiones a ese servidor desde la IP ${ipSalida ?? '(la IP que me indique OperativAI)'} y activar la conexión cifrada (SSL).
4. Enviarme por un medio seguro: la dirección del servidor, el puerto, el nombre de la base, el usuario y la contraseña.

Si prefieren, este script hace los pasos 1 y 2 (revísenlo y ajústenlo a nuestras tablas):

${scriptSoloLectura({ motor, base, esquema, ipSalida })}

Gracias.`
}

/** Pistas por código de error del backend (el mensaje ya viene en español; esto dice QUÉ HACER). */
export const PISTA_ERROR: Record<string, string> = {
  host_no_permitido: 'Usa el nombre o la IP pública de tu servidor, no una dirección interna.',
  host_no_resuelve: 'Copia la dirección tal cual te la dio tu proveedor, sin «http://» ni barras.',
  no_alcanzable: 'Lo más común: el firewall del servidor no permite nuestra IP, o el puerto es otro.',
  timeout: 'Lo más común: el firewall bloquea la conexión. Pídele a tu proveedor que permita nuestra IP.',
  credenciales: 'Si estás seguro de la contraseña, puede que el usuario solo pueda entrar desde otra IP.',
  base_no_existe: 'Revisa mayúsculas y minúsculas: en muchos servidores importan.',
  sin_permiso: 'Pídele a tu proveedor que le dé permiso de entrar y leer esa base al usuario.',
  ssl: 'Pídele a tu proveedor que active SSL. Si usa un certificado propio, elige la opción «Cifrada» (sin verificar el certificado).',
}
