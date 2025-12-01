/**
 * Project API Service
 *
 * Provides type-safe API integration with the Project Composition Engine backend.
 * Handles all HTTP communication and error handling for project management.
 */

import {
  Project,
  Scanner,
  AvailableScanner,
  ScannerParameters,
  ParameterSnapshot,
  ExecutionConfig,
  ExecutionStatus,
  ExecutionResults,
  CreateProjectRequest,
  UpdateProjectRequest,
  AddScannerRequest,
  UpdateScannerRequest,
  ApiError
} from '@/types/projectTypes';

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const API_PREFIX = '/api';

class ProjectApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${API_PREFIX}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.text();
        let errorMessage: string;

        try {
          const errorJson = JSON.parse(errorData);
          errorMessage = errorJson.detail || errorJson.message || 'API request failed';
        } catch {
          errorMessage = errorData || `HTTP ${response.status}: ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Project Management Methods

  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/projects');
  }

  /**
   * Get a specific project by ID
   */
  async getProject(projectId: string): Promise<Project> {
    return this.request<Project>(`/projects/${projectId}`);
  }

  /**
   * Create a new project
   */
  async createProject(request: CreateProjectRequest): Promise<Project> {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Update an existing project
   */
  async updateProject(projectId: string, request: UpdateProjectRequest): Promise<Project> {
    return this.request<Project>(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.request<void>(`/projects/${projectId}`, {
      method: 'DELETE',
    });
  }

  // Scanner Management Methods

  /**
   * Get all available scanners (from generated_scanners directory)
   */
  async getAvailableScanners(): Promise<AvailableScanner[]> {
    return this.request<AvailableScanner[]>('/scanners');
  }

  /**
   * Get scanners in a specific project
   */
  async getProjectScanners(projectId: string): Promise<Scanner[]> {
    return this.request<Scanner[]>(`/projects/${projectId}/scanners`);
  }

  /**
   * Add a scanner to a project
   */
  async addScannerToProject(projectId: string, request: AddScannerRequest): Promise<Scanner> {
    return this.request<Scanner>(`/projects/${projectId}/scanners`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Update scanner settings in a project
   */
  async updateProjectScanner(
    projectId: string,
    scannerId: string,
    request: UpdateScannerRequest
  ): Promise<Scanner> {
    return this.request<Scanner>(`/projects/${projectId}/scanners/${scannerId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  /**
   * Remove a scanner from a project
   */
  async removeScannerFromProject(projectId: string, scannerId: string): Promise<void> {
    await this.request<void>(`/projects/${projectId}/scanners/${scannerId}`, {
      method: 'DELETE',
    });
  }

  // Parameter Management Methods

  /**
   * Get parameters for a scanner in a project
   */
  async getScannerParameters(projectId: string, scannerId: string): Promise<ScannerParameters> {
    const response = await this.request<{ parameters: ScannerParameters }>(
      `/projects/${projectId}/scanners/${scannerId}/parameters`
    );
    return response.parameters;
  }

  /**
   * Update parameters for a scanner in a project
   */
  async updateScannerParameters(
    projectId: string,
    scannerId: string,
    parameters: ScannerParameters
  ): Promise<void> {
    await this.request<void>(`/projects/${projectId}/scanners/${scannerId}/parameters`, {
      method: 'PUT',
      body: JSON.stringify(parameters),
    });
  }

  /**
   * Get parameter history for a scanner
   */
  async getScannerParameterHistory(
    projectId: string,
    scannerId: string
  ): Promise<ParameterSnapshot[]> {
    const response = await this.request<{ history: any[] }>(
      `/projects/${projectId}/scanners/${scannerId}/parameters/history`
    );
    return response.history.map(item => ({
      snapshot_id: item.id,
      scanner_id: scannerId,
      parameters: item.parameters,
      created_at: item.created_at,
      created_by: item.created_by,
      description: item.description,
    }));
  }

  // Project Execution Methods

  /**
   * Execute a project
   */
  async executeProject(projectId: string, config: ExecutionConfig): Promise<string> {
    const response = await this.request<{ execution_id: string }>(`/projects/${projectId}/execute`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
    return response.execution_id;
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(projectId: string, executionId: string): Promise<ExecutionStatus> {
    return this.request<ExecutionStatus>(`/projects/${projectId}/executions/${executionId}`);
  }

  /**
   * Get execution results
   */
  async getExecutionResults(
    projectId: string,
    executionId: string,
    format: 'json' | 'csv' = 'json'
  ): Promise<ExecutionResults | Blob> {
    if (format === 'csv') {
      const response = await fetch(
        `${BASE_URL}${API_PREFIX}/projects/${projectId}/executions/${executionId}/results?format=csv`
      );

      if (!response.ok) {
        throw new Error('Failed to download CSV results');
      }

      return response.blob();
    }

    return this.request<ExecutionResults>(`/projects/${projectId}/executions/${executionId}/results`);
  }

  // Health and Status Methods

  /**
   * Check API health
   */
  async getHealth(): Promise<{ status: string; timestamp: string; version: string }> {
    return this.request<{ status: string; timestamp: string; version: string }>('/health');
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<any> {
    return this.request<any>('/status');
  }

  // Helper Methods

  /**
   * Get available project templates
   */
  async getProjectTemplates(): Promise<any[]> {
    // This would be implemented when backend supports templates
    // For now, return predefined templates
    return [
      {
        id: 'lc_momentum_setup',
        name: 'LC Momentum Setup',
        description: 'Liquid Catalyst momentum-based scanner combination',
        scanners: [
          {
            scanner_id: 'lc_frontside_d3_extended_1',
            scanner_file: 'lc_frontside_d3_extended_1.py',
            weight: 1.0,
          },
          {
            scanner_id: 'lc_frontside_d2_extended',
            scanner_file: 'lc_frontside_d2_extended.py',
            weight: 1.0,
          },
          {
            scanner_id: 'lc_frontside_d2_extended_1',
            scanner_file: 'lc_frontside_d2_extended_1.py',
            weight: 1.0,
          },
        ],
        aggregation_method: 'weighted',
        tags: ['momentum', 'liquid-catalyst', 'multi-scanner'],
      },
    ];
  }

  /**
   * Validate project configuration
   */
  validateProject(project: Partial<CreateProjectRequest | UpdateProjectRequest>): string[] {
    const errors: string[] = [];

    if ('name' in project && (!project.name || project.name.trim().length === 0)) {
      errors.push('Project name is required');
    }

    if ('name' in project && project.name && project.name.length > 255) {
      errors.push('Project name must be less than 255 characters');
    }

    return errors;
  }

  /**
   * Validate execution configuration
   */
  validateExecutionConfig(config: Partial<ExecutionConfig>): string[] {
    const errors: string[] = [];

    if (!config.date_range?.start_date) {
      errors.push('Start date is required');
    }

    if (!config.date_range?.end_date) {
      errors.push('End date is required');
    }

    if (config.date_range?.start_date && config.date_range?.end_date) {
      const start = new Date(config.date_range.start_date);
      const end = new Date(config.date_range.end_date);

      if (end <= start) {
        errors.push('End date must be after start date');
      }
    }

    if (config.timeout_seconds !== undefined && (config.timeout_seconds < 30 || config.timeout_seconds > 1800)) {
      errors.push('Timeout must be between 30 and 1800 seconds');
    }

    return errors;
  }

  /**
   * Format API errors for user display
   */
  formatError(error: any): ApiError {
    return {
      message: error.message || 'An unexpected error occurred',
      details: error.stack || error.toString(),
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const projectApiService = new ProjectApiService();
export default projectApiService;