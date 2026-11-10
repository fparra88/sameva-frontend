import { Copy, EnvelopeSimple, Trash } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { fechaCorta } from '../../lib/formato'
import type { Invitacion, InvitacionCreada, Proveedor, RolInvitable, UsuarioEquipo, Vendedor } from '../../lib/tipos'
import { useApi } from '../../lib/useApi'
import { Aviso, Chip } from '../ui'

const ROL: Record<string, string> = { owner: 'Dueño', superadmin: 'Administrador', member: 'Colaborador', vendedor: 'Vendedor', proveedor: 'Proveedor' }
const ROL_DESC: Record<RolInvitable, string> = {
  member: 'Ve conversaciones, embudo y agenda; no cambia la configuración.',
  vendedor: 'Solo ve lo suyo: sus leads y las conversaciones que le asignen.',
  proveedor: 'Solo ve su agenda de citas y maneja su disponibilidad.',
}
const mensaje = (e: unknown, r: string) => (e instanceof ApiError ? e.message : r)

function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" className="btn-ghost min-h-8 px-2.5 text-xs" onClick={() => { void navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 1800) }) }}>
      <Copy size={13} aria-hidden /> {ok ? 'Copiado' : 'Copiar enlace'}
    </button>
  )
}

/** Cuentas del negocio e invitaciones pendientes (solo owner y superadmin). */
export function Usuarios() {
  const { usuario } = useAuth()
  const tenantId = usuario?.tenant_id ?? null
  const usuarios = useApi<UsuarioEquipo[]>('/equipo/usuarios')
  const invitaciones = useApi<Invitacion[]>('/equipo/invitaciones')
  const [aviso, setAviso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enlace, setEnlace] = useState<InvitacionCreada | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<RolInvitable>('member')
  const [ficha, setFicha] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Las fichas solo se piden cuando el rol las necesita.
  const vendedores = useApi<Vendedor[]>(rol === 'vendedor' && tenantId ? `/tenants/${tenantId}/vendedores` : null)
  const proveedores = useApi<Proveedor[]>(rol === 'proveedor' && tenantId ? `/tenants/${tenantId}/calendario/proveedores` : null)
  const fichas = (rol === 'vendedor' ? vendedores.datos : rol === 'proveedor' ? proveedores.datos : null)?.filter((f) => f.activo && !f.portal_user_id) ?? []
  const cargandoFichas = (rol === 'vendedor' && vendedores.cargando) || (rol === 'proveedor' && proveedores.cargando)
  const fichaError = rol === 'vendedor' ? vendedores.error : rol === 'proveedor' ? proveedores.error : null

  const limpiar = () => { setError(null); setAviso(null) }
  const accion = async (id: string, fn: () => Promise<string | void>, respaldo: string) => {
    limpiar(); setOcupado(id)
    try { const m = await fn(); if (m) setAviso(m); usuarios.recargar(true); invitaciones.recargar(true) }
    catch (e) { setError(mensaje(e, respaldo)) }
    finally { setOcupado(null) }
  }

  const invitar = async (e: FormEvent) => {
    e.preventDefault()
    limpiar(); setEnlace(null); setEnviando(true)
    try {
      const r = await api<InvitacionCreada>('/equipo/invitaciones', {
        method: 'POST',
        body: { email: email.trim(), role: rol, ...(rol === 'vendedor' ? { vendedor_id: ficha } : {}), ...(rol === 'proveedor' ? { proveedor_id: ficha } : {}) },
      })
      setEnlace(r); setEmail(''); setFicha('')
      setAviso(r.correo_enviado ? `Invitación enviada a ${r.email}.` : `No pudimos enviar el correo a ${r.email}: comparte el enlace tú mismo.`)
      invitaciones.recargar(true)
    } catch (err) { setError(mensaje(err, 'No se pudo enviar la invitación.')) }
    finally { setEnviando(false) }
  }

  const alternar = (u: UsuarioEquipo) => accion(u.id, async () => {
    await api(`/equipo/usuarios/${u.id}`, { method: 'PATCH', body: { activo: !u.activo } })
    return u.activo ? `${u.nombre ?? u.email} ya no tiene acceso al portal.` : `${u.nombre ?? u.email} volvió a tener acceso.`
  }, 'No se pudo cambiar el acceso.')
  const reenviar = (i: Invitacion) => accion(i.id, async () => {
    const r = await api<InvitacionCreada>(`/equipo/invitaciones/${i.id}/reenviar`, { method: 'POST' })
    setEnlace(r)
    return r.correo_enviado ? `Invitación reenviada a ${i.email}.` : `No pudimos enviar el correo: comparte el enlace tú mismo.`
  }, 'No se pudo reenviar la invitación.')
  const revocar = (i: Invitacion) => accion(i.id, async () => { await api(`/equipo/invitaciones/${i.id}`, { method: 'DELETE' }); return `Invitación a ${i.email} cancelada.` }, 'No se pudo cancelar la invitación.')

  const puedeEnviar = email.trim().includes('@') && !enviando && (rol === 'member' || ficha !== '')

  return (
    <div className="space-y-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      {aviso && <Aviso tipo="ok">{aviso}</Aviso>}
      {enlace && (
        <div className="card flex flex-wrap items-center gap-3 p-3 text-sm">
          <span className="min-w-0 flex-1 break-all text-ink-muted">Enlace de invitación para {enlace.email}: <span className="font-mono text-xs text-ink">{enlace.enlace}</span></span>
          <Copiar texto={enlace.enlace} />
        </div>
      )}

      <section className="card space-y-3 p-5" aria-labelledby="inv-t">
        <header>
          <h2 id="inv-t" className="font-semibold">Invitar a alguien</h2>
          <p className="text-sm text-ink-muted">Le llega un correo con un enlace para elegir su contraseña. Invitar otra vez al mismo correo reemplaza la invitación anterior.</p>
        </header>
        <form onSubmit={invitar} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label htmlFor="i-email" className="field-label">Correo</label><input id="i-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" /></div>
            <div><label htmlFor="i-rol" className="field-label">Rol</label>
              <select id="i-rol" className="field" value={rol} onChange={(e) => { setRol(e.target.value as RolInvitable); setFicha('') }}>
                <option value="member">Colaborador</option><option value="vendedor">Vendedor</option><option value="proveedor">Proveedor (agenda)</option>
              </select></div>
          </div>
          <p className="text-xs text-ink-muted">{ROL_DESC[rol]}</p>
          {rol !== 'member' && (
            <div className="max-w-md">
              <label htmlFor="i-ficha" className="field-label">{rol === 'vendedor' ? 'Ficha de vendedor' : 'Ficha de proveedor'}</label>
              {cargandoFichas ? <Spinner /> : (
                <select id="i-ficha" className="field" value={ficha} onChange={(e) => setFicha(e.target.value)} required>
                  <option value="">Elige una…</option>{fichas.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              )}
              {fichaError && <p className="mt-1 text-xs text-danger">{fichaError.message}</p>}
              {!cargandoFichas && !fichaError && fichas.length === 0 && <p className="mt-1 text-xs text-ink-muted">No hay fichas activas sin acceso. {rol === 'proveedor' ? 'Crea el proveedor en Agenda → Proveedores.' : 'Las fichas de vendedor se crean en la gestión de ventas.'}</p>}
            </div>
          )}
          <div className="flex justify-end"><button type="submit" className="btn-primary" disabled={!puedeEnviar}><EnvelopeSimple size={16} aria-hidden /> {enviando ? 'Enviando…' : 'Enviar invitación'}</button></div>
        </form>
      </section>

      {invitaciones.datos && invitaciones.datos.length > 0 && (
        <section className="card overflow-hidden" aria-labelledby="pend-t">
          <h2 id="pend-t" className="border-b border-line px-5 py-3 font-semibold">Invitaciones pendientes</h2>
          <ul className="divide-y divide-line">
            {invitaciones.datos.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{i.email}</p>
                  <p className="text-xs text-ink-muted">{ROL[i.role]}{i.vendedor_nombre ? ` · ${i.vendedor_nombre}` : ''}{i.proveedor_nombre ? ` · ${i.proveedor_nombre}` : ''} · {i.vencida ? 'venció' : 'vence'} {fechaCorta(i.expira_en)}</p>
                </div>
                {i.vencida && <Chip tono="aviso">vencida</Chip>}
                <button type="button" className="btn-ghost min-h-9 px-3" disabled={ocupado === i.id} onClick={() => reenviar(i)}>Reenviar</button>
                <button type="button" className="btn-ghost size-9 px-0 hover:text-danger" disabled={ocupado === i.id} onClick={() => revocar(i)} aria-label={`Cancelar invitación a ${i.email}`}><Trash size={15} aria-hidden /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card overflow-hidden" aria-labelledby="usr-t">
        <h2 id="usr-t" className="border-b border-line px-5 py-3 font-semibold">Cuentas del negocio</h2>
        {usuarios.error && <div className="p-4"><Aviso tipo="error">{usuarios.error.message}</Aviso></div>}
        {usuarios.cargando && !usuarios.datos ? <div className="p-6 text-center"><Spinner /></div> : (
          <ul className="divide-y divide-line">
            {usuarios.datos?.map((u) => (
              <li key={u.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${u.activo ? '' : 'opacity-60'}`}>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2"><span className="truncate font-medium">{u.nombre ?? u.email}</span><Chip tono={u.role === 'owner' ? 'info' : 'gris'}>{ROL[u.role] ?? u.role}</Chip>{u.es_tu_cuenta && <Chip tono="ok">tú</Chip>}{!u.activo && <Chip tono="aviso">sin acceso</Chip>}</p>
                  <p className="truncate text-xs text-ink-muted">{u.nombre ? `${u.email} · ` : ''}{u.vendedor_nombre ?? u.proveedor_nombre ?? ''}{(u.vendedor_nombre ?? u.proveedor_nombre) ? ' · ' : ''}{u.ultimo_acceso ? `último acceso ${fechaCorta(u.ultimo_acceso)}` : 'aún no ha entrado'}</p>
                </div>
                {!u.es_tu_cuenta && ['member', 'vendedor', 'proveedor'].includes(u.role) && (
                  <button type="button" className="btn-ghost min-h-9 px-3" disabled={ocupado === u.id} onClick={() => alternar(u)}>{u.activo ? 'Quitar acceso' : 'Devolver acceso'}</button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
