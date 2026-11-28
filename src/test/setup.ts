import { vi } from 'vitest'

// El índice de @phosphor-icons/react reexporta ~3000 archivos (uno por icono): importarlo en Node
// tarda varios segundos y era casi todo el tiempo de la suite. En tests los iconos son decorativos,
// así que cualquier icono es un <svg> vacío. Si un test necesita el icono real: vi.unmock(...).
vi.mock('@phosphor-icons/react', async () => {
  const { createElement } = await import('react')
  const Icono = (props: Record<string, unknown>) =>
    createElement('svg', { 'aria-hidden': props['aria-hidden'], className: props.className as string | undefined })
  return new Proxy({}, {
    get: (_, nombre) => (nombre === 'then' || typeof nombre === 'symbol' ? undefined : Icono),
    has: (_, nombre) => nombre !== 'then',
  })
})
