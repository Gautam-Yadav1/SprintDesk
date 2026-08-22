import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  configureAuthHandlers,
  createHttpClient,
  HttpError,
  resetHttpAuth,
} from './http'

const client = createHttpClient('https://api.test')

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function authHeaderOf(call: unknown[]): string | undefined {
  const init = call[1] as RequestInit
  return (init.headers as Record<string, string>).Authorization
}

describe('http client auth interceptor', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    resetHttpAuth()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    resetHttpAuth()
  })

  it('attaches the bearer token to authenticated requests only', async () => {
    configureAuthHandlers({
      getAccessToken: () => 'access-1',
      refresh: vi.fn(),
      onRefreshFailure: vi.fn(),
    })
    // A fresh Response per call: a body can only be read once.
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })))

    await client.get('/private', { auth: true })
    await client.get('/public')

    expect(authHeaderOf(fetchMock.mock.calls[0]!)).toBe('Bearer access-1')
    expect(authHeaderOf(fetchMock.mock.calls[1]!)).toBeUndefined()
  })

  it('refreshes and replays the request once after a 401', async () => {
    let token = 'expired'
    const refresh = vi.fn(async () => {
      token = 'fresh'
      return token
    })
    configureAuthHandlers({
      getAccessToken: () => token,
      refresh,
      onRefreshFailure: vi.fn(),
    })

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: 'Token expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ id: 7 }))

    await expect(client.get<{ id: number }>('/me', { auth: true })).resolves.toEqual({ id: 7 })

    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(authHeaderOf(fetchMock.mock.calls[0]!)).toBe('Bearer expired')
    expect(authHeaderOf(fetchMock.mock.calls[1]!)).toBe('Bearer fresh')
  })

  it('does not retry a second time when the replay also fails', async () => {
    configureAuthHandlers({
      getAccessToken: () => 'access',
      refresh: vi.fn(async () => 'fresh'),
      onRefreshFailure: vi.fn(),
    })

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ message: 'Token expired' }, 401))
      .mockResolvedValueOnce(jsonResponse({ message: 'Still unauthorised' }, 401))

    await expect(client.get('/me', { auth: true })).rejects.toBeInstanceOf(HttpError)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('shares a single refresh between concurrent 401s', async () => {
    let token = 'expired'
    const refresh = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          setTimeout(() => {
            token = 'fresh'
            resolve(token)
          }, 10)
        }),
    )
    configureAuthHandlers({
      getAccessToken: () => token,
      refresh,
      onRefreshFailure: vi.fn(),
    })

    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      const header = (init.headers as Record<string, string>).Authorization
      return Promise.resolve(
        header === 'Bearer fresh'
          ? jsonResponse({ ok: true })
          : jsonResponse({ message: 'Token expired' }, 401),
      )
    })

    const [first, second] = await Promise.all([
      client.get('/tasks', { auth: true }),
      client.get('/users', { auth: true }),
    ])

    expect(first).toEqual({ ok: true })
    expect(second).toEqual({ ok: true })
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })

  it('reports the failure and stops when the refresh cannot be completed', async () => {
    const onRefreshFailure = vi.fn()
    configureAuthHandlers({
      getAccessToken: () => 'expired',
      refresh: vi.fn(async () => null),
      onRefreshFailure,
    })

    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ message: 'Token expired' }, 401)),
    )

    await expect(client.get('/me', { auth: true })).rejects.toMatchObject({ status: 401 })
    expect(onRefreshFailure).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('leaves an unauthenticated 401 alone', async () => {
    const refresh = vi.fn()
    configureAuthHandlers({
      getAccessToken: () => 'access',
      refresh,
      onRefreshFailure: vi.fn(),
    })
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ message: 'Nope' }, 401)))

    await expect(client.get('/public')).rejects.toBeInstanceOf(HttpError)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('surfaces the API error message on a failed request', async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ message: 'Invalid credentials' }, 400)),
    )

    await expect(client.post('/auth/login', { username: 'x' })).rejects.toMatchObject({
      status: 400,
      message: 'Invalid credentials',
    })
  })
})
