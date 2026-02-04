/**
 * EdgeDev AI Agent - Projects Page
 *
 * Project management with premium black/gold theme
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjects } from '@/lib/hooks';
import {
  MessageSquare,
  BarChart3,
  FolderOpen,
  Brain,
  Settings,
  Activity,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Folder,
  Plus,
  Calendar,
  Code,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Chat', href: '/', icon: MessageSquare },
  { name: 'Plan', href: '/plan', icon: Sparkles },
  { name: 'Scan', href: '/scan', icon: BarChart3 },
  { name: 'Backtest', href: '/backtest', icon: TrendingUp },
  { name: 'Patterns', href: '/patterns', icon: BarChart3 },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function ProjectsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { projects, isLoading, error } = useProjects();
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface lg:static lg:z-40 lg:translate-x-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold shadow-glow-sm">
                <Sparkles className="h-4 w-4 text-black" />
              </div>
              <span className="font-semibold text-lg">EdgeDev AI</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-surface-hover text-text-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 p-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gold text-black shadow-gold-sm'
                      : 'text-text-muted hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Status */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <div className="h-2 w-2 rounded-full bg-gold shadow-[0_0_0_2px_rgba(212,175,55,0.3)]" />
              <span>Projects Ready</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-300 ease-out"
        style={{ width: sidebarOpen ? 'calc(100% - 384px)' : '100%' }}
      >
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded hover:bg-surface-hover text-text-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Folder className="h-5 w-5 text-gold" />
            <h1 className="text-sm font-medium">Projects</h1>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Trading Projects</h2>
                <p className="text-sm text-text-muted">
                  Manage your trading strategies and research
                </p>
              </div>
              <Link
                href="/plan"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold text-black font-medium rounded-lg hover:bg-gold-hover transition-all duration-200 shadow-gold-sm hover:shadow-glow-md"
              >
                <Plus className="h-4 w-4" />
                New Project
              </Link>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="card rounded-xl p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-text-muted">Loading projects...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="card rounded-xl p-12 text-center border border-red-500/20">
                <p className="mb-2 text-sm font-medium text-red-500">Error loading projects</p>
                <p className="text-xs text-text-muted">{error.message}</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && projects.length === 0 && (
              <div className="card rounded-xl p-12 text-center">
                <Folder className="mx-auto mb-4 h-16 w-16 text-text-muted" />
                <h3 className="mb-2 text-lg font-semibold">No projects yet</h3>
                <p className="text-sm text-text-muted mb-6">
                  Create your first trading strategy project to get started.
                </p>
                <Link
                  href="/plan"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black font-medium rounded-lg hover:bg-gold-hover transition-all duration-200 shadow-gold-sm hover:shadow-glow-md"
                >
                  <Plus className="h-4 w-4" />
                  Create Project
                </Link>
              </div>
            )}

            {/* Projects grid */}
            {!isLoading && !error && projects.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project: any) => (
                  <ProjectCard key={project.project_id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  return (
    <Link
      href={`/projects/${project.project_id}`}
      className="card rounded-xl p-6 hover:border-gold/30 transition-all duration-200 block"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-gold" />
          <h3 className="font-semibold">{project.name}</h3>
        </div>
        <span
          className={`px-2 py-1 text-xs font-semibold border rounded-lg ${
            project.status === 'active'
              ? 'bg-green-500/10 text-green-500 border-green-500/20'
              : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
          }`}
        >
          {project.status}
        </span>
      </div>

      <p className="mb-4 text-sm text-text-muted line-clamp-2 min-h-[2.5rem]">
        {project.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-text-muted">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
        </div>
        {project.strategies_count !== undefined && (
          <div className="flex items-center gap-1">
            <Code className="h-3.5 w-3.5" />
            <span>{project.strategies_count} strategies</span>
          </div>
        )}
      </div>
    </Link>
  );
}
