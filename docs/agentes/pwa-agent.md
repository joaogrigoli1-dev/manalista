# PWA Agent
**Modelo:** `claude-sonnet-4-6`
**Fase:** BLOCO 2 — FASES 2A/2B/2C
**Especialidade:** Serwist, Web App Manifest, Service Worker, IndexedDB, offline UX

---

## CONTEXTO RECEBIDO DO ORQUESTRADOR

- **Repo:** `~/Documents/DEV/manalista`
- **Framework:** Next.js 15 App Router (Serwist é o único suportado corretamente)
- **Pré-requisito:** Bloco 0 e Bloco 1 concluídos
- **Alvo:** PWA instalável, offline para leitura, push notifications pós-Bloco 4
- **iOS target:** 16.4+ (PWA completo) · iOS 15-16.3 (degradação graciosa)
- **Android target:** Chrome 76+ (beforeinstallprompt)

---

## FASE 2A — Manifest + Ícones

### 2A.1 — Instalar ferramenta de ícones (30 min)

```bash
cd ~/Documents/DEV/manalista
npm install -D pwa-asset-generator
```

**Gerar todos os ícones a partir do logo "M":**
```bash
# Criar SVG fonte do ícone primeiro em public/icons/logo-source.svg
npx pwa-asset-generator public/icons/logo-source.svg public/icons \
  --manifest public/manifest.webmanifest \
  --index src/app/layout.tsx \
  --background "#0F8B8D" \
  --theme-color "#0F8B8D" \
  --opaque false \
  --maskable true \
  --favicon true
```

**Ícones necessários:**
- `icon-192.png` (any)
- `icon-512.png` (any)
- `icon-maskable-192.png` (maskable com safe-zone 80%)
- `icon-maskable-512.png` (maskable)
- `apple-touch-icon-180.png` (iOS)
- Splash screens para cada device iOS (gerados pelo pwa-asset-generator)
- `favicon.ico` e `favicon.svg`

### 2A.2 — Criar manifest.webmanifest (30 min)

```json
// public/manifest.webmanifest
{
  "name": "MAnalista — Análise pediátrica multiprofissional",
  "short_name": "MAnalista",
  "description": "Análise multiprofissional de desenvolvimento infantil com IA",
  "id": "/?source=pwa",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui"],
  "orientation": "any",
  "background_color": "#F7F9FB",
  "theme_color": "#0F8B8D",
  "lang": "pt-BR",
  "dir": "ltr",
  "categories": ["health", "medical", "education"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/landing-mobile.png", "sizes": "1170x2532", "type": "image/png", "form_factor": "narrow", "label": "Tela inicial" },
    { "src": "/screenshots/debate-mobile.png", "sizes": "1170x2532", "type": "image/png", "form_factor": "narrow", "label": "Debate em tempo real" },
    { "src": "/screenshots/landing-desktop.png", "sizes": "1920x1080", "type": "image/png", "form_factor": "wide", "label": "Desktop" }
  ],
  "shortcuts": [
    { "name": "Nova análise", "url": "/analise", "icons": [{ "src": "/icons/new-analysis-96.png", "sizes": "96x96" }] },
    { "name": "Meu histórico", "url": "/conta/historico", "icons": [{ "src": "/icons/history-96.png", "sizes": "96x96" }] }
  ],
  "share_target": {
    "action": "/analise?via=share",
    "method": "GET",
    "params": { "title": "title", "text": "text" }
  }
}
```

### 2A.3 — Linkar manifest e Apple tags no layout.tsx

```typescript
// src/app/layout.tsx — adicionar no <head>
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="MAnalista" />
<meta name="theme-color" content="#0F8B8D" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#0F1123" media="(prefers-color-scheme: dark)" />
// Splash screens gerados pelo pwa-asset-generator serão adicionados aqui automaticamente
```

**Commit:**
```
feat(pwa): adicionar manifest, ícones maskable e Apple PWA tags
```

---

## FASE 2B — Service Worker (Serwist)

### 2B.1 — Instalar Serwist (30 min)

```bash
npm install serwist @serwist/next
npm install -D @serwist/build
```

### 2B.2 — Configurar next.config.ts

