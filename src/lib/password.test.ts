import { describe, expect, it } from 'vitest'
import { passwordValida, requisitosPassword } from './password'

// Mismos casos que backend/tests/test_politica_password.py: si cambia la regla, cambian los dos.
const faltantes = (p: string) => requisitosPassword(p).filter((r) => !r.cumple).map((r) => r.clave)

describe('regla de contraseña (espejo de politica_password.py)', () => {
  it.each([
    'Clave.2026', 'abc@1234', 'a#1aaaaa', 'x$9yyyyy', 'q%5wwwww', 'z.0zzzzz', 'm:7mmmmm', 'ñandú#12', 'Otra-cosa!_1.', '  esp@cio 1 ',
  ])('%s cumple', (p) => {
    expect(faltantes(p)).toEqual([])
    expect(passwordValida(p)).toBe(true)
  })

  it.each([
    ['Cl.1', 'largo'],
    ['12345678@', 'letra'],
    ['sinnumero@', 'numero'],
    ['Clave²³⁴.x', 'numero'],
    ['Clave1234', 'simbolo'],
    ['Clave-123!', 'simbolo'],
  ])('%s: falta %s', (p, falta) => {
    expect(faltantes(p)).toEqual([falta])
    expect(passwordValida(p)).toBe(false)
  })

  it('tope de 128', () => {
    expect(passwordValida('Aa.1'.repeat(32))).toBe(true)
    expect(passwordValida('Aa.1'.repeat(33))).toBe(false)
  })
})
