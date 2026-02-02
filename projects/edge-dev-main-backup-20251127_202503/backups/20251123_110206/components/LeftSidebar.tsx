'use client';

import React from 'react';
import { Folder, Plus, Upload } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  scanCount: number;
}

interface LeftSidebarProps {
  projects?: Project[];
  selectedProject?: string;
  onSelectProject?: (id: string) => void;
  onNewProject?: () => void;
  onUpload?: () => void;
}

/**
 * Left Sidebar - Projects & Upload
 * Compact sidebar matching Traderra 6565 styling
 */
export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  projects = [],
  selectedProject,
  onSelectProject,
  onNewProject,
  onUpload
}) => {
  return (
    <aside className="h-full border-r border-[#1a1a1a] bg-[#111111] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <h2 className="text-sm font-semibold studio-text mb-1">Projects</h2>
        <p className="text-xs studio-muted">{projects.length} loaded</p>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto p-2">
        {projects.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Folder className="h-8 w-8 studio-muted mx-auto mb-2" />
            <p className="text-xs studio-muted">No projects</p>
            <p className="text-xs studio-muted mt-1">Upload a scanner to start</p>
          </div>
        ) : (
          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onSelectProject?.(project.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedProject === project.id
                    ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'
                    : 'hover:bg-[#1a1a1a] studio-text'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span className="truncate flex-1">{project.name}</span>
                </div>
                <div className="text-xs studio-muted mt-1">
                  {project.scanCount} scans
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-[#1a1a1a] space-y-2">
        <button
          onClick={onNewProject}
          className="w-full btn-secondary flex items-center justify-center gap-2 py-2"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">New Project</span>
        </button>

        <button
          onClick={onUpload}
          className="w-full btn-primary flex items-center justify-center gap-2 py-2"
        >
          <Upload className="h-4 w-4" />
          <span className="text-sm">Upload Scanner</span>
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;