```typescript
// next.config.ts
import withSerwist from "@serwist/next";

const withSerwistConfig = withSerwist({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // desabilitar em dev para facilitar debug
});

const nextConfig = withSerwistConfig({
  output: "standalone",
  // ... resto da config existente
});

export default nextConfig;
```

### 2B.3 — Service Worker (src/app/sw.ts)

```typescript
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { defaultCache } from "@serwist/next/worker";
import { installSerwist } from "@serwist/sw";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // ── App shell: NetworkFirst com fallback para /offline ──
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "shell-v1",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      },
    },

    // ── Chunks Next.js (hash no nome → seguro cachear muito) ──
    {
      matcher: /\/_next\/static\//,
      handler: "CacheFirst",
      options: {
        cacheName: "static-v1",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },

    // ── Fontes ──
    {
      matcher: /\.(woff2|woff|ttf|otf)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts-v1",
        expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },

    // ── Avatars dos agentes e ícones PWA ──
    {
      matcher: /\/(avatars|icons)\//,
      handler: "CacheFirst",
      options: {
        cacheName: "assets-v1",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 180 },
      },
    },

    // ── API: read endpoints (StaleWhileRevalidate) ──
    {
      matcher: ({ url, request }) =>
        url.pathname.startsWith("/api/") &&
        url.pathname !== "/api/analise" &&
        url.pathname !== "/api/relatorio" &&
        request.method === "GET",
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "api-v1",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      },
    },

    // ── /api/analise e /api/relatorio: NUNCA cachear ──
    {
      matcher: ({ url }) =>
        url.pathname === "/api/analise" || url.pathname === "/api/relatorio",
      handler: "NetworkOnly",
    },

    // ── PDFs gerados ──
    {
      matcher: /\.pdf$/,
      handler: "CacheFirst",
      options: {
        cacheName: "pdfs-v1",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 90 },
      },
    },
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

// ── Web Push (Phase 4F vai adicionar) ──
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title ?? "MAnalista", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-96.png",
      data: { url: data.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

// ── Background Sync (para análises pendentes Android) ──
self.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "retry-analysis") {
    event.waitUntil(retryPendingAnalyses());
  }
});

async function retryPendingAnalyses() {
  // Será implementado no Bloco 5 (Background Sync Android)
}
```

**Commit:**
```
feat(pwa): adicionar Service Worker com Serwist (offline-first)
```

---

## FASE 2C — IndexedDB + Offline UX

### 2C.1 — Instalar Dexie (30 min)

```bash
npm install dexie
```

### 2C.2 — Definir banco IndexedDB

```typescript
// src/lib/local-db.ts
import Dexie, { type EntityTable } from "dexie";

export interface LocalAnalysis {
  id: string;
  childData: object;
  result: object;
  createdAt: Date;
  expiresAt: Date;
}

export interface LocalDraft {
  id: string;
  childData: object;
  status: "pending";
  createdAt: Date;
}

class MAnalistaDB extends Dexie {
  analyses!: EntityTable<LocalAnalysis, "id">;
  drafts!: EntityTable<LocalDraft, "id">;

  constructor() {
    super("manalista-v1");
    this.version(1).stores({
      analyses: "id, createdAt, expiresAt",
      drafts: "id, status, createdAt",
    });
  }
}

export const localDb = new MAnalistaDB();

// Limpar análises expiradas na inicialização
export async function pruneExpiredAnalyses() {
  await localDb.analyses
    .where("expiresAt")
    .below(new Date())
    .delete();
}
```

### 2C.3 — Salvar análise no IndexedDB após conclusão

```typescript
// Em useAnalysis.ts, após receber evento "complete":
import { localDb } from "@/lib/local-db";

// Salvar localmente (30 dias de retenção)
await localDb.analyses.put({
  id: analysisId,
  childData: childData,
  result: event.result,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
});
```

### 2C.4 — Página /offline

```typescript
// src/app/offline/page.tsx
"use client";
import { useEffect, useState } from "react";
import { localDb } from "@/lib/local-db";
import Link from "next/link";

export default function OfflinePage() {
  const [lastAnalysis, setLastAnalysis] = useState<LocalAnalysis | null>(null);

  useEffect(() => {
    localDb.analyses
      .orderBy("createdAt")
      .reverse()
      .first()
      .then(setLastAnalysis);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-2xl font-bold text-ink-primary mb-4">
        Você está offline
      </h1>
      <p className="text-ink-secondary mb-8">
        Sem conexão com a internet. Você pode ver análises salvas anteriormente.
      </p>

      {lastAnalysis && (
        <div>
          <p className="text-ink-muted mb-4">Última análise salva:</p>
          {/* Mostrar resumo da última análise */}
        </div>
      )}

      <button
        onClick={() => window.location.reload()}
        className="btn-primary"
      >
        Tentar reconectar
      </button>
    </div>
  );
}
```

