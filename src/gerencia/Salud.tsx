import { CheckCircle } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '../components'
import { api, ApiError } from '../lib/api'
import { fechaCorta, hora } from '../lib/formato'
import type { AlertaGerencia, ProblemaSalud, SaludGerencia } from '../lib/tipos'
import { useApi } from '../lib/useApi'
import { Aviso, Chip } from '../portal/ui'

const SEVERIDAD = {
  alta: { etiqueta: 'Alta', tono: 'aviso' as const, orden: 0 },
  media: { etiqueta: 'Media', tono: 'info' as const, orden: 1 },
  baja: { etiqueta: 'Baja', tono: 'gris' as const, orden: 2 },
}
const titulo = (tipo: string) => { const t = tipo.replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1) }
const enlaceNegocio = (nombre: string) => `/gerencia/negocios?q=${encodeURIComponent(nombre)}`

/** Qué está roto o por romperse ahora mismo, de todos los negocios, más las alertas abiertas de plataforma. */
export default function Salud() {
  const salud = useApi<SaludGerencia>('/gerencia/salud')
  const [error, setError] = useState<string | null>(null)
  const [cerrando, setCerrando] = useState<string | null>(null)

  const revisar = async (a: AlertaGerencia) => {
    setError(null); setCerrando(a.id)
    try { await api(`/gerencia/alertas/${a.id}/revisar`, { method: 'PATCH' }); salud.recargar(true) }
    catch (e) { setError(e instanceof ApiError ? e.message : 'No se pudo cerrar la alerta.') }
    finally { setCerrando(null) }
  }

  const s = salud.datos
  const grupos = new Map<string, ProblemaSalud[]>()
  for (const p of s?.problemas ?? []) grupos.set(p.tipo, [...(grupos.get(p.tipo) ?? []), p])
  const ordenados = [...grupos.entries()].sort(([, a], [, b]) => SEVERIDAD[a[0].severidad].orden - SEVERIDAD[b[0].severidad].orden)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Salud</h1>
          <p className="mt-1 text-ink-muted">Problemas operativos de todos los negocios, ordenados por severidad.</p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => salud.recargar()} disabled={salud.cargando}>Actualizar</button>
      </div>

      <div className="space-y-4">
        {(salud.error || error) && <Aviso tipo="error">{error ?? salud.error!.message}</Aviso>}
        {salud.cargando && !s && <div className="p-8 text-center"><Spinner /></div>}

        {s && s.alertas_abiertas.length > 0 && (
          <section className="card overflow-hidden" aria-labelledby="al-t">
            <h2 id="al-t" className="border-b border-line px-5 py-3 font-semibold">Alertas abiertas <span className="font-normal text-ink-muted">({s.alertas_abiertas.length})</span></h2>
            <ul className="divide-y divide-line">
              {s.alertas_abiertas.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.titulo}</p>
                    <p className="text-xs text-ink-muted">
                      {a.tenant_nombre ? <Link className="underline" to={enlaceNegocio(a.tenant_nombre)}>{a.tenant_nombre}</Link> : 'Plataforma'} · {titulo(a.tipo)} · {fechaCorta(a.creada_en)} {hora(a.creada_en)}
                    </p>
                  </div>
                  <button type="button" className="btn-ghost min-h-8 px-3 text-xs" disabled={cerrando === a.id} onClick={() => revisar(a)}><CheckCircle size={14} aria-hidden /> {cerrando === a.id ? 'Cerrando…' : 'Marcar revisada'}</button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {s && ordenados.length === 0 && s.alertas_abiertas.length === 0 && <Aviso tipo="ok">Todo en orden: no hay problemas operativos ahora mismo.</Aviso>}

        {ordenados.map(([tipo, lista]) => (
          <section key={tipo} className="card overflow-hidden" aria-label={titulo(tipo)}>
            <h2 className="flex items-center gap-2 border-b border-line px-5 py-3 font-semibold">
              {titulo(tipo)} <Chip tono={SEVERIDAD[lista[0].severidad].tono}>{SEVERIDAD[lista[0].severidad].etiqueta}</Chip>
              <span className="font-normal text-ink-muted">({lista.length})</span>
            </h2>
            <ul className="divide-y divide-line">
              {lista.map((p, i) => (
                <li key={`${p.tenant_id}-${i}`} className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-2.5 text-sm">
                  <span className="w-48 shrink-0 font-medium">{p.tenant_nombre ? <Link className="underline" to={enlaceNegocio(p.tenant_nombre)}>{p.tenant_nombre}</Link> : 'Plataforma'}</span>
                  <span className="min-w-0 flex-1 text-ink-muted">{p.detalle}</span>
                  {p.fecha && <span className="tabular-nums text-xs text-ink-muted">{fechaCorta(p.fecha)}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {s && <p className="text-xs text-ink-muted">Generado {fechaCorta(s.generado_en)} {hora(s.generado_en)}</p>}
      </div>
    </div>
  )
}
