import './Canales.css'

/**
 * Escenario animado de «Canales»: tres canales → agente → bandeja unificada.
 * Las animaciones son SVG nativas (SMIL) + CSS; ver Canales.css. Respeta prefers-reduced-motion.
 */
export function EscenarioCanales() {
  return (
    <div className="cn-escenario" style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', rowGap: '28px' }}>

      <div style={{ flex: '1 1 340px', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <article className="cn-card" style={{ boxSizing: 'border-box', height: '112px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#FFFFFF', border: '1px solid #DDE3F5', borderRadius: '22px' }}>
      <div style={{ flex: '0 0 60px', width: '60px', height: '60px', borderRadius: '18px', background: '#E3F6EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-8.1 14.4L2.7 21.5l4.7-1.2A9.5 9.5 0 1 0 12 2.5Z" fill="none" stroke="#128C48" strokeWidth="1.8" strokeLinejoin="round"></path><path d="M8.6 7.9c.3-.6.6-.6.9-.6h.5c.2 0 .4.1.5.4l.8 1.9c.1.2 0 .4-.1.6l-.5.7c-.1.2-.1.3 0 .5.6 1 1.5 1.9 2.7 2.4.2.1.4.1.5-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.3.3.6-.2.9-1 1.6-2 1.6-3 0-6.2-3.2-6.2-6.3 0-.8.1-1.4.5-2.2Z" fill="#128C48"></path></svg>
      </div>
      <div style={{ minWidth: '0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <h3 style={{ margin: '0', fontSize: '20px', lineHeight: '1.2', fontWeight: '800' }}>WhatsApp</h3>
      <p style={{ margin: '0', fontSize: '15px', lineHeight: '1.35', color: '#46506E' }}>Atiende, cotiza y agenda</p>
      <span style={{ alignSelf: 'flex-start', marginTop: '5px', padding: '3px 10px', borderRadius: '999px', background: '#E3F6EA', color: '#0F6B37', fontSize: '12px', fontWeight: '700' }}>Business API o código QR</span>
      </div>
      </article>

      <article className="cn-card" style={{ boxSizing: 'border-box', height: '112px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#FFFFFF', border: '1px solid #DDE3F5', borderRadius: '22px' }}>
      <div style={{ flex: '0 0 60px', width: '60px', height: '60px', borderRadius: '18px', background: '#FDE7F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="#C2188A" strokeWidth="1.9"></rect><circle cx="12" cy="12" r="4.2" fill="none" stroke="#C2188A" strokeWidth="1.9"></circle><circle cx="17.4" cy="6.6" r="1.2" fill="#C2188A"></circle></svg>
      </div>
      <div style={{ minWidth: '0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <h3 style={{ margin: '0', fontSize: '20px', lineHeight: '1.2', fontWeight: '800' }}>Instagram</h3>
      <p style={{ margin: '0', fontSize: '15px', lineHeight: '1.35', color: '#46506E' }}>Cada mensaje, un lead</p>
      <span style={{ alignSelf: 'flex-start', marginTop: '5px', padding: '3px 10px', borderRadius: '999px', background: '#FDE7F4', color: '#A3126F', fontSize: '12px', fontWeight: '700' }}>Cuenta profesional + Meta</span>
      </div>
      </article>

      <article className="cn-card" style={{ boxSizing: 'border-box', height: '112px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: '#FFFFFF', border: '1px solid #DDE3F5', borderRadius: '22px' }}>
      <div style={{ flex: '0 0 60px', width: '60px', height: '60px', borderRadius: '18px', background: '#E4EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" fill="#1668D8"></path></svg>
      </div>
      <div style={{ minWidth: '0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <h3 style={{ margin: '0', fontSize: '20px', lineHeight: '1.2', fontWeight: '800' }}>Facebook</h3>
      <p style={{ margin: '0', fontSize: '15px', lineHeight: '1.35', color: '#46506E' }}>Messenger atendido 24/7</p>
      <span style={{ alignSelf: 'flex-start', marginTop: '5px', padding: '3px 10px', borderRadius: '999px', background: '#E4EEFF', color: '#1255B8', fontSize: '12px', fontWeight: '700' }}>Inicia sesión con Meta</span>
      </div>
      </article>

      </div>

      <div className="cn-link" style={{ flex: '0 0 260px', width: '260px', height: '368px', position: 'relative' }}>
      <div style={{ position: 'absolute', left: '74px', top: '128px', width: '112px', height: '112px', borderRadius: '50%', background: '#FFFFFF', boxShadow: '0 0 0 10px rgba(72,205,235,.14), 0 20px 32px -8px rgba(14,27,61,.45)' }}></div>
      <svg width="260" height="368" viewBox="0 0 260 368" style={{ position: 'absolute', inset: '0' }} role="img" aria-label="Los tres canales se conectan al agente, que los envía a la bandeja">
      <path id="r1" d="M0 56 C 62 56, 40 184, 74 184" fill="none" stroke="#1FA855" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 9"><animate attributeName="stroke-dashoffset" from="0" to="-11" dur="0.9s" repeatCount="indefinite"></animate></path>
      <path id="r2" d="M0 184 L 74 184" fill="none" stroke="#D6249F" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 9"><animate attributeName="stroke-dashoffset" from="0" to="-11" dur="0.9s" repeatCount="indefinite"></animate></path>
      <path id="r3" d="M0 312 C 62 312, 40 184, 74 184" fill="none" stroke="#1877F2" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 9"><animate attributeName="stroke-dashoffset" from="0" to="-11" dur="0.9s" repeatCount="indefinite"></animate></path>
      <path id="r4" d="M186 184 L 260 184" fill="none" stroke="#3B4FD1" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 9"><animate attributeName="stroke-dashoffset" from="0" to="-11" dur="0.9s" repeatCount="indefinite"></animate></path>
      <circle r="5" fill="#1FA855"><animateMotion dur="2s" repeatCount="indefinite" path="M0 56 C 62 56, 40 184, 74 184"></animateMotion></circle>
      <circle r="5" fill="#D6249F"><animateMotion dur="2s" begin="0.6s" repeatCount="indefinite" path="M0 184 L 74 184"></animateMotion></circle>
      <circle r="5" fill="#1877F2"><animateMotion dur="2s" begin="1.2s" repeatCount="indefinite" path="M0 312 C 62 312, 40 184, 74 184"></animateMotion></circle>
      <circle r="5" fill="#3B4FD1"><animateMotion dur="1.4s" repeatCount="indefinite" path="M186 184 L 260 184"></animateMotion></circle>
      <circle cx="0" cy="56" r="5" fill="#1FA855"></circle>
      <circle cx="0" cy="184" r="5" fill="#D6249F"></circle>
      <circle cx="0" cy="312" r="5" fill="#1877F2"></circle>
      <circle cx="260" cy="184" r="5" fill="#3B4FD1"></circle>
      <g transform="translate(130 184)">
      <circle r="56" fill="#48CDEB" opacity="0.4"><animate attributeName="r" values="56;98" dur="2.4s" repeatCount="indefinite"></animate><animate attributeName="opacity" values="0.4;0" dur="2.4s" repeatCount="indefinite"></animate></circle>
      <circle r="56" fill="#48CDEB" opacity="0.4"><animate attributeName="r" values="56;98" dur="2.4s" begin="1.2s" repeatCount="indefinite"></animate><animate attributeName="opacity" values="0.4;0" dur="2.4s" begin="1.2s" repeatCount="indefinite"></animate></circle>
      <g>
      <animateTransform attributeName="transform" type="scale" values="1;1.08;1;1.05;1" keyTimes="0;0.15;0.3;0.45;1" dur="1.4s" repeatCount="indefinite"></animateTransform>
      <circle r="54" fill="#FFFFFF" stroke="#48CDEB" strokeWidth="4"></circle>
      <clipPath id="owlclip"><circle r="50"></circle></clipPath>
      <image href="/imagenes/agente-dex.png" x="-60" y="-58" width="108" height="108" clipPath="url(#owlclip)"></image>
      </g>
      </g>
      </svg>
      <div style={{ position: 'absolute', left: '0', right: '0', top: '262px', textAlign: 'center', fontSize: '14px', fontWeight: '800', color: '#0E1B3D' }}>Tu agente IA</div>
      </div>

      <div style={{ flex: '1 1 360px', minWidth: '0', boxSizing: 'border-box', minHeight: '368px', background: '#FFFFFF', border: '1px solid #DDE3F5', borderRadius: '26px', boxShadow: '0 1px 0 #FFFFFF inset, 0 4px 8px rgba(14,27,61,.06), 0 34px 60px -26px rgba(14,27,61,.40)', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid #E8ECF8' }}>
      <span style={{ fontSize: '17px', fontWeight: '800' }}>Bandeja unificada</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#0F6B37' }}><span className="cn-live" style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#1FA855', display: 'inline-block' }}></span>En vivo</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0' }}>
      <div style={{ position: 'relative', flex: '0 0 44px', width: '44px', height: '44px', borderRadius: '50%', background: '#E3F6EA', color: '#0F6B37', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>M
      <span style={{ position: 'absolute', right: '-4px', bottom: '-4px', width: '20px', height: '20px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px #DDE3F5' }}><svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-8.1 14.4L2.7 21.5l4.7-1.2A9.5 9.5 0 1 0 12 2.5Z" fill="#128C48"></path></svg></span>
      </div>
      <div style={{ flex: '1 1 auto', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '15px', fontWeight: '700' }}>María G.</span>
      <span style={{ fontSize: '14px', color: '#46506E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>¿Tienen esta talla disponible?</span>
      </div>
      <span style={{ flex: '0 0 auto', padding: '4px 10px', borderRadius: '999px', background: '#E6EBFF', color: '#2B3FB8', fontSize: '12px', fontWeight: '700' }}>Cotizando</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0' }}>
      <div style={{ position: 'relative', flex: '0 0 44px', width: '44px', height: '44px', borderRadius: '50%', background: '#FDE7F4', color: '#A3126F', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>L
      <span style={{ position: 'absolute', right: '-4px', bottom: '-4px', width: '20px', height: '20px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px #DDE3F5' }}><svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="#C2188A" strokeWidth="3"></rect><circle cx="12" cy="12" r="4" fill="none" stroke="#C2188A" strokeWidth="3"></circle></svg></span>
      </div>
      <div style={{ flex: '1 1 auto', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '15px', fontWeight: '700' }}>Luis R.</span>
      <span style={{ fontSize: '14px', color: '#46506E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Vi su publicación de ayer</span>
      </div>
      <span style={{ flex: '0 0 auto', padding: '4px 10px', borderRadius: '999px', background: '#FDE7F4', color: '#A3126F', fontSize: '12px', fontWeight: '700' }}>Nuevo lead</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0' }}>
      <div style={{ position: 'relative', flex: '0 0 44px', width: '44px', height: '44px', borderRadius: '50%', background: '#E4EEFF', color: '#1255B8', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A
      <span style={{ position: 'absolute', right: '-4px', bottom: '-4px', width: '20px', height: '20px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px #DDE3F5' }}><svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" fill="#1668D8"></path></svg></span>
      </div>
      <div style={{ flex: '1 1 auto', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '15px', fontWeight: '700' }}>Ana P.</span>
      <span style={{ fontSize: '14px', color: '#46506E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>¿Atienden el sábado?</span>
      </div>
      <span style={{ flex: '0 0 auto', padding: '4px 10px', borderRadius: '999px', background: '#E3F6EA', color: '#0F6B37', fontSize: '12px', fontWeight: '700' }}>Cita agendada</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px 0' }}>
      <div style={{ position: 'relative', flex: '0 0 44px', width: '44px', height: '44px', borderRadius: '50%', background: '#E3F6EA', color: '#0F6B37', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>C
      <span style={{ position: 'absolute', right: '-4px', bottom: '-4px', width: '20px', height: '20px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 1px #DDE3F5' }}><svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-8.1 14.4L2.7 21.5l4.7-1.2A9.5 9.5 0 1 0 12 2.5Z" fill="#128C48"></path></svg></span>
      </div>
      <div style={{ flex: '1 1 auto', minWidth: '0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '15px', fontWeight: '700' }}>Carlos M.</span>
      <span style={{ fontSize: '14px', color: '#46506E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Gracias, quedó perfecto</span>
      </div>
      <span style={{ flex: '0 0 auto', padding: '4px 10px', borderRadius: '999px', background: '#EEF1F8', color: '#3A4466', fontSize: '12px', fontWeight: '700' }}>Resuelto</span>
      </div>

      </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px' }}>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '10px 20px 10px 12px', background: '#FFFFFF', border: '1px solid #DDE3F5', borderRadius: '999px' }}>
      <span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E6EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z" fill="none" stroke="#2B3FB8" strokeWidth="2" strokeLinejoin="round"></path></svg></span>
      <span style={{ fontSize: '15px', fontWeight: '700' }}>Mismo tono</span>
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '10px 20px 10px 12px', background: '#FFFFFF', border: '1px solid #DDE3F5', borderRadius: '999px' }}>
      <span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E6EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" fill="none" stroke="#2B3FB8" strokeWidth="2" strokeLinejoin="round"></path><path d="M9 9h6M9 13h6" stroke="#2B3FB8" strokeWidth="2" strokeLinecap="round"></path></svg></span>
      <span style={{ fontSize: '15px', fontWeight: '700' }}>Misma información</span>
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '10px 20px 10px 12px', background: '#FFFFFF', border: '1px solid #DDE3F5', borderRadius: '999px' }}>
      <span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E6EBFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="#2B3FB8" strokeWidth="2"></circle><path d="M12 7.5V12l3 2" fill="none" stroke="#2B3FB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg></span>
      <span style={{ fontSize: '15px', fontWeight: '700' }}>Activo 24/7</span>
      </div>

      </div>
    </div>
  )
}