### 2C.5 — NetworkBadge online/offline

```typescript
// src/components/NetworkBadge.tsx
"use client";
import { useEffect, useState } from "react";

export function NetworkBadge() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Ping periódico
    const interval = setInterval(async () => {
      try {
        await fetch("/api/health", { method: "HEAD", cache: "no-store" });
        setOnline(true);
      } catch {
        setOnline(false);
      }
    }, 30_000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  if (online) return null; // não mostrar nada quando online

  return (
    <div role="status" aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full
                 bg-amber-100 border border-amber-300 px-3 py-1.5 text-amber-800 text-sm font-medium">
      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
      Você está offline
    </div>
  );
}
```

### 2C.6 — Install Prompt

```typescript
// src/components/InstallPwaPrompt.tsx
"use client";
import { useEffect, useState } from "react";

// Disparar após 1ª análise completa — verificar localStorage
export function InstallPwaPrompt({ trigger }: { trigger: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Detectar iOS (Safari sem beforeinstallprompt)
    const isIosSafari = /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !("MSStream" in window);
    setIsIos(isIosSafari);

    // Capturar evento Android/Desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    // Mostrar apenas quando trigger ativo + não instalado + não dispensado
    const dismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (trigger && !dismissed && (deferredPrompt || isIos)) {
      setShow(true);
    }
  }, [trigger, deferredPrompt, isIos]);

  if (!show) return null;

  return (
    <div role="dialog" aria-labelledby="pwa-prompt-title"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl bg-bg-card shadow-dialog p-5">
      <h2 id="pwa-prompt-title" className="font-bold text-ink-primary mb-2">
        Instale o MAnalista
      </h2>
      <p className="text-sm text-ink-secondary mb-4">
        Acesse seus laudos offline, receba notificações e use como app.
      </p>

      {isIos ? (
        <div className="text-sm text-ink-muted">
          Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>
        </div>
      ) : (
        <button onClick={async () => {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          setShow(false);
          if (outcome === "dismissed") {
            localStorage.setItem("pwa-prompt-dismissed", "true");
          }
        }}>
          Instalar agora
        </button>
      )}

      <button onClick={() => {
        setShow(false);
        localStorage.setItem("pwa-prompt-dismissed", "true");
      }} className="absolute top-3 right-3" aria-label="Fechar">
        ×
      </button>
    </div>
  );
}
```

**Commit:**
```
feat(pwa): adicionar IndexedDB (Dexie), página offline, NetworkBadge e InstallPrompt
```

---

## VERIFICAÇÕES FINAIS

```bash
npm run check
npm run build

# Em Chrome DevTools:
# 1. Application → Manifest → verificar todos os campos
# 2. Application → Service Workers → verificar SW registrado
# 3. Application → Cache Storage → verificar caches após primeira visita
# 4. Network → Offline → recarregar → verificar /offline aparece
# 5. Lighthouse → PWA → deve passar todos os critérios

# iOS Safari (BrowserStack):
# - Share Sheet → Add to Home Screen → verifica ícone e splash
# - Abrir instalado → standalone (sem browser UI)

# Android Chrome:
# - beforeinstallprompt capturado → mini prompt aparece
```

---

## REPORTAR AO ORQUESTRADOR

- [ ] manifest.webmanifest válido (sem erros no Lighthouse)
- [ ] Ícones gerados (192, 512, maskable, apple-touch-icon, splash screens iOS)
- [ ] Service Worker registrado e cacheando corretamente
- [ ] /offline funciona sem internet
- [ ] IndexedDB salvando análise após conclusão
- [ ] NetworkBadge aparece quando offline
- [ ] InstallPrompt aparece após 1ª análise
- [ ] Testado em BrowserStack: iOS 16.4+ e Android Chrome
- [ ] Lighthouse PWA: todos os checks passando
