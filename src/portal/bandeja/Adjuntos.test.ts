import { describe, expect, it } from 'vitest'
import { errorArchivo, esImagen, tamano } from './Adjuntos'

const MB = 1024 * 1024
// File con tamaño simulado: no hace falta reservar 16 MB de memoria.
const archivo = (nombre: string, size: number) => Object.defineProperty(new File([], nombre), 'size', { value: size })

describe('errorArchivo() (mismos topes que services/adjuntos.py)', () => {
  it.each([
    ['foto.jpg', 5 * MB], ['foto.JPEG', 1], ['captura.png', 100], ['cotizacion.pdf', 16 * MB], ['contrato.docx', 10],
  ])('%s de %i bytes se acepta', (nombre, size) => {
    expect(errorArchivo(archivo(nombre, size))).toBeNull()
  })
  it('rechaza tipos no admitidos (incluido audio)', () => {
    for (const n of ['nota.ogg', 'video.mp4', 'hoja.xlsx', 'viejo.doc', 'sin_extension']) {
      expect(errorArchivo(archivo(n, 10))).toMatch(/Solo se pueden enviar/)
    }
  })
  it('rechaza vacíos y los que pasan el tope', () => {
    expect(errorArchivo(archivo('a.png', 0))).toBe('El archivo está vacío.')
    expect(errorArchivo(archivo('a.png', 5 * MB + 1))).toBe('La imagen pesa más de 5 MB.')
    expect(errorArchivo(archivo('a.pdf', 16 * MB + 1))).toBe('El documento pesa más de 16 MB.')
  })
})

it('esImagen por MIME o extensión', () => {
  expect(esImagen('image/png')).toBe(true)
  expect(esImagen('foto.JPG')).toBe(true)
  expect(esImagen('application/pdf')).toBe(false)
})

it('tamano()', () => {
  expect(tamano(10)).toBe('1 KB')
  expect(tamano(2048)).toBe('2 KB')
  expect(tamano(1.5 * MB)).toBe('1.5 MB')
})
