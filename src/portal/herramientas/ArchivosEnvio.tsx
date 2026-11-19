import { FileDoc, FilePdf, Image as ImagenIcono, Paperclip, Trash, UploadSimple } from '@phosphor-icons/react'
import { useRef, useState, type FormEvent } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import type { ArchivoEnvio, ArchivosEnvioInfo } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip, Dialogo } from '../ui'

// Refleja services/adjuntos.py (el servidor valida por firma de bytes): JPG/PNG ≤ 5 MB, PDF/DOCX ≤ 16 MB.
const ACEPTA = '.jpg,.jpeg,.png,.pdf,.docx'
const MB = 1024 * 1024

const tamano = (b: number) => (b >= MB ? `${(b / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const IconoTipo = ({ a }: { a: ArchivoEnvio }) =>
  a.tipo_wa === 'image' ? <ImagenIcono size={20} aria-hidden /> : a.mime === 'application/pdf' ? <FilePdf size={20} aria-hidden /> : <FileDoc size={20} aria-hidden />

const mensaje = (e: unknown, por: string) => (e instanceof ApiError ? e.message : por)

/** Catálogo de hasta 5 archivos que el agente puede mandar por WhatsApp (el archivo, no un enlace). */
export function ArchivosEnvio({ gerencia }: { gerencia: boolean }) {
  const datos = useApi<ArchivosEnvioInfo>('/herramientas/archivos')
  const info = datos.datos
  const [subiendo, setSubiendo] = useState<{ archivo: File; descripcion: string } | null>(null)
  const [aBorrar, setABorrar] = useState<ArchivoEnvio | null>(null)
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const entrada = useRef<HTMLInputElement>(null)

  // Sin bucket configurado la función no existe para el negocio; sin plan solo se ofrece a quien gestiona.
  if (!info || !info.disponible) return null
  if (!info.incluida_en_plan && !gerencia) return null

  const lleno = info.archivos.length >= info.maximo

  const elegir = (f: File | undefined) => {
    if (!f) return
    setError(null); setAviso(null)
    setSubiendo({ archivo: f, descripcion: '' })
    if (entrada.current) entrada.current.value = ''
  }

  const subir = async (e: FormEvent) => {
    e.preventDefault()
    if (!subiendo) return
    setTrabajando(true); setError(null)
    try {
      const f = new FormData()
      f.append('archivo', subiendo.archivo)
      f.append('descripcion', subiendo.descripcion)
      await api('/herramientas/archivos', { method: 'POST', body: f })
      setSubiendo(null); setAviso('Archivo guardado. El agente ya puede enviarlo.'); datos.recargar(true)
    } catch (err) { setError(mensaje(err, 'No se pudo subir el archivo.')) }
    finally { setTrabajando(false) }
  }

  const borrar = async () => {
    if (!aBorrar) return
    setTrabajando(true); setError(null)
    try {
      await api(`/herramientas/archivos/${aBorrar.id}`, { method: 'DELETE' })
      setABorrar(null); setAviso('Archivo eliminado.'); datos.recargar(true)
    } catch (err) { setError(mensaje(err, 'No se pudo eliminar el archivo.')); setABorrar(null) }
    finally { setTrabajando(false) }
  }

  return (
    <section className="card space-y-3 p-4" aria-label="Archivos para enviar">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-strong"><Paperclip size={20} aria-hidden /></span>
          <div>
            <h2 className="font-semibold">Archivos para enviar <span className="text-sm font-normal text-ink-muted">({info.archivos.length}/{info.maximo})</span></h2>
            <p className="text-sm text-ink-muted">
              Catálogos, listas de precios o fotos que tu agente manda al cliente por WhatsApp. Le llega el archivo, no un enlace. Cada envío cuesta 1 crédito.
            </p>
          </div>
        </div>
        {gerencia && info.incluida_en_plan && (
          <>
            <input ref={entrada} type="file" accept={ACEPTA} className="hidden" onChange={(e) => elegir(e.target.files?.[0])} />
            <button type="button" className="btn-primary" disabled={lleno} title={lleno ? 'Elimina un archivo para subir otro' : undefined} onClick={() => entrada.current?.click()}>
              <UploadSimple size={16} aria-hidden /> Subir archivo
            </button>
          </>
        )}
      </div>

      {error && !subiendo && <Aviso tipo="error">{error}</Aviso>}
      {aviso && <Aviso tipo="ok">{aviso}</Aviso>}

      {!info.incluida_en_plan ? (
        <Aviso tipo="info">Enviar archivos no está incluido en tu plan. Mejora tu plan en Ajustes → Suscripción para usarlo.</Aviso>
      ) : datos.cargando && !datos.datos ? <div className="p-4 text-center"><Spinner /></div>
        : info.archivos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-center text-sm text-ink-muted">
            Aún no hay archivos. Sube JPG, PNG (hasta 5 MB), PDF o DOCX (hasta 16 MB) y explica cuándo debe enviarlos el agente.
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {info.archivos.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-ink-muted"><IconoTipo a={a} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="truncate font-medium">{a.nombre}</span><Chip>{tamano(a.bytes)}</Chip></div>
                  <p className="break-words text-sm text-ink-muted">{a.descripcion}</p>
                </div>
                {gerencia && <button type="button" className="btn-ghost size-9 px-0 hover:text-danger" onClick={() => setABorrar(a)} aria-label={`Eliminar ${a.nombre}`}><Trash size={15} aria-hidden /></button>}
              </li>
            ))}
          </ul>
        )}

      <Dialogo abierto={!!subiendo} titulo="Subir archivo" onCerrar={() => setSubiendo(null)} ocupado={trabajando}>
        {subiendo && (
          <form onSubmit={subir} className="space-y-3">
            <p className="break-all text-sm"><strong>{subiendo.archivo.name}</strong> · {tamano(subiendo.archivo.size)}</p>
            <label className="block space-y-1">
              <span className="text-sm font-medium">¿Cuándo debe enviarlo el agente?</span>
              <textarea
                className="input min-h-24 w-full" required minLength={3} maxLength={500} value={subiendo.descripcion}
                placeholder="Ej.: Cuando el cliente pida el catálogo o los precios de los servicios."
                onChange={(e) => setSubiendo({ ...subiendo, descripcion: e.target.value })}
              />
            </label>
            {error && <Aviso tipo="error">{error}</Aviso>}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" disabled={trabajando} onClick={() => setSubiendo(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={trabajando || subiendo.descripcion.trim().length < 3}>{trabajando ? 'Subiendo…' : 'Guardar'}</button>
            </div>
          </form>
        )}
      </Dialogo>

      <Dialogo abierto={!!aBorrar} titulo="Eliminar archivo" onCerrar={() => setABorrar(null)} ocupado={trabajando}>
        <p className="text-sm">¿Eliminar <strong className="break-all">{aBorrar?.nombre}</strong>? El agente dejará de poder enviarlo. Los mensajes ya enviados no cambian.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn-ghost" disabled={trabajando} onClick={() => setABorrar(null)}>Cancelar</button>
          <button type="button" className="btn-primary" disabled={trabajando} onClick={borrar}>{trabajando ? 'Eliminando…' : 'Eliminar'}</button>
        </div>
      </Dialogo>
    </section>
  )
}
