import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InstallBanner } from "@/components/pwa/InstallBanner";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050508" },
    { media: "(prefers-color-scheme: light)", color: "#7C5CFC" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "MAnalista — Análise Multiprofissional Pediátrica",
    template: "%s | MAnalista",
  },
  description:
    "Sistema de sugestão diagnóstica com equipe multiprofissional de IA. " +
    "MODO DEMONSTRAÇÃO — não substitui diagnóstico médico real.",
  keywords: ["análise pediátrica", "TEA", "TDAH", "neurodesenvolvimento", "IA"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MAnalista",
  },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://manalista.com.br",
    siteName: "MAnalista",
    title: "MAnalista — Análise Multiprofissional Pediátrica",
    description: "Sistema de sugestão diagnóstica com IA para neurodesenvolvimento pediátrico.",
    images: [{ url: "/icons/icon-512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "MAnalista",
    description: "Análise multiprofissional pediátrica com IA",
    images: ["/icons/icon-512.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#050508" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MAnalista" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('manalista-theme') || 'dark';
                document.documentElement.setAttribute('data-theme', t);
              })();
            `,
          }}
        />
      </head>
      <body className={`${jakarta.variable} ${geistMono.variable} antialiased`}>
        {children}
        <InstallBanner />
      </body>
    </html>
  );
}
