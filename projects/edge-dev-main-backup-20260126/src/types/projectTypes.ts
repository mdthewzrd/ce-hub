/**
 * TypeScript interfaces for Project Management Components
 *
 * These types match the backend API structure for seamless integration
 * with the Project Composition Engine while maintaining type safety.
 */

// Core project and scanner types
export interface Project {
  id: string;
  name: string;
  description: string;
  aggregation_method: AggregationMethod;
  tags: string[];
  scanner_count: number;
  scannerCount?: number; // API response field
  created_at: string;
  createdAt?: string; // API response field
  updated_at: string;
  updatedAt?: string; // API response field
  last_executed: string | null;
  lastScanDate?: string; // API response field
  execution_count: number;
  status?: 'active' | 'archived' | 'draft'; // API response field
  // Enhanced fields for scanner projects from Renata chat
  title?: string;
  type?: string;
  functionName?: string;
  enhanced?: boolean;
  code?: string;
  features?: {
    hasParameters: boolean;
    hasMarketData: boolean;
    hasEnhancedFormatting: boolean;
  };
}

export interface Scanner {
  id: string;
  scanner_id: string;
  scanner_file: string;
  enabled: boolean;
  weight: number;
  order_index: number;
  parameter_count: number;
}

export interface ScannerReference {
  scanner_id: string;
  scanner_file: string;
  parameter_file?: string;
  enabled: boolean;
  weight: number;
  order_index: number;
}

// Available scanner information for selection
export interface AvailableScanner {
  id: string;
  name: string;
  file_path: string;
  description: string;
  category: string;
  parameters_count: number;
  created_at: string;
}

// Aggregation methods
export enum AggregationMethod {
  UNION = 'union',
  INTERSECTION = 'intersection',
  WEIGHTED = 'weighted',
  CUSTOM = 'custom'
}

// Execution configuration and results
export interface ExecutionConfig {
  date_range: {
    start_date: string;
    end_date: string;
  };
  symbols?: string[];
  filters?: Record<string, any>;
  parallel_execution: boolean;
  timeout_seconds: number;
}

export interface ExecutionStatus {
  execution_id: string;
  project_id: string;
  status: 'running' | 'completed' | 'failed';
  started_at: string;
  total_signals?: number;
  execution_time?: number;
  scanner_results?: Record<string, number>;
}

export interface ExecutionResults {
  execution_id: string;
  project_id: string;
  signals: Signal[];
  summary: ExecutionSummary;
  metadata: Record<string, any>;
}

export interface Signal {
  ticker: string;
  date: string;
  signal_type: string;
  scanner_id: string;
  confidence: number;
  metadata: Record<string, any>;
}

export interface ExecutionSummary {
  total_signals: number;
  unique_symbols: number;
  scanner_breakdown: Record<string, number>;
  aggregation_method: string;
  execution_time_ms: number;
}

// Scanner parameters
export interface ScannerParameter {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: any;
  validation?: ParameterValidation;
}

export interface ParameterValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  options?: any[];
}

export interface ScannerParameters {
  [key: string]: any;
}

export interface ParameterSnapshot {
  snapshot_id: string;
  scanner_id: string;
  parameters: ScannerParameters;
  created_at: string;
  created_by?: string;
  description?: string;
}

// API request/response types
export interface CreateProjectRequest {
  name: string;
  description?: string;
  aggregation_method: AggregationMethod;
  tags?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  aggregation_method?: AggregationMethod;
  tags?: string[];
}

export interface AddScannerRequest {
  scanner_id: string;
  scanner_file: string;
  enabled?: boolean;
  weight?: number;
  order_index?: number;
}

export interface UpdateScannerRequest {
  enabled?: boolean;
  weight?: number;
  order_index?: number;
}

// Component props interfaces
export interface ProjectManagerProps {
  projects: Project[];
  onCreateProject: (config: CreateProjectRequest) => Promise<void>;
  onEditProject: (id: string, config: UpdateProjectRequest) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onOpenProject: (project: Project) => void;
  loading?: boolean;
}

export interface ScannerSelectorProps {
  projectId: string;
  availableScanners: AvailableScanner[];
  selectedScanners: Scanner[];
  onSelectScanner: (scanner: AvailableScanner) => Promise<void>;
  onRemoveScanner: (scannerId: string) => Promise<void>;
  onUpdateScanner: (scannerId: string, updates: UpdateScannerRequest) => Promise<void>;
  loading?: boolean;
}

export interface ParameterEditorProps {
  projectId: string;
  scanner: Scanner;
  parameters: ScannerParameters;
  parameterHistory: ParameterSnapshot[];
  onParameterChange: (key: string, value: any) => void;
  onSaveParameters: () => Promise<void>;
  onLoadSnapshot: (snapshotId: string) => Promise<void>;
  loading?: boolean;
}

export interface ProjectExecutorProps {
  project: Project;
  scanners: Scanner[];
  onExecuteProject: (config: ExecutionConfig) => Promise<string>;
  activeExecution?: ExecutionStatus;
  onViewResults: (executionId: string) => void;
}

export interface ResultsViewerProps {
  execution: ExecutionStatus;
  results?: ExecutionResults;
  onDownload: (format: 'json' | 'csv') => void;
  onClose: () => void;
}

