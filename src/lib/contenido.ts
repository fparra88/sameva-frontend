/**
 * Contenido de la landing en un solo lugar, para editar textos y paquetes de
 * créditos sin tocar componentes. Basado en la información pública de operativai.com.mx.
 */

// TODO: confirmar el número oficial de OperativAI (este es el del sitio actual).
export const WHATSAPP_VENTAS = '5213317586975'
export const waLink = (texto: string) => `https://wa.me/${WHATSAPP_VENTAS}?text=${encodeURIComponent(texto)}`

export const UBICACION = 'Guadalajara, México · Disponible en todo el país'

// Los planes y precios ya no viven acá: salen de la base (GET /planes/publicos), que
// administra gerencia en /gerencia/planes. Ver landing/Secciones.tsx.

export const PAQUETES_CREDITOS = [
  { creditos: 100, precio: 29.99 },
  { creditos: 500, precio: 129.99 },
  { creditos: 1000, precio: 239.99 },
  { creditos: 5000, precio: 999.99 },
]

export const FAQ = [
  {
    q: '¿Qué es un crédito?',
    a: 'Cada vez que el agente usa una herramienta (cotizar, agendar, consultar inventario, registrar un lead) consume un crédito. Los créditos del plan se renuevan cada mes y no se acumulan.',
  },
  {
    q: '¿Qué pasa si me quedo sin créditos o sin leads en el mes?',
    a: 'Puedes comprar paquetes de créditos extra, que no vencen. Si llegas al tope de leads, el agente deja de registrar nuevos hasta el siguiente ciclo mensual.',
  },
  {
    q: '¿En qué canales atiende el agente?',
    a: 'WhatsApp (Business API o WhatsApp Web), Instagram Direct y Facebook Messenger. Todas las conversaciones llegan a una sola bandeja en tu portal.',
  },
  {
    q: '¿Qué tan difícil es conectarlo?',
    a: 'Conectas tus cuentas desde el portal con el inicio de sesión de Meta o escaneando un código QR. Nuestro equipo acompaña la implementación y normalmente el agente queda operando en alrededor de dos semanas.',
  },
  {
    q: '¿Puedo tomar una conversación yo mismo?',
    a: 'Sí. Desde la bandeja tomas cualquier conversación cuando quieras y la regresas a la IA cuando termines. También puedes asignarla a un vendedor.',
  },
  {
    q: '¿Puedo cambiar de plan o cancelar?',
    a: 'Cuando quieras. Subir de plan surte efecto de inmediato; bajar o cancelar aplica en el siguiente ciclo mensual. No hay plazo forzoso.',
  },
]

export const formatoMXN = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: Number.isInteger(n) ? 0 : 2 })
