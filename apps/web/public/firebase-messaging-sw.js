// Firebase Messaging Service Worker
// Handles background push notifications via FCM Web Push

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Firebase config injected at build time via __FIREBASE_CONFIG__ env var.
// In production, replace these with your actual Firebase project values.
const firebaseConfig = {
  apiKey:            self.__FIREBASE_API_KEY      || '',
  authDomain:        self.__FIREBASE_AUTH_DOMAIN  || '',
  projectId:         self.__FIREBASE_PROJECT_ID   || '',
  storageBucket:     self.__FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.__FIREBASE_SENDER_ID    || '',
  appId:             self.__FIREBASE_APP_ID       || '',
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

// Handle background messages (app not in foreground)
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {}
  const notifTitle = title || 'Hi Tom Fleet'
  const notifOptions = {
    body: body || '',
    icon: icon || '/icon-192.png',
    badge: '/badge-72.png',
    data: payload.data ?? {},
    tag: payload.data?.type || 'general',
    renotify: true,
    requireInteraction: false,
    actions: payload.data?.related_fault_id
      ? [{ action: 'open_fault', title: 'Bekijk storing' }]
      : [],
  }
  self.registration.showNotification(notifTitle, notifOptions)
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data ?? {}
  let url = '/'

  if (event.action === 'open_fault' && data.related_fault_id) {
    url = `/faults/${data.related_fault_id}`
  } else if (data.related_fault_id) {
    url = `/faults/${data.related_fault_id}`
  } else if (data.related_pickup_id) {
    url = `/driver/schedule`
  } else {
    url = '/notifications'
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url })
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
