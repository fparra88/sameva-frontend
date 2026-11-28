// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Registro } from './Acceso'

vi.mock('../lib/auth', () => ({ useAuth: () => ({ estado: 'anonimo', iniciarConToken: vi.fn() }) }))
vi.mock('./EscenarioPortal', () => ({ EscenarioPortal: () => null }))

afterEach(cleanup)

const escribir = (id: string, valor: string) => fireEvent.change(document.getElementById(id)!, { target: { value: valor } })
const boton = () => screen.getByRole('button', { name: 'Continuar' }) as HTMLButtonElement

function montar() {
  render(<MemoryRouter><Registro /></MemoryRouter>)
  escribir('r-negocio', 'Ferretería')
  escribir('r-email', 'ana@ejemplo.com')
  fireEvent.click(screen.getByRole('checkbox'))
}

describe('Registro: contraseña', () => {
  it('el botón sigue bloqueado hasta cumplir todo y coincidir', () => {
    montar()
    expect(boton().disabled).toBe(true)

    escribir('r-pass', 'Clave2026')                   // falta el símbolo
    escribir('r-pass2', 'Clave2026')
    expect(screen.getByText(/Un símbolo/).textContent).toContain('falta')
    expect(boton().disabled).toBe(true)

    escribir('r-pass', 'Clave.2026')
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy()
    expect(document.getElementById('r-pass2')!.getAttribute('aria-invalid')).toBe('true')
    expect(boton().disabled).toBe(true)

    escribir('r-pass2', 'Clave.2026')
    expect(screen.getByText('Las contraseñas coinciden.')).toBeTruthy()
    expect(boton().disabled).toBe(false)
  })

  it('manda password y password_confirmacion a /auth/registro', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ email: 'ana@ejemplo.com', expira_en_minutos: 10, reenviar_en_segundos: 60 }), { status: 202 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    montar()
    escribir('r-pass', 'Clave.2026')
    escribir('r-pass2', 'Clave.2026')
    fireEvent.click(boton())

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/registro')
    expect(JSON.parse(init!.body as string)).toMatchObject({
      email: 'ana@ejemplo.com', password: 'Clave.2026', password_confirmacion: 'Clave.2026', acepta_terminos: true,
    })
  })
})
