import { ArrowLeft } from '@phosphor-icons/react'
import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components'
import { UBICACION, waLink } from '../lib/contenido'
import { Footer } from './Secciones'

const ACTUALIZADO = '18 de noviembre de 2026'

function Pagina({ titulo, children }: { titulo: string; children: ReactNode }) {
  useEffect(() => {
    const previo = document.title
    document.title = `${titulo} · OperativAI`
    window.scrollTo(0, 0)
    return () => { document.title = previo }
  }, [titulo])

  return (
    <>
      <header className="border-b border-line py-4">
        <div className="container-page flex items-center justify-between">
          <Logo />
          <Link to="/" className="inline-flex min-h-11 items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft size={16} aria-hidden /> Volver al sitio
          </Link>
        </div>
      </header>
      <main className="container-page max-w-3xl py-12 md:py-16">
        <h1 className="text-3xl font-bold sm:text-4xl">{titulo}</h1>
        <p className="mt-2 text-sm text-ink-muted">Última actualización: {ACTUALIZADO}</p>
        <div className="mt-8 grid gap-8 leading-relaxed text-ink [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-1 [&_p+p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6">
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}

const Seccion = ({ t, children }: { t: string; children: ReactNode }) => (
  <section><h2>{t}</h2>{children}</section>
)

const Contacto = () => (
  <p>
    Para dudas, solicitudes o aclaraciones escríbenos por{' '}
    <a href={waLink('Hola, tengo una duda sobre los documentos legales de OperativAI.')} className="font-semibold text-primary hover:underline" target="_blank" rel="noreferrer">WhatsApp</a>{' '}
    o desde la opción «Reportar un problema» del portal. {UBICACION}.
  </p>
)

/* ------------------------------------------------- Términos y condiciones */

export function Terminos() {
  return (
    <Pagina titulo="Términos y condiciones">
      <p>
        Estos términos regulan el uso de OperativAI (el «Servicio»), una plataforma que ofrece agentes de inteligencia artificial para atender
        y dar seguimiento a clientes por WhatsApp, Instagram, Facebook y chat web, junto con un portal de gestión (bandeja de conversaciones,
        agenda de citas, CRM, herramientas y reportes). Al crear una cuenta o usar el Servicio aceptas estos términos. Si no estás de acuerdo,
        no lo uses.
      </p>

      <Seccion t="1. Quién puede usar el Servicio">
        <p>Debes ser mayor de edad y tener facultades para obligar al negocio que registras. Eres responsable de la veracidad de los datos de tu cuenta y de las personas a las que des acceso (usuarios, vendedores, proveedores).</p>
      </Seccion>

      <Seccion t="2. Tu cuenta">
        <ul>
          <li>Verificamos tu correo con un código. Mantén tu contraseña en secreto; todo lo hecho desde tu cuenta se considera hecho por ti.</li>
          <li>Avísanos de inmediato si sospechas un acceso no autorizado.</li>
          <li>Puedes invitar a otros usuarios con distintos roles; tú decides y respondes por sus permisos.</li>
        </ul>
      </Seccion>

      <Seccion t="3. Qué ofrece el Servicio">
        <ul>
          <li>Agente de IA que responde mensajes de tus clientes en los canales que conectes, usando la configuración e información que tú le proporciones.</li>
          <li>Bandeja unificada, con la posibilidad de tomar una conversación en cualquier momento y devolverla a la IA.</li>
          <li>Agenda de citas, avisos, CRM y seguimiento de ventas, herramientas conectadas (como Google Sheets y Docs, o una base de datos MySQL o PostgreSQL propia) y cobros mediante enlaces de pago, según el plan contratado.</li>
        </ul>
        <p>Las funciones disponibles, límites (vendedores, proveedores, créditos y llamadas de IA al mes) y precios dependen del plan vigente publicado en el sitio.</p>
      </Seccion>

      <Seccion t="4. Planes, créditos y pagos">
        <ul>
          <li>Los precios se muestran en pesos mexicanos. Los cobros se procesan con un proveedor de pagos externo (Stripe); no almacenamos los datos completos de tu tarjeta.</li>
          <li>Cada uso de una herramienta por el agente consume créditos. Los créditos del plan se renuevan cada mes y no se acumulan; los paquetes extra no vencen.</li>
          <li>Al llegar al tope de llamadas de IA de tu plan en el ciclo de facturación, el agente deja de responder en todas las conversaciones y tus clientes reciben un aviso de que un asesor se pondrá en contacto. El agente se reanuda al reiniciarse el ciclo; puedes subir de plan para continuar antes.</li>
          <li>Subir de plan surte efecto de inmediato. Bajar de plan o cancelar aplica en el siguiente ciclo mensual. No hay plazo forzoso.</li>
          <li>Salvo que la ley disponga otra cosa, los pagos realizados no son reembolsables por periodos ya iniciados ni por créditos ya consumidos.</li>
          <li>Si un pago falla o la suscripción vence, podemos limitar o suspender funciones hasta regularizarla.</li>
        </ul>
      </Seccion>

      <Seccion t="5. Canales de terceros">
        <p>
          El Servicio se conecta a plataformas de terceros (Meta: WhatsApp, Instagram y Facebook; proveedores de mensajería; Google; Stripe). Su disponibilidad
          y sus propias condiciones (por ejemplo, políticas de mensajería de WhatsApp Business) están fuera de nuestro control. Eres responsable de contar con
          las autorizaciones necesarias de esas plataformas y de cumplir sus reglas. No respondemos por suspensiones o cambios decididos por ellas.
        </p>
      </Seccion>

      <Seccion t="6. Inteligencia artificial">
        <ul>
          <li>El agente genera respuestas automáticas con modelos de IA y puede cometer errores o dar información incompleta. Debes revisar su configuración, mantener actualizada la información de tu negocio y supervisar las conversaciones.</li>
          <li>Si tu plan incluye el análisis de imágenes, documentos y audios, el agente puede leer lo que te envían tus clientes (fotos, PDF, documentos de Word y notas de voz transcritas a texto). Cada adjunto analizado consume un crédito. La interpretación de un adjunto puede ser inexacta.</li>
          <li>Eres responsable del contenido que configuras (instrucciones, precios, políticas) y de lo que el agente comunique en tu nombre dentro de ese marco.</li>
          <li>Si conectas una base de datos propia, eres responsable de los datos que expones al agente y de tener derecho a usarlos con ese fin. Te recomendamos usar un usuario de solo lectura y, de preferencia, vistas con únicamente lo necesario. El agente solo consulta las tablas, vistas y columnas que elijas, y esa información puede mostrarse a tus clientes en las conversaciones y ser procesada por nuestros proveedores de IA. Registramos tu aceptación y los permisos que detectamos en el usuario que conectaste.</li>
          <li>No uses el agente para decisiones que requieran asesoría profesional (médica, legal, financiera) sin intervención humana.</li>
        </ul>
      </Seccion>

      <Seccion t="7. Uso aceptable">
        <p>Queda prohibido usar el Servicio para:</p>
        <ul>
          <li>Enviar spam, mensajes masivos no solicitados o contactar a personas que no hayan dado su consentimiento.</li>
          <li>Contenido ilegal, engañoso, fraudulento, discriminatorio o que infrinja derechos de terceros.</li>
          <li>Intentar vulnerar la seguridad, acceder a datos de otros negocios, hacer ingeniería inversa o sobrecargar la plataforma.</li>
          <li>Revender o sublicenciar el Servicio sin autorización por escrito.</li>
        </ul>
        <p>Podemos suspender o dar de baja cuentas que incumplan estas reglas.</p>
      </Seccion>

      <Seccion t="8. Tus clientes y sus datos">
        <p>
          Respecto de los datos personales de tus clientes finales (nombre, teléfono, mensajes, citas), tú eres el responsable ante ellos y OperativAI actúa como
          encargado que los trata por tu cuenta y conforme a tus instrucciones. Debes contar con la base legal y los avisos de privacidad necesarios frente a
          tus clientes. Consulta nuestro <Link to="/avisodeprivacidad" className="font-semibold text-primary hover:underline">Aviso de privacidad</Link>.
        </p>
      </Seccion>

      <Seccion t="9. Propiedad intelectual">
        <p>
          OperativAI, su software, marca y diseño son de nuestra propiedad o de sus licenciantes. Te otorgamos una licencia limitada, revocable y no exclusiva para usar el Servicio
          mientras tu cuenta esté activa. Tú conservas la titularidad de tu contenido y nos autorizas a procesarlo únicamente para prestarte el Servicio.
        </p>
      </Seccion>

      <Seccion t="10. Soporte y acceso de nuestro equipo">
        <p>
          Para dar soporte, el personal de la plataforma puede ver tu cuenta en modo de solo lectura. Cualquier acceso de edición requiere tu aprobación expresa y temporal,
          y las acciones quedan registradas.
        </p>
      </Seccion>

      <Seccion t="11. Disponibilidad y límite de responsabilidad">
        <p>
          Trabajamos para mantener el Servicio disponible, pero se ofrece «tal cual», sin garantía de operación ininterrumpida o libre de errores. En la medida que la ley permita,
          no somos responsables por daños indirectos, pérdida de ventas, de oportunidades o de datos derivados del uso o la imposibilidad de usar el Servicio, ni por fallas de terceros.
          Nuestra responsabilidad total se limita a lo que hayas pagado por el Servicio en los 3 meses previos al hecho que la origine.
        </p>
      </Seccion>

      <Seccion t="12. Terminación">
        <p>
          Puedes cancelar tu suscripción o eliminar tu cuenta cuando quieras desde el portal. Podemos suspender o terminar el Servicio por incumplimiento de estos términos, falta de pago
          o requerimiento legal. Al eliminar la cuenta se borran tus datos conforme al Aviso de privacidad, salvo lo que debamos conservar por obligación legal.
        </p>
      </Seccion>

      <Seccion t="13. Cambios">
        <p>Podemos actualizar estos términos. Publicaremos la versión vigente en esta página con su fecha y, si el cambio es relevante, te avisaremos por correo o en el portal. Seguir usando el Servicio implica aceptar los cambios.</p>
      </Seccion>

      <Seccion t="14. Ley aplicable y jurisdicción">
        <p>Estos términos se rigen por las leyes de los Estados Unidos Mexicanos. Para su interpretación y cumplimiento, las partes se someten a los tribunales competentes de Guadalajara, Jalisco, renunciando a cualquier otro fuero.</p>
      </Seccion>

      <Seccion t="15. Contacto"><Contacto /></Seccion>
    </Pagina>
  )
}

/* ------------------------------------------- Eliminación de datos (Meta) */

export function EliminacionDatos() {
  return (
    <Pagina titulo="Eliminación de datos de usuario">
      <p>
        Esta página explica cómo solicitar la eliminación de los datos que OperativAI trata a través de Facebook, Instagram y WhatsApp (plataformas de Meta).
        Puedes pedirlo en cualquier momento, sin costo.
      </p>

      <Seccion t="1. Qué datos podemos tener sobre ti">
        <ul>
          <li>Si eres cliente de un negocio que usa OperativAI: tu nombre o identificador en el canal (número de WhatsApp, usuario de Instagram o Facebook), los mensajes y archivos que enviaste, y datos de citas o seguimiento comercial.</li>
          <li>Si eres dueño o usuario de un negocio en OperativAI: los datos de tu cuenta y los tokens de acceso de las páginas o cuentas de Meta que conectaste.</li>
        </ul>
      </Seccion>

      <Seccion t="2. Si eres cliente final de un negocio">
        <p>Envíanos tu solicitud por <a href={waLink('Hola, quiero solicitar la eliminación de mis datos personales.')} className="font-semibold text-primary hover:underline" target="_blank" rel="noreferrer">WhatsApp</a> indicando:</p>
        <ul>
          <li>Tu nombre y el canal por el que escribiste (WhatsApp, Instagram o Facebook).</li>
          <li>Tu número de teléfono o nombre de usuario en ese canal.</li>
          <li>El negocio con el que conversaste, si lo recuerdas.</li>
        </ul>
        <p>Verificaremos que la solicitud corresponde a tu cuenta y eliminaremos tus mensajes, archivos y datos asociados. También puedes pedirlo directamente al negocio con el que hablaste.</p>
      </Seccion>

      <Seccion t="3. Si conectaste Facebook, Instagram o WhatsApp a tu negocio">
        <ul>
          <li><strong>Desconectar el canal:</strong> en el portal, ve a Canales y desconecta la cuenta. Eliminamos de inmediato los tokens de acceso de Meta guardados.</li>
          <li><strong>Revocar el acceso desde Meta:</strong> en Facebook, entra a Configuración y privacidad → Configuración → Integraciones de empresa (o «Aplicaciones y sitios web»), selecciona OperativAI y elige «Eliminar». Esto retira nuestro acceso a tu cuenta.</li>
          <li><strong>Eliminar todo el negocio:</strong> desde Ajustes → Cuenta puedes eliminar tu cuenta; se borran los datos del negocio, sus conversaciones y conexiones.</li>
        </ul>
      </Seccion>

      <Seccion t="4. Qué pasa después">
        <p>
          Atendemos las solicitudes en un máximo de 20 días hábiles y te confirmamos cuando se completen. Podemos conservar únicamente lo que la ley nos obligue
          (por ejemplo, registros de pagos y de auditoría). Los mensajes que ya se encuentren en WhatsApp, Instagram o Facebook permanecen en esas plataformas y se
          eliminan según sus propias políticas.
        </p>
      </Seccion>

      <Seccion t="5. Contacto"><Contacto /></Seccion>

      <p className="text-sm text-ink-muted">
        Consulta también el <Link to="/avisodeprivacidad" className="font-semibold text-primary hover:underline">Aviso de privacidad</Link> y los{' '}
        <Link to="/terminosycondiciones" className="font-semibold text-primary hover:underline">Términos y condiciones</Link>.
      </p>
    </Pagina>
  )
}

/* -------------------------------------------------- Aviso de privacidad */

export function Privacidad() {
  return (
    <Pagina titulo="Aviso de privacidad">
      <p>
        En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, OperativAI («nosotros») informa cómo trata los datos personales
        de quienes usan el portal y de los clientes finales de los negocios que usan el Servicio.
      </p>

      <Seccion t="1. Responsable">
        <p>Fernando Ramon Parra Villanueva, con domicilio en 8 de julio 462 colonia Centro Guadalajara, Jalisco, México, es responsable del tratamiento de los datos de las personas que se registran y usan el portal. Sobre los datos de los clientes finales de cada negocio, el negocio es el responsable y OperativAI es encargado (ver sección 7).</p>
      </Seccion>

      <Seccion t="2. Datos que recabamos">
        <ul>
          <li><strong>Cuenta y negocio:</strong> nombre, correo electrónico, contraseña (almacenada cifrada con hash), nombre del negocio, foto de perfil opcional, rol y zona horaria.</li>
          <li><strong>Clientes finales de tu negocio:</strong> nombre o identificador del canal (número de WhatsApp, usuario de Instagram o Facebook), mensajes y archivos adjuntos que envían, datos de citas y de seguimiento comercial (etapa del embudo, notas, vendedor asignado).</li>
          <li><strong>Pagos:</strong> historial y estado de suscripción, créditos y cobros. Los datos de tarjeta los captura y resguarda directamente el procesador de pagos; nosotros no los almacenamos.</li>
          <li><strong>Conexiones:</strong> credenciales o tokens de acceso a los canales y herramientas que conectes (Meta, Google) y, si conectas una base de datos propia, su dirección, usuario y contraseña (esta última cifrada), guardados con medidas de seguridad.</li>
          <li><strong>Técnicos y de soporte:</strong> dirección IP, navegador y sistema, registros de acceso y de auditoría, y la información que incluyas al reportar un problema (descripción y captura opcional).</li>
        </ul>
        <p>No solicitamos datos personales sensibles. Te pedimos no compartir con el agente información sensible innecesaria, y a tus clientes tampoco.</p>
      </Seccion>

      <Seccion t="3. Finalidades">
        <p>Necesarias para el Servicio:</p>
        <ul>
          <li>Crear y verificar tu cuenta, autenticarte y mantener la seguridad.</li>
          <li>Operar el agente de IA, la bandeja, la agenda, el CRM y las herramientas conectadas.</li>
          <li>Procesar pagos, suscripciones y créditos, y emitir avisos del servicio (códigos, alertas, recordatorios de citas).</li>
          <li>Dar soporte, prevenir fraude y abusos, y cumplir obligaciones legales.</li>
        </ul>
        <p>Adicionales: mejorar el Servicio con estadísticas de uso agregadas. Puedes oponerte a estas finalidades escribiéndonos; no afecta el servicio contratado.</p>
      </Seccion>

      <Seccion t="4. Con quién compartimos los datos">
        <p>Solo con proveedores que son necesarios para prestar el Servicio y que tratan los datos bajo nuestras instrucciones:</p>
        <ul>
          <li>Meta (WhatsApp, Instagram, Facebook) y proveedores de mensajería de WhatsApp, para enviar y recibir mensajes.</li>
          <li>Proveedores de inteligencia artificial, que procesan el texto de las conversaciones para generar respuestas y, si tu plan lo incluye, las imágenes y documentos que envían tus clientes.</li>
          <li>Groq, si tu plan incluye el análisis de audios: transcribe a texto las notas de voz de tus clientes. No conservamos el audio, solo su transcripción.</li>
          <li>Stripe, para pagos y cobros.</li>
          <li>Google, si activas las herramientas de Sheets o Docs.</li>
          <li>Tu propia base de datos, si la conectas: consultamos únicamente las tablas, vistas y columnas que elijas y no creamos una copia de ella.</li>
          <li>Proveedores de infraestructura, almacenamiento y envío de correo.</li>
          <li>Autoridades, cuando exista un mandato legal.</li>
        </ul>
        <p>No vendemos tus datos ni los de tus clientes. Algunos proveedores pueden estar fuera de México; en ese caso se aplican las garantías contractuales y de seguridad correspondientes.</p>
      </Seccion>

      <Seccion t="5. Conservación">
        <p>
          Conservamos los datos mientras tu cuenta esté activa. Las conversaciones de números ocultos o desvinculados se eliminan automáticamente a los 12 meses.
          Al eliminar tu cuenta se borran los datos del negocio, salvo la información que debamos conservar por obligaciones fiscales, legales o de seguridad (por ejemplo, registros de pagos y de auditoría).
        </p>
      </Seccion>

      <Seccion t="6. Derechos ARCO">
        <p>
          Tienes derecho a Acceder a tus datos, Rectificarlos, Cancelarlos y Oponerte a su tratamiento, así como a revocar tu consentimiento o limitar su uso. Puedes corregir
          gran parte de tus datos desde Ajustes y eliminar tu cuenta desde el portal. Para cualquier otra solicitud, contáctanos por los medios indicados abajo con tu nombre, el
          correo de tu cuenta y la descripción clara de lo que solicitas; responderemos en un máximo de 20 días hábiles.
        </p>
      </Seccion>

      <Seccion t="7. Si eres un negocio que usa OperativAI">
        <p>
          Los datos de tus clientes finales son tuyos: tú decides qué canales conectas y qué se hace con ellos, y respondes ante ellos como responsable. Debes tener tu propio
          aviso de privacidad y su consentimiento para que sus mensajes sean atendidos por un agente de IA y tratados por proveedores como los descritos arriba. Nosotros los
          tratamos únicamente para prestarte el Servicio. Si un cliente final ejerce sus derechos ante ti, te apoyaremos para atenderlos.
        </p>
      </Seccion>

      <Seccion t="8. Seguridad">
        <p>
          Aplicamos medidas técnicas y administrativas razonables: contraseñas con hash, sesiones con cookies protegidas, control de acceso por roles, separación de datos entre negocios,
          cifrado en tránsito y registros de auditoría. Ningún sistema es infalible; si ocurre una vulneración que afecte tus derechos, te lo notificaremos.
        </p>
      </Seccion>

      <Seccion t="9. Cookies y almacenamiento local">
        <p>Usamos una cookie de sesión estrictamente necesaria para mantenerte autenticado y almacenamiento local del navegador para preferencias como el tema claro u oscuro. No usamos cookies publicitarias.</p>
      </Seccion>

      <Seccion t="10. Cambios a este aviso">
        <p>Publicaremos cualquier modificación en esta página con su fecha de actualización y, si es relevante, te avisaremos por correo o en el portal.</p>
      </Seccion>

      <Seccion t="11. Contacto"><Contacto /></Seccion>

      <p className="text-sm text-ink-muted">
        Consulta también los <Link to="/terminosycondiciones" className="font-semibold text-primary hover:underline">Términos y condiciones</Link>.
      </p>
    </Pagina>
  )
}
