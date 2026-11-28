// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { enmascararCorreo } from '../lib/formato'
import { Entrar, Recuperar } from './Acceso'

vi.mock('../lib/auth', () => ({ useAuth: () => ({ estado: 'anonimo', entrar: vi.fn() }) }))
vi.mock('./EscenarioPortal', () => ({ EscenarioPortal: () => null }))

afterEach(cleanup)

const escribir = (id: string, valor: string) => fireEvent.change(document.getElementById(id)!, { target: { value: valor } })
const res = (status: number, cuerpo?: unknown) => new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status })
const SOLICITADA = { expira_en_minutos: 5, reenviar_en_segundos: 60 }

function EstadoEntrar() {
  const s = useLocation().state as { aviso?: string; email?: string } | null
  return <p>entrar:{s?.email}:{s?.aviso}</p>
}

function montar(inicio: { pathname: string; state?: unknown } = { pathname: '/portal/recuperar' }) {
  render(
    <MemoryRouter initialEntries={[inicio]}>
      <Routes>
        <Route path="/portal/recuperar" element={<Recuperar />} />
        <Route path="/portal/entrar" element={<EstadoEntrar />} />
      </Routes>
    </MemoryRouter>,
  )
}

it('enmascararCorreo', () => {
  expect(enmascararCorreo('fernanda@gmail.com')).toBe('fe••••••@gmail.com')
  expect(enmascararCorreo(' al@x.mx ')).toBe('a•••@x.mx')
  expect(enmascararCorreo('a@x.mx')).toBe('a•••@x.mx')
  expect(enmascararCorreo('sin-arroba')).toBe('sin-arroba')
})

describe('Recuperar contraseña', () => {
  it('pide el correo completo, muestra solo una parte y no dice si existe', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(res(202, SOLICITADA))
    vi.stubGlobal('fetch', fetchMock)
    montar()
    escribir('rc-email', 'fernanda@gmail.com')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }))

    await screen.findByText('Revisa tu correo')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/recuperar/solicitar')
    expect(JSON.parse(init!.body as string)).toEqual({ email: 'fernanda@gmail.com' })
    expect(screen.getByText('fe••••••@gmail.com')).toBeTruthy()
    expect(document.body.textContent).toContain('Si fe••••••@gmail.com tiene una cuenta')
    expect(document.body.textContent).not.toContain('fernanda@gmail.com')
  })

  it('canjea el código con la contraseña nueva y vuelve a Entrar con aviso', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(res(202, SOLICITADA)).mockResolvedValueOnce(res(204))
    vi.stubGlobal('fetch', fetchMock)
    montar({ pathname: '/portal/recuperar', state: { email: 'ana@ejemplo.com' } })
    // El correo llega ya escrito desde Entrar.
    expect((document.getElementById('rc-email') as HTMLInputElement).value).toBe('ana@ejemplo.com')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByText('Revisa tu correo')

    const cambiar = () => screen.getByRole('button', { name: 'Cambiar contraseña' }) as HTMLButtonElement
    escribir('rc-codigo', '12a3456')               // solo dígitos
    expect((document.getElementById('rc-codigo') as HTMLInputElement).value).toBe('123456')
    escribir('rc-pass', 'Clave.2026')
    escribir('rc-pass2', 'Clave.2027')
    expect(cambiar().disabled).toBe(true)
    escribir('rc-pass2', 'Clave.2026')
    expect(cambiar().disabled).toBe(false)
    fireEvent.click(cambiar())

    await screen.findByText(/^entrar:ana@ejemplo.com:Listo/)
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/recuperar/restablecer')
    expect(JSON.parse(fetchMock.mock.calls[1][1]!.body as string)).toEqual({
      email: 'ana@ejemplo.com', codigo: '123456', password: 'Clave.2026', password_confirmacion: 'Clave.2026',
    })
  })

  it('código incorrecto: muestra el error genérico de la API y se queda', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>()
      .mockResolvedValueOnce(res(202, SOLICITADA))
      .mockResolvedValueOnce(res(400, { detail: 'El código es incorrecto o ya venció. Solicita uno nuevo.' })))
    montar()
    escribir('rc-email', 'ana@ejemplo.com')
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    await screen.findByText('Revisa tu correo')
    escribir('rc-codigo', '000000')
    escribir('rc-pass', 'Clave.2026')
    escribir('rc-pass2', 'Clave.2026')
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar contraseña' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('El código es incorrecto o ya venció'))
    expect(screen.getByText('Revisa tu correo')).toBeTruthy()
  })
})

describe('Entrar', () => {
  it('«¿Olvidaste tu contraseña?» lleva el correo escrito', async () => {
    render(
      <MemoryRouter initialEntries={['/portal/entrar']}>
        <Routes>
          <Route path="/portal/entrar" element={<Entrar />} />
          <Route path="/portal/recuperar" element={<Recuperar />} />
        </Routes>
      </MemoryRouter>,
    )
    escribir('l-email', ' ana@ejemplo.com ')
    fireEvent.click(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' }))
    await screen.findByText('Recupera tu contraseña')
    expect((document.getElementById('rc-email') as HTMLInputElement).value).toBe('ana@ejemplo.com')
  })

  it('muestra el aviso y el correo al volver de Recuperar', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/portal/entrar', state: { email: 'ana@ejemplo.com', aviso: 'Listo, ya cambiaste tu contraseña.' } }]}>
        <Entrar />
      </MemoryRouter>,
    )
    expect(screen.getByRole('status').textContent).toBe('Listo, ya cambiaste tu contraseña.')
    expect((document.getElementById('l-email') as HTMLInputElement).value).toBe('ana@ejemplo.com')
  })
})
