'use strict';
// Bump VERSION whenever any precached page, script or icon changes.
const VERSION = 'offline-20260904-21';
const BASE = new URL('./', self.location.href);
const PREFIX = 'qarya-shell:' + BASE.pathname + ':';
const CACHE = PREFIX + VERSION;
const FILES = [
  'index.html', 'start.html', 'cloud.html', 'representative.html',
  'representative-dashboard.html', 'representative-sale.html',
  'admin-dashboard.html', 'admin-control.html', 'representatives.html',
  'cash-handover.html', 'rep-daily-close.html', 'route-order.html',
  'stock-orders.js', 'stock-orders-ui.js', 'purchase-list-ui.js', 'mobile-ui.js',
  'sales-discount-fix.js', 'sales-payment-ui.js', 'sales-balance-ui.js',
  'sync-core.js', 'rep-safety.js', 'material-import.js', 'material-import-ui.js',
  'rep-purchase-report.js', 'cloud-sync.js', 'offline.js',
  'manifest.webmanifest', 'icons/qarya-wordmark-180.png',
  'icons/qarya-wordmark-192.png', 'icons/qarya-wordmark-512.png',
  'icons/qarya-wordmark-maskable-512.png'
];
const URLS = FILES.map(file => new URL(file, BASE).href);
const ALLOWED = new Set(URLS);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(URLS.map(url => new Request(url, {cache: 'reload'})))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);await self.clients.claim();})());
});
self.addEventListener('fetch', event => {
  const request = event.request;if (request.method !== 'GET') return;const url = new URL(request.url);
  if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  if (url.pathname === BASE.pathname) url.pathname += 'index.html';url.search = '';url.hash = '';
  if (!ALLOWED.has(url.href)) return;
  event.respondWith((async () => {const cached = await (await caches.open(CACHE)).match(url.href);return cached || fetch(request);})());
});