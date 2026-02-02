/**
 * Team Dashboard Page
 * Main dashboard for team members to manage press requests
 */

import { RequestQueue } from "@/components/team/RequestQueue";
import { Suspense } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Press Agent - Team Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage press release production</p>
            </div>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="text-muted-foreground hover:text-foreground">Exit Team View</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="h-[calc(100vh-73px)]">
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading dashboard...</div>}>
          <RequestQueue
            onRequestClick={(requestId) => {
              router.push(`/production/${requestId}`);
            }}
          />
        </Suspense>
      </main>
    </div>
  );
}
