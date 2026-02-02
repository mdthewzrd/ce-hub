import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../styles/globals.css'
import '../styles/button-fix.css'
import { ClerkProvider } from '@clerk/nextjs'
import { CopilotKit } from '@copilotkit/react-core'
import { QueryProvider } from '@/components/providers/query-provider'
import { ToastProvider } from '@/components/providers/toast-provider'
import { StudioTheme } from '@/components/providers/studio-theme'
import { Footer } from '@/components/layout/footer'
import { PnLModeProvider } from '@/contexts/PnLModeContext'
import { DisplayModeProvider } from '@/contexts/DisplayModeContext'
import { DateRangeProvider } from '@/contexts/DateRangeContext'
import { NotificationProvider } from '@/components/ui/notification-system'
import { ErrorBoundary } from '@/components/ui/error-boundary'

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
        <ClerkProvider
          appearance={{
            baseTheme: undefined,
            elements: {
              formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
              card: 'studio-surface',
              headerTitle: 'studio-text',
              headerSubtitle: 'studio-muted',
              socialButtonsBlockButton: 'studio-surface border-border hover:bg-accent',
              socialButtonsBlockButtonText: 'studio-text',
              formFieldLabel: 'studio-text',
              formFieldInput: 'studio-surface border-border studio-text',
              footerActionText: 'studio-muted',
              footerActionLink: 'text-primary hover:text-primary/80',
              identityPreviewText: 'studio-text',
              identityPreviewEditButtonIcon: 'text-primary',
              formResendCodeLink: 'text-primary hover:text-primary/80',
              formButtonReset: 'text-primary hover:text-primary/80',
            },
            variables: {
              colorPrimary: '#3b82f6',
              colorBackground: '#0a0a0a',
              colorInputBackground: '#0a0a0a',
              colorInputText: '#fafafa',
              colorText: '#fafafa',
              colorTextSecondary: '#a1a1aa',
              borderRadius: '0.5rem',
            }
          }}
        >
          <ErrorBoundary>
            <StudioTheme>
              <DisplayModeProvider>
                <PnLModeProvider>
                  <DateRangeProvider>
                    <NotificationProvider>
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
                    </NotificationProvider>
                  </DateRangeProvider>
                </PnLModeProvider>
              </DisplayModeProvider>
            </StudioTheme>
          </ErrorBoundary>
        </ClerkProvider>
      </body>
    </html>
  )
}