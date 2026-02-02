// Simple project storage system for demonstration purposes
// In a real app, this would be connected to a database

interface Project {
  id: string;
  name: string;
  type: string;
  functionName: string;
  enhanced: boolean;
  code: string;
  description?: string;
  tags?: string[];
  timestamp: string;
  features?: {
    hasParameters: boolean;
    hasMarketData: boolean;
    hasEnhancedFormatting: boolean;
  };
}

class ProjectStorage {
  private readonly STORAGE_KEY = 'edge-dev-projects';

  // Get all projects
  getProjects(): Project[] {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  // Add a new project
  addProject(projectData: Omit<Project, 'id' | 'timestamp'>): Project {
    const project: Project = {
      ...projectData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    const projects = this.getProjects();
    projects.push(project);
    this.saveProjects(projects);

    console.log('✅ Project added to storage:', project);
    return project;
  }

  // Get project by ID
  getProject(id: string): Project | null {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  // Update project
  updateProject(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);

    if (index >= 0) {
      projects[index] = { ...projects[index], ...updates };
      this.saveProjects(projects);
      return projects[index];
    }

    return null;
  }

  // Delete project
  deleteProject(id: string): boolean {
    const projects = this.getProjects();
    const filteredProjects = projects.filter(p => p.id !== id);

    if (filteredProjects.length < projects.length) {
      this.saveProjects(filteredProjects);
      return true;
    }

    return false;
  }

  // Clear all projects
  clearProjects(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // Save projects to localStorage
  private saveProjects(projects: Project[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
      } catch (error) {
        console.error('Error saving projects:', error);
      }
    }
  }

  // Get project count
  getProjectCount(): number {
    return this.getProjects().length;
  }

  // Get projects by type
  getProjectsByType(type: string): Project[] {
    return this.getProjects().filter(p => p.type === type);
  }
}

// Singleton instance
export const projectStorage = new ProjectStorage();
export type { Project };