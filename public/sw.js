import { CACHE_NAME, PRECACHE_URLS, classifyCacheRoute, purgeOldCaches } from '/js/sw-routes.js';

const NETWORK_TIMEOUT_MS = 2500;

function createOfflineJsonResponse(message = 'Không có kết nối mạng') {
  return new Response(JSON.stringify({ error: message }), {
    status: 503,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-AgriCircle-Offline': '1'
    }
  });
}

async function fetchWithTimeout(request) {
  const controller = new AbortController();
  const timerId = setTimeout(() => {
    controller.abort();
  }, NETWORK_TIMEOUT_MS);
  try {
    return await fetch(request, { signal: controller.signal });
  } finally {
    clearTimeout(timerId);
  }
}

async function handleNetworkFirst(request, pathname) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetchWithTimeout(request);
    if (response && response.ok) {
      const cc = response.headers.get('cache-control') || '';
      if (!cc.includes('no-store')) {
        await cache.put(request, response.clone());
      }
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: pathname === '/' });
    if (cached) {
      return cached;
    }
    if ((pathname === '/' || pathname === '/index.html') && request.mode === 'navigate') {
      const rootCached = (await cache.match('/')) || (await cache.match('/index.html'));
      if (rootCached) {
        return rootCached;
      }
    }
    return createOfflineJsonResponse('Không thể tải dữ liệu khi ngoại tuyến');
  }
}

async function handleCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cc = response.headers.get('cache-control') || '';
      if (!cc.includes('no-store')) {
        await cache.put(request, response.clone());
      }
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function handleNetworkOnly(request, pathname) {
  try {
    return await fetch(request);
  } catch {
    if (pathname.startsWith('/api/')) {
      return createOfflineJsonResponse('Đang mất kết nối mạng');
    }
    return new Response('Đang mất kết nối mạng', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          const response = await fetch(url, { cache: 'no-cache' });
          if (!response.ok) {
            throw new Error(`Không thể lưu đệm ${url}`);
          }
          await cache.put(url, response);
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    purgeOldCaches(caches, CACHE_NAME).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) {
    return;
  }
  const routeType = classifyCacheRoute(url.pathname, request.method);
  if (routeType === 'bypass') {
    return;
  }
  if (routeType === 'network-first') {
    event.respondWith(handleNetworkFirst(request, url.pathname));
    return;
  }
  if (routeType === 'cache-first') {
    event.respondWith(handleCacheFirst(request));
    return;
  }
  event.respondWith(handleNetworkOnly(request, url.pathname));
});
