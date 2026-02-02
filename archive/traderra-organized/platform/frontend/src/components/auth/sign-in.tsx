'use client'

import { SignIn } from '@clerk/nextjs'

export function AuthSignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center studio-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold studio-text mb-2">Welcome to Traderra</h1>
          <p className="studio-muted">Sign in to access your trading journal</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
              card: 'studio-surface rounded-lg shadow-xl',
              headerTitle: 'studio-text',
              headerSubtitle: 'studio-muted',
              socialButtonsBlockButton: 'studio-surface border border-[#333] hover:bg-[#1a1a1a]',
              socialButtonsBlockButtonText: 'studio-text',
              formFieldLabel: 'studio-text',
              formFieldInput: 'studio-surface border border-[#333] focus:border-primary',
              footerActionLink: 'text-primary hover:text-primary/90',
            },
          }}
        />
      </div>
    </div>
  )
}