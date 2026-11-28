import { defineConfig } from 'vitest/config'

// Config aparte de vite.config.ts: los tests no necesitan Tailwind ni el plugin de React
// (el JSX lo transforma Vite con `jsx: react-jsx` del tsconfig), así arrancan más rápido.
// Entorno por defecto `node`; los archivos que necesitan DOM lo piden con
// `// @vitest-environment happy-dom` en la primera línea.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
  },
})
