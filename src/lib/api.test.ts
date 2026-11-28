import { beforeEach, describe, expect, it, vi } from 'vitest'

// api.ts guarda estado de módulo (token, refresh en curso, modo soporte): cada test usa una copia nueva.
let m: typeof import('./api')
const fetchMock = vi.fn<typeof fetch>()

const json = (status: number, cuerpo?: unknown, headers: Record<string, string> = {}) =>
  new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status, headers })

beforeEach(async () => {
  vi.resetModules()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  m = await import('./api')
})

const headersDe = (n: number) => fetchMock.mock.calls[n][1]!.headers as Record<string, string>

describe('api()', () => {
  it('manda credenciales, Bearer y JSON', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: 1 }))
    m.setAccessToken('tok')
    await expect(m.api('/x', { method: 'POST', body: { a: 1 } })).resolves.toEqual({ ok: 1 })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/x')
    expect(init).toMatchObject({ method: 'POST', credentials: 'include', body: '{"a":1}' })
    expect(headersDe(0)).toMatchObject({ Authorization: 'Bearer tok', 'Content-Type': 'application/json' })
  })

  it('con FormData deja que el navegador ponga el Content-Type', async () => {
    fetchMock.mockResolvedValueOnce(json(204))
    const fd = new FormData()
    await m.api('/subir', { method: 'POST', body: fd })
    expect(headersDe(0)['Content-Type']).toBeUndefined()
    expect(fetchMock.mock.calls[0][1]!.body).toBe(fd)
  })

  it('auth:false no manda el token', async () => {
    fetchMock.mockResolvedValueOnce(json(200, {}))
    m.setAccessToken('tok')
    await m.api('/publico', { auth: false })
    expect(headersDe(0).Authorization).toBeUndefined()
  })

  it('204 devuelve undefined', async () => {
    fetchMock.mockResolvedValueOnce(json(204))
    await expect(m.api('/x')).resolves.toBeUndefined()
  })

  it('marca como UTC las fechas sin zona de la respuesta', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { a: '2026-01-05T18:30:00', b: '2026-01-05T18:30:00Z', c: '2026-01-05' }))
    await expect(m.api('/x')).resolves.toEqual({ a: '2026-01-05T18:30:00Z', b: '2026-01-05T18:30:00Z', c: '2026-01-05' })
  })
})

describe('401 y refresh', () => {
  it('refresca una vez y repite la petición con el token nuevo', async () => {
    m.setAccessToken('viejo')
    fetchMock
      .mockResolvedValueOnce(json(401))
      .mockResolvedValueOnce(json(200, { access_token: 'nuevo', refresh_token: null, token_type: 'bearer' }))
      .mockResolvedValueOnce(json(200, { ok: true }))
    await expect(m.api('/x')).resolves.toEqual({ ok: true })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/refresh')
    expect(headersDe(2).Authorization).toBe('Bearer nuevo')
    expect(m.getAccessToken()).toBe('nuevo')
  })

  it('peticiones simultáneas comparten un solo /auth/refresh', async () => {
    let soltar!: (r: Response) => void
    fetchMock.mockImplementation(async (url) => {
      if (url === '/api/auth/refresh') return new Promise<Response>((r) => { soltar = r })
      return m.getAccessToken() === 'nuevo' ? json(200, { ok: true }) : json(401)
    })
    const a = m.api('/a')
    const b = m.api('/b')
    await vi.waitFor(() => expect(soltar).toBeDefined())
    soltar(json(200, { access_token: 'nuevo' }))
    await expect(Promise.all([a, b])).resolves.toEqual([{ ok: true }, { ok: true }])
    expect(fetchMock.mock.calls.filter(([u]) => u === '/api/auth/refresh')).toHaveLength(1)
  })

  it('si el refresh falla borra el token y avisa que la sesión expiró', async () => {
    const expirada = vi.fn()
    m.onSesionExpirada(expirada)
    m.setAccessToken('viejo')
    fetchMock.mockResolvedValueOnce(json(401, { detail: 'No autenticado' })).mockResolvedValueOnce(json(401))
    await expect(m.api('/x')).rejects.toMatchObject({ status: 401, message: 'No autenticado' })
    expect(m.getAccessToken()).toBeNull()
    expect(expirada).toHaveBeenCalledOnce()
  })

  it('en modo soporte nunca llama a /auth/refresh', async () => {
    m.setModoSoporte(true)
    fetchMock.mockResolvedValueOnce(json(401))
    await expect(m.api('/x')).rejects.toBeInstanceOf(m.ApiError)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('auth:false no intenta refrescar', async () => {
    fetchMock.mockResolvedValueOnce(json(401))
    await expect(m.api('/login', { auth: false })).rejects.toMatchObject({ status: 401 })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})

describe('errores', () => {
  const error = async (res: Response) => {
    fetchMock.mockResolvedValueOnce(res)
    return m.api<never>('/x').catch((e: unknown) => e as InstanceType<typeof m.ApiError>)
  }

  it('detail en texto', async () => {
    expect(await error(json(400, { detail: 'Correo inválido' }))).toMatchObject({ status: 400, message: 'Correo inválido' })
  })

  it('detail con codigo y mensaje', async () => {
    expect(await error(json(402, { detail: { codigo: 'sin_familia', mensaje: 'Tu plan no lo incluye' } })))
      .toMatchObject({ status: 402, codigo: 'sin_familia', message: 'Tu plan no lo incluye' })
  })

  it('lista de validación de FastAPI sin el prefijo "Value error, "', async () => {
    const e = await error(json(422, { detail: [{ msg: 'Value error, Teléfono inválido' }, { msg: 'Falta el nombre' }] }))
    expect(e.message).toBe('Teléfono inválido. Falta el nombre')
  })

  it('500 sin cuerpo y Retry-After', async () => {
    const e = await error(new Response('<html>', { status: 503, headers: { 'Retry-After': '30' } }))
    expect(e).toMatchObject({ status: 503, retryAfter: 30, message: 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.' })
  })

  it('sin red = status 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(m.api('/x')).rejects.toMatchObject({ status: 0, message: expect.stringContaining('No pudimos conectar') })
  })

  it('AbortError se propaga tal cual', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('abortado', 'AbortError'))
    await expect(m.api('/x')).rejects.toMatchObject({ name: 'AbortError' })
  })
})
