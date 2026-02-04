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
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                ← Press Agent
              </a>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm">Dashboard</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 status-pulse" />
                <span className="text-muted-foreground">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Loading...
          </div>
        }>
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
