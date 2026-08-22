/**
 * Minimal fetch client with the two interceptor behaviours SprintDesk needs:
 *
 *  1. a request interceptor that attaches `Authorization: Bearer <token>`
 *     to calls marked `auth: true`;
 *  2. a response interceptor that, on a 401, performs a silent token refresh
 *     and replays the original request exactly once.
 *
 * Concurrent 401s share a single in-flight refresh promise, so a burst of
 * expired requests triggers one refresh call rather than one per request.
 */

export class HttpError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(status: number, message: string, body: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.body = body
  }
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  /** Attach the access token and take part in refresh-and-retry. */
  auth?: boolean
}

interface AuthHandlers {
  getAccessToken: () => string | null
  /** Resolves with a fresh access token, or `null` when the session is gone. */
  refresh: () => Promise<string | null>
  /** Called once when a refresh attempt definitively fails. */
  onRefreshFailure: () => void
}

const noAuth: AuthHandlers = {
  getAccessToken: () => null,
  refresh: async () => null,
  onRefreshFailure: () => {},
}

let handlers: AuthHandlers = noAuth
let inFlightRefresh: Promise<string | null> | null = null

/** Wires the auth feature into the client without the client importing it. */
export function configureAuthHandlers(next: AuthHandlers): void {
  handlers = next
}

/** Test seam: drops handlers and any in-flight refresh between cases. */
export function resetHttpAuth(): void {
  handlers = noAuth
  inFlightRefresh = null
}

function refreshOnce(): Promise<string | null> {
  inFlightRefresh ??= handlers.refresh().finally(() => {
    inFlightRefresh = null
  })
  return inFlightRefresh
}

async function parse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function send(url: string, options: HttpRequestOptions, token: string | null) {
  const headers: Record<string, string> = { ...options.headers }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.auth && token) headers.Authorization = `Bearer ${token}`

  return fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })
}

async function request<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
  let response = await send(url, options, handlers.getAccessToken())

  if (response.status === 401 && options.auth) {
    const token = await refreshOnce()
    if (!token) {
      handlers.onRefreshFailure()
      throw new HttpError(401, 'Session expired', await parse(response))
    }
    response = await send(url, options, token)
  }

  const body = await parse(response)
  if (!response.ok) {
    const message =
      (body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : null) ?? `Request failed with status ${response.status}`
    throw new HttpError(response.status, message, body)
  }

  return body as T
}

export interface HttpClient {
  get: <T>(path: string, options?: HttpRequestOptions) => Promise<T>
  post: <T>(path: string, body?: unknown, options?: HttpRequestOptions) => Promise<T>
}

export function createHttpClient(baseUrl: string): HttpClient {
  const resolve = (path: string) => `${baseUrl}${path}`
  return {
    get: (path, options) => request(resolve(path), { ...options, method: 'GET' }),
    post: (path, body, options) => request(resolve(path), { ...options, method: 'POST', body }),
  }
}
