import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../components'
import { api, ApiError } from '../lib/api'
import { fechaCorta, hora } from '../lib/formato'
import type { EstadoReporte, ReporteIncidencia } from '../lib/tipos'
import { useApi } from '../lib/useApi'
import { Aviso, Chip, Dialogo } from '../portal/ui'

const ESTADOS: { id: EstadoReporte; etiqueta: string; tono: 'aviso' | 'info' | 'ok' }[] = [
  { id: 'abierto', etiqueta: 'Abierto', tono: 'aviso' },
  { id: 'en_revision', etiqueta: 'En revisión', tono: 'info' },
  { id: 'resuelto', etiqueta: 'Resuelto', tono: 'ok' },
]
const info = (e: EstadoReporte) => ESTADOS.find((x) => x.id === e)!
const PAGINA = 50

/** Reportes que los usuarios mandan con «Reportar un problema»: ver, abrir la captura y cambiar el estado. */
export default function Incidencias() {
  const [estado, setEstado] = useState('')
  const [limite, setLimite] = useState(PAGINA)
  const q = new URLSearchParams({ limite: String(limite) })
  if (estado) q.set('estado', estado)
  const lista = useApi<ReporteIncidencia[]>(`/gerencia/incidencias?${q}`)
  const [abierto, setAbierto] = useState<string | null>(null)
  const elegido = lista.datos?.find((r) => r.id === abierto) ?? null

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Reportes</h1>
          <p className="mt-1 text-ink-muted">Problemas que reportan los usuarios desde el portal.</p>
        </div>
        <select className="field w-auto" aria-label="Estado" value={estado} onChange={(e) => { setEstado(e.target.value); setLimite(PAGINA) }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => <option key={e.id} value={e.id}>{e.etiqueta}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {lista.error && <Aviso tipo="error">{lista.error.message}</Aviso>}
        <section className="card overflow-hidden" aria-label="Reportes">
          {lista.cargando && !lista.datos ? <div className="p-8 text-center"><Spinner /></div>
            : !lista.datos?.length ? <p className="p-8 text-center text-sm text-ink-muted">Sin reportes.</p> : (
              <ul className="divide-y divide-line">
                {lista.datos.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => setAbierto(r.id)} className="flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 text-left text-sm hover:bg-muted/40">
                      <span className="w-36 shrink-0 tabular-nums text-ink-muted">{fechaCorta(r.creado_en)} {hora(r.creado_en)}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{r.resumen}</span><span className="block truncate text-xs text-ink-muted">{r.nombre_negocio ?? 'Sin negocio'} · {r.email}{r.tiene_adjunto && ' · 📎'}</span></span>
                      <Chip tono={info(r.estado).tono}>{info(r.estado).etiqueta}</Chip>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          {lista.datos && lista.datos.length >= limite && (
            <div className="border-t border-line p-3 text-center"><button type="button" className="btn-ghost min-h-9 px-4 text-sm" onClick={() => setLimite((n) => n + PAGINA)}>Ver más</button></div>
          )}
        </section>
      </div>

      {elegido && <Detalle key={elegido.id} r={elegido} onCerrar={() => setAbierto(null)} onCambio={() => lista.recargar(true)} />}
    </div>
  )
}

const ETIQUETA_CONTEXTO: Record<string, string> = { ruta: 'Pantalla', navegador: 'Navegador', sistema_operativo: 'Sistema', idioma: 'Idioma', zona_horaria: 'Zona horaria' }
const medida = (v: unknown) => { const m = v as { ancho?: number; alto?: number } | undefined; return m?.ancho && m?.alto ? `${m.ancho}×${m.alto}` : null }

function Detalle({ r, onCerrar, onCambio }: { r: ReporteIncidencia; onCerrar: () => void; onCambio: () => void }) {
  const [captura, setCaptura] = useState<string | null>(null)
  const [fallaCaptura, setFallaCaptura] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // La captura exige token: se baja como blob y se libera al cerrar.
  useEffect(() => {
    if (!r.tiene_adjunto) return
    let vivo = true
    let objeto: string | null = null
    api<Blob>(`/gerencia/incidencias/${r.id}/adjunto`, { blob: true })
      .then((b) => { if (vivo) { objeto = URL.createObjectURL(b); setCaptura(objeto) } })
      .catch(() => { if (vivo) setFallaCaptura(true) })
    return () => { vivo = false; if (objeto) URL.revokeObjectURL(objeto) }
  }, [r.id, r.tiene_adjunto])

  const cambiar = async (nuevo: EstadoReporte) => {
    setError(null); setOcupado(true)
    try { await api(`/gerencia/incidencias/${r.id}`, { method: 'PATCH', body: { estado: nuevo } }); onCambio() }
    catch (e) { setError(e instanceof ApiError ? e.message : 'No se pudo cambiar el estado.') }
    finally { setOcupado(false) }
  }

  const c = r.contexto
  const datos = [
    ...Object.entries(ETIQUETA_CONTEXTO).filter(([k]) => typeof c[k] === 'string').map(([k, t]) => [t, String(c[k])] as const),
    ['Pantalla del equipo', medida(c.pantalla)] as const, ['Ventana', medida(c.ventana)] as const,
  ].filter(([, v]) => v)

  return (
    <Dialogo abierto titulo={r.resumen} onCerrar={onCerrar} ocupado={ocupado} ancho="max-w-2xl">
      <div className="mt-3 space-y-4">
        <p className="text-sm text-ink-muted">
          {r.nombre_negocio ? <Link className="underline" to={`/gerencia/negocios?q=${encodeURIComponent(r.nombre_negocio)}`}>{r.nombre_negocio}</Link> : 'Sin negocio'} · {r.email} · {fechaCorta(r.creado_en)} {hora(r.creado_en)}
        </p>
        {error && <Aviso tipo="error">{error}</Aviso>}
        <p className="whitespace-pre-wrap break-words rounded-xl bg-muted/60 p-3 text-sm">{r.descripcion}</p>
        {r.tiene_adjunto && (
          captura ? <a href={captura} target="_blank" rel="noreferrer"><img src={captura} alt="Captura del reporte" className="max-h-80 rounded-xl border border-line object-contain" /></a>
            : fallaCaptura ? <Aviso tipo="info">No se pudo cargar la captura.</Aviso> : <Spinner label="Cargando captura" />
        )}
        {datos.length > 0 && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
            {datos.map(([t, v]) => <div key={t} className="contents"><dt className="text-ink-muted">{t}</dt><dd className="break-all">{v}</dd></div>)}
          </dl>
        )}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <span className="text-sm text-ink-muted">Estado:</span>
          {ESTADOS.map((e) => (
            <button key={e.id} type="button" disabled={ocupado || r.estado === e.id} aria-pressed={r.estado === e.id} onClick={() => cambiar(e.id)}
              className={`min-h-9 cursor-pointer rounded-full px-4 text-sm font-semibold transition disabled:cursor-default ${r.estado === e.id ? 'bg-primary text-on-primary' : 'border border-line text-ink-muted hover:bg-muted'}`}>
              {e.etiqueta}
            </button>
          ))}
          {r.atendido_por && r.atendido_en && <span className="text-xs text-ink-muted">Última vez: {r.atendido_por}, {fechaCorta(r.atendido_en)} {hora(r.atendido_en)}</span>}
        </div>
      </div>
    </Dialogo>
  )
}
