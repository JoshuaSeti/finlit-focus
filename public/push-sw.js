// Messaging-only worker: shows FinLit reminders. No caching.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { body: event.data && event.data.text() }; }
  event.waitUntil(self.registration.showNotification(d.title || 'FinLit 🪙', {
    body: d.body || 'Keep your coin streak going!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: d.tag || 'finlit',
    renotify: true,
    requireInteraction: true,
    vibrate: [300, 100, 300, 100, 500],
    data: { url: d.url || '/modules' },
    actions: [{ action: 'open', title: '🪙 Save my streak' }, { action: 'later', title: 'Later' }],
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'later') return;
  const url = (event.notification.data && event.notification.data.url) || '/modules';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if ('focus' in c) { c.navigate(url); return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
