import { ArrowLeft, ArrowRight, Copy, Database, Eye, ShieldCheck, Table, Warning } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Spinner } from '../../components'
import { api, ApiError } from '../../lib/api'
import type { DbExternaDetalle, DbExternaInfo, DbObjeto, DbProbarResultado, Herramienta, MotorDb } from '../../lib/tipos'
import { Aviso, Chip, Dialogo } from '../ui'
import { MOTORES, mensajeParaProveedor, PISTA_ERROR, scriptSoloLectura } from './guiaDb'

type Paso = 'tipo' | 'preparar' | 'datos' | 'objetos' | 'confirmar'
const PASOS: { id: Paso; etiqueta: string }[] = [
  { id: 'tipo', etiqueta: 'Tipo' }, { id: 'preparar', etiqueta: 'Preparar' }, { id: 'datos', etiqueta: 'Conectar' },
  { id: 'objetos', etiqueta: 'Elegir datos' }, { id: 'confirmar', etiqueta: 'Confirmar' },
]
const MAX_OBJETOS = 20
type Seleccion = Record<string, { descripcion: string; columnas: Set<string> }>

const mensaje = (e: unknown, respaldo: string) => (e instanceof ApiError ? e.message : respaldo)

function BotonCopiar({ texto, etiqueta }: { texto: string; etiqueta: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" className="btn-ghost min-h-9 px-3 text-xs"
      onClick={() => { void navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 1800) }) }}>
      <Copy size={13} aria-hidden /> {ok ? 'Copiado' : etiqueta}
    </button>
  )
}

/**
 * Asistente para conectar una base MySQL o PostgreSQL. Pensado para dos personas: quien sabe de bases de datos
 * (script y datos, directo) y quien no (mensaje para reenviar a su proveedor, con palabras llanas).
 * En modo edición (`editar`) arranca en «Conectar» con los datos guardados; la contraseña se conserva si se deja vacía.
 */
