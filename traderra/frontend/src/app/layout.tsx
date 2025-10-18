import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../styles/globals.css'
// import { ClerkProvider } from '@clerk/nextjs' // Temporarily disabled for testing
import { CopilotKit } from '@copilotkit/react-core'
import { QueryProvider } from '@/components/providers/query-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { StudioTheme } from '@/components/providers/studio-theme'
import { Footer } from '@/components/layout/footer'
// import { DateRangeProvider } from '@/contexts/DateRangeContext'

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
  title: 'Traderra - AI-Powered Trading Journal',
  description: 'Professional trading journal and performance analysis platform powered by Renata AI',
  keywords: 'trading, journal, AI, performance, analysis, Renata',
  authors: [{ name: 'Traderra Team' }],
  creator: 'Traderra',
  publisher: 'Traderra',
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
    url: 'https://traderra.com',
    siteName: 'Traderra',
    title: 'Traderra - AI-Powered Trading Journal',
    description: 'Professional trading journal and performance analysis platform powered by Renata AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Traderra - AI-Powered Trading Journal',
    description: 'Professional trading journal and performance analysis platform powered by Renata AI',
    creator: '@traderra',
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
        </head>
        <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased studio-bg min-h-screen`}>
          <StudioTheme>
            {/* <DateRangeProvider> */}
              <CopilotKit
                runtimeUrl="/api/copilotkit"
              >
                <QueryProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <main className="flex-1">
                      {children}
                    </main>
                    <Footer />
                  </div>
                  <ToastProvider />
                </QueryProvider>
              </CopilotKit>
            {/* </DateRangeProvider> */}
          </StudioTheme>
        </body>
      </html>
  )
}