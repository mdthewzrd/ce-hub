import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-grain">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-foreground" />
            <span className="font-semibold text-sm">Press Agent</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/onboarding" className="text-muted-foreground hover:text-foreground transition-colors">
              Get Started
            </Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-24">
        <div className="max-w-2xl space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-medium tracking-tight leading-[1.1]">
              Press releases
              <br />
              <span className="text-muted-foreground">on autopilot.</span>
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
              Multi-agent workflow that handles research, writing, and distribution.
              Production-ready output in 24-48 hours.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/onboarding"
              className="px-5 py-2.5 bg-foreground text-background rounded text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start project
            </Link>
            <Link
              href="/catalog"
              className="px-5 py-2.5 border border-border rounded text-sm font-medium hover:bg-muted transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-8 mt-20 pt-12 border-t border-border max-w-lg">
          <div className="space-y-1">
            <div className="text-2xl font-medium tracking-tight">$0.013</div>
            <div className="text-xs text-muted-foreground">per release</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-medium tracking-tight">&lt;24h</div>
            <div className="text-xs text-muted-foreground">turnaround</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-medium tracking-tight">4</div>
            <div className="text-xs text-muted-foreground">AI agents</div>
          </div>
        </div>
      </main>
    </div>
  );
}
