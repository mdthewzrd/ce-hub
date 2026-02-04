/**
 * Request Tracking Page
 * Client-facing page to track press request status
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TrackingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Press Agent</h1>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <Link href="/onboarding" className="hover:text-foreground">Create New</Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Track Your Request</h2>
            <p className="text-muted-foreground">
              Monitor your press release production progress
            </p>
          </div>

          {/* Demo status card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Request Status</CardTitle>
                <Badge variant="secondary">Demo</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress steps */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Onboarding Complete</p>
                    <p className="text-sm text-muted-foreground">All information collected</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Outlets Selected</p>
                    <p className="text-sm text-muted-foreground">TechCrunch, VentureBeat selected</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm animate-pulse">
                    ⟳
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">In Production</p>
                    <p className="text-sm text-muted-foreground">Writer agent is creating your draft</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Quality Review</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                    5
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Delivery</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Estimated completion: <span className="font-medium text-foreground">24-48 hours</span>
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Contact Support
                </Button>
                <Button size="sm" className="flex-1">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info card */}
          <Card className="mt-6 bg-muted/30">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Our AI writer creates your press release draft</li>
                <li>Professional editors review and refine the content</li>
                <li>QA checks ensure quality and AP style compliance</li>
                <li>We submit to your selected media outlets</li>
                <li>You receive confirmation and tracking updates via email</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
