/**
 * Projects Page
 *
 * Display and manage trading strategy projects.
 */

'use client';

import { useProjects } from '@/lib/hooks';
import { FolderOpen, Calendar, Tag } from 'lucide-react';

export default function ProjectsPage() {
  const { projects, count, isLoading, error } = useProjects();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg font-medium text-error">Error loading projects</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              {count} {count === 1 ? 'project' : 'projects'} stored
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No projects yet</h3>
            <p className="text-sm text-muted-foreground">
              Projects will be created from your conversations and strategy development sessions.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.project_id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  const createdDate = new Date(project.created_at).toLocaleDateString();
  const updatedDate = new Date(project.updated_at).toLocaleDateString();

  return (
    <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:bg-secondary">
      <div className="mb-4">
        <h3 className="mb-1 text-lg font-semibold">{project.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Created {createdDate}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Updated {updatedDate}</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          <span>
            {project.scanners.length} {project.scanners.length === 1 ? 'scanner' : 'scanners'},
            {project.strategies.length} {project.strategies.length === 1 ? 'strategy' : 'strategies'}
          </span>
        </div>

        {project.tags.length > 0 && (
          <div className="flex items-start gap-2">
            <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {project.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button className="mt-4 w-full rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary">
        View Details
      </button>
    </div>
  );
}
