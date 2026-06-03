const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
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

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(rest.headers as Record<string, string>),
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`
      try {
        const data = (await response.json()) as { error?: string }
        if (data.error) message = data.error
      } catch {
        // ignore parse error
      }
      throw new ApiError(response.status, message)
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
}

export const apiClient = new ApiClient()
