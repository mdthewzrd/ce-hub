/**
 * Client Catalog Page
 * Media outlet selection with pricing and budget calculator
 */

import { CatalogSelector } from "@/components/client/CatalogSelector";
import { Suspense } from "react";

export default function CatalogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Press Agent</h1>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <a href="/" className="hover:text-foreground">Home</a>
            <a href="/onboarding" className="hover:text-foreground">Onboarding</a>
            <a href="/tracking" className="hover:text-foreground">Track Request</a>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Select Media Outlets</h2>
            <p className="text-muted-foreground">
              Choose where you'd like your press release to be distributed
            </p>
          </div>

          {/* Catalog selector */}
          <Suspense fallback={<div className="text-center py-12">Loading catalog...</div>}>
            <CatalogSelector
              onComplete={(outlets, total) => {
                console.log("Selected outlets:", outlets, "Total:", total);
              }}
            />
          </Suspense>

          {/* Help text */}
          <div className="mt-8 p-6 bg-muted/30 rounded-lg">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>We'll review your request and assign it to our production team</li>
              <li>Our AI writers will craft your press release within 24-48 hours</li>
              <li>Professional editors review and refine the content</li>
              <li>QA checks ensure quality and AP style compliance</li>
              <li>We'll submit to your selected outlets for publication</li>
              <li>You'll receive confirmation and tracking updates via email</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  );
}
