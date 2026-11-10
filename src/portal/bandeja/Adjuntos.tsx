import { DownloadSimple, File as Archivo, FilePdf, FileDoc } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Adjunto } from '../../lib/tipos'

const MB = 1024 * 1024
/** Mismos tipos y topes que el servidor (services/adjuntos.py); él valida de nuevo por la firma del archivo. */
export const ACEPTA = '.jpg,.jpeg,.png,.pdf,.docx,image/jpeg,image/png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const IMAGEN_MAX = 5 * MB
const DOCUMENTO_MAX = 16 * MB
const EXT_IMAGEN = /\.(jpe?g|png)$/i
const EXT_DOC = /\.(pdf|docx)$/i

export const esImagen = (nombreOMime: string) => nombreOMime.startsWith('image/') || EXT_IMAGEN.test(nombreOMime)

/** null = el archivo se puede mandar; si no, el motivo en español. */
export function errorArchivo(f: File): string | null {
  const imagen = EXT_IMAGEN.test(f.name)
  if (!imagen && !EXT_DOC.test(f.name)) return 'Solo se pueden enviar imágenes JPG o PNG y documentos PDF o DOCX.'
  if (f.size === 0) return 'El archivo está vacío.'
  if (imagen && f.size > IMAGEN_MAX) return 'La imagen pesa más de 5 MB.'
  if (!imagen && f.size > DOCUMENTO_MAX) return 'El documento pesa más de 16 MB.'
  return null
}

export const tamano = (b: number) => (b >= MB ? `${(b / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

/** Descarga autenticada del adjunto (la ruta exige el token, así que no sirve un <img src> directo). */
function useBlob(conversacionId: string, a: Adjunto, activo: boolean) {
  const [url, setUrl] = useState<string | null>(null)
  const [fallo, setFallo] = useState(false)
  useEffect(() => {
    if (!activo) return
    let vivo = true
    let objeto: string | null = null
    api<Blob>(`/conversaciones/${conversacionId}/adjuntos/${a.id}`, { blob: true })
      .then((b) => { if (vivo) { objeto = URL.createObjectURL(b); setUrl(objeto) } })
      .catch(() => { if (vivo) setFallo(true) })
    return () => { vivo = false; if (objeto) URL.revokeObjectURL(objeto) }
  }, [conversacionId, a.id, activo])
  return { url, fallo }
}

/** Un adjunto dentro de una burbuja: miniatura para imágenes y botón de descarga para documentos. */
export function AdjuntoVista({ conversacionId, a }: { conversacionId: string; a: Adjunto }) {
  const imagen = esImagen(a.mime)
  const { url, fallo } = useBlob(conversacionId, a, imagen)
  const [bajando, setBajando] = useState(false)

  if (imagen) {
    if (fallo) return <p className="text-xs opacity-80">No se pudo cargar la imagen «{a.nombre}».</p>
    return url
      ? <a href={url} target="_blank" rel="noreferrer" aria-label={`Abrir imagen ${a.nombre}`}><img src={url} alt={a.nombre} className="max-h-64 max-w-full rounded-lg object-cover" /></a>
      : <div className="grid h-32 w-48 place-items-center rounded-lg bg-black/10 text-xs opacity-80">Cargando imagen…</div>
  }

  const descargar = async () => {
    setBajando(true)
    try {
      const blob = await api<Blob>(`/conversaciones/${conversacionId}/adjuntos/${a.id}`, { blob: true })
      const u = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = u; enlace.download = a.nombre
      document.body.appendChild(enlace); enlace.click(); enlace.remove()
      setTimeout(() => URL.revokeObjectURL(u), 10_000)
    } catch { /* el botón vuelve a quedar disponible para reintentar */ }
    finally { setBajando(false) }
  }
  const Icono = /\.pdf$/i.test(a.nombre) ? FilePdf : /\.docx?$/i.test(a.nombre) ? FileDoc : Archivo
  return (
    <button type="button" onClick={descargar} disabled={bajando} aria-label={`Descargar ${a.nombre}`}
      className="flex w-full min-w-48 cursor-pointer items-center gap-2 rounded-lg bg-black/10 px-3 py-2 text-left hover:bg-black/20 disabled:opacity-60">
      <Icono size={26} aria-hidden />
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{a.nombre}</span><span className="block text-[11px] opacity-80">{tamano(a.bytes)}</span></span>
      <DownloadSimple size={18} aria-hidden />
    </button>
  )
}
