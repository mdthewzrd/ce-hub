/**
 * Projects Page - Clean Design
 */

'use client';

import { useProjects } from '@/lib/hooks';
import { FolderOpen, Calendar, Tag, Sparkles } from 'lucide-react';

export default function ProjectsPage() {
  const { projects, count, isLoading, error } = useProjects();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-sm text-text-muted">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-error">Error loading projects</p>
          <p className="text-xs text-text-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-xl font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-text-muted">
              {count} {count === 1 ? 'project' : 'projects'}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {projects.length === 0 ? (
          <div className="card text-center p-12">
            <FolderOpen className="mx-auto mb-4 h-12 w-12 text-text-muted" />
            <h3 className="mb-2 text-base font-medium">No projects yet</h3>
            <p className="text-sm text-text-muted">
              Projects will be created from your conversations.
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
    <div className="card card-interactive">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-medium">{project.name}</h3>
        </div>
        <p className="text-xs text-text-muted line-clamp-2 min-h-[2.5rem]">
          {project.description}
        </p>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-text-muted">
          <Calendar className="h-3.5 w-3.5" />
          <span>Created {createdDate}</span>
        </div>

        <div className="flex items-center gap-2 text-text-muted">
          <Calendar className="h-3.5 w-3.5" />
          <span>Updated {updatedDate}</span>
        </div>

        <div className="flex items-center gap-2 text-text-muted">
          <FolderOpen className="h-3.5 w-3.5" />
          <span>
            {project.scanners.length} {project.scanners.length === 1 ? 'scanner' : 'scanners'}
            {project.strategies.length > 0 && (
              <>, {project.strategies.length} {project.strategies.length === 1 ? 'strategy' : 'strategies'}</>
            )}
          </span>
        </div>

        {project.tags?.length > 0 && (
          <div className="flex items-start gap-2">
            <Tag className="h-3.5 w-3.5 text-text-muted mt-0.5" />
            <div className="flex flex-wrap gap-1">
              {project.tags.map((tag: string) => (
                <span key={tag} className="badge badge-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
