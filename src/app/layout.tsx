import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";

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
};

export const metadata: Metadata = {
  title: "MAnalista — Análise Multiprofissional Pediátrica",
  description:
    "Sistema de sugestão diagnóstica com equipe multiprofissional de IA. " +
    "MODO DEMONSTRAÇÃO — não substitui diagnóstico médico real.",
  keywords: ["análise pediátrica", "TEA", "TDAH", "neurodesenvolvimento", "IA"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#050508" />
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
      </body>
    </html>
  );
}
