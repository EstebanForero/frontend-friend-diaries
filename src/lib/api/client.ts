import { isTauriRuntime } from '@/lib/runtime'

const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL || '/api')

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

class ApiClient {
  private accessToken: string | null = null

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { body, ...rest } = options
    const method = rest.method ?? 'GET'

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(rest.headers as Record<string, string>),
    }

    if (isTauriRuntime()) {
      headers['X-Friend-Diaries-Client'] = 'tauri'
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    let response: Response
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        ...rest,
        headers,
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
    } catch {
      throw new ApiError(
        0,
        'Could not reach Friend Diaries. Check that the backend is running and try again.',
        `${method} ${path}`,
      )
    }

    if (!response.ok) {
      let serverMessage: string | undefined
      try {
        const data = (await response.json()) as { error?: string; message?: string }
        serverMessage = data.error ?? data.message
      } catch {
        // ignore parse error
      }
      throw new ApiError(
        response.status,
        getFriendlyErrorMessage(response.status, path, serverMessage),
        `${method} ${path}`,
      )
    }

    if (response.status === 204) {
      return undefined as T
    }

    const json = (await response.json()) as { data: T }
    return json.data
  }

  get<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'POST', body })
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'PUT', body })
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'PATCH', body })
  }

  delete<T>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }

  async postForm<T>(path: string, form: FormData): Promise<T> {
    const headers: Record<string, string> = {}
    if (isTauriRuntime()) headers['X-Friend-Diaries-Client'] = 'tauri'
    if (this.accessToken) headers['Authorization'] = `Bearer ${this.accessToken}`

    let response: Response
    try {
      response = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: form,
      })
    } catch {
      throw new ApiError(0, 'Could not reach Friend Diaries.', `POST ${path}`)
    }

    if (!response.ok) {
      let serverMessage: string | undefined
      try {
        const data = (await response.json()) as { error?: string; message?: string }
        serverMessage = data.error ?? data.message
      } catch { /* ignore */ }
      throw new ApiError(response.status, getFriendlyErrorMessage(response.status, path, serverMessage), `POST ${path}`)
    }

    const json = (await response.json()) as { data: T }
    return json.data
  }
}

export const apiClient = new ApiClient()

function normalizeBaseUrl(value: string) {
  if (typeof window === 'undefined') return value

  try {
    const url = new URL(value, window.location.origin)
    if (
      window.location.protocol === 'https:' &&
      url.protocol === 'http:' &&
      url.host === window.location.host
    ) {
      return `${window.location.origin}${url.pathname}${url.search}`
    }
  } catch {
    return value
  }

  return value
}

function getFriendlyErrorMessage(status: number, path: string, serverMessage?: string) {
  if (serverMessage && !isGenericError(serverMessage)) {
    return humanizeServerMessage(serverMessage)
  }

  switch (status) {
    case 400:
      return 'Something in that request was not valid. Check the fields and try again.'
    case 401:
      return 'Your session has expired. Sign in again to continue.'
    case 403:
      return 'You do not have permission to do that.'
    case 404:
      return getNotFoundMessage(path)
    case 409:
      return 'That conflicts with something already saved. Refresh and try again.'
    case 422:
      return 'Some information is missing or invalid. Check the form and try again.'
    case 429:
      return 'Too many attempts. Wait a moment and try again.'
    default:
      if (status >= 500) {
        return 'Friend Diaries had a server problem. Try again in a moment.'
      }
      return `Friend Diaries could not complete that request. Status ${status}.`
  }
}

function getNotFoundMessage(path: string) {
  if (path.includes('/groups/')) {
    return 'That diary could not be found. It may have been deleted, or you may no longer have access.'
  }
  if (path.includes('/share/notes/')) {
    return 'That shared note link is invalid or has expired.'
  }
  if (path.includes('/notes/')) {
    return 'That note could not be found. It may have been deleted or the link may be outdated.'
  }
  if (path.includes('/friends')) {
    return 'That friend request or friendship could not be found.'
  }
  return 'That item could not be found. It may have been moved, deleted, or the link may be outdated.'
}

function isGenericError(message: string) {
  return /^request failed with status \d+$/i.test(message) || /^not found$/i.test(message)
}

function humanizeServerMessage(message: string) {
  if (message === 'internal server error') {
    return 'Friend Diaries had a server problem. Try again in a moment.'
  }
  return message.charAt(0).toUpperCase() + message.slice(1)
}
