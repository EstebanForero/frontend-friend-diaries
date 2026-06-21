import { apiClient } from '@/lib/api/client'

export const pushApi = {
  getVapidKey: () => apiClient.get<{ key: string }>('/push/vapid-key'),
  subscribe: (sub: object) => apiClient.post<void>('/push/subscribe', sub),
  unsubscribe: (endpoint: string) => apiClient.post<void>('/push/unsubscribe', { endpoint }),
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}
