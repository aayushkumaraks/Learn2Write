import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

function hashContent(chunks: string[]): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (const text of chunks) {
    for (let i = 0; i < text.length; i++) {
      const ch = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')
  ).slice(0, 12);
}

function offlineSpaServiceWorker(): Plugin {
  return {
    name: 'learn2write-offline-sw',
    apply: 'build',
    generateBundle(_options, bundle) {
      const precacheSet = new Set<string>([
        './',
        './index.html',
        './icon.svg',
        './manifest.webmanifest',
      ]);

      const hashParts: string[] = [];

      for (const [fileName, output] of Object.entries(bundle)) {
        if (fileName === 'sw.js') continue;
        precacheSet.add(`./${fileName}`);
        hashParts.push(fileName);
        if (output.type === 'chunk') {
          hashParts.push(output.code);
        } else if (typeof output.source === 'string') {
          hashParts.push(output.source);
        } else if (output.source instanceof Uint8Array) {
          hashParts.push(String(output.source.byteLength));
        }
      }

      const version = hashContent(hashParts);
      const cacheName = `learn2write-offline-${version}`;
      const precacheAssets = Array.from(precacheSet).sort();

      const swSource = `/* Auto-generated offline SPA Service Worker for Learn2Write */
const CACHE_NAME = ${JSON.stringify(cacheName)};
const CACHE_PREFIX = 'learn2write-offline-';
const PRECACHE_ASSETS = ${JSON.stringify(precacheAssets, null, 2)};

function toScopeUrl(relativePath) {
  return new URL(relativePath, self.registration.scope).href;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS.map(toScopeUrl)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch {
        if (request.mode === 'navigate') {
          const shell = await cache.match(toScopeUrl('./index.html'));
          if (shell) return shell;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })
  );
});
`;

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: swSource,
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), offlineSpaServiceWorker()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
