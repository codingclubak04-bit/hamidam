/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

clientsClaim()

interface PushPayload {
  title: string
  body: string
  url?: string
}

self.addEventListener('push', (event) => {
  if (!event.data) return
  const payload = event.data.json() as PushPayload

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: payload.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) ?? '/'
  const targetUrl = new URL(url, self.location.origin).href

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const client = clients.find((c): c is WindowClient => 'focus' in c)

      if (client) {
        // client.navigate()는 iOS Safari/WebKit에서 신뢰성이 낮아, 페이지 쪽에서
        // postMessage를 받아 react-router로 직접 이동하도록 위임한다.
        client.postMessage({ type: 'navigate', url })
        await client.focus()
        return
      }

      await self.clients.openWindow(targetUrl)
    })(),
  )
})
