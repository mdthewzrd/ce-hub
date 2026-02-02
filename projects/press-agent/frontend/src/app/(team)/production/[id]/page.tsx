/**
 * Production Workspace Page
 * Main workspace for producing a press release with agent collaboration
 */

import { ProductionWorkspace } from "@/components/team/ProductionWorkspace";
import { Suspense } from "react";

export default function ProductionPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <a
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground"
                >
                  ← Back to Dashboard
                </a>
                <span className="text-muted-foreground">|</span>
                <h1 className="text-xl font-bold">Production Workspace</h1>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Request ID: {params.id}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span className="font-medium">In Progress</span>
              </div>
              <button className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted">
                Assign to Team
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <main className="flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              Loading workspace...
            </div>
          }
        >
          <ProductionWorkspace requestId={params.id} />
        </Suspense>
      </main>
    </div>
  );
}
