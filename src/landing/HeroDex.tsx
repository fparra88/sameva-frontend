import './HeroDex.css'

/**
 * Visual del hero: Dex en su órbita con tarjetas de canales, integración e implementación.
 * Animación solo con CSS (HeroDex.css): entrada escalonada y movimiento en reposo; respeta prefers-reduced-motion.
 */
export function HeroDex() {
  return (
    <div className="hd-orbit" style={{ position: 'relative', width: '100%', maxWidth: '640px', aspectRatio: '1 / 1' }}>

    <div className="hd-stage" style={{ position: 'absolute', inset: '0' }}>
    <div className="hd-halo" style={{ position: 'absolute', inset: '9%', borderRadius: '50%', background: 'radial-gradient(circle at 50% 45%, #FFFFFF 0%, #DCE6FA 62%, #C9D8F6 100%)' }}></div>
    <svg aria-hidden="true" viewBox="0 0 582 582" style={{ position: 'absolute', inset: '0', width: '100%', height: '100%' }} fill="none">
    <g className="hd-spin">
    <circle cx="291" cy="291" r="262" stroke="#9FB6E8" strokeWidth="2" strokeDasharray="3 9" strokeLinecap="round"></circle>
    <circle cx="291" cy="291" r="190" stroke="#C3D3F3" strokeWidth="1.5"></circle>
    <circle cx="422" cy="64" r="7" fill="#0A3AA8"></circle>
    <circle cx="537" cy="381" r="7" fill="#0A3AA8"></circle>
    <circle cx="106" cy="476" r="7" fill="#0A3AA8"></circle>
    <circle cx="188" cy="552" r="4" fill="#9FB6E8"></circle>
    <circle cx="470" cy="500" r="4" fill="#9FB6E8"></circle>
    </g>
    <path className="hd-spark hd-spark-1" d="M268 24c1.5 8 3.5 10 12 12-8.5 2-10.5 4-12 12-1.5-8-3.5-10-12-12 8.5-2 10.5-4 12-12z" fill="#0A3AA8" opacity="0.85"></path>
    <path className="hd-spark hd-spark-2" d="M556 300c1 5.5 2.5 7 8 8-5.5 1-7 2.5-8 8-1-5.5-2.5-7-8-8 5.5-1 7-2.5 8-8z" fill="#7FA0E6"></path>
    <path className="hd-spark hd-spark-3" d="M60 380c1 5.5 2.5 7 8 8-5.5 1-7 2.5-8 8-1-5.5-2.5-7-8-8 5.5-1 7-2.5 8-8z" fill="#7FA0E6"></path>
    </svg>
    <div className="hd-owl" style={{ position: 'absolute', left: '11%', top: '17%', width: '78%' }}>
    <img src="/imagenes/dex-saluda.webp" alt="Dex, la mascota búho de IA, saluda con el ala y un globo de mensaje" width={1094} height={947} fetchPriority="high" style={{ display: 'block', width: '100%', height: 'auto', filter: 'drop-shadow(0 24px 30px rgba(11,27,74,0.22))' }} />
    </div>

    <div aria-hidden="true" className="hd-badge hd-badge-1" style={{ position: 'absolute', left: '1.9%', top: '38%', width: '44px', height: '44px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid #D5DBEC', boxShadow: '0 8px 18px rgba(11,27,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A3AA8' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5h16v10H12l-5 4v-4H4z"></path><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01"></path></svg>
    </div>
    <div aria-hidden="true" className="hd-badge hd-badge-2" style={{ position: 'absolute', left: '89.7%', top: '34.5%', width: '44px', height: '44px', borderRadius: '50%', background: '#FFFFFF', border: '1px solid #D5DBEC', boxShadow: '0 8px 18px rgba(11,27,74,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0A3AA8' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 20V12M12 20V5M19 20v-5"></path></svg>
    </div>
    </div>

    <div className="hd-card hd-card-1" style={{ position: 'absolute', left: '0', top: '0', width: '262px', boxSizing: 'border-box', padding: '14px 16px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #D5DBEC', boxShadow: '0 14px 30px rgba(11,27,74,0.13)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A5578' }}>Canales</span>
    <div style={{ display: 'flex', gap: '8px' }}>
    <span aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#DDF5E7', color: '#0E7A3D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.5L3.5 20.5l1.5-4.5A8.5 8.5 0 1 1 20.5 11.5z"></path><path d="M9 8.8c0 3.2 2.8 6 6 6l1.2-1.5-2-1-.9.8a3.5 3.5 0 0 1-1.7-1.7l.8-.9-1-2z"></path></svg>
    </span>
    <span aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FCE3EF', color: '#B0155A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="5"></rect><circle cx="12" cy="12" r="4"></circle><circle cx="17" cy="7" r="0.8" fill="currentColor"></circle></svg>
    </span>
    <span aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E0EAFF', color: '#1650BF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5l.5-3.5h-3V9c0-.3.2-.5.5-.5z"></path></svg>
    </span>
    </div>
    <span style={{ fontSize: '14px', fontWeight: '600', lineHeight: '1.3', color: '#0B1B4A' }}>WhatsApp, Instagram y Facebook</span>
    </div>

    <div className="hd-card hd-card-2" style={{ position: 'absolute', right: '0', bottom: '12%', width: '282px', boxSizing: 'border-box', padding: '14px 16px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #D5DBEC', boxShadow: '0 14px 30px rgba(11,27,74,0.13)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
    <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A5578' }}>Integración</span>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
    <span aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E0EAFF', color: '#0A3AA8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1 12H6L5 8z"></path><path d="M9 8V6.5a3 3 0 0 1 6 0V8"></path></svg>
    </span>
    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0B1B4A' }}>Ventas</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
    <span aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E0EAFF', color: '#0A3AA8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9z"></path><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"></path></svg>
    </span>
    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0B1B4A' }}>Inventario</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
    <span aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#E0EAFF', color: '#0A3AA8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"></rect><path d="M3 10h18"></path><circle cx="16.5" cy="14.5" r="1.1" fill="currentColor"></circle></svg>
    </span>
    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0B1B4A' }}>Cobranza</span>
    </div>
    </div>
    </div>

    <div className="hd-card hd-card-3" style={{ position: 'absolute', left: '0', bottom: '0', width: '262px', boxSizing: 'border-box', padding: '14px 16px', borderRadius: '16px', background: '#FFFFFF', border: '1px solid #D5DBEC', boxShadow: '0 14px 30px rgba(11,27,74,0.13)', display: 'flex', alignItems: 'center', gap: '12px' }}>
    <span aria-hidden="true" style={{ flex: 'none', width: '44px', height: '44px', borderRadius: '12px', background: '#0A3AA8', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="3"></rect><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"></path></svg>
    </span>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}><span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgb(74, 85, 120)' }}>Implementación</span><span style={{ fontSize: '14px', fontWeight: '600', lineHeight: '1.3', color: 'rgb(11, 27, 74)' }}>Acompañada de asesores de confianza</span></div>
    </div>

    </div>
  )
}
