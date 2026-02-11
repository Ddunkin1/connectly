/* Minimal service worker for Web Push subscription. */
self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();
            const title = data.title || 'Connectly';
            const options = {
                body: data.body || '',
                icon: data.icon || '/favicon.ico',
            };
            event.waitUntil(self.registration.showNotification(title, options));
        } catch {
            event.waitUntil(self.registration.showNotification('Connectly', { body: 'You have a new notification' }));
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});
