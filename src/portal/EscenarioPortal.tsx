import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import './EscenarioPortal.css'

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const IcoBandeja = () => <svg viewBox="0 0 24 24" {...trazo}><path d="M4 5h16v11H9l-5 4V5Z" /></svg>
const IcoAgenda = () => <svg viewBox="0 0 24 24" {...trazo}><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /></svg>
const IcoCrm = () => <svg viewBox="0 0 24 24" {...trazo}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5" /></svg>
const IcoReportes = () => <svg viewBox="0 0 24 24" {...trazo}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>

/** Escenario ilustrado (decorativo) del lado derecho de Entrar/Registro. Solo CSS + escalado al espacio disponible. */
export function EscenarioPortal() {
  const caja = useRef<HTMLDivElement>(null)
  const escena = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const c = caja.current, s = escena.current
    if (!c || !s) return
    const ajustar = () => {
      const k = Math.min(c.clientWidth / 700, c.clientHeight / 670, 1.25)
      s.style.transform = `scale(${Math.max(k, 0.45)})`
    }
    ajustar()
    const ro = new ResizeObserver(ajustar)
    ro.observe(c)
    return () => ro.disconnect()
  }, [])

  const fondo = (c: string) => ({ background: c }) as CSSProperties

  return (
    <aside className="pt-stagepanel" aria-hidden>
      <div className="pt-stagebox" ref={caja}>
        <div className="pt-stage" ref={escena}>
          <svg className="pt-links" viewBox="0 0 680 650">
            <path d="M90 70 C130 70 120 130 160 130" />
            <path d="M60 165 C120 165 110 190 160 190" />
            <path d="M94 260 C130 260 120 250 160 250" />
          </svg>

          <div className="pt-chip pt-wa pt-float">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20l1.4-4.3A8 8 0 1 1 8.4 18.7L4 20Z" /><path d="M9.5 9c.3 2.3 2.2 4.2 4.5 4.5l1.2-1.2-1.8-.9-.8.6c-.8-.4-1.5-1.1-1.9-1.9l.6-.8-.9-1.8L9.5 9Z" fill="#fff" stroke="none" /></svg>
          </div>
          <div className="pt-chip pt-ig pt-float pt-f2">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17" cy="7" r="1" fill="#fff" stroke="none" /></svg>
          </div>
          <div className="pt-chip pt-fb pt-float pt-f3">
            <svg viewBox="0 0 24 24" fill="#fff"><path d="M13.5 21v-7.5h2.6l.5-3h-3.1V8.7c0-.9.3-1.5 1.6-1.5h1.6V4.5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2H7.5v3h2.8V21h3.2Z" /></svg>
          </div>

          <div className="pt-glass pt-inbox pt-float pt-f2">
            <div className="pt-ih">
              <div className="pt-bot">IA</div>
              <strong>Bandeja</strong>
              <span className="pt-live"><i></i>En vivo</span>
            </div>
            <div className="pt-chat pt-on">
              <div className="pt-av" style={fondo('#2F7BFF')}>M<u style={fondo('var(--wa)')}></u></div>
              <div className="pt-lines"><span></span><span></span></div><span className="pt-badge">2</span>
            </div>
            <div className="pt-chat">
              <div className="pt-av" style={fondo('#8A3AB9')}>J<u style={fondo('var(--ig)')}></u></div>
              <div className="pt-lines"><span></span><span></span></div>
            </div>
            <div className="pt-chat">
              <div className="pt-av" style={fondo('#0E9F9F')}>A<u style={fondo('var(--fb)')}></u></div>
              <div className="pt-lines"><span></span><span></span></div>
            </div>
            <div className="pt-conv">
              <div className="pt-b pt-in">¿Tienen cita el jueves?</div>
              <div className="pt-b pt-out">Sí. Jueves 4:00 p. m. Agendada ✓<br /><span className="pt-tag">AGENTE IA</span></div>
              <div className="pt-typing"><i></i><i></i><i></i></div>
            </div>
          </div>

          <img className="pt-dex" src="/imagenes/dex-portal.png" alt="" width={290} height={250} />
          <div className="pt-dextag"><i></i>Dex · tu agente IA</div>

          <div className="pt-glass pt-agenda pt-float">
            <div className="pt-card-t"><IcoAgenda />Agenda</div>
            <div className="pt-days">
              <i></i><i></i><i className="pt-e"></i><i></i><i></i><i></i><i></i>
              <i></i><i className="pt-e"></i><i></i><i className="pt-d"></i><i></i><i></i><i></i>
              <i></i><i></i><i></i><i className="pt-e"></i><i></i><i></i><i></i>
            </div>
            <div className="pt-ev"><i></i>4:00 p. m.</div>
          </div>

          <div className="pt-glass pt-report pt-float pt-f2">
            <div className="pt-card-t"><IcoReportes />Reportes</div>
            <div className="pt-bars"><i></i><i></i><i></i><i></i><i></i><i></i></div>
            <div className="pt-up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15l5-5 4 4 5-6" /></svg>+38%</div>
          </div>

          <div className="pt-glass pt-crm pt-float pt-f3">
            <div className="pt-card-t"><svg viewBox="0 0 24 24" {...trazo}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 5.2a3.5 3.5 0 0 1 0 5.6M18 14.8c2 .6 3.2 2.2 3.5 5" /></svg>CRM</div>
            <div className="pt-cols">
              <div className="pt-col"><b></b><i></i><i></i><i></i></div>
              <div className="pt-col"><b></b><i></i><i></i></div>
              <div className="pt-col"><b></b><i></i></div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-cap">
        <h2>Dex atiende.<br /><em>Tú decides.</em></h2>
        <div className="pt-tiles">
          <span className="pt-tile"><IcoBandeja />Bandeja</span>
          <span className="pt-tile"><IcoAgenda />Agenda</span>
          <span className="pt-tile"><IcoCrm />CRM</span>
          <span className="pt-tile"><IcoReportes />Reportes</span>
        </div>
      </div>
    </aside>
  )
}
