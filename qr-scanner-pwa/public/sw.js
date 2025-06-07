const CACHE_NAME = 'gym-qr-scanner-v4';
const OFFLINE_URL = '/scan/offline.html';
const BACKGROUND_SYNC_TAG = 'sync-pending-scans';

const urlsToCache = [
  '/scan/',
  '/scan/index.html',
  '/scan/styles.css',
  '/scan/app.js',
  '/scan/manifest.json',
  '/scan/icons/icon-192x192.png',
  '/scan/icons/icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache:', err);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If fetch fails and the request is for HTML, show offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background sync event listener
self.addEventListener('sync', (event) => {
  if (event.tag === BACKGROUND_SYNC_TAG) {
    console.log('Background sync triggered');
    event.waitUntil(
      syncPendingScansWithSW()
    );
  }
});

// Function to notify the client to sync pending scans
async function syncPendingScansWithSW() {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_PENDING_SCANS'
    });
  });
}

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data.type === 'GET_PENDING_SCANS_COUNT') {
    // You could implement this if you want to show badge counts
  }
});