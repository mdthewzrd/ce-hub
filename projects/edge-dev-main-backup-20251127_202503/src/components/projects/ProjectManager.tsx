/**
 * ProjectManager Component
 *
 * Main project management interface that provides CRUD operations for projects,
 * search/filtering capabilities, and project templates for quick creation.
 * Integrates with the Project Composition Engine backend.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, Trash2, Edit, Play, FolderOpen, Tag, Calendar, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Project,
  ProjectManagerProps,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
  AggregationMethod,
  ApiError
} from '@/types/projectTypes';
import { projectApiService } from '@/services/projectApiService';
import { cn } from '@/lib/utils';

// Create Project Modal Component
interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: CreateProjectRequest) => Promise<void>;
  templates: any[];
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  templates
}) => {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    aggregation_method: AggregationMethod.UNION,
    tags: []
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      // Apply template if selected
      let projectData = { ...formData };
      if (selectedTemplate) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          projectData = {
            ...projectData,
            aggregation_method: template.aggregation_method,
            tags: [...new Set([...(projectData.tags || []), ...(template.tags || [])])]
          };
        }
      }

      // Validate
      const validationErrors = projectApiService.validateProject(projectData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      await onSubmit(projectData);
      onClose();
      setFormData({
        name: '',
        description: '',
        aggregation_method: AggregationMethod.UNION,
        tags: []
      });
      setSelectedTemplate('');
    } catch (error: any) {
      setErrors([error.message || 'Failed to create project']);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Create New Project</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-200">Project Template</Label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              >
                <option value="">Start from scratch</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-200">
              Project Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-200">
              Description
            </Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description"
              rows={3}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white resize-none"
            />
          </div>

          {/* Aggregation Method */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-200">Signal Aggregation Method</Label>
            <select
              value={formData.aggregation_method}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                aggregation_method: e.target.value as AggregationMethod
              }))}
              className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white"
            >
              <option value={AggregationMethod.UNION}>Union - Combine all signals</option>
              <option value={AggregationMethod.INTERSECTION}>Intersection - Common signals only</option>
              <option value={AggregationMethod.WEIGHTED}>Weighted - Scanner-specific weights</option>
              <option value={AggregationMethod.CUSTOM}>Custom - User-defined logic</option>
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-sm font-medium text-gray-200">
              Tags (comma-separated)
            </Label>
            <Input
              id="tags"
              value={(formData.tags || []).join(', ')}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
              }))}
              placeholder="momentum, liquid-catalyst, experimental"
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-900 border border-red-700 rounded-md p-3">
              {errors.map((error, index) => (
                <p key={index} className="text-red-300 text-sm">{error}</p>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onOpen: (project: Project) => void;
  onExecute: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onOpen,
  onExecute
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="bg-gray-800 border-gray-700 p-4 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{project.name}</h3>
          {project.description && (
            <p className="text-gray-400 text-sm mb-2 line-clamp-2">{project.description}</p>
          )}
        </div>
        <div className="flex space-x-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(project)}
            className="text-gray-400 hover:text-white h-8 w-8"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(project.id)}
            className="text-gray-400 hover:text-red-400 h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div className="flex items-center space-x-2">
          <Users className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300">{project.scanner_count} scanners</span>
        </div>
        <div className="flex items-center space-x-2">
          <Play className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-300">{project.execution_count} runs</span>
        </div>
      </div>

      {/* Tags */}
      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {project.tags.slice(0, 3).map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs bg-gray-700 text-gray-300"
            >
              {tag}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
              +{project.tags.length - 3} more
            </Badge>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 mb-3">
        <div>Created: {formatDate(project.created_at)}</div>
        <div>Updated: {formatDate(project.updated_at)}</div>
        {project.last_executed && (
          <div>Last run: {formatDate(project.last_executed)}</div>
        )}
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          onClick={() => onOpen(project)}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-sm"
        >
          <FolderOpen className="h-4 w-4 mr-1" />
          Open
        </Button>
        <Button
          onClick={() => onExecute(project)}
          disabled={project.scanner_count === 0}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm"
        >
          <Play className="h-4 w-4 mr-1" />
          Run
        </Button>
      </div>
    </Card>
  );
};

// Main ProjectManager Component
export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onOpenProject,
  loading = false
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>({
    searchTerm: '',
    tags: [],
    sort_by: 'updated_at',
    sort_order: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateData = await projectApiService.getProjectTemplates();
        setTemplates(templateData);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };
    loadTemplates();
  }, []);

  // Filter and sort projects
  const filteredProjects = projects
    .filter(project => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          project.name.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          project.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Tag filter
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag =>
          project.tags.includes(filterTag)
        );
        if (!hasMatchingTag) return false;
      }

      // Aggregation method filter
      if (filters.aggregation_method && project.aggregation_method !== filters.aggregation_method) {
        return false;
      }

      // Scanner count filter
      if (filters.has_scanners !== undefined) {
        if (filters.has_scanners && project.scanner_count === 0) return false;
        if (!filters.has_scanners && project.scanner_count > 0) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const order = filters.sort_order === 'asc' ? 1 : -1;

      switch (filters.sort_by) {
        case 'name':
          return order * a.name.localeCompare(b.name);
        case 'created_at':
          return order * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        case 'execution_count':
          return order * (a.execution_count - b.execution_count);
        case 'updated_at':
        default:
          return order * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      }
    });

  const handleCreateProject = async (projectData: CreateProjectRequest) => {
    await onCreateProject(projectData);
    setShowCreateModal(false);
  };

  const handleEditProject = async (projectData: UpdateProjectRequest) => {
    if (editingProject) {
      await onEditProject(editingProject.id, projectData);
      setEditingProject(null);
    }
  };

  const handleDeleteCompositionProject = async (projectId: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await onDeleteProject(projectId);
    }
  };

  // Get all unique tags for filter
  const allTags = Array.from(new Set(projects.flatMap(p => p.tags))).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 mt-1">
            Manage multi-scanner compositions and execute unified backtests
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder="Search projects by name, description, or tags..."
              className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="bg-gray-800 border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Tags Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-200">Tags</Label>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {allTags.map(tag => (
                    <label key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        checked={filters.tags?.includes(tag) || false}
                        onCheckedChange={(checked) => {
                          setFilters(prev => ({
                            ...prev,
                            tags: checked
                              ? [...(prev.tags || []), tag]
                              : (prev.tags || []).filter(t => t !== tag)
                          }));
                        }}
                      />
                      <span className="text-sm text-gray-300">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Aggregation Method Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-200">Aggregation</Label>
                <select
                  value={filters.aggregation_method || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    aggregation_method: e.target.value as AggregationMethod || undefined
                  }))}
                  className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                >
                  <option value="">All methods</option>
                  <option value={AggregationMethod.UNION}>Union</option>
                  <option value={AggregationMethod.INTERSECTION}>Intersection</option>
                  <option value={AggregationMethod.WEIGHTED}>Weighted</option>
                  <option value={AggregationMethod.CUSTOM}>Custom</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-200">Sort By</Label>
                <select
                  value={filters.sort_by}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sort_by: e.target.value as any
                  }))}
                  className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                >
                  <option value="updated_at">Last Updated</option>
                  <option value="created_at">Created Date</option>
                  <option value="name">Name</option>
                  <option value="execution_count">Execution Count</option>
                </select>
              </div>

              {/* Other Filters */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-200">Scanner Status</Label>
                <select
                  value={filters.has_scanners === undefined ? '' : filters.has_scanners.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    has_scanners: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-white text-sm"
                >
                  <option value="">All projects</option>
                  <option value="true">Has scanners</option>
                  <option value="false">No scanners</option>
                </select>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-gray-800 border-gray-700 p-4 animate-pulse">
              <div className="h-6 bg-gray-700 rounded mb-3"></div>
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-4"></div>
              <div className="flex space-x-2 mb-3">
                <div className="h-6 bg-gray-700 rounded px-3"></div>
                <div className="h-6 bg-gray-700 rounded px-3"></div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 bg-gray-700 rounded flex-1"></div>
                <div className="h-8 bg-gray-700 rounded w-16"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700 p-8 text-center">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
          </h3>
          <p className="text-gray-400 mb-4">
            {projects.length === 0
              ? 'Create your first project to start organizing your scanners'
              : 'Try adjusting your search or filter criteria'
            }
          </p>
          {projects.length === 0 && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={setEditingProject}
              onDelete={handleDeleteCompositionProject}
              onOpen={onOpenProject}
              onExecute={onOpenProject}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        templates={templates}
      />

      {/* Edit Project Modal - Similar to create but pre-filled */}
      {editingProject && (
        <CreateProjectModal
          isOpen={!!editingProject}
          onClose={() => setEditingProject(null)}
          onSubmit={handleEditProject}
          templates={templates}
        />
      )}
    </div>
  );
};

export default ProjectManager;