export const CACHE_NAME = 'khkt-pwa-v2';

export const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/styles/app.css',
  '/js/app.js',
  '/js/api.js',
  '/js/state.js',
  '/js/sw-routes.js',
  '/js/map-view.js',
  '/js/post-form.js',
  '/js/calculator-view.js',
  '/js/impact-view.js',
  '/js/admin-view.js',
  '/shared/regions.js',
  '/shared/crops.js',
  '/shared/units.js',
  '/shared/geo.js',
  '/shared/pricing.js',
  '/shared/voice-parser.js',
  '/shared/validation.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  '/vendor/leaflet/leaflet.js',
  '/vendor/leaflet/leaflet.css',
  '/vendor/leaflet/images/layers.png',
  '/vendor/leaflet/images/layers-2x.png',
  '/vendor/leaflet/images/marker-icon.png',
  '/vendor/leaflet/images/marker-icon-2x.png',
  '/vendor/leaflet/images/marker-shadow.png',
  '/api/crops'
];

export function classifyCacheRoute(pathname, method = 'GET') {
  const normalizedMethod = typeof method === 'string' ? method.toUpperCase() : 'GET';
  if (normalizedMethod !== 'GET') {
    return 'bypass';
  }
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) {
    return 'network-only';
  }
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return 'network-only';
  }
  const cleanPath = decoded.split('?')[0].split('#')[0];
  if (cleanPath.includes('..') || cleanPath.includes('\\')) {
    return 'network-only';
  }
  if (cleanPath === '/sw.js') {
    return 'bypass';
  }
  if (cleanPath === '/api/admin' || cleanPath.startsWith('/api/admin/')) {
    return 'network-only';
  }
  if (cleanPath === '/api/crops') {
    return 'network-first';
  }
  if (cleanPath.startsWith('/api/')) {
    return 'network-only';
  }
  if (
    cleanPath === '/' ||
    cleanPath === '/index.html' ||
    cleanPath === '/manifest.webmanifest' ||
    cleanPath.startsWith('/styles/') ||
    cleanPath.startsWith('/js/') ||
    cleanPath.startsWith('/shared/')
  ) {
    return 'network-first';
  }
  if (cleanPath.startsWith('/icons/') || cleanPath.startsWith('/vendor/leaflet/')) {
    return 'cache-first';
  }
  return 'network-only';
}

export async function purgeOldCaches(cacheStorage, activeCacheName = CACHE_NAME) {
  if (!cacheStorage || typeof cacheStorage.keys !== 'function' || typeof cacheStorage.delete !== 'function') {
    return;
  }
  const keys = await cacheStorage.keys();
  const stale = keys.filter((name) => name !== activeCacheName);
  await Promise.all(stale.map((name) => cacheStorage.delete(name)));
}
