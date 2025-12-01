/**
 * Projects Page
 *
 * Main projects page that orchestrates all project management components.
 * Provides seamless workflow for project creation, scanner configuration,
 * parameter editing, and execution management.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Settings, Play, Users, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import project management components
import ProjectManager from '@/components/projects/ProjectManager';
import ScannerSelector from '@/components/projects/ScannerSelector';
import ParameterEditor from '@/components/projects/ParameterEditor';
import ProjectExecutor from '@/components/projects/ProjectExecutor';

// Import types and services
import {
  Project,
  Scanner,
  AvailableScanner,
  ScannerParameters,
  ParameterSnapshot,
  ExecutionStatus,
  ExecutionResults,
  CreateProjectRequest,
  UpdateProjectRequest,
  AddScannerRequest,
  UpdateScannerRequest,
  ExecutionConfig,
  ProjectManagementState,
  ApiError
} from '@/types/projectTypes';
import { projectApiService } from '@/services/projectApiService';
import { cn } from '@/lib/utils';

// Main Projects Page Component
export default function ProjectsPage() {
  // State management
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

  // Current view state
  const [currentView, setCurrentView] = useState<'list' | 'project'>('list');
  const [activeTab, setActiveTab] = useState<'scanners' | 'parameters' | 'execute'>('scanners');
  const [selectedScanner, setSelectedScanner] = useState<Scanner | null>(null);
  const [scannerParameters, setScannerParameters] = useState<ScannerParameters>({});
  const [parameterHistory, setParameterHistory] = useState<ParameterSnapshot[]>([]);

  // Initialize data loading
  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll for execution status updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (state.activeExecution?.status === 'running') {
      intervalId = setInterval(() => {
        pollExecutionStatus();
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.activeExecution?.status, state.selectedProject?.id, state.activeExecution?.execution_id]);

  // Load initial data
  const loadInitialData = async () => {
    await Promise.all([
      loadProjects(),
      loadAvailableScanners()
    ]);
  };

  // Projects management functions
  const loadProjects = async () => {
    try {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, projects: true },
        errors: { ...prev.errors, projects: null }
      }));

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

  const loadAvailableScanners = async () => {
    try {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, scanners: true }
      }));

      const scanners = await projectApiService.getAvailableScanners();

      setState(prev => ({
        ...prev,
        availableScanners: scanners,
        loading: { ...prev.loading, scanners: false }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, scanners: false },
        errors: { ...prev.errors, scanners: projectApiService.formatError(error) }
      }));
    }
  };

  const createProject = async (projectData: CreateProjectRequest) => {
    try {
      const newProject = await projectApiService.createProject(projectData);
      setState(prev => ({
        ...prev,
        projects: [newProject, ...prev.projects]
      }));
    } catch (error: any) {
      throw error;
    }
  };

  const updateProject = async (projectId: string, projectData: UpdateProjectRequest) => {
    try {
      const updatedProject = await projectApiService.updateProject(projectId, projectData);
      setState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? updatedProject : p),
        selectedProject: prev.selectedProject?.id === projectId ? updatedProject : prev.selectedProject
      }));
    } catch (error: any) {
      throw error;
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await projectApiService.deleteProject(projectId);
      setState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        selectedProject: prev.selectedProject?.id === projectId ? null : prev.selectedProject
      }));

      if (state.selectedProject?.id === projectId) {
        setCurrentView('list');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const openProject = async (project: Project) => {
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

      setCurrentView('project');
      setActiveTab('scanners');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, scanners: false },
        errors: { ...prev.errors, scanners: projectApiService.formatError(error) }
      }));
    }
  };

  // Scanner management functions
  const addScannerToProject = async (scanner: AvailableScanner) => {
    if (!state.selectedProject) return;

    try {
      const addRequest: AddScannerRequest = {
        scanner_id: scanner.id,
        scanner_file: scanner.file_path,
        enabled: true,
        weight: 1.0,
        order_index: state.projectScanners.length
      };

      const newScanner = await projectApiService.addScannerToProject(
        state.selectedProject.id,
        addRequest
      );

      setState(prev => ({
        ...prev,
        projectScanners: [...prev.projectScanners, newScanner]
      }));
    } catch (error: any) {
      throw error;
    }
  };

  const removeScannerFromProject = async (scannerId: string) => {
    if (!state.selectedProject) return;

    try {
      await projectApiService.removeScannerFromProject(state.selectedProject.id, scannerId);

      setState(prev => ({
        ...prev,
        projectScanners: prev.projectScanners.filter(s => s.scanner_id !== scannerId)
      }));

      if (selectedScanner?.scanner_id === scannerId) {
        setSelectedScanner(null);
      }
    } catch (error: any) {
      throw error;
    }
  };

  const updateScannerInProject = async (scannerId: string, updates: UpdateScannerRequest) => {
    if (!state.selectedProject) return;

    try {
      const updatedScanner = await projectApiService.updateProjectScanner(
        state.selectedProject.id,
        scannerId,
        updates
      );

      setState(prev => ({
        ...prev,
        projectScanners: prev.projectScanners.map(s =>
          s.scanner_id === scannerId ? updatedScanner : s
        )
      }));

      if (selectedScanner?.scanner_id === scannerId) {
        setSelectedScanner(updatedScanner);
      }
    } catch (error: any) {
      throw error;
    }
  };

  // Parameter management functions
  const loadScannerParameters = async (scanner: Scanner) => {
    if (!state.selectedProject) return;

    try {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, parameters: true }
      }));

      const [parameters, history] = await Promise.all([
        projectApiService.getScannerParameters(state.selectedProject.id, scanner.scanner_id),
        projectApiService.getScannerParameterHistory(state.selectedProject.id, scanner.scanner_id)
      ]);

      setScannerParameters(parameters);
      setParameterHistory(history);
      setSelectedScanner(scanner);
      setActiveTab('parameters');

      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, parameters: false }
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, parameters: false },
        errors: { ...prev.errors, parameters: projectApiService.formatError(error) }
      }));
    }
  };

  const updateScannerParameters = async () => {
    if (!state.selectedProject || !selectedScanner) return;

    try {
      await projectApiService.updateScannerParameters(
        state.selectedProject.id,
        selectedScanner.scanner_id,
        scannerParameters
      );

      // Reload parameter history
      const history = await projectApiService.getScannerParameterHistory(
        state.selectedProject.id,
        selectedScanner.scanner_id
      );
      setParameterHistory(history);
    } catch (error: any) {
      throw error;
    }
  };

  const loadParameterSnapshot = async (snapshotId: string) => {
    if (!state.selectedProject || !selectedScanner) return;

    try {
      const snapshot = parameterHistory.find(s => s.snapshot_id === snapshotId);
      if (snapshot) {
        setScannerParameters(snapshot.parameters);
      }
    } catch (error: any) {
      console.error('Failed to load snapshot:', error);
    }
  };

  // Execution management functions
  const executeProject = async (config: ExecutionConfig): Promise<string> => {
    if (!state.selectedProject) throw new Error('No project selected');

    try {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, execution: true }
      }));

      const executionId = await projectApiService.executeProject(state.selectedProject.id, config);

      // Start polling for status
      const execution: ExecutionStatus = {
        execution_id: executionId,
        project_id: state.selectedProject.id,
        status: 'running',
        started_at: new Date().toISOString()
      };

      setState(prev => ({
        ...prev,
        activeExecution: execution,
        executionResults: null,
        loading: { ...prev.loading, execution: false }
      }));

      setActiveTab('execute');

      return executionId;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: { ...prev.loading, execution: false },
        errors: { ...prev.errors, execution: projectApiService.formatError(error) }
      }));
      throw error;
    }
  };

  const pollExecutionStatus = async () => {
    if (!state.selectedProject || !state.activeExecution) return;

    try {
      const status = await projectApiService.getExecutionStatus(
        state.selectedProject.id,
        state.activeExecution.execution_id
      );

      setState(prev => ({
        ...prev,
        activeExecution: status
      }));
    } catch (error: any) {
      console.error('Failed to poll execution status:', error);
    }
  };

  const viewExecutionResults = (executionId: string) => {
    setActiveTab('execute');
  };

  // Render functions
  const renderProjectList = () => (
    <ProjectManager
      projects={state.projects}
      onCreateProject={createProject}
      onEditProject={updateProject}
      onDeleteProject={deleteProject}
      onOpenProject={openProject}
      loading={state.loading.projects}
    />
  );

  const renderProjectView = () => {
    if (!state.selectedProject) return null;

    return (
      <div className="space-y-6">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setCurrentView('list')}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">{state.selectedProject.name}</h1>
              <p className="text-gray-400">{state.selectedProject.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
              {state.selectedProject.aggregation_method}
            </Badge>
            <Badge variant="secondary" className="bg-blue-900 text-blue-200">
              {state.projectScanners.length} scanners
            </Badge>
          </div>
        </div>

        {/* Error Display */}
        {(state.errors.scanners || state.errors.parameters || state.errors.execution) && (
          <Card className="bg-red-900 border-red-700 p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <div>
                <h3 className="text-red-200 font-medium">Error</h3>
                <p className="text-red-300 text-sm">
                  {state.errors.scanners?.message ||
                   state.errors.parameters?.message ||
                   state.errors.execution?.message}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Project Tabs */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger
              value="scanners"
              className="text-gray-300 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Scanners
            </TabsTrigger>
            <TabsTrigger
              value="parameters"
              className="text-gray-300 data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Parameters
            </TabsTrigger>
            <TabsTrigger
              value="execute"
              className="text-gray-300 data-[state=active]:text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Execute
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanners">
            <ScannerSelector
              projectId={state.selectedProject.id}
              availableScanners={state.availableScanners}
              selectedScanners={state.projectScanners}
              onSelectScanner={addScannerToProject}
              onRemoveScanner={removeScannerFromProject}
              onUpdateScanner={updateScannerInProject}
              loading={state.loading.scanners}
            />
          </TabsContent>

          <TabsContent value="parameters">
            {selectedScanner ? (
              <ParameterEditor
                projectId={state.selectedProject.id}
                scanner={selectedScanner}
                parameters={scannerParameters}
                parameterHistory={parameterHistory}
                onParameterChange={(key, value) => {
                  setScannerParameters(prev => ({ ...prev, [key]: value }));
                }}
                onSaveParameters={updateScannerParameters}
                onLoadSnapshot={loadParameterSnapshot}
                loading={state.loading.parameters}
              />
            ) : (
              <Card className="bg-gray-800 border-gray-700 p-8 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Scanner Selected</h3>
                <p className="text-gray-400 mb-4">
                  Select a scanner from the Scanners tab to configure its parameters
                </p>
                <Button onClick={() => setActiveTab('scanners')}>
                  Go to Scanners
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="execute">
            <ProjectExecutor
              project={state.selectedProject}
              scanners={state.projectScanners}
              onExecuteProject={executeProject}
              activeExecution={state.activeExecution || undefined}
              onViewResults={viewExecutionResults}
            />
          </TabsContent>
        </Tabs>

        {/* Quick Actions for Scanners Tab */}
        {activeTab === 'scanners' && state.projectScanners.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 p-4">
            <h3 className="text-sm font-medium text-white mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {state.projectScanners.map(scanner => (
                <Button
                  key={scanner.scanner_id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadScannerParameters(scanner)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {scanner.scanner_id}
                </Button>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {currentView === 'list' ? renderProjectList() : renderProjectView()}
      </div>
    </div>
  );
}