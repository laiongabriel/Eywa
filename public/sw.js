// Eywa Service Worker — handles notification display and click
// Served from /sw.js (public/sw.js in the repo)
/* global clients */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

// Handle notification click: focus the app tab or open a new one
self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const origin = self.location.origin
      for (const c of list) {
        try {
          if (new URL(c.url).origin === origin) return c.focus()
        } catch { /* invalid URL, skip */ }
      }
      return clients.openWindow('/')
    })
  )
})
