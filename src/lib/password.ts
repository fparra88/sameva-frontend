/**
 * Regla de contraseñas nuevas: espejo de backend/services/politica_password.py.
 * Aquí solo sirve para avisar mientras se escribe; el servidor la vuelve a validar.
 * No se aplica al iniciar sesión (las contraseñas ya registradas siguen valiendo).
 */
export const PASSWORD_MIN = 8
export const PASSWORD_MAX = 128
export const SIMBOLOS = '@#$%.:'

export interface Requisito { clave: string; texto: string; cumple: boolean }

export function requisitosPassword(p: string): Requisito[] {
  return [
    { clave: 'largo', texto: `Al menos ${PASSWORD_MIN} caracteres`, cumple: [...p].length >= PASSWORD_MIN },
    { clave: 'letra', texto: 'Una letra', cumple: /\p{L}/u.test(p) },
    { clave: 'numero', texto: 'Un número', cumple: /[0-9]/.test(p) },
    { clave: 'simbolo', texto: `Un símbolo: ${[...SIMBOLOS].join(' ')}`, cumple: [...p].some((c) => SIMBOLOS.includes(c)) },
  ]
}

export const passwordValida = (p: string) => p.length <= PASSWORD_MAX && requisitosPassword(p).every((r) => r.cumple)
