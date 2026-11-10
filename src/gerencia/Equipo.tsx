import { Plus, Trash } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Spinner } from '../components'
import { api, ApiError } from '../lib/api'
import { fechaCorta } from '../lib/formato'
import type { UsuarioGerencia } from '../lib/tipos'
import { useApi } from '../lib/useApi'
import { Aviso, Chip, Dialogo } from '../portal/ui'

/** Equipo de la plataforma. Verlo puede cualquiera de gerencia; agregar y quitar, solo la persona principal. */
export default function Equipo() {
  const equipo = useApi<UsuarioGerencia[]>('/gerencia/usuarios')
  const [agregando, setAgregando] = useState(false)
  const [quitando, setQuitando] = useState<UsuarioGerencia | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const puedeAdministrar = equipo.datos?.[0]?.puede_administrar ?? false
  const hecho = (mensaje: string) => { setAgregando(false); setQuitando(null); setAviso(mensaje); equipo.recargar(true) }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Equipo</h1>
          <p className="mt-1 text-ink-muted">Personas con acceso a este panel. Cada alta y baja queda en la bitácora.</p>
        </div>
        {puedeAdministrar && <button type="button" className="btn-primary" onClick={() => { setAviso(null); setAgregando(true) }}><Plus size={16} aria-hidden /> Agregar persona</button>}
      </div>

      <div className="space-y-4">
        {equipo.error && <Aviso tipo="error">{equipo.error.message}</Aviso>}
        {aviso && <Aviso tipo="ok">{aviso}</Aviso>}
        {equipo.datos && !puedeAdministrar && <Aviso tipo="info">Solo la persona principal de gerencia puede agregar o quitar miembros.</Aviso>}
        <section className="card overflow-hidden" aria-label="Equipo de gerencia">
          {equipo.cargando && !equipo.datos ? <div className="p-8 text-center"><Spinner /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-muted/60 text-xs text-ink-muted"><tr>
                  <th scope="col" className="px-5 py-2 font-medium">Persona</th><th scope="col" className="px-3 py-2 font-medium">Cargo</th>
                  <th scope="col" className="px-3 py-2 font-medium">Último acceso</th><th scope="col" className="px-3 py-2 font-medium">Estado</th><th scope="col" className="px-5 py-2" />
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {equipo.datos?.map((u) => (
                    <tr key={u.id}>
                      <td className="px-5 py-2.5"><span className="font-semibold">{u.full_name}</span>{u.es_yo && <span className="ml-1 text-xs text-ink-muted">(tú)</span>}<span className="block text-xs text-ink-muted">{u.email}</span></td>
                      <td className="px-3 py-2.5">{u.cargo}</td>
                      <td className="px-3 py-2.5 tabular-nums">{u.ultimo_acceso ? fechaCorta(u.ultimo_acceso) : '—'}</td>
                      <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">
                        {u.es_principal && <Chip tono="info">principal</Chip>}
                        {!u.tiene_cuenta_portal && <Chip tono="aviso">aún sin cuenta</Chip>}
                      </div></td>
                      <td className="px-5 py-2.5 text-right">
                        {puedeAdministrar && !u.es_yo && !u.es_principal && (
                          <button type="button" className="btn-ghost min-h-8 px-3 text-xs" aria-label={`Quitar a ${u.full_name}`} onClick={() => { setAviso(null); setQuitando(u) }}><Trash size={13} aria-hidden /> Quitar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <p className="text-xs text-ink-muted">«Aún sin cuenta»: la persona debe registrarse en el portal con ese mismo correo (o entrar con Google) para usar el panel; el acceso se activa solo.</p>
      </div>

      {agregando && <AgregarPersona onCerrar={() => setAgregando(false)} onHecho={hecho} />}
      {quitando && <QuitarPersona usuario={quitando} onCerrar={() => setQuitando(null)} onHecho={hecho} />}
    </div>
  )
}

function AgregarPersona({ onCerrar, onHecho }: { onCerrar: () => void; onHecho: (m: string) => void }) {
  const [f, setF] = useState({ email: '', full_name: '', cargo: '' })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null); setEnviando(true)
    try {
      await api('/gerencia/usuarios', { method: 'POST', body: { email: f.email.trim(), full_name: f.full_name.trim(), cargo: f.cargo.trim() } })
      onHecho(`${f.full_name.trim()} ya tiene acceso a gerencia.`)
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo agregar a la persona.'); setEnviando(false) }
  }

  return (
    <Dialogo abierto titulo="Agregar persona al equipo" onCerrar={onCerrar} ocupado={enviando}>
      <form onSubmit={guardar} className="mt-4 space-y-4">
        {error && <Aviso tipo="error">{error}</Aviso>}
        <div><label htmlFor="eq-nombre" className="field-label">Nombre completo</label><input id="eq-nombre" className="field" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required minLength={2} maxLength={255} /></div>
        <div><label htmlFor="eq-email" className="field-label">Correo</label><input id="eq-email" type="email" className="field" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /><p className="mt-1 text-xs text-ink-muted">Debe ser el correo con el que se registra o entra a su portal.</p></div>
        <div><label htmlFor="eq-cargo" className="field-label">Cargo</label><input id="eq-cargo" className="field" value={f.cargo} onChange={(e) => setF({ ...f, cargo: e.target.value })} required minLength={2} maxLength={100} placeholder="Soporte, Operaciones…" /></div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={enviando}>{enviando ? 'Agregando…' : 'Agregar'}</button>
        </div>
      </form>
    </Dialogo>
  )
}

function QuitarPersona({ usuario, onCerrar, onHecho }: { usuario: UsuarioGerencia; onCerrar: () => void; onHecho: (m: string) => void }) {
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quitar = async () => {
    setError(null); setEnviando(true)
    try {
      await api(`/gerencia/usuarios/${usuario.id}`, { method: 'DELETE' })
      onHecho(`${usuario.full_name} ya no tiene acceso a gerencia.`)
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo quitar a la persona.'); setEnviando(false) }
  }

  return (
    <Dialogo abierto titulo="Quitar acceso a gerencia" onCerrar={onCerrar} ocupado={enviando}>
      <div className="mt-4 space-y-4">
        {error && <Aviso tipo="error">{error}</Aviso>}
        <p className="text-sm"><strong>{usuario.full_name}</strong> ({usuario.email}) perderá el acceso al panel en su siguiente petición. Su cuenta de portal no se toca.</p>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={quitar} disabled={enviando}>{enviando ? 'Quitando…' : 'Quitar acceso'}</button>
        </div>
      </div>
    </Dialogo>
  )
}