// Project templates for quick creation
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  scanners: {
    scanner_id: string;
    scanner_file: string;
    weight: number;
    default_parameters?: ScannerParameters;
  }[];
  aggregation_method: AggregationMethod;
  tags: string[];
}

// Filter and search interfaces
export interface ProjectFilters {
  searchTerm?: string;
  tags?: string[];
  aggregation_method?: AggregationMethod;
  date_range?: {
    start: string;
    end: string;
  };
  has_scanners?: boolean;
  sort_by?: 'name' | 'created_at' | 'updated_at' | 'execution_count';
  sort_order?: 'asc' | 'desc';
}

export interface ScannerFilters {
  searchTerm?: string;
  category?: string;
  enabled?: boolean;
  sort_by?: 'name' | 'order_index' | 'weight' | 'parameter_count';
  sort_order?: 'asc' | 'desc';
}

// Error handling
export interface ApiError {
  message: string;
  details?: string;
  code?: string;
  timestamp: string;
}

// UI state management
export interface ProjectManagementState {
  projects: Project[];
  selectedProject: Project | null;
  availableScanners: AvailableScanner[];
  projectScanners: Scanner[];
  activeExecution: ExecutionStatus | null;
  executionResults: ExecutionResults | null;
  loading: {
    projects: boolean;
    scanners: boolean;
    parameters: boolean;
    execution: boolean;
  };
  errors: {
    projects: ApiError | null;
    scanners: ApiError | null;
    parameters: ApiError | null;
    execution: ApiError | null;
  };
  filters: {
    projects: ProjectFilters;
    scanners: ScannerFilters;
  };
}

// Common component states
export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
}

export interface ErrorState {
  error: ApiError | null;
  isRetrying?: boolean;
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ProjectValidation extends ValidationResult {
  project: Partial<Project>;
}

export interface ParameterValidationResult extends ValidationResult {
  parameters: ScannerParameters;
}

// ========================================
// Enhanced Project Management with Chat Integration
// ========================================

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
  context?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: string;
}

export interface ChatSession {
  id: string;
  title: string;
  projectId: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
  tags?: string[];
}

export interface EnhancedProject extends Project {
  chatSessions: ChatSession[];
  activeChatId?: string;
  scanResults: ScanResult[];
  strategy: string; // e.g., "Backside Momentum", "LC Patterns"
  color?: string; // For visual organization
}

export interface ScanResult {
  id: string;
  projectId: string;
  scanName: string;
  scanType: 'builtin' | 'uploaded' | 'custom';
  parameters: Record<string, any>;
  results: any[];
  executionTime?: number;
  resultCount: number;
}

export interface ProjectWithChats {
  project: EnhancedProject;
  totalChatMessages: number;
  lastChatActivity?: Date;
  totalScanResults: number;
  lastScanActivity?: Date;
}

// Chat session management
export interface CreateChatSessionRequest {
  projectId: string;
  title: string;
  initialMessage?: string;
  tags?: string[];
}

export interface UpdateChatSessionRequest {
  title?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface ChatSessionFilters {
  projectId?: string;
  searchTerm?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  isActive?: boolean;
  sort_by?: 'title' | 'created_at' | 'last_active_at' | 'message_count';
  sort_order?: 'asc' | 'desc';
}

// Enhanced project management state
export interface EnhancedProjectManagementState {
  projects: EnhancedProject[];
  activeProjectId?: string;
  activeChatId?: string;
  chatSessions: ChatSession[];
  isLoading: boolean;
  error?: string;
  filters: ProjectFilters;
  chatFilters: ChatSessionFilters;
}

// Project dashboard statistics
export interface ProjectDashboardStats {
  totalProjects: number;
  totalChatSessions: number;
  totalScanResults: number;
  averageChatsPerProject: number;
  averageScansPerProject: number;
  mostActiveProject?: {
    id: string;
    name: string;
    chatCount: number;
    scanCount: number;
  };
  recentActivity: {
    chatSessions: ChatSession[];
    scanResults: ScanResult[];
  };
}

// Component interfaces for enhanced project management
export interface EnhancedProjectManagerProps {
  projects: EnhancedProject[];
  activeChatSession?: ChatSession;
  onCreateProject: (config: CreateProjectRequest) => Promise<void>;
  onEditProject: (id: string, config: UpdateProjectRequest) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onSelectProject: (projectId: string) => void;
  onCreateChatSession: (config: CreateChatSessionRequest) => Promise<void>;
  onSelectChatSession: (chatId: string) => void;
  onDeleteChatSession: (chatId: string) => Promise<void>;
  loading?: boolean;
}

export interface ChatSessionManagerProps {
  projectId: string;
  chatSessions: ChatSession[];
  activeChatId?: string;
  onCreateSession: (config: CreateChatSessionRequest) => Promise<void>;
  onSelectSession: (chatId: string) => void;
  onDeleteSession: (chatId: string) => Promise<void>;
  onUpdateSession: (chatId: string, updates: UpdateChatSessionRequest) => Promise<void>;
  loading?: boolean;
}

export interface ProjectChatIntegrationProps {
  project: EnhancedProject;
  activeChat: ChatSession;
  onSendMessage: (content: string, attachments?: FileAttachment[]) => Promise<void>;
  onCreateNewChat: (title: string) => Promise<void>;
  onSwitchChat: (chatId: string) => void;
  isLoading?: boolean;
}