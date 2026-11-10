import { Hero } from './Hero'
import { Navbar } from './Navbar'
import { Canales, Caso, ComoFunciona, Contacto, Footer, Operacion, Portal, Precios, Preguntas } from './Secciones'

export default function Landing() {
  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">
        <Hero />
        <Canales />
        <ComoFunciona />
        <Operacion />
        <Portal />
        <Caso />
        <Precios />
        <Preguntas />
        <Contacto />
      </main>
      <Footer />
    </>
  )
}
