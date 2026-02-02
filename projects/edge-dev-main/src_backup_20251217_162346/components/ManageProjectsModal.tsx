'use client'

import React, { useState, useEffect } from 'react';
import {
  X,
  FolderPlus,
  Edit,
  Trash2,
  Play,
  Settings,
  Calendar,
  TrendingUp,
  Star,
  AlertCircle,
  Loader,
  Check,
  Plus,
  ChevronRight,
  Code,
  BarChart3,
  Search
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description?: string;
  scan_type: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  last_run?: string;
  results_count?: number;
  is_favorite: boolean;
  tags?: string[];
  config?: any;
}

interface ManageProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectAction: (action: string, projectId?: string, projectData?: any) => void;
}

export const ManageProjectsModal: React.FC<ManageProjectsModalProps> = ({
  isOpen,
  onClose,
  onProjectAction
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'archived'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Load projects when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 ManageProjectsModal is opening - loading projects...');
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    setLoading(true);
    setError('');

    try {
      // Try multiple possible endpoints
      const endpoints = [
        'http://localhost:8000/api/projects/user/test_user_123',
        'http://localhost:8000/api/projects/list',
        'http://localhost:8000/projects/list'
      ];

      let data = null;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint);
          if (response.ok) {
            data = await response.json();
            success = true;
            console.log(`✅ Successfully loaded projects from: ${endpoint}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Failed endpoint: ${endpoint}`);
        }
      }

      if (success && data) {
        // Handle different response formats
        const projectsData = data.projects || data.data || data;
        const projectsArray = Array.isArray(projectsData) ? projectsData : [];

        // Transform to match our interface
        const transformedProjects = projectsArray.map((project: any) => ({
          id: project.id || project._id,
          name: project.name || project.project_name,
          description: project.description || project.project_description,
          scan_type: project.scan_type || project.type || 'unknown',
          status: project.status || 'active',
          created_at: project.created_at || project.timestamp || new Date().toISOString(),
          last_run: project.last_run,
          results_count: project.results_count || project.result_count || 0,
          is_favorite: project.is_favorite || false,
          tags: project.tags || [],
          config: project.config || {}
        }));

        setProjects(transformedProjects);
        console.log(`📂 Loaded ${transformedProjects.length} projects`);
      } else {
        // Create mock data if no projects found
        const mockProjects: Project[] = [
          {
            id: '1',
            name: 'Momentum Scanner',
            description: 'Identifies high-momentum stocks with RSI and moving average confirmation',
            scan_type: 'momentum',
            status: 'active',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            last_run: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            results_count: 42,
            is_favorite: true,
            tags: ['momentum', 'technical', 'daily'],
            config: { rsi_period: 14, ma_period: 20 }
          },
          {
            id: '2',
            name: 'Volume Breakout Detector',
            description: 'Scans for unusual volume spikes and price breakouts from consolidation',
            scan_type: 'volume',
            status: 'completed',
            created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            last_run: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            results_count: 28,
            is_favorite: false,
            tags: ['volume', 'breakout', 'intraday'],
            config: { volume_multiplier: 2.5, lookback_days: 10 }
          },
          {
            id: '3',
            name: 'Options Flow Scanner',
            description: 'Tracks unusual options activity and institutional flow',
            scan_type: 'options',
            status: 'archived',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            last_run: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            results_count: 15,
            is_favorite: false,
            tags: ['options', 'institutional', 'flow'],
            config: { min_contracts: 100, strike_filter: 'ITM' }
          }
        ];

        setProjects(mockProjects);
        console.log('📂 Using mock project data');
      }
    } catch (error) {
      setError('Failed to load projects');
      console.error('❌ Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.scan_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = activeTab === 'all' || project.status === activeTab;

    return matchesSearch && matchesTab;
  });

  const handleProjectAction = (action: string, projectId?: string, projectData?: any) => {
    console.log(`🔄 Project action: ${action}`, projectId, projectData);
    onProjectAction(action, projectId, projectData);
    if (action !== 'edit') {
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'completed': return 'text-blue-400 bg-blue-400/20';
      case 'archived': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />;
      case 'completed': return <Check className="h-3 w-3" />;
      case 'archived': return <Settings className="h-3 w-3" />;
      default: return <Settings className="h-3 w-3" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-gray-900 border-2 border-yellow-500 rounded-lg w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl" style={{ boxShadow: '0 0 30px rgba(212, 175, 55, 0.3)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Manage Projects</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects..."
                className="w-64 pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              {(['all', 'active', 'completed', 'archived'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-yellow-500 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Create New Project Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-6 w-6 text-yellow-500 animate-spin" />
              <span className="ml-2 text-gray-300">Loading projects...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-400 p-4 bg-red-900/30 rounded-lg border border-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderPlus className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? 'No projects found matching your search' : 'No projects found'}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {searchTerm ? 'Try a different search term' : 'Create your first project to get started'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className={`p-4 border rounded-lg transition-all ${
                    selectedProject === project.id
                      ? 'border-yellow-500 bg-yellow-500/10'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white">{project.name}</h3>
                        {project.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                          {getStatusIcon(project.status)}
                          <span>{project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-sm text-gray-400 mb-3">{project.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          <span className="text-gray-500">Type:</span>
                          <span>{project.scan_type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                        {project.last_run && (
                          <div className="flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            <span>Last run: {new Date(project.last_run).toLocaleDateString()}</span>
                          </div>
                        )}
                        {project.results_count !== undefined && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{project.results_count} results</span>
                          </div>
                        )}
                      </div>

                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {project.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleProjectAction('run', project.id)}
                        className="p-2 text-green-400 hover:bg-green-400/20 rounded-lg transition-colors"
                        title="Run Project"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleProjectAction('edit', project.id)}
                        className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition-colors"
                        title="Edit Project"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleProjectAction('delete', project.id)}
                        className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            {activeTab !== 'all' && ` (${activeTab})`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => handleProjectAction('refresh')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageProjectsModal;