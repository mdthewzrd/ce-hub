/**
 * ProjectModal Component
 *
 * Integrated project management modal that matches the main edge-dev theme.
 * Allows users to manage scanner projects directly from the main interface.
 */

'use client'

import React, { useState, useEffect } from 'react';
import {
  X, Plus, Settings, Play, Users, BarChart3, AlertCircle,
  GripVertical, Target, Weight, ToggleLeft, ToggleRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Project, Scanner, AvailableScanner, CreateProjectRequest,
  ExecutionConfig, ProjectManagementState, AggregationMethod
} from '@/types/projectTypes';
import { projectApiService } from '@/services/projectApiService';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteProject?: (projectId: string, config: ExecutionConfig) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onExecuteProject }) => {
  const [state, setState] = useState<ProjectManagementState>({
    projects: [],
    selectedProject: null,
    availableScanners: [],
    projectScanners: [],
    activeExecution: null,
    executionResults: null,
    loading: {
      projects: false,
      scanners: false,
      parameters: false,
      execution: false
    },
    errors: {
      projects: null,
      scanners: null,
      parameters: null,
      execution: null
    },
    filters: {
      projects: {
        searchTerm: '',
        sort_by: 'updated_at',
        sort_order: 'desc'
      },
      scanners: {
        searchTerm: '',
        sort_by: 'order_index',
        sort_order: 'asc'
      }
    }
  });

  const [activeTab, setActiveTab] = useState<'projects' | 'current'>('projects');
  const [newProjectName, setNewProjectName] = useState('');
  const [showCreateProject, setShowCreateProject] = useState(false);

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      setState(prev => ({ ...prev, loading: { ...prev.loading, projects: true } }));
      const projects = await projectApiService.getProjects();
      setState(prev => ({
        ...prev,
        projects,
        loading: { ...prev.loading, projects: false }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, projects: false },
        errors: { ...prev.errors, projects: projectApiService.formatError(error) }
      }));
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const request: CreateProjectRequest = {
        name: newProjectName.trim(),
        description: `Multi-scanner project: ${newProjectName.trim()}`,
        aggregation_method: AggregationMethod.WEIGHTED,
        tags: ['edge-dev', 'scanner-composition']
      };

      const newProject = await projectApiService.createProject(request);
      setState(prev => ({
        ...prev,
        projects: [newProject, ...prev.projects]
      }));

      setNewProjectName('');
      setShowCreateProject(false);
    } catch (error: any) {
      console.error('Failed to create project:', error);
    }
  };

  const selectProject = async (project: Project) => {
    try {
      setState(prev => ({
        ...prev,
        selectedProject: project,
        loading: { ...prev.loading, scanners: true }
      }));

      const scanners = await projectApiService.getProjectScanners(project.id);
      setState(prev => ({
        ...prev,
        projectScanners: scanners,
        loading: { ...prev.loading, scanners: false }
      }));

      setActiveTab('current');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, scanners: false },
        errors: { ...prev.errors, scanners: projectApiService.formatError(error) }
      }));
    }
  };

  const executeCurrentProject = async () => {
    if (!state.selectedProject) return;

    const config: ExecutionConfig = {
      date_range: {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      },
      parallel_execution: true,
      timeout_seconds: 300
    };

    try {
      const executionId = await projectApiService.executeProject(state.selectedProject.id, config);
      console.log(`Started execution: ${executionId}`);

      if (onExecuteProject) {
        onExecuteProject(state.selectedProject.id, config);
      }

      onClose();
    } catch (error: any) {
      console.error('Failed to execute project:', error);
      alert(`Failed to execute project: ${error.message || 'Unknown error occurred'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-4xl h-[80vh] flex flex-col"
           style={{ backgroundColor: 'var(--studio-bg)', borderColor: 'var(--studio-border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Scanner Projects
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="h-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800 m-4">
              <TabsTrigger value="projects" className="text-gray-300 data-[state=active]:text-white">
                All Projects
              </TabsTrigger>
              <TabsTrigger value="current" className="text-gray-300 data-[state=active]:text-white">
                Current Project
              </TabsTrigger>
            </TabsList>

            <div className="px-4 pb-4 h-full">
              <TabsContent value="projects" className="h-full">
                <div className="space-y-4 h-full">
                  {/* Create Project */}
                  <div className="flex gap-2">
                    {showCreateProject ? (
                      <>
                        <Input
                          placeholder="Project name..."
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white flex-1"
                          onKeyPress={(e) => e.key === 'Enter' && createProject()}
                        />
                        <Button onClick={createProject} size="sm">Create</Button>
                        <Button variant="outline" size="sm" onClick={() => setShowCreateProject(false)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setShowCreateProject(true)} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        New Project
                      </Button>
                    )}
                  </div>

                  {/* Projects List */}
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {state.loading.projects ? (
                      <div className="text-center py-8 text-gray-400">Loading projects...</div>
                    ) : state.projects.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No projects yet. Create your first scanner composition project!
                      </div>
                    ) : (
                      state.projects.map((project) => (
                        <Card key={project.id}
                              className="p-4 bg-gray-800 border-gray-700 hover:bg-gray-750 cursor-pointer transition-colors"
                              onClick={() => selectProject(project)}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-white">{project.name}</h3>
                              <p className="text-sm text-gray-400">{project.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                  {project.scanner_count} scanners
                                </Badge>
                                <Badge variant="secondary" className="bg-blue-900 text-blue-200">
                                  {project.aggregation_method}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-col items-end text-xs text-gray-400">
                              <span>Updated</span>
                              <span>{new Date(project.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="current" className="h-full">
                {state.selectedProject ? (
                  <div className="space-y-4 h-full">
                    {/* Project Header */}
                    <Card className="p-4 bg-gray-800 border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-white">{state.selectedProject.name}</h3>
                          <p className="text-gray-400">{state.selectedProject.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={executeCurrentProject}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={state.projectScanners.length === 0}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Execute Project
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {/* Scanners */}
                    <div className="space-y-2 overflow-y-auto flex-1">
                      <h4 className="text-sm font-medium text-gray-300">
                        Project Scanners ({state.projectScanners.length})
                      </h4>
                      {state.loading.scanners ? (
                        <div className="text-center py-8 text-gray-400">Loading scanners...</div>
                      ) : state.projectScanners.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          No scanners configured yet. Add scanners to this project.
                        </div>
                      ) : (
                        state.projectScanners.map((scanner) => (
                          <Card key={scanner.scanner_id}
                                className="p-3 bg-gray-800 border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <div>
                                  <h5 className="font-medium text-white">{scanner.scanner_id}</h5>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                                      Weight: {scanner.weight}
                                    </Badge>
                                    <Badge variant={scanner.enabled ? 'default' : 'secondary'}
                                           className={scanner.enabled ? 'bg-green-600' : 'bg-gray-600'}>
                                      {scanner.enabled ? 'Enabled' : 'Disabled'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Select a project to view its scanners and configuration
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;