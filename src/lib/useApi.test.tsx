// @vitest-environment happy-dom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './api'
import { useApi, useDebounce } from './useApi'

const fetchMock = vi.fn<typeof fetch>()
const json = (status: number, cuerpo: unknown) => new Response(JSON.stringify(cuerpo), { status })

afterEach(() => { cleanup(); fetchMock.mockReset(); vi.useRealTimers() })

describe('useApi()', () => {
  it('carga datos y recarga', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValueOnce(json(200, { n: 1 })).mockResolvedValueOnce(json(200, { n: 2 }))
    const { result } = renderHook(() => useApi<{ n: number }>('/x'))
    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.datos).toEqual({ n: 1 }))
    expect(result.current.cargando).toBe(false)

    act(() => result.current.recargar(true))
    // silencioso: no vuelve a mostrar el estado de carga
    expect(result.current.cargando).toBe(false)
    await waitFor(() => expect(result.current.datos).toEqual({ n: 2 }))
  })

  it('expone el ApiError', async () => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValueOnce(json(409, { detail: 'Módulo apagado' }))
    const { result } = renderHook(() => useApi('/x'))
    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError))
    expect(result.current.error).toMatchObject({ status: 409, message: 'Módulo apagado' })
    expect(result.current.cargando).toBe(false)
  })

  it('ruta null no pide nada', () => {
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useApi(null))
    expect(result.current).toMatchObject({ datos: null, cargando: false, error: null })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('al cambiar de ruta aborta la petición anterior', async () => {
    vi.stubGlobal('fetch', fetchMock)
    const señales: AbortSignal[] = []
    fetchMock.mockImplementation(async (url, init) => {
      señales.push(init!.signal!)
      return json(200, { url })
    })
    const { result, rerender } = renderHook(({ r }) => useApi<{ url: string }>(r), { initialProps: { r: '/a' } })
    rerender({ r: '/b' })
    await waitFor(() => expect(result.current.datos).toEqual({ url: '/api/b' }))
    expect(señales[0].aborted).toBe(true)
  })
})

it('useDebounce entrega el último valor tras la espera', () => {
  vi.useFakeTimers()
  const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), { initialProps: { v: 'a' } })
  rerender({ v: 'ab' })
  rerender({ v: 'abc' })
  expect(result.current).toBe('a')
  act(() => { vi.advanceTimersByTime(300) })
  expect(result.current).toBe('abc')
})
