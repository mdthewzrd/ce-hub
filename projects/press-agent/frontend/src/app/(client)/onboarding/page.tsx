/**
 * Client Onboarding Page
 * AI-powered chat interface for collecting press request details
 */

import { OnboardingChat } from "@/components/client/OnboardingChat";
import { Suspense } from "react";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Press Agent</h1>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <a href="/" className="hover:text-foreground">Home</a>
            <a href="/catalog" className="hover:text-foreground">Catalog</a>
            <a href="/tracking" className="hover:text-foreground">Track Request</a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Create Your Press Release</h2>
            <p className="text-muted-foreground">
              Answer a few questions and we'll craft a professional press release for you
            </p>
          </div>

          {/* Chat interface */}
          <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
            <Suspense fallback={<div className="p-8 text-center">Loading chat...</div>}>
              <OnboardingChat
                requestId={crypto.randomUUID()}
                clientId={crypto.randomUUID()}
                clientName=""
                onComplete={(data) => {
                  console.log("Onboarding complete:", data);
                  // Store data and redirect to catalog
                  sessionStorage.setItem("pressRequestData", JSON.stringify(data));
                  window.location.href = "/catalog";
                }}
              />
            </Suspense>
          </div>

          {/* Info cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <div className="border rounded-lg p-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Quick & Easy</h3>
              <p className="text-sm text-muted-foreground">
                Complete onboarding in under 5 minutes with our AI assistant
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Quality Guaranteed</h3>
              <p className="text-sm text-muted-foreground">
                Professional journalists review every press release before delivery
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Transparent Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Choose from our catalog of media outlets that fit your budget
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
