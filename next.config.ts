import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  reloadOnOnline: true,
  // Disable durante desenvolvimento para não interferir no HMR
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  env: {
    APP_NAME: "MAnalista",
    APP_VERSION: "0.1.0",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HSTS — força HTTPS por 2 anos (preload após 6 meses de estabilidade)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Bloquear sniffing de MIME type
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Bloquear iframe embedding (proteção clickjacking)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Referrer Policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy — microphone liberado para TTS futuro
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
          },
          // CSP — provisório com unsafe-eval/inline até Bloco 1 remover CSS-in-JS
          // TODO (Bloco 1): migrar para nonce-based CSP ao remover CSS inline
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://api.anthropic.com",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
