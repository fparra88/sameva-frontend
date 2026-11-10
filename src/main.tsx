import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Spinner } from './components'
import { AuthProvider } from './lib/auth'
import Landing from './landing/Landing'
import './index.css'

// El portal se carga aparte: quien solo visita la landing no lo descarga.
const PortalLayout = lazy(() => import('./portal/PortalLayout'))
const Terminos = lazy(() => import('./landing/Legal').then((m) => ({ default: m.Terminos })))
const Privacidad = lazy(() => import('./landing/Legal').then((m) => ({ default: m.Privacidad })))
const Entrar = lazy(() => import('./portal/Acceso').then((m) => ({ default: m.Entrar })))
const Registro = lazy(() => import('./portal/Acceso').then((m) => ({ default: m.Registro })))
const Bandeja = lazy(() => import('./portal/bandeja/Bandeja'))
const Agente = lazy(() => import('./portal/agente/Agente'))
const Herramientas = lazy(() => import('./portal/herramientas/Herramientas'))
const Agenda = lazy(() => import('./portal/agenda/Agenda'))
const Ajustes = lazy(() => import('./portal/ajustes/Ajustes'))
const PagoExito = lazy(() => import('./portal/pagos/Retornos').then((m) => ({ default: m.PagoExito })))
const PagoError = lazy(() => import('./portal/pagos/Retornos').then((m) => ({ default: m.PagoError })))
const CobrosConectar = lazy(() => import('./portal/pagos/Retornos').then((m) => ({ default: m.CobrosConectar })))
const Reenviar = lazy(() => import('./portal/pagos/Retornos').then((m) => ({ default: m.Reenviar })))
const Canales = lazy(() => import('./portal/canales/Canales'))
const GerenciaLayout = lazy(() => import('./gerencia/GerenciaLayout'))
const Planes = lazy(() => import('./gerencia/Planes'))
const Negocios = lazy(() => import('./gerencia/Negocios'))
const Auditoria = lazy(() => import('./gerencia/Auditoria'))
const Incidencias = lazy(() => import('./gerencia/Incidencias'))
const Salud = lazy(() => import('./gerencia/Salud'))
const Consumo = lazy(() => import('./gerencia/Consumo'))
const Equipo = lazy(() => import('./gerencia/Equipo'))
const EnlaceSoporte = lazy(() => import('./portal/soporte/EnlaceSoporte'))
const VerComo = lazy(() => import('./gerencia/verComo'))
const Proximamente = lazy(() => import('./portal/Paginas').then((m) => ({ default: m.Proximamente })))

const cargando = <div className="grid min-h-dvh place-items-center"><Spinner /></div>

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={cargando}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/terminosycondiciones" element={<Terminos />} />
            <Route path="/avisodeprivacidad" element={<Privacidad />} />
            <Route path="/portal/entrar" element={<Entrar />} />
            <Route path="/portal/registro" element={<Registro />} />
            <Route path="/portal" element={<PortalLayout />}>
              <Route path="bandeja/:id?" element={<Bandeja />} />
              <Route path="conversaciones/*" element={<Navigate to="/portal/bandeja" replace />} />
              <Route path="agente" element={<Agente />} />
              <Route path="herramientas" element={<Herramientas />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="cuenta" element={<Ajustes />} />
              <Route path="pagos/exito" element={<PagoExito />} />
              <Route path="pagos/error" element={<PagoError />} />
              <Route path="cobros/conectar" element={<CobrosConectar />} />
              <Route path="canales" element={<Canales />} />
              <Route path="*" element={<Proximamente />} />
            </Route>
            <Route path="/gerencia" element={<GerenciaLayout />}>
              <Route path="negocios" element={<Negocios />} />
              <Route path="planes" element={<Planes />} />
              <Route path="incidencias" element={<Incidencias />} />
              <Route path="salud" element={<Salud />} />
              <Route path="consumo" element={<Consumo />} />
              <Route path="equipo" element={<Equipo />} />
              <Route path="auditoria" element={<Auditoria />} />
              <Route path="*" element={<Navigate to="/gerencia/negocios" replace />} />
            </Route>
            {/* Pestaña de soporte ("ver como"): recibe el token de Gerencia y pasa al portal del negocio. */}
            <Route path="/soporte/ver-como" element={<VerComo />} />
            {/* Enlace del correo: el dueño aprueba o rechaza la edición de soporte sin iniciar sesión. */}
            <Route path="/acceso-soporte" element={<EnlaceSoporte />} />
            {/* Enlaces de retorno que arma la API sobre BASE_URL_FRONTEND (rutas de la versión anterior). */}
            <Route path="/canales" element={<Reenviar a="/portal/canales" />} />
            <Route path="/suscripcion" element={<Reenviar a="/portal/cuenta?vista=suscripcion" />} />
            <Route path="/pagos/exito" element={<Reenviar a="/portal/pagos/exito" />} />
            <Route path="/pagos/error" element={<Reenviar a="/portal/pagos/error" />} />
            <Route path="/cobros/conectar" element={<Reenviar a="/portal/cobros/conectar" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
