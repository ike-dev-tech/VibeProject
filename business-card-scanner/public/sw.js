// Service Worker for Business Card Scanner PWA

const CACHE_NAME = 'business-card-scanner-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// インストール時の処理
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// アクティベーション時の処理
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// フェッチ時の処理
self.addEventListener('fetch', (event) => {
  // Vision APIやGASへのリクエストはキャッシュしない
  if (
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('script.google.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // キャッシュがあればそれを返す
      if (response) {
        return response;
      }

      // キャッシュがなければネットワークから取得
      return fetch(event.request).then((response) => {
        // 有効なレスポンスかチェック
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // レスポンスをキャッシュに保存
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