export function ConectarBaseDatos({ info, editar, nombreNegocio, onCerrar, onGuardado }: {
  info: DbExternaInfo; editar: Herramienta | null; nombreNegocio: string; onCerrar: () => void; onGuardado: (m: string) => void
}) {
  const [paso, setPaso] = useState<Paso>(editar ? 'datos' : 'tipo')
  const [cargandoDetalle, setCargandoDetalle] = useState(editar !== null)
  const [nivel, setNivel] = useState<'tecnico' | 'ayuda'>('tecnico')
  const [motor, setMotor] = useState<MotorDb>('postgresql')
  const [host, setHost] = useState('')
  const [puerto, setPuerto] = useState('')
  const [base, setBase] = useState('')
  const [esquema, setEsquema] = useState('public')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [ssl, setSsl] = useState<'require' | 'verify'>('require')
  const [resultado, setResultado] = useState<DbProbarResultado | null>(null)
  const [seleccion, setSeleccion] = useState<Seleccion>({})
  const [previa, setPrevia] = useState<DbExternaDetalle['objetos']>([])
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [riesgo, setRiesgo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<{ texto: string; codigo?: string } | null>(null)

  // Edición: se cargan los datos NO secretos guardados (la contraseña nunca viaja al navegador).
  useEffect(() => {
    if (!editar) return
    let vivo = true
    api<DbExternaDetalle>(`/herramientas/db-externa/${editar.tool_key}`)
      .then((d) => {
        if (!vivo) return
        setMotor(d.motor); setHost(d.host); setPuerto(d.puerto ? String(d.puerto) : ''); setBase(d.base)
        setUsuario(d.usuario); setSsl(d.ssl_modo); setNombre(d.display_name); setDescripcion(d.description); setPrevia(d.objetos)
      })
      .catch((e) => { if (vivo) setError({ texto: mensaje(e, 'No se pudo cargar la conexión.') }) })
      .finally(() => { if (vivo) setCargandoDetalle(false) })
    return () => { vivo = false }
  }, [editar])

  const datosScript = { motor, base, esquema, ipSalida: info.ip_salida }
  const puertoNum = puerto.trim() ? Number(puerto) : MOTORES[motor].puerto
  const datosCompletos = host.trim().length >= 3 && base.trim() !== '' && usuario.trim() !== '' && (editar ? true : password !== '')
    && Number.isInteger(puertoNum) && puertoNum >= 1 && puertoNum <= 65535

  const permisos = resultado?.permisos_escritura ?? null
  const hayRiesgo = permisos !== null && (permisos.hay || !permisos.verificable)
  const elegidos = Object.entries(seleccion).filter(([, v]) => v.columnas.size > 0)

  const idx = PASOS.findIndex((p) => p.id === paso)
  const ir = (p: Paso) => { setError(null); setPaso(p) }

  const probar = async () => {
    setOcupado(true); setError(null)
    try {
      const r = await api<DbProbarResultado>('/herramientas/db-externa/probar', {
        method: 'POST',
        // En edición, sin contraseña nueva el servidor prueba con la guardada (tool_key).
        body: { motor, host: host.trim(), puerto: puertoNum, base: base.trim(), usuario: usuario.trim(), password: password || null, ssl_modo: ssl, tool_key: editar?.tool_key ?? null },
      })
      setResultado(r)
      // Edición: se conserva lo ya elegido que siga existiendo. Alta: nada elegido de antemano.
      const nueva: Seleccion = {}
      for (const p of previa) {
        const real = r.objetos.find((o) => o.objeto === p.objeto)
        if (real) nueva[p.objeto] = { descripcion: p.descripcion, columnas: new Set(p.columnas.filter((c) => real.columnas.some((x) => x.nombre === c))) }
      }
      setSeleccion(nueva); setRiesgo(false)
      ir('objetos')
    } catch (e) {
      setError({ texto: mensaje(e, 'No se pudo probar la conexión.'), codigo: e instanceof ApiError ? e.codigo : undefined })
    } finally { setOcupado(false) }
  }

  const alternarObjeto = (o: DbObjeto) => setSeleccion((s) => {
    const n = { ...s }
    if (n[o.objeto]) { delete n[o.objeto]; return n }
    if (Object.keys(n).length >= MAX_OBJETOS) return s
    // Las columnas que parecen secretos quedan desmarcadas: el cliente decide si las expone.
    n[o.objeto] = { descripcion: '', columnas: new Set(o.columnas.filter((c) => !c.sensible).map((c) => c.nombre)) }
    return n
  })
  const alternarColumna = (obj: string, col: string) => setSeleccion((s) => {
    const cols = new Set(s[obj].columnas)
    if (cols.has(col)) cols.delete(col); else cols.add(col)
    return { ...s, [obj]: { ...s[obj], columnas: cols } }
  })

  const irAConfirmar = () => {
    if (!descripcion.trim()) {
      const nombres = elegidos.map(([k]) => k).join(', ')
      setDescripcion(`Cuando el cliente pregunte por información que está en: ${nombres}.`)
    }
    if (!nombre.trim()) setNombre(`Base de datos ${nombreNegocio || ''}`.trim())
    ir('confirmar')
  }

  const guardar = async () => {
    setOcupado(true); setError(null)
    const objetos = elegidos.map(([objeto, v]) => ({ objeto, descripcion: v.descripcion.trim(), columnas: [...v.columnas] }))
    const comun = {
      motor, host: host.trim(), puerto: puertoNum, base: base.trim(), usuario: usuario.trim(), ssl_modo: ssl, objetos,
      acepta_responsabilidad: acepta, acepta_riesgo_escritura: riesgo,
    }
    try {
      if (editar) {
        await api(`/herramientas/db-externa/${editar.tool_key}`, { method: 'PUT', body: { ...comun, password: password || null } })
        if (nombre.trim() !== editar.display_name || descripcion.trim() !== editar.description) {
          await api(`/herramientas/${editar.tool_key}`, { method: 'PATCH', body: { display_name: nombre.trim(), description: descripcion.trim() } })
        }
        onGuardado(`"${nombre.trim()}" actualizada.`)
      } else {
        const h = await api<Herramienta>('/herramientas/db-externa', { method: 'POST', body: { ...comun, password, display_name: nombre.trim(), description: descripcion.trim() } })
        onGuardado(`"${h.display_name}" conectada. Actívala en los números donde quieras que el agente la use.`)
      }
      setPassword('')
    } catch (e) {
      setError({ texto: mensaje(e, 'No se pudo guardar la conexión.'), codigo: e instanceof ApiError ? e.codigo : undefined })
    } finally { setOcupado(false) }
  }

  const puedeConfirmar = nombre.trim().length >= 2 && descripcion.trim().length >= 5 && acepta && (!hayRiesgo || riesgo)
  const vistas = useMemo(() => (resultado?.objetos ?? []).filter((o) => o.tipo === 'vista'), [resultado])
  const tablas = useMemo(() => (resultado?.objetos ?? []).filter((o) => o.tipo === 'tabla'), [resultado])

  const filaObjeto = (o: DbObjeto) => {
    const sel = seleccion[o.objeto]
    return (
      <li key={o.objeto} className="p-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" className="mt-1 size-4 accent-primary" checked={!!sel} onChange={() => alternarObjeto(o)} disabled={!sel && Object.keys(seleccion).length >= MAX_OBJETOS} />
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="break-all font-mono text-sm font-semibold">{o.objeto}</span>
              {o.tipo === 'vista' ? <Chip tono="ok">vista · recomendada</Chip> : <Chip tono="gris">tabla</Chip>}
              <span className="text-xs text-ink-muted">{o.columnas.length} columnas</span>
            </span>
            {!sel && o.tipo === 'tabla' && <span className="mt-0.5 block text-xs text-ink-muted">Una tabla muestra todas sus filas. Si puedes, crea una vista con solo lo necesario.</span>}
          </span>
        </label>
        {sel && (
          <div className="ml-7 mt-3 space-y-3">
            <div>
              <label htmlFor={`d-${o.objeto}`} className="field-label">¿Qué contiene? <span className="font-normal text-ink-muted">(ayuda al agente a usarla bien)</span></label>
              <input id={`d-${o.objeto}`} className="field" maxLength={300} value={sel.descripcion} placeholder="Ej.: Productos con su precio y existencias"
                onChange={(e) => setSeleccion((s) => ({ ...s, [o.objeto]: { ...s[o.objeto], descripcion: e.target.value } }))} />
            </div>
            <fieldset>
              <legend className="field-label">Columnas que el agente puede ver</legend>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {o.columnas.map((c) => (
                  <label key={c.nombre} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-sm">
                    <input type="checkbox" className="size-4 accent-primary" checked={sel.columnas.has(c.nombre)} onChange={() => alternarColumna(o.objeto, c.nombre)} />
                    <span className="min-w-0 flex-1 truncate font-mono">{c.nombre}</span>
                    {c.sensible && <Chip tono="aviso">sensible</Chip>}
                  </label>
                ))}
              </div>
              {sel.columnas.size === 0 && <p className="mt-1 text-xs text-danger">Elige al menos una columna.</p>}
            </fieldset>
          </div>
        )}
      </li>
    )
  }

  return (
    <Dialogo abierto titulo={editar ? 'Editar conexión a base de datos' : 'Conectar una base de datos'} onCerrar={onCerrar} ocupado={ocupado} ancho="max-w-2xl">
      <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Progreso">
        {PASOS.map((p, i) => (
          <li key={p.id} aria-current={i === idx ? 'step' : undefined} className={i === idx ? 'font-bold text-primary' : i < idx ? 'text-ink' : 'text-ink-muted'}>{i + 1}. {p.etiqueta}</li>
        ))}
      </ol>

      <div className="mt-4 max-h-[62dvh] space-y-4 overflow-y-auto px-0.5 pb-0.5">
        {error && (
          <Aviso tipo="error">
            {error.texto}{error.codigo && PISTA_ERROR[error.codigo] ? <> <span className="font-normal opacity-90">{PISTA_ERROR[error.codigo]}</span></> : null}
          </Aviso>
        )}
        {cargandoDetalle && <div className="p-6 text-center"><Spinner /></div>}

        {/* 1 · Tipo */}
        {!cargandoDetalle && paso === 'tipo' && (
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">Tu agente podrá consultar información de tu propia base de datos (por ejemplo productos, precios o existencias) para responder a tus clientes. Solo <strong>lee</strong>: nunca escribe ni borra.</p>
            <fieldset>
              <legend className="field-label">¿Qué tipo de base de datos tienes?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(info.motores.length ? info.motores : (['postgresql', 'mysql'] as MotorDb[])).map((m) => (
                  <label key={m} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${motor === m ? 'border-primary bg-primary-soft/40' : 'border-line'}`}>
                    <input type="radio" name="motor" className="mt-1 accent-primary" checked={motor === m} onChange={() => setMotor(m)} />
                    <span><span className="block font-semibold">{MOTORES[m].nombre}</span><span className="block text-xs text-ink-muted">{MOTORES[m].descripcion}</span></span>
                  </label>
                ))}
              </div>
              <p className="mt-1 text-xs text-ink-muted">¿No sabes cuál es? Pregúntale a quien te hizo el sistema o te da el hosting: te lo dirá en una frase.</p>
            </fieldset>
            <fieldset>
              <legend className="field-label">¿Cómo prefieres avanzar?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${nivel === 'tecnico' ? 'border-primary bg-primary-soft/40' : 'border-line'}`}>
                  <input type="radio" name="nivel" className="mt-1 accent-primary" checked={nivel === 'tecnico'} onChange={() => setNivel('tecnico')} />
                  <span><span className="block font-semibold">Sé de bases de datos</span><span className="block text-xs text-ink-muted">Te damos el script para crear el usuario de solo lectura y la vista.</span></span>
                </label>
                <label className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${nivel === 'ayuda' ? 'border-primary bg-primary-soft/40' : 'border-line'}`}>
                  <input type="radio" name="nivel" className="mt-1 accent-primary" checked={nivel === 'ayuda'} onChange={() => setNivel('ayuda')} />
                  <span><span className="block font-semibold">Necesito ayuda</span><span className="block text-xs text-ink-muted">Te damos un mensaje listo para enviar a quien administra tu base.</span></span>
                </label>
              </div>
            </fieldset>
          </div>
        )}

        {/* 2 · Preparar */}
        {!cargandoDetalle && paso === 'preparar' && (
          <div className="space-y-4">
            <section className="flex items-start gap-3 rounded-xl border border-line bg-muted/40 p-3">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Por tu seguridad, no uses tu usuario principal</p>
                <p className="text-ink-muted">Crea un usuario aparte que <strong>solo pueda leer</strong>, y de preferencia una <strong>vista</strong>: una «ventana» que muestra únicamente las columnas que quieras (sin datos personales ni cosas internas). Así, aunque algo fallara, tu información no se puede modificar y el agente solo ve lo que tú decidas.</p>
              </div>
            </section>

            {nivel === 'ayuda' ? (
              <section className="space-y-3">
                <h3 className="font-semibold">Qué hacer, paso a paso</h3>
                <ol className="list-decimal space-y-1.5 pl-5 text-sm text-ink-muted">
                  <li>Copia el mensaje de abajo y envíaselo a quien administra tu base de datos (tu proveedor de hosting o quien te hizo el sistema).</li>
                  <li>Esa persona te devolverá: la dirección del servidor, el puerto, el nombre de la base, un usuario y una contraseña.</li>
                  <li>Vuelve aquí y pulsa «Ya tengo mis datos» para continuar.</li>
                </ol>
                <div>
                  <label htmlFor="g-base-a" className="field-label">Nombre de tu base de datos <span className="font-normal text-ink-muted">(si lo sabes)</span></label>
                  <input id="g-base-a" className="field" value={base} onChange={(e) => setBase(e.target.value)} maxLength={128} placeholder="Ej.: mi_tienda" />
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-muted/50 p-3 text-xs">{mensajeParaProveedor(datosScript, nombreNegocio)}</pre>
                <BotonCopiar texto={mensajeParaProveedor(datosScript, nombreNegocio)} etiqueta="Copiar mensaje para mi proveedor" />
              </section>
            ) : (
              <section className="space-y-3">
                <h3 className="font-semibold">Requisitos</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
                  <li>Servidor accesible desde internet, con <strong>SSL activado</strong> (no se conecta sin cifrar).</li>
                  <li>Permite las conexiones entrantes desde nuestra IP: {info.ip_salida ? <span className="inline-flex items-center gap-1.5"><code className="rounded bg-muted px-1.5 py-0.5 font-mono text-ink">{info.ip_salida}</code><BotonCopiar texto={info.ip_salida} etiqueta="Copiar IP" /></span> : <em>consulta con soporte la IP de salida</em>}.</li>
                  <li>No se aceptan direcciones internas (localhost, 10.x, 192.168.x…).</li>
                </ul>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="g-base" className="field-label">Nombre de la base</label>
                    <input id="g-base" className="field" value={base} onChange={(e) => setBase(e.target.value)} maxLength={128} placeholder="mi_tienda" />
                  </div>
                  {motor === 'postgresql' && (
                    <div>
                      <label htmlFor="g-esq" className="field-label">Esquema</label>
                      <input id="g-esq" className="field" value={esquema} onChange={(e) => setEsquema(e.target.value)} maxLength={63} placeholder="public" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">Script de ejemplo ({MOTORES[motor].nombre})</h3>
                  <BotonCopiar texto={scriptSoloLectura(datosScript)} etiqueta="Copiar script" />
                </div>
                <pre className="max-h-64 overflow-auto rounded-xl border border-line bg-muted/50 p-3 text-xs">{scriptSoloLectura(datosScript)}</pre>
                <p className="text-xs text-ink-muted">Revísalo y adáptalo a tus tablas antes de ejecutarlo. Nosotros nunca vemos ni guardamos esa contraseña hasta que tú la escribes en el siguiente paso.</p>
              </section>
            )}
          </div>
        )}

        {/* 3 · Datos de conexión */}
        {!cargandoDetalle && paso === 'datos' && (
          <div className="space-y-4">
            {editar?.estado === 'requiere_atencion' && <Aviso tipo="error">La conexión dejó de funcionar. Revisa los datos (¿cambió la contraseña?) y vuelve a probar.</Aviso>}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="c-host" className="field-label">Dirección del servidor</label>
                <input id="c-host" className="field" value={host} onChange={(e) => setHost(e.target.value)} maxLength={253} autoComplete="off" spellCheck={false} placeholder="db.mitienda.com" autoFocus />
                <p className="mt-1 text-xs text-ink-muted">Solo el nombre o la IP, sin «http://».</p>
              </div>
              <div>
                <label htmlFor="c-puerto" className="field-label">Puerto</label>
                <input id="c-puerto" className="field" inputMode="numeric" value={puerto} onChange={(e) => setPuerto(e.target.value.replace(/\D/g, ''))} placeholder={String(MOTORES[motor].puerto)} />
              </div>
              <div>
                <label htmlFor="c-base" className="field-label">Base de datos</label>
                <input id="c-base" className="field" value={base} onChange={(e) => setBase(e.target.value)} maxLength={128} autoComplete="off" spellCheck={false} />
              </div>
              <div>
                <label htmlFor="c-user" className="field-label">Usuario</label>
                <input id="c-user" className="field" value={usuario} onChange={(e) => setUsuario(e.target.value)} maxLength={128} autoComplete="off" spellCheck={false} placeholder="operativai_lectura" />
              </div>
              <div>
                <label htmlFor="c-pass" className="field-label">Contraseña</label>
                <input id="c-pass" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={256} autoComplete="new-password"
                  placeholder={editar ? 'En blanco = conservar la actual' : ''} />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="c-ssl" className="field-label">Conexión</label>
                <select id="c-ssl" className="field" value={ssl} onChange={(e) => setSsl(e.target.value as 'require' | 'verify')}>
                  <option value="require">Cifrada (funciona con la mayoría de servidores)</option>
                  <option value="verify">Cifrada y verificando el certificado (más estricta)</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-ink-muted">La contraseña se guarda cifrada y nunca se vuelve a mostrar.</p>
          </div>
        )}

        {/* 4 · Qué ve el agente */}
        {!cargandoDetalle && paso === 'objetos' && resultado && (
          <div className="space-y-4">
            <Aviso tipo="ok">Conexión correcta. Ahora elige qué puede consultar tu agente.</Aviso>
            {hayRiesgo && permisos && (
              <div role="alert" className="space-y-2 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm">
                <p className="flex items-center gap-2 font-semibold text-danger"><Warning size={16} aria-hidden /> Este usuario puede modificar datos</p>
                {permisos.detalle.length > 0 && <ul className="list-disc pl-5 text-ink">{permisos.detalle.map((d) => <li key={d}>{d}</li>)}</ul>}
                <p className="text-ink-muted">Aunque OperativAI solo hace lecturas, es más seguro usar un usuario de <strong>solo lectura</strong>. Te recomendamos volver al paso «Preparar» y crear uno.</p>
                <button type="button" className="btn-ghost min-h-9 px-3 text-xs" onClick={() => ir('preparar')}><ArrowLeft size={13} aria-hidden /> Crear un usuario de solo lectura</button>
              </div>
            )}
            {resultado.objetos.length === 0 ? (
              <div className="space-y-2">
                <Aviso tipo="info">Este usuario no puede ver ninguna tabla ni vista. Crea una vista y dale permiso de lectura (SELECT) al usuario.</Aviso>
                <button type="button" className="btn-ghost" onClick={() => ir('preparar')}><ArrowLeft size={14} aria-hidden /> Ver cómo hacerlo</button>
              </div>
            ) : (
              <>
                {vistas.length === 0 && <Aviso tipo="info">No hay vistas. Puedes usar tablas, pero una vista te deja mostrar solo lo necesario (y ocultar datos personales). Te recomendamos crear una.</Aviso>}
                <p className="text-xs text-ink-muted">{elegidos.length} de {MAX_OBJETOS} permitidos elegidos. El agente solo verá lo que marques; las columnas que parecen contraseñas o datos delicados vienen desmarcadas.</p>
                {vistas.length > 0 && <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line" aria-label="Vistas">{vistas.map(filaObjeto)}</ul>}
                {tablas.length > 0 && <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line" aria-label="Tablas">{tablas.map(filaObjeto)}</ul>}
              </>
            )}
          </div>
        )}

        {/* 5 · Confirmar */}
        {!cargandoDetalle && paso === 'confirmar' && (
          <div className="space-y-4">
            <section className="rounded-xl border border-line p-3 text-sm">
              <p className="flex items-center gap-2 font-semibold"><Database size={16} aria-hidden /> {MOTORES[motor].nombre} · {host.trim()}:{puertoNum} · {base.trim()}</p>
              <ul className="mt-2 space-y-1 text-ink-muted">
                {elegidos.map(([k, v]) => <li key={k} className="flex items-center gap-2">{resultado?.objetos.find((o) => o.objeto === k)?.tipo === 'vista' ? <Eye size={14} aria-hidden /> : <Table size={14} aria-hidden />}<span className="font-mono text-ink">{k}</span> · {v.columnas.size} columnas</li>)}
              </ul>
            </section>
            <div>
              <label htmlFor="f-nombre" className="field-label">Nombre</label>
              <input id="f-nombre" className="field" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={255} />
              <p className="mt-1 text-xs text-ink-muted">Cómo la reconoces tú en tu lista.</p>
            </div>
            <div>
              <label htmlFor="f-desc" className="field-label">Cuándo debe consultarla el agente</label>
              <textarea id="f-desc" rows={3} maxLength={1000} value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                className="w-full resize-y rounded-xl border border-ink-muted/35 bg-surface p-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15" />
              <p className="mt-1 text-xs text-ink-muted">Lo lee la IA para decidir si la usa: sé concreto. Ej.: «Cuando el cliente pregunte por precios o existencias».</p>
            </div>
            {hayRiesgo && permisos && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm">
                <input type="checkbox" className="mt-1 size-4 accent-primary" checked={riesgo} onChange={(e) => setRiesgo(e.target.checked)} />
                <span>El usuario de esta base <strong>puede modificar datos</strong>. Entiendo el riesgo y quiero continuar de todos modos. Esta confirmación queda registrada.</span>
              </label>
            )}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 text-sm">
              <input type="checkbox" className="mt-1 size-4 accent-primary" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
              <span>Soy responsable de los datos que el agente podrá consultar y confirmo que tengo derecho a usarlos con este fin. Sé que parte de esa información podrá mostrarse a mis clientes en las conversaciones. Esta aceptación queda registrada.</span>
            </label>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn-ghost" onClick={onCerrar} disabled={ocupado}>Cancelar</button>
        <div className="flex gap-2">
          {idx > 0 && !(editar && paso === 'datos') && (
            <button type="button" className="btn-ghost" disabled={ocupado} onClick={() => ir(PASOS[idx - 1].id)}><ArrowLeft size={14} aria-hidden /> Atrás</button>
          )}
          {paso === 'tipo' && <button type="button" className="btn-primary" onClick={() => ir('preparar')}>Continuar <ArrowRight size={14} aria-hidden /></button>}
          {paso === 'preparar' && <button type="button" className="btn-primary" onClick={() => ir('datos')}>Ya tengo mis datos <ArrowRight size={14} aria-hidden /></button>}
          {paso === 'datos' && <button type="button" className="btn-primary" onClick={probar} disabled={!datosCompletos || ocupado || cargandoDetalle}>{ocupado ? 'Probando…' : 'Probar conexión'}</button>}
          {paso === 'objetos' && <button type="button" className="btn-primary" onClick={irAConfirmar} disabled={elegidos.length === 0}>Continuar <ArrowRight size={14} aria-hidden /></button>}
          {paso === 'confirmar' && <button type="button" className="btn-primary" onClick={guardar} disabled={!puedeConfirmar || ocupado}>{ocupado ? 'Guardando…' : editar ? 'Guardar cambios' : 'Conectar'}</button>}
        </div>
      </div>
    </Dialogo>
  )
}
