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
  ApiError,
  AggregationMethod
} from '@/types/projectTypes';

// Configuration - Prioritize FastAPI backend with persistent project storage
const FALLBACK_URLS = [
  'http://localhost:8000', // Python backend with fixed scanner execution
  'http://localhost:5658', // Alternative Python backend
  'http://localhost:5659', // Backside B Scan server (fallback)
];
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5666'; // Primary server - FastAPI with persistent storage
const API_PREFIX = '/api';

class ProjectApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Optimized: Try primary server first with timeout, only use fallbacks for critical failures
    const primaryUrl = `${BASE_URL}${API_PREFIX}${endpoint}`;

    // Add cache-busting only for GET requests
    const cacheBuster = options.method === 'GET' || !options.method ? `?_t=${Date.now()}` : '';
    const url = `${primaryUrl}${cacheBuster}`;

    try {
      console.log(`🚀 Fast project API call to: ${url}`);

      // Use shorter timeout for project operations (10 seconds max)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Project API successful: ${url}`);

        // Handle different response formats
        if (data && typeof data === 'object' && 'success' in data) {
          if (options.method === 'DELETE') {
            return data;
          }

          if (data.success && data.data) {
            return this.transformProjectData(data.data) as T;
          } else if (data.data) {
            return this.transformProjectData(data.data) as T;
          }
        }

        // Transform data if it's an array of projects (but not for DELETE)
        if (Array.isArray(data) && options.method !== 'DELETE') {
          return this.transformProjectData(data) as T;
        }

        return data;
      } else {
        console.warn(`⚠️ Primary server failed: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('⏰ Project API timeout (10s) - this should not happen for basic operations');
      } else {
        console.warn('⚠️ Primary server error:', error);
      }
    }

    // Only try fallbacks for GET requests and critical operations
    if (options.method === 'GET' || endpoint.includes('/projects')) {
      console.log('🔄 Trying fallback servers for critical operation...');

      const fallbackUrls = FALLBACK_URLS.slice(0, 2); // Only try first 2 fallbacks

      for (const baseUrl of fallbackUrls) {
        try {
          const fallbackUrl = `${baseUrl}${API_PREFIX}${endpoint}${cacheBuster}`;
          console.log(`  Trying fallback: ${fallbackUrl}`);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s fallback timeout

          const response = await fetch(fallbackUrl, {
            ...config,
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Fallback successful: ${baseUrl}`);
            return data;
          }
        } catch (error) {
          console.warn(`❌ Fallback ${baseUrl} failed:`, error);
        }
      }
    }

    // Return appropriate fallback
    console.error('❌ All servers failed, using fallback data');
    return this.getFallbackData<T>(endpoint);
  }

  private getFallbackData<T>(endpoint: string): T {
    console.log(`🏠 Generating fallback data for endpoint: ${endpoint}`);

    // Provide static fallback data based on endpoint
    if (endpoint === '/projects') {
      return [
        {
          id: "1",
          name: "Edge-Dev Trading System",
          title: "Edge-Dev Trading System",
          description: "Advanced trading scanner with parameter integrity (Backend unavailable)",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active" as const,
          scannerCount: 1,
          type: "Trading Scanner",
          enhanced: true,
          aggregation_method: "single",
          tags: ["scanner", "trading"],
          features: {
            hasParameters: true,
            hasMarketData: true,
            hasEnhancedFormatting: false
          }
        },
        {
          id: "2",
          name: "LC Sophisticated Scanner",
          title: "LC Sophisticated Scanner",
          description: "Liquidity catalyst pattern detection (Backend unavailable)",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "active" as const,
          scannerCount: 1,
          type: "Trading Scanner",
          enhanced: true,
          aggregation_method: "single",
          tags: ["scanner", "trading", "liquid-catalyst"],
          features: {
            hasParameters: true,
            hasMarketData: true,
            hasEnhancedFormatting: false
          }
        }
      ] as any;
    }

    // Default fallback for other endpoints
    return {
      success: false,
      message: "Backend services unavailable - using offline mode",
      timestamp: new Date().toISOString()
    } as any;
  }

  /**
   * Transform project data from API format to interface format
   */
  private transformProjectData(projects: any[]): any[] {
    return projects.map(project => ({
      ...project,
      // Map API fields to interface fields
      scanner_count: project.scannerCount || project.scanner_count || 0,
      created_at: project.createdAt || project.created_at || project.updated_at || new Date().toISOString(),
      updated_at: project.updatedAt || project.updated_at || project.createdAt || new Date().toISOString(),
      last_executed: project.lastScanDate || project.last_executed || null,
      execution_count: project.execution_count || 0,
      aggregation_method: project.aggregation_method || 'union',
      tags: project.tags || [],
      // Ensure required fields have defaults
      status: project.status || 'active',
      name: project.name || project.title || 'Unnamed Project',
      description: project.description || 'No description available'
    }));
  }

  private async requestWithErrorHandling<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await this.request<T>(endpoint, options);
      return response;
    } catch (error) {
      const errorData = error instanceof Error ? error.message : 'Unknown error';
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.detail || errorJson.message || 'API request failed';
      } catch {
        errorMessage = errorData || 'API request failed';
      }

      console.error(`API Error [${endpoint}]:`, error);
      throw new Error(errorMessage);
    }
  }

  // Project Management Methods

  /**
   * Get all projects
   */
  async getProjects(): Promise<Project[]> {
    // Use the backend API (port 5666) which has all the projects
    const response = await fetch(`http://localhost:5666/api/projects`);

    if (!response.ok) {
      throw new Error(`Failed to get projects: ${response.status}`);
    }

    const data = await response.json();

    // Backend returns array directly or wrapped in { success: true, data: [...] }
    let projects: any[] = [];
    if (Array.isArray(data)) {
      projects = data;
    } else if (data.success && data.data) {
      projects = data.data;
    }

    // Transform the data to ensure all fields are properly mapped
    return this.transformProjectData(projects);
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
    // Use the backend API (port 5666) which has all the projects
    const response = await fetch(`http://localhost:5666/api/projects?id=${projectId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete project: ${response.status}`);
    }

    // Return success - we don't need to return the response data
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
    // Use link-scanner endpoint which is what the backend actually provides
    const linkRequest = {
      scanner_id: request.scanner_id || `scanner_${Date.now()}`,
      scanner_name: request.scanner_file || 'Unknown Scanner',
      scanner_code: request.scanner_file || '',
      enabled: request.enabled !== false, // default to true
      weight: request.weight || 1.0,
      order_index: request.order_index || 0
    };

    return this.request<Scanner>(`/projects/${projectId}/link-scanner`, {
      method: 'POST',
      body: JSON.stringify(linkRequest),
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
   * 🎯 CRITICAL: Include formatted_code from localStorage for full market scanning
   */
  async executeProject(projectId: string, config: ExecutionConfig): Promise<string> {
    // 🎯 Check if Renata has formatted code in localStorage (full market scan)
    const formattedCode = localStorage.getItem('twoStageScannerCode');

    // Add formatted_code to request if available
    const enhancedConfig = {
      ...config,
      ...(formattedCode && { formatted_code: formattedCode })
    };

    if (formattedCode) {
      console.log('✅ Using Renata formatted code from localStorage for full market scan');
    } else {
      console.log('⚠️ No formatted code in localStorage, using original code (may have limited symbols)');
    }

    const response = await this.request<{ execution_id: string }>(`/projects/${projectId}/execute`, {
      method: 'POST',
      body: JSON.stringify(enhancedConfig),
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