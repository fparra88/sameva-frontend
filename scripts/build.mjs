// `npm run build`: chequeo de tipos (tsc) y bundle (vite) en paralelo en vez de uno tras otro.
// Son independientes (tsconfig tiene noEmit y Vite no usa tsc). Si cualquiera falla, sale con error,
// así que un build con errores de tipos sigue fallando en Docker/CI igual que antes.
import { spawn } from 'node:child_process'

const correr = (nombre, args) => new Promise((resolve) => {
  const p = spawn(process.execPath, args, { stdio: 'inherit' })
  p.on('close', (code) => {
    if (code !== 0) console.error(`\n✗ ${nombre} falló (código ${code})`)
    resolve(code ?? 1)
  })
})

const codigos = await Promise.all([
  correr('tsc', ['node_modules/typescript/bin/tsc', '-b']),
  correr('vite build', ['node_modules/vite/bin/vite.js', 'build']),
])
process.exit(codigos.some((c) => c !== 0) ? 1 : 0)
