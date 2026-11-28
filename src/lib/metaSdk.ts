/**
 * Carga compartida del SDK de JS de Meta: Facebook/Instagram (ConectarFacebook)
 * y el Embedded Signup de WhatsApp (metaWhatsAppEmbeddedSignup) usan el mismo
 * `window.FB`, así que solo se inyecta el script una vez.
 */
export interface RespuestaLogin { authResponse?: { code?: string } | null }
export interface FbSdk {
  init: (o: object) => void
  login: (cb: (r: RespuestaLogin) => void, o: object) => void
}
declare global { interface Window { FB?: FbSdk; fbAsyncInit?: () => void } }

export const META_APP_ID = import.meta.env.VITE_META_APP_ID as string | undefined
const VERSION = 'v21.0'

let cargaSdk: Promise<FbSdk> | null = null

/** Carga el SDK de Facebook una sola vez. */
export function cargarSdk(): Promise<FbSdk> {
  if (cargaSdk) return cargaSdk
  cargaSdk = new Promise<FbSdk>((resolver, rechazar) => {
    window.fbAsyncInit = () => {
      window.FB!.init({ appId: META_APP_ID, cookie: true, xfbml: false, version: VERSION })
      resolver(window.FB!)
    }
    const s = document.createElement('script')
    s.src = 'https://connect.facebook.net/es_LA/sdk.js'
    s.async = true
    s.onerror = () => { cargaSdk = null; rechazar(new Error('No se pudo cargar Facebook. Revisa tu conexión o el bloqueador de anuncios.')) }
    document.body.appendChild(s)
  })
  return cargaSdk
}
