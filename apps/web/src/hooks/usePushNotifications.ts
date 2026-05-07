import { useEffect } from 'react'
import { supabase, MOCK_MODE } from '@/lib/supabase'

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY as string | undefined

export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId || MOCK_MODE || !VAPID_KEY || !('serviceWorker' in navigator) || !('Notification' in window)) return

    const register = async () => {
      if (Notification.permission === 'denied') return

      const permission = Notification.permission === 'granted'
        ? 'granted'
        : await Notification.requestPermission()

      if (permission !== 'granted') return

      try {
        const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        })
        const token = btoa(JSON.stringify(sub))

        // Persist FCM token in users table so edge function can target this device
        await supabase!.from('users').update({ fcm_token: token }).eq('id', userId)
      } catch {
        // Permission or subscription failure — non-fatal
      }
    }

    register()
  }, [userId])
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData  = atob(base64)
  const arr      = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i)
  return arr.buffer as ArrayBuffer
}
