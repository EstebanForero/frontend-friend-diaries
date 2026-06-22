import { useCallback, useEffect, useState } from 'react'
import { pushApi, urlBase64ToUint8Array } from '../api/push.api'

type PushState = 'unsupported' | 'denied' | 'subscribed' | 'unsubscribed'

const isTauri = () => '__TAURI_INTERNALS__' in window

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('unsupported')

  useEffect(() => {
    if (isTauri()) {
      // In Tauri (Android/desktop), Web Push isn't available.
      // We use the Tauri notification plugin instead — just check if
      // Notification API exists as a proxy for "can we ask permission".
      if (!('Notification' in window)) return
      if (Notification.permission === 'denied') {
        setState('denied')
      } else if (Notification.permission === 'granted') {
        setState('subscribed')
      } else {
        setState('unsubscribed')
      }
      return
    }

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
    if (isTauri()) {
      // Use the Tauri notification plugin for native Android/desktop permission
      try {
        const { isPermissionGranted, requestPermission } = await import(
          '@tauri-apps/plugin-notification'
        )
        const already = await isPermissionGranted()
        if (already) {
          setState('subscribed')
          return
        }
        const result = await requestPermission()
        setState(result === 'granted' ? 'subscribed' : 'denied')
      } catch {
        // Plugin not available
      }
      return
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Explicitly request permission first so the browser prompt is clearly
    // triggered by the user gesture (required on some browsers)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      setState('denied')
      return
    }

    const { key } = await pushApi.getVapidKey()
    if (!key) return

    const reg = await navigator.serviceWorker.ready

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key).buffer as ArrayBuffer,
    })

    await pushApi.subscribe(sub.toJSON())
    setState('subscribed')
  }, [])

  const unsubscribe = useCallback(async () => {
    if (isTauri()) {
      setState('unsubscribed')
      return
    }
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (!sub) return
    await pushApi.unsubscribe(sub.endpoint)
    await sub.unsubscribe()
    setState('unsubscribed')
  }, [])

  return { state, subscribe, unsubscribe }
}
