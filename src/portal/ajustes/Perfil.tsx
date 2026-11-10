import { Camera, Moon, Sun, Trash } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { ACCEPT_FOTO, FOTO_MAX_PX, FotoInvalida, iniciales, prepararFoto, useFotoPerfil } from '../../lib/foto'
import { guardarTema, useTema } from '../../lib/tema'
import type { CampoPerfil, GeneroPerfil, Perfil as PerfilT } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso } from '../ui'

const GENEROS: { valor: GeneroPerfil; etiqueta: string }[] = [
  { valor: 'femenino', etiqueta: 'Femenino' },
  { valor: 'masculino', etiqueta: 'Masculino' },
  { valor: 'prefiero_no_decirlo', etiqueta: 'Prefiero no decirlo' },
]
const ETIQUETA_CAMPO: Record<CampoPerfil, string> = {
  nombres: 'nombre(s)', apellido_paterno: 'apellido paterno', fecha_nacimiento: 'fecha de nacimiento', genero: 'género',
}

// Mismas reglas que schemas.PerfilIn en el backend, que es quien decide.
const PATRON_NOMBRE = /^[\p{L}](?:[\p{L}]|[ '’\-.])*$/u
const EDAD_MINIMA = 18

/** Fecha más reciente que cumple la edad mínima hoy, como YYYY-MM-DD. */
function fechaMaxima(): string {
  const h = new Date()
  const l = new Date(h.getFullYear() - EDAD_MINIMA, h.getMonth(), h.getDate())
  return `${l.getFullYear()}-${String(l.getMonth() + 1).padStart(2, '0')}-${String(l.getDate()).padStart(2, '0')}`
}
/** Vacío no es error (se puede guardar a medias); lo que haya tiene que ser un nombre. */
function errorNombre(v: string): string | null {
  const t = v.trim()
  if (!t) return null
  if (t.length > 100) return 'Máximo 100 caracteres'
  return PATRON_NOMBRE.test(t) ? null : 'Solo letras, espacios, guion, apóstrofo o punto'
}
const nulo = (v: string) => v.trim() || null

function Campo({ id, etiqueta, error, hint, children }: { id: string; etiqueta: string; error?: string | null; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{etiqueta}{hint && <span className="ml-1.5 font-normal text-ink-muted">· {hint}</span>}</label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

/** Foto, datos personales y apariencia. Nada del perfil es obligatorio para usar el portal. */
export function Perfil() {
  const { usuario, recargarUsuario } = useAuth()
  const perfil = useApi<PerfilT>('/perfil')
  const tema = useTema()
  const fotoUrl = useFotoPerfil(perfil.datos?.foto_version)

  const [nombres, setNombres] = useState('')
  const [paterno, setPaterno] = useState('')
  const [materno, setMaterno] = useState('')
  const [nacimiento, setNacimiento] = useState('')
  const [genero, setGenero] = useState<GeneroPerfil | ''>('')
  const [empresa, setEmpresa] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [errorFoto, setErrorFoto] = useState<string | null>(null)
  const inputFoto = useRef<HTMLInputElement>(null)
  const p = perfil.datos

  // Al llegar el perfil, el formulario parte de lo guardado.
  useEffect(() => {
    if (!p) return
    setNombres(p.nombres ?? ''); setPaterno(p.apellido_paterno ?? ''); setMaterno(p.apellido_materno ?? '')
    setNacimiento(p.fecha_nacimiento ?? ''); setGenero(p.genero ?? ''); setEmpresa(p.empresa ?? '')
  }, [p])

  const errores = {
    nombres: errorNombre(nombres), paterno: errorNombre(paterno), materno: errorNombre(materno),
    nacimiento: nacimiento && nacimiento > fechaMaxima() ? `Debes tener al menos ${EDAD_MINIMA} años` : null,
    empresa: empresa.trim().length > 255 ? 'Máximo 255 caracteres' : null,
  }
  const hayErrores = Object.values(errores).some(Boolean)

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (hayErrores) return
    setGuardando(true); setError(null); setAviso(null)
    try {
      const g = await api<PerfilT>('/perfil', { method: 'PUT', body: {
        nombres: nulo(nombres), apellido_paterno: nulo(paterno), apellido_materno: nulo(materno),
        fecha_nacimiento: nacimiento || null, genero: genero || null, empresa: nulo(empresa),
      } })
      setAviso(g.completo ? 'Perfil guardado.' : 'Guardado. Todavía faltan algunos datos para completar tu perfil.')
      perfil.recargar(true); void recargarUsuario()
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo guardar el perfil.') }
    finally { setGuardando(false) }
  }

  const elegirFoto = async (archivo: File | undefined) => {
    if (!archivo) return
    setErrorFoto(null); setSubiendo(true)
    try {
      const lista = await prepararFoto(archivo)
      const datos = new FormData(); datos.append('archivo', lista)
      await api('/perfil/foto', { method: 'PUT', body: datos })
      perfil.recargar(true)
    } catch (err) { setErrorFoto(err instanceof FotoInvalida || err instanceof ApiError ? err.message : 'No se pudo subir la foto.') }
    finally { setSubiendo(false); if (inputFoto.current) inputFoto.current.value = '' }
  }
  const quitarFoto = async () => {
    setErrorFoto(null); setSubiendo(true)
    try { await api('/perfil/foto', { method: 'DELETE' }); perfil.recargar(true) }
    catch (err) { setErrorFoto(err instanceof ApiError ? err.message : 'No se pudo quitar la foto.') }
    finally { setSubiendo(false) }
  }

  if (!p && perfil.cargando) return <div className="p-10 text-center"><Spinner /></div>

  return (
    <div className="space-y-4">
      {perfil.error && <Aviso tipo="error">{perfil.error.message}</Aviso>}
      {p && !p.completo && (
        <Aviso tipo="info">
          Para completar tu perfil faltan: {p.faltantes.map((f) => ETIQUETA_CAMPO[f]).join(', ')}.
          {p.recordatorio_dias_restantes !== null && ` Te lo recordaremos a diario durante ${p.recordatorio_dias_restantes} ${p.recordatorio_dias_restantes === 1 ? 'día' : 'días'} más.`}
        </Aviso>
      )}

      <section className="card space-y-3 p-5" aria-labelledby="foto-t">
        <header>
          <h2 id="foto-t" className="font-semibold">Foto de perfil</h2>
          <p className="text-sm text-ink-muted">Opcional · JPG o PNG · se ajusta sola a {FOTO_MAX_PX}×{FOTO_MAX_PX} px como máximo.</p>
        </header>
        <div className="flex items-center gap-4">
          {fotoUrl
            ? <img src={fotoUrl} alt="Tu foto de perfil" className="size-20 rounded-full object-cover ring-2 ring-line" />
            : <span className="grid size-20 place-items-center rounded-full bg-primary-soft text-2xl font-bold text-primary-strong" aria-hidden>{iniciales(nombres, paterno, usuario?.email)}</span>}
          <div className="flex flex-wrap gap-2">
            <input ref={inputFoto} type="file" accept={ACCEPT_FOTO} className="sr-only" aria-label="Elegir foto de perfil" disabled={subiendo} onChange={(e) => void elegirFoto(e.target.files?.[0])} />
            <button type="button" className="btn-ghost" disabled={subiendo} onClick={() => inputFoto.current?.click()}><Camera size={16} aria-hidden /> {subiendo ? 'Subiendo…' : p?.tiene_foto ? 'Cambiar foto' : 'Subir foto'}</button>
            {p?.tiene_foto && <button type="button" className="btn-ghost hover:text-danger" disabled={subiendo} onClick={quitarFoto}><Trash size={16} aria-hidden /> Quitar</button>}
          </div>
        </div>
        {errorFoto && <Aviso tipo="error">{errorFoto}</Aviso>}
      </section>

      <form onSubmit={guardar} noValidate className="card space-y-4 p-5" aria-labelledby="datos-t">
        <header>
          <h2 id="datos-t" className="font-semibold">Datos personales</h2>
          <p className="text-sm text-ink-muted">Puedes guardar a medias y completarlo después.</p>
        </header>
        <Campo id="correo" etiqueta="Correo" hint="con el que inicias sesión"><input id="correo" type="email" className="field" value={usuario?.email ?? ''} readOnly disabled /></Campo>
        <Campo id="nombres" etiqueta="Nombre(s)" error={errores.nombres}><input id="nombres" className="field" value={nombres} onChange={(e) => setNombres(e.target.value)} autoComplete="given-name" maxLength={100} disabled={guardando} /></Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="paterno" etiqueta="Apellido paterno" error={errores.paterno}><input id="paterno" className="field" value={paterno} onChange={(e) => setPaterno(e.target.value)} autoComplete="family-name" maxLength={100} disabled={guardando} /></Campo>
          <Campo id="materno" etiqueta="Apellido materno" hint="opcional" error={errores.materno}><input id="materno" className="field" value={materno} onChange={(e) => setMaterno(e.target.value)} maxLength={100} disabled={guardando} /></Campo>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="nacimiento" etiqueta="Fecha de nacimiento" error={errores.nacimiento}><input id="nacimiento" type="date" className="field" value={nacimiento} max={fechaMaxima()} onChange={(e) => setNacimiento(e.target.value)} autoComplete="bday" disabled={guardando} /></Campo>
          <Campo id="genero" etiqueta="Género">
            <select id="genero" className="field" value={genero} onChange={(e) => setGenero(e.target.value as GeneroPerfil | '')} disabled={guardando}>
              <option value="">Selecciona…</option>{GENEROS.map((g) => <option key={g.valor} value={g.valor}>{g.etiqueta}</option>)}
            </select>
          </Campo>
        </div>
        <Campo id="empresa" etiqueta="Empresa" hint="opcional" error={errores.empresa}><input id="empresa" className="field" value={empresa} onChange={(e) => setEmpresa(e.target.value)} autoComplete="organization" maxLength={255} disabled={guardando} /></Campo>
        {error && <Aviso tipo="error">{error}</Aviso>}
        {aviso && <Aviso tipo="ok">{aviso}</Aviso>}
        <div className="flex justify-end"><button type="submit" className="btn-primary" disabled={hayErrores || guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button></div>
      </form>

      <section className="card flex items-center justify-between gap-3 p-5" aria-label="Apariencia">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">{tema === 'light' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />} Apariencia</h2>
          <p className="text-sm text-ink-muted">Tema {tema === 'light' ? 'claro' : 'oscuro'}. Se recuerda solo en este navegador.</p>
        </div>
        <button type="button" role="switch" aria-checked={tema === 'dark'} aria-label="Usar tema oscuro" onClick={() => guardarTema(tema === 'dark' ? 'light' : 'dark')}
          className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${tema === 'dark' ? 'bg-primary' : 'bg-ink-muted/40'}`}>
          <span className={`absolute left-0.5 top-0.5 size-6 rounded-full bg-white shadow transition-transform ${tema === 'dark' ? 'translate-x-5' : ''}`} />
        </button>
      </section>
    </div>
  )
}
