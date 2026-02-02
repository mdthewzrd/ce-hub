import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import MainLayoutWithAI from '@/components/MainLayoutWithAI'
import { ScanExecutionProvider } from '@/contexts/ScanExecutionContext'
import ScanProgressDisplay from '@/components/ScanProgressDisplay'
import { RenataCopilotKit } from '@/components/renata/RenataCopilotKit'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'edge.dev',
  description: 'Professional scanner optimization and backtesting platform powered by Renata AI',
  keywords: 'trading, scanner, backtesting, AI, optimization, analysis, Renata',
  authors: [{ name: 'Edge-Dev Team' }],
  creator: 'Edge-Dev',
  publisher: 'Edge-Dev',
  robots: {
    index: false, // Private application
    follow: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://edge-dev.com',
    siteName: 'Edge-Dev',
    title: 'edge.dev',
    description: 'Professional scanner optimization and backtesting platform powered by Renata AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'edge.dev',
    description: 'Professional scanner optimization and backtesting platform powered by Renata AI',
    creator: '@edgedev',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 🔧 CACHE BUSTER - Edge-dev optimized scanning platform
              window.CACHE_BUSTER_VERSION = "2025-11-18-TRADERRA-STYLING-MIGRATION";
              window.FRONTEND_VERSION = "EDGE_DEV_TRADERRA_v2.0";

              console.log("🔧 EDGE-DEV CACHE BUSTER ACTIVE:", window.CACHE_BUSTER_VERSION);
              console.log("🔧 FRONTEND VERSION:", window.FRONTEND_VERSION);

              // Force reload if old version detected
              if (typeof localStorage !== 'undefined') {
                if (localStorage.getItem('frontend_version') !== window.FRONTEND_VERSION) {
                  console.log("  NEW VERSION DETECTED - CLEARING CACHE");
                  localStorage.clear();
                  sessionStorage.clear();
                  localStorage.setItem('frontend_version', window.FRONTEND_VERSION);
                  // Force a hard refresh to clear component cache
                  if (window.location.search.indexOf('cache_cleared=1') === -1) {
                    window.location.href = window.location.href + (window.location.search ? '&' : '?') + 'cache_cleared=1';
                  }
                }
              }
            `
          }}
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}>
        <RenataCopilotKit>
          <ScanExecutionProvider>
            <MainLayoutWithAI>
              {children}
            </MainLayoutWithAI>
            <ScanProgressDisplay />
          </ScanExecutionProvider>
        </RenataCopilotKit>
      </body>
    </html>
  )
}
