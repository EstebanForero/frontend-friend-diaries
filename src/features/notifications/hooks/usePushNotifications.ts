import { useCallback, useEffect, useState } from 'react'
import { pushApi, urlBase64ToUint8Array } from '../api/push.api'

type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('unsupported')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setState(sub ? 'subscribed' : 'unsubscribed')
      })
    })
  }, [])

  const subscribe = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return

    const { key } = await pushApi.getVapidKey()
    if (!key) return

    // SW is already registered in main.tsx — just wait for it to be ready
    const reg = await navigator.serviceWorker.ready

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key).buffer as ArrayBuffer,
    })

    setState('subscribed')
    await pushApi.subscribe(sub.toJSON())
  }, [])

  const unsubscribe = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await pushApi.unsubscribe(sub.endpoint)
    await sub.unsubscribe()
    setState('unsubscribed')
  }, [])

  return { state, subscribe, unsubscribe }
}
