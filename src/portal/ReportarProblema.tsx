import { Bug, ImageSquare, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { tamano } from './bandeja/Adjuntos'
import { Aviso, Dialogo } from './ui'

const MB = 1024 * 1024
const CAPTURA_MAX = 5 * MB
const RESUMEN = { min: 5, max: 120 }
const DESCRIPCION = { min: 10, max: 4000 }

/** Navegador y sistema operativo a partir del user agent (solo para depurar; el servidor guarda el texto crudo también). */
function plataforma(): { navegador: string; sistema_operativo: string } {
  const ua = navigator.userAgent
  const navegador = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Otro'
  const so = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Otro'
  return { navegador, sistema_operativo: so }
}

/** Lo que el navegador sabe y ayuda a reproducir el problema. Sin query ni hash: pueden traer tokens. */
function contexto(ruta: string) {
  return JSON.stringify({
    ruta, ...plataforma(), user_agent: navigator.userAgent, idioma: navigator.language,
    zona_horaria: Intl.DateTimeFormat().resolvedOptions().timeZone,
    pantalla: { ancho: window.screen.width, alto: window.screen.height },
    ventana: { ancho: window.innerWidth, alto: window.innerHeight },
  })
}

function errorCaptura(f: File): string | null {
  if (!/\.(png|jpe?g)$/i.test(f.name) && !/^image\/(png|jpeg)$/.test(f.type)) return 'La captura tiene que ser una imagen PNG o JPG.'
  if (f.size === 0) return 'La imagen está vacía.'
  if (f.size > CAPTURA_MAX) return 'La imagen pesa más de 5 MB.'
  return null
}

/**
 * Acceso permanente a «Reportar un problema»: un icono tenue al final del dock que abre el formulario.
 * Cualquier rol puede reportar (el servidor no lo condiciona al plan); en "ver como" no se ofrece porque saldría con
 * la identidad del cliente.
 */
export function ReportarProblema() {
  const { usuario } = useAuth()
  const { pathname } = useLocation()
  const [abierto, setAbierto] = useState(false)
  const [resumen, setResumen] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [captura, setCaptura] = useState<File | null>(null)
  const [vista, setVista] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)
  const selector = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!captura) { setVista(null); return }
    const u = URL.createObjectURL(captura)
    setVista(u)
    return () => URL.revokeObjectURL(u)
  }, [captura])

  if (usuario?.impersonado_por) return null

  const abrir = () => { setError(null); setEnviado(false); setAbierto(true) }
  const cerrar = () => {
    if (enviando) return
    setAbierto(false)
    // Si ya se envió, el formulario queda limpio para el próximo; si no, se conserva lo escrito.
    if (enviado) { setResumen(''); setDescripcion(''); setCaptura(null) }
  }
  const elegir = (f: File | null | undefined) => {
    if (!f) return
    const motivo = errorCaptura(f)
    if (motivo) { setError(motivo); return }
    setError(null); setCaptura(f)
  }

  const valido = resumen.trim().length >= RESUMEN.min && descripcion.trim().length >= DESCRIPCION.min
  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!valido || enviando) return
    setError(null); setEnviando(true)
    try {
      const datos = new FormData()
      datos.append('resumen', resumen.trim())
      datos.append('descripcion', descripcion.trim())
      datos.append('contexto', contexto(pathname))
      if (captura) datos.append('adjunto', captura)
      await api('/incidencias', { method: 'POST', body: datos })
      setEnviado(true)
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo enviar el reporte. Inténtalo de nuevo.') }
    finally { setEnviando(false) }
  }

  return (
    <>
      <button type="button" onClick={abrir} aria-label="Reportar un problema" title="Reportar un problema"
        className="group flex size-9 sm:size-11 cursor-pointer items-center justify-center gap-2 rounded-full text-ink-muted/60 transition hover:bg-muted hover:text-ink focus-visible:text-ink lg:hover:w-auto lg:hover:px-3 lg:focus-visible:w-auto lg:focus-visible:px-3">
        <Bug size={20} aria-hidden />
        <span className="hidden text-xs font-semibold lg:group-hover:inline lg:group-focus-visible:inline">Reportar un problema</span>
      </button>

      <Dialogo abierto={abierto} titulo="Reportar un problema" onCerrar={cerrar} ocupado={enviando}>
        {enviado ? (
          <div className="mt-3 space-y-4">
            <Aviso tipo="ok">Gracias, recibimos tu reporte. El equipo lo revisará y, si hace falta, te escribirá al correo de tu cuenta.</Aviso>
            <div className="flex justify-end"><button type="button" className="btn-primary" onClick={cerrar}>Cerrar</button></div>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-3 space-y-4">
            <p className="text-sm text-ink-muted">Cuéntanos qué pasó. Con tu reporte enviamos tu correo, la pantalla en la que estás y datos de tu navegador, para poder reproducirlo.</p>
            {error && <Aviso tipo="error">{error}</Aviso>}
            <div>
              <label htmlFor="rp-resumen" className="field-label">Resumen</label>
              <input id="rp-resumen" className="field" value={resumen} onChange={(e) => setResumen(e.target.value)} maxLength={RESUMEN.max} required placeholder="Ej. No puedo enviar un mensaje desde la bandeja" autoFocus />
            </div>
            <div>
              <label htmlFor="rp-desc" className="field-label">¿Qué ocurrió?</label>
              <textarea id="rp-desc" className="field min-h-32" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={DESCRIPCION.max} required
                onPaste={(e) => { const f = [...e.clipboardData.files][0]; if (f) { e.preventDefault(); elegir(f) } }}
                placeholder="Qué estabas haciendo, qué esperabas y qué pasó en su lugar." />
              <p className="mt-1 text-right text-xs text-ink-muted">{descripcion.length}/{DESCRIPCION.max}</p>
            </div>
            <div>
              <span className="field-label">Captura de pantalla <span className="font-normal text-ink-muted">(opcional)</span></span>
              <input ref={selector} type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { elegir(e.target.files?.[0]); e.target.value = '' }} />
              {captura ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-muted/50 p-2">
                  {vista && <img src={vista} alt="" className="size-14 rounded-lg object-cover" />}
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{captura.name}</span><span className="block text-xs text-ink-muted">{tamano(captura.size)}</span></span>
                  <button type="button" onClick={() => setCaptura(null)} disabled={enviando} aria-label="Quitar captura" className="btn-ghost size-9 px-0"><X size={16} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => selector.current?.click()} className="btn-ghost"><ImageSquare size={16} aria-hidden /> Adjuntar imagen (PNG o JPG, hasta 5 MB)</button>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={cerrar} disabled={enviando}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={!valido || enviando}>{enviando ? 'Enviando…' : 'Enviar reporte'}</button>
            </div>
          </form>
        )}
      </Dialogo>
    </>
  )
}
