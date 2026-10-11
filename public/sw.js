importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: 'AIzaSyChd_BpNhfED79IML4B5dIksGpGlN_8N3o',
  authDomain: 'zmusic-98543.firebaseapp.com',
  projectId: 'zmusic-98543',
  storageBucket: 'zmusic-98543.firebasestorage.app',
  messagingSenderId: '330393149383',
  appId: '1:330393149383:web:fcf6a80e6c0a5b883943e2',
  measurementId: 'G-71W9VFS34P'
});
const firebaseMessaging = firebase.messaging();
firebaseMessaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || payload.data?.title || 'ZMusic';
  return self.registration.showNotification(title, {
    body: payload.notification?.body || payload.data?.body || 'Ada kemas kini baharu.',
    icon: '/logo.png', badge: '/logo.png',
    data: { url: payload.data?.url || '/' },
    tag: payload.data?.tag || 'zmusic-notification'
  });
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const client of list) { if ('focus' in client) { client.navigate(target); return client.focus(); } }
    return clients.openWindow(target);
  }));
});

const CACHE_STATIC_NAME = 'ZMusic-static-v3';
const CACHE_DATA_NAME = 'ZMusic-api-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/banner.png',
  '/app.js',
  '/player.js',
  '/fullplayer.js',
  '/miniplayer.js',
  '/home.js',
  '/library.js',
  '/liked.js',
  '/search.js',
  '/album.js',
  '/artist.js',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

                                         
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets');
      return Promise.allSettled(
        STATIC_ASSETS.map((url) => {
          return fetch(url).then((res) => {
            if (res.status === 200 || res.type === 'opaque') {
              return cache.put(url, res);
            }
          }).catch((err) => {
            console.warn('[SW] Failed to cache:', url, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

                                       
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DATA_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

                                         
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

                                                     
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

                                                                           
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html', { ignoreSearch: true }) || caches.match('/', { ignoreSearch: true });
      })
    );
    return;
  }

                                                                                        
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_DATA_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
                                                     
            return new Response(
              JSON.stringify({ status: false, offline: true, message: 'Anda sedang offline (PWA Offline Mode)' }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

                                                                                                     
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
                                                                
        if (navigator.onLine) {
          fetch(request).then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              caches.open(CACHE_STATIC_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_STATIC_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
                                                                     
        if (request.headers.get('accept')?.includes('image')) {
          return caches.match('/logo.png');
        }
      });
    })
  );
});
