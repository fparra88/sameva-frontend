import { useEffect, useState } from 'react'
import { api } from './api'

/** Topes que la API aplica (PERFIL_FOTO_MAX_PX / PERFIL_FOTO_MAX_BYTES por defecto). */
export const FOTO_MAX_PX = 642
export const FOTO_MAX_BYTES = 2 * 1024 * 1024
export const ACCEPT_FOTO = 'image/jpeg,image/png'

export class FotoInvalida extends Error {}

/** Valida y reduce la foto en el navegador para que quepa en los topes del servidor. */
export async function prepararFoto(archivo: File): Promise<File> {
  if (!['image/jpeg', 'image/png'].includes(archivo.type)) throw new FotoInvalida('La foto debe ser JPG o PNG.')
  const bmp = await createImageBitmap(archivo).catch(() => { throw new FotoInvalida('No se pudo leer esa imagen.') })
  const escala = Math.min(1, FOTO_MAX_PX / Math.max(bmp.width, bmp.height))
  if (escala === 1 && archivo.size <= FOTO_MAX_BYTES) { bmp.close(); return archivo }
  const lienzo = document.createElement('canvas')
  lienzo.width = Math.round(bmp.width * escala); lienzo.height = Math.round(bmp.height * escala)
  lienzo.getContext('2d')!.drawImage(bmp, 0, 0, lienzo.width, lienzo.height)
  bmp.close()
  // Siempre JPEG al reducir: pesa mucho menos que PNG y cabe en el tope.
  const blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, 'image/jpeg', 0.88))
  if (!blob || blob.size > FOTO_MAX_BYTES) throw new FotoInvalida('La foto pesa demasiado. Prueba con otra más pequeña.')
  return new File([blob], 'perfil.jpg', { type: 'image/jpeg' })
}

/** Foto propia como URL de objeto (la API pide token, no se puede usar un <img src> directo). */
export function useFotoPerfil(version: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!version) { setUrl(null); return }
    let creada: string | null = null
    let cancelado = false
    api<Blob>('/perfil/foto', { blob: true })
      .then((b) => { if (cancelado) return; creada = URL.createObjectURL(b); setUrl(creada) })
      .catch(() => { if (!cancelado) setUrl(null) })
    return () => { cancelado = true; if (creada) URL.revokeObjectURL(creada) }
  }, [version])
  return url
}

export function iniciales(nombres?: string | null, apellido?: string | null, correo?: string | null): string {
  const a = (nombres?.trim()[0] ?? '') + (apellido?.trim()[0] ?? '')
  return (a || correo?.trim()[0] || '?').toUpperCase()
}
