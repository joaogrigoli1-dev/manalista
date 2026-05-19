import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import {
  Serwist,
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from "serwist";
import { defaultCache } from "@serwist/next/worker";

// Tipagem do self no contexto SW
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Cache de fontes Google com CacheFirst
    {
      matcher: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: new CacheFirst({
        cacheName: "manalista-fonts",
        plugins: [
          new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
          new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
    },
    // Cache de assets estáticos (imagens, SVGs)
    {
      matcher: /\.(?:png|svg|jpg|jpeg|webp|gif|ico)$/i,
      handler: new CacheFirst({
        cacheName: "manalista-images",
        plugins: [
          new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }),
          new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
    },
    // API de análise: network-only (dados sempre frescos, sem fallback em cache)
    {
      matcher: /^\/api\/analise/,
      handler: new NetworkOnly(),
    },
    // API de relatório: network-only (PDF sempre gerado fresh)
    {
      matcher: /^\/api\/relatorio/,
      handler: new NetworkOnly(),
    },
    // API de health: network-first com cache curto
    {
      matcher: /^\/api\/health/,
      handler: new NetworkFirst({
        cacheName: "manalista-api",
        plugins: [
          new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 60 }),
          new CacheableResponsePlugin({ statuses: [0, 200] }),
        ],
      }),
    },
    // Páginas HTML e assets Next.js: estratégias padrão recomendadas
    ...defaultCache,
  ],
});

serwist.addEventListeners();
