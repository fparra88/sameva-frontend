import { Warning } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { fechaCorta } from '../../lib/formato'
import type { EliminacionCuenta } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Dialogo } from '../ui'

const CONFIRMACION = 'ELIMINAR'

/** Zona de peligro: borrar la cuenta borra el negocio entero. Solo el dueño. */
export function BorrarCuenta() {
  const { salir } = useAuth()
  const [abierto, setAbierto] = useState(false)
  // Solo se revisa cuando se abre el diálogo.
  const revision = useApi<EliminacionCuenta>(abierto ? '/cuenta/eliminacion' : null)
  const [texto, setTexto] = useState('')
  const [password, setPassword] = useState('')
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const r = revision.datos

  const cerrar = () => { if (borrando) return; setAbierto(false); setTexto(''); setPassword(''); setError(null) }

  const borrar = async (e: FormEvent) => {
    e.preventDefault()
    if (!r?.eliminable || texto !== CONFIRMACION || !password) return
    setBorrando(true); setError(null)
    try {
      await api('/cuenta/eliminar', { method: 'POST', body: { confirmacion: texto, password } })
      await salir()
    } catch (err) { setError(err instanceof ApiError ? err.message : 'No se pudo borrar la cuenta.'); setBorrando(false) }
  }

  return (
    <section className="card border-danger/30 p-5" aria-labelledby="peligro-t">
      <h2 id="peligro-t" className="flex items-center gap-2 font-semibold text-danger"><Warning size={18} aria-hidden /> Borrar cuenta</h2>
      <p className="mt-1 text-sm text-ink-muted">Elimina tu cuenta y el negocio completo: conversaciones, clientes, agente, canales y la cuenta de todo tu equipo. No se puede deshacer.</p>
      <button type="button" className="btn-ghost mt-4 text-danger hover:border-danger/40" onClick={() => setAbierto(true)}>Borrar mi cuenta…</button>

      <Dialogo abierto={abierto} titulo="Borrar cuenta" onCerrar={cerrar} ocupado={borrando}>
        {revision.cargando && !r ? <div className="mt-4 text-center"><Spinner label="Revisando tu cuenta" /></div>
          : revision.error ? <div className="mt-3"><Aviso tipo="error">{revision.error.message}</Aviso></div>
          : r && (
            <form onSubmit={borrar} className="mt-3 space-y-4">
              {r.bloqueos.length > 0 ? (
                <div className="space-y-2"><p className="text-sm">Por ahora no se puede borrar la cuenta:</p>
                  <ul className="space-y-2">{r.bloqueos.map((b) => <li key={b.codigo}><Aviso tipo="error">{b.mensaje}</Aviso></li>)}</ul></div>
              ) : (
                <>
                  <div className="rounded-xl bg-danger/5 p-3 text-sm">
                    <p className="font-medium">Se eliminará de forma permanente:</p>
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-ink-muted">
                      <li>{r.conversaciones.toLocaleString('es-MX')} conversaciones</li>
                      <li>{r.usuarios_portal} {r.usuarios_portal === 1 ? 'cuenta del portal' : 'cuentas del portal'}</li>
                      {Number(r.creditos_disponibles) > 0 && <li>{Number(r.creditos_disponibles).toLocaleString('es-MX')} créditos sin usar</li>}
                      {r.pagado_hasta && <li>Días ya pagados de tu suscripción (hasta {fechaCorta(r.pagado_hasta)}): conviene esperar a esa fecha</li>}
                    </ul>
                  </div>
                  {r.verificacion === 'google' ? (
                    <Aviso tipo="info">Tu cuenta entra con Google. Para borrarla escríbenos a soporte, porque desde aquí hace falta tu contraseña.</Aviso>
                  ) : (
                    <>
                      <div><label htmlFor="b-conf" className="field-label">Escribe {CONFIRMACION} para confirmar</label><input id="b-conf" className="field" value={texto} onChange={(e) => setTexto(e.target.value)} autoComplete="off" /></div>
                      <div><label htmlFor="b-pass" className="field-label">Tu contraseña</label><input id="b-pass" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
                    </>
                  )}
                  {error && <Aviso tipo="error">{error}</Aviso>}
                </>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-ghost" onClick={cerrar} disabled={borrando}>Cancelar</button>
                {r.eliminable && r.verificacion === 'password' && (
                  <button type="submit" className="btn-primary !bg-danger" disabled={borrando || texto !== CONFIRMACION || !password}>{borrando ? 'Borrando…' : 'Borrar todo'}</button>
                )}
              </div>
            </form>
          )}
      </Dialogo>
    </section>
  )
}
