/**
 * WhatsApp Embedded Signup de Meta: a diferencia de Facebook/Instagram (que pide
 * permisos por scope o config_id de Login for Business), este flujo entrega el
 * waba_id/phone_number_id elegidos por un evento `message` del propio SDK
 * (WA_EMBEDDED_SIGNUP), no por el `code` de FB.login.
 */
import { cargarSdk } from './metaSdk'

const WA_CONFIG_ID = import.meta.env.VITE_META_WA_CONFIG_ID as string | undefined
export const META_WA_CONFIG_ID = WA_CONFIG_ID

/** Si el negocio deja la ventana abierta, no dejamos la promesa colgada para siempre. */
const TIMEOUT_MS = 5 * 60 * 1000

export interface ResultadoEmbeddedSignup { wabaId: string; phoneNumberId: string }

/**
 * Abre el Embedded Signup y espera el evento WA_EMBEDDED_SIGNUP con el
 * waba_id/phone_number_id elegidos. Resuelve null si el negocio canceló.
 */
export async function conectarWhatsAppEmbeddedSignup(): Promise<ResultadoEmbeddedSignup | null> {
  if (!WA_CONFIG_ID) throw new Error('Falta VITE_META_WA_CONFIG_ID en la configuración del portal')

  const fb = await cargarSdk()

  return new Promise<ResultadoEmbeddedSignup | null>((resolve, reject) => {
    let terminado = false

    const limpiar = () => {
      terminado = true
      window.removeEventListener('message', alRecibirMensaje)
      clearTimeout(temporizador)
    }

    function alRecibirMensaje(evento: MessageEvent) {
      if (terminado) return
      // El SDK manda este evento desde facebook.com, nunca desde nuestro origen.
      if (evento.origin !== 'https://www.facebook.com' && evento.origin !== 'https://web.facebook.com') return

      let datos: unknown
      try { datos = typeof evento.data === 'string' ? JSON.parse(evento.data) : evento.data }
      catch { return }
      if (!datos || typeof datos !== 'object') return

      const mensaje = datos as { type?: string; event?: string; data?: Record<string, unknown> }
      if (mensaje.type !== 'WA_EMBEDDED_SIGNUP') return

      if (mensaje.event === 'CANCEL') { limpiar(); resolve(null); return }

      // No se distingue por nombre de evento (Meta agrega variantes como
      // FINISH_ONLY_WABA): basta con que traiga los dos ids que necesitamos.
      const wabaId = mensaje.data?.waba_id
      const phoneNumberId = mensaje.data?.phone_number_id
      if (typeof wabaId === 'string' && typeof phoneNumberId === 'string') {
        limpiar()
        resolve({ wabaId, phoneNumberId })
      }
    }

    window.addEventListener('message', alRecibirMensaje)

    const temporizador = setTimeout(() => {
      limpiar()
      reject(new Error('La conexión con WhatsApp tardó demasiado. Intenta de nuevo.'))
    }, TIMEOUT_MS)

    fb.login(
      () => {
        // La respuesta real llega por el evento `message` de arriba; este
        // callback del SDK solo confirma que el diálogo se cerró.
      },
      {
        config_id: WA_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: 'whatsapp_business_app_onboarding',
          sessionInfoVersion: '2',
        },
      },
    )
  })
}
