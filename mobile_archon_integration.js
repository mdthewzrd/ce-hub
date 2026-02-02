// Mobile Archon MCP Integration
// Direct integration with Archon MCP server for mobile interface

class MobileArchonIntegration {
    constructor() {
        this.archonEndpoint = 'http://localhost:8052';
        this.fileServerEndpoint = 'http://localhost:8109';
    }

    async getArchonProjects() {
        try {
            const response = await fetch(`${this.archonEndpoint}/projects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: 'CE-Hub projects'
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    return this.formatProjectsForMobile(result.projects);
                }
            }
            return null;
        } catch (error) {
            console.error('Archon MCP error:', error);
            return null;
        }
    }

    async searchArchonKnowledge(query) {
        try {
            const response = await fetch(`${this.archonEndpoint}/rag/search_knowledge_base`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query,
                    match_count: 5
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    return this.formatKnowledgeForMobile(result.results);
                }
            }
            return null;
        } catch (error) {
            console.error('Archon knowledge search error:', error);
            return null;
        }
    }

    async getFileServerProjects() {
        try {
            const response = await fetch(`${this.fileServerEndpoint}/agents`);
            if (response.ok) {
                const result = await response.json();
                return result.agents;
            }
        } catch (error) {
            console.error('File server error:', error);
            return null;
        }
    }

    formatProjectsForMobile(projects) {
        return projects.map(project => ({
            id: project.id || `proj-${Math.random().toString(36).substr(2, 9)}`,
            name: project.title || project.name || 'Unnamed Project',
            description: project.description || 'Project description',
            status: project.status || 'unknown',
            github_repo: project.github_repo || '',
            agents: project.agents || [],
            created_at: project.created_at || new Date().toISOString(),
            type: 'archon_project'
        }));
    }

    formatKnowledgeForMobile(results) {
        return results.map(result => ({
            id: `knowledge-${Math.random().toString(36).substr(2, 9)}`,
            title: this.extractTitle(result.content),
            content: result.content,
            source: result.source || 'Knowledge Base',
            score: result.score || 0,
            type: 'knowledge'
        }));
    }

    extractTitle(content) {
        // Extract a meaningful title from the content
        const lines = content.split('\n');
        const titleLine = lines.find(line =>
            line.includes('**') || line.length < 100 && line.trim().length > 0
        );

        if (titleLine) {
            return titleLine.replace(/\*\*/g, '').trim();
        }

        return content.substring(0, 50).trim() + '...';
    }

    async getRealCEHubProjects() {
        // Get actual CE-Hub projects from file system
        try {
            const response = await fetch(`http://100.95.223.19:8120/file-operations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'list_directory',
                    path: 'projects'
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.items) {
                    return result.items
                        .filter(item => item.type === 'directory')
                        .map(dir => ({
                            id: dir.name,
                            name: this.formatProjectName(dir.name),
                            description: this.getProjectDescription(dir.name),
                            status: 'active',
                            type: 'cehub_project',
                            items: []
                        }));
                }
            }
        } catch (error) {
            console.error('CE-Hub projects error:', error);
        }
        return [];
    }

    formatProjectName(name) {
        return name
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace(/\b(Esp|Api|Cli|Cpu|Gpu|Hud|Ui|Ux|Pwa|Ssl|Tls|Vpn)\b/g, s => s.toUpperCase());
    }

    getProjectDescription(name) {
        const descriptions = {
            'edge-dev-main': 'Main edge development trading scanner system',
            'edge-dev-mobile': 'Mobile-focused trading application',
            'traderra': 'Trading platform with portfolio management',
            'renata': 'AI calendar and scheduling system',
            'claude-bridge': 'Claude integration and bridge system',
            'edge-dev': 'Edge development and optimization tools'
        };
        return descriptions[name.toLowerCase()] || 'CE-Hub project directory';
    }

    async getComprehensiveProjectData() {
        const [archonProjects, cehubProjects, fileAgents] = await Promise.all([
            this.getArchonProjects(),
            this.getRealCEHubProjects(),
            this.getFileServerProjects()
        ]);

        return {
            archon: archonProjects || [],
            cehub: cehubProjects || [],
            fileAgents: fileAgents || [],
            totalProjects: (archonProjects?.length || 0) + (cehubProjects?.length || 0),
            lastUpdated: new Date().toISOString()
        };
    }
}

// Export for use in mobile interface
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileArchonIntegration;
} else if (typeof window !== 'undefined') {
    window.MobileArchonIntegration = MobileArchonIntegration;
}