'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Brain, X, Send, Upload, Loader2, CheckCircle2, XCircle, Plus, Search, Sparkles, Wrench, Zap, FileText, Shield, Activity, History } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import ChatHistorySidebar from './ChatHistorySidebar';
import {
  generateConversationName,
  saveConversation,
  loadAllConversations,
  type ChatConversation
} from '@/utils/renataChatHistory';

// Agent types with their icons and colors
const AGENTS = {
  code_analyzer: {
    name: 'Code Analyzer',
    icon: Search,
    color: '#3B82F6',
    description: 'Analyzes code structure'
  },
  parameter_extractor: {
    name: 'Parameter Extractor',
    icon: Wrench,
    color: '#F59E0B',
    description: 'Extracts parameters'
  },
  code_formatter: {
    name: 'Code Formatter',
    icon: Sparkles,
    color: '#8B5CF6',
    description: 'Formats code'
  },
  optimizer: {
    name: 'Optimizer',
    icon: Zap,
    color: '#10B981',
    description: 'Optimizes performance'
  },
  documentation: {
    name: 'Documentation',
    icon: FileText,
    color: '#EC4899',
    description: 'Adds documentation'
  },
  validator: {
    name: 'Validator',
    icon: Shield,
    color: '#EF4444',
    description: 'Validates compliance'
  },
  orchestrator: {
    name: 'Renata Orchestrator',
    icon: Brain,
    color: '#D4AF37',
    description: 'Multi-agent coordinator'
  }
};

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agent?: keyof typeof AGENTS;
  agentsUsed?: string[];
  transformedCode?: string;
  validationResults?: any;
  scannerName?: string;
}

interface Project {
  id: string;
  name: string;
  title: string;
  description?: string;
}

interface RenataV2ChatProps {
  transformedCode?: string | null;
  onTransformComplete?: (code: string) => void;
}

export default function RenataV2Chat({ transformedCode: initialTransformedCode, onTransformComplete }: RenataV2ChatProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "**Welcome!** I'm **Renata** - your AI-powered EdgeDev code transformation assistant.\n\nI'll transform your trading scanners to EdgeDev standards with:\n\n• ✅ EdgeDev Standard compliance\n• ⚡ Performance optimizations\n• 🛡️ Bug fixes applied\n• 📚 Clean documentation\n\nUpload a scanner file or paste Python code to get started!",
      type: 'assistant',
      timestamp: new Date(),
      agent: 'orchestrator'
    }
  ]);

  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat history state
  const [showHistory, setShowHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [conversationName, setConversationName] = useState<string | null>(null);

  // Project management state
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [addingToProject, setAddingToProject] = useState(false);
  const [currentTransformedCode, setCurrentTransformedCode] = useState<string | null>(null);
  const [currentScannerName, setCurrentScannerName] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Strip thinking text from code before saving
  const stripThinkingText = (code: string): string => {
    if (!code) return code;

    const lines = code.split('\n');
    let codeStartIdx = 0;

    // Find where actual Python code starts
    for (let i = 0; i < lines.length; i++) {
      const stripped = lines[i].trim();

      // Skip empty lines
      if (!stripped) continue;

      // Skip lines that look like thinking/explanation
      const thinkingKeywords = [
        'okay, let', 'first, i', 'i need', 'looking at', 'let\'s tackle',
        'the user wants', 'the template\'s', 'another thing', 'putting it all',
        'now, let', 'looking at the existing', 'i can see', 'the issue is'
      ];

      if (stripped.startsWith('#') && thinkingKeywords.some(kw => stripped.toLowerCase().includes(kw))) {
        continue;
      }

      // Found actual code
      if (stripped.startsWith('import ') ||
          stripped.startsWith('from ') ||
          stripped.startsWith('class ') ||
          stripped.startsWith('def ') ||
          stripped.startsWith('"""') ||
          stripped.startsWith("'''")) {
        codeStartIdx = i;
        break;
      }
    }

    // Return clean code
    return lines.slice(codeStartIdx).join('\n');
  };

  // ==================== CHAT HISTORY MANAGEMENT ====================

  /**
   * Save current conversation to history
   */
  const saveCurrentConversation = () => {
    // Only save if there are user messages beyond the welcome
    const userMessages = messages.filter(m => m.type === 'user' && m.id !== '1');
    if (userMessages.length === 0) return;

    // Get first user message for naming
    const firstUserMessage = userMessages[0].content;

    try {
      const conversation: ChatConversation = {
        id: currentConversationId || Date.now().toString(),
        name: conversationName || generateConversationName(firstUserMessage),
        firstMessage: firstUserMessage,
        messages: messages.map(m => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)
        })),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      saveConversation(conversation);
      setCurrentConversationId(conversation.id);
      setConversationName(conversation.name);
      console.log('💾 Conversation saved:', conversation.name);
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  };

  /**
   * Load a conversation from history
   */
  const loadConversation = (conversation: ChatConversation) => {
    console.log('📂 Loading conversation:', conversation.name);

    setMessages(conversation.messages as ChatMessage[]);
    setCurrentConversationId(conversation.id);
    setConversationName(conversation.name);

    // Restore code if present
    const lastAssistantMessage = [...conversation.messages]
      .reverse()
      .find(m => m.type === 'assistant' && m.transformedCode);

    if (lastAssistantMessage?.transformedCode) {
      setCurrentTransformedCode(lastAssistantMessage.transformedCode);
      setCurrentScannerName(lastAssistantMessage.scannerName || 'Scanner');
    }

    scrollToBottom();
  };

  /**
   * Start a new conversation
   */
  const startNewConversation = () => {
    const newId = Date.now().toString();
    setCurrentConversationId(newId);
    setConversationName(null);
    setMessages([
      {
        id: '1',
        content: "**Welcome!** I'm **Renata** - your AI-powered EdgeDev code transformation assistant.\n\nI'll transform your trading scanners to EdgeDev standards with:\n\n• ✅ EdgeDev Standard compliance\n• ⚡ Performance optimizations\n• 🛡️ Bug fixes applied\n• 📚 Clean documentation\n\nUpload a scanner file or paste Python code to get started!",
        type: 'assistant',
        timestamp: new Date(),
        agent: 'orchestrator'
      }
    ]);
    setCurrentTransformedCode(null);
    setCurrentScannerName(null);
    console.log('✨ New conversation started');
  };

  // Auto-save conversation when messages change
  useEffect(() => {
    if (messages.length > 1) { // More than just welcome message
      const saveTimeout = setTimeout(() => {
        saveCurrentConversation();
      }, 1000); // Debounce saves

      return () => clearTimeout(saveTimeout);
    }
  }, [messages]);

  // Load pre-transformed code from scan page
  useEffect(() => {
    if (initialTransformedCode) {
      console.log('📥 Loading pre-transformed code from scan page...');

      // CRITICAL: Strip thinking text from initial code
      const cleanedInitialCode = stripThinkingText(initialTransformedCode);
      console.log(`🧹 Cleaned initial code: ${initialTransformedCode.length} → ${cleanedInitialCode.length} chars`);

      const transformedMessage: ChatMessage = {
        id: (Date.now()).toString(),
        content: '✅ **Auto-transformation Complete!**\n\nYour scanner has been transformed to EdgeDev Standard with:\n\n• ✅ `fetch_all_grouped_data` → `fetch_grouped_data`\n• ✅ Removed `$` from column names (ADV20_$ → adv20_usd)\n• ✅ Preserved all original logic and implementations\n\nThe transformed code is now ready to run on the EdgeDev platform!',
        type: 'assistant',
        timestamp: new Date(),
        transformedCode: cleanedInitialCode,
        scannerName: localStorage.getItem('twoStageScannerName') || 'Scanner'
      };

      setMessages(prev => [...prev, transformedMessage]);
      setCurrentTransformedCode(cleanedInitialCode);

      // Notify parent component
      if (onTransformComplete) {
        onTransformComplete(cleanedInitialCode);
      }

      scrollToBottom();
    }
  }, [initialTransformedCode, onTransformComplete]);

  // Fetch available projects
  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:5666/api/projects');
      if (response.ok) {
        const data = await response.json();
        const allProjects = Array.isArray(data) ? data : (data.data || []);

        // 🚨 CRITICAL FIX: Filter out deleted projects to prevent adding scanners to them
        // Load deleted IDs from localStorage and window object
        let deletedIds = new Set<string>();
        if (typeof window !== 'undefined') {
          const storedDeletedIds = JSON.parse(localStorage.getItem('deletedProjectIds') || '[]') || [];
          deletedIds = new Set(storedDeletedIds);
          // Merge with runtime deleted IDs
          if (window.deletedProjectIds) {
            window.deletedProjectIds.forEach(id => deletedIds.add(id));
          }
          console.log('🗑️ Renata: Filtering out deleted projects:', Array.from(deletedIds));
        }

        // Filter out deleted projects
        const filteredProjects = allProjects.filter((project: any) => {
          const projectId = project.id || project.project_data?.id;
          const isDeleted = deletedIds.has(projectId);
          if (isDeleted) {
            console.log('  🚫 Skipping deleted project:', project.name, '(', projectId, ')');
          }
          return !isDeleted;
        });

        console.log('✅ Renata: Fetched', filteredProjects.length, 'non-deleted projects (from', allProjects.length, 'total)');
        setProjects(filteredProjects);
        return filteredProjects;
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
    return [];
  };

  // Add scanner to project
  const addToProject = async (projectId: string) => {
    if (!currentTransformedCode || !currentScannerName) return;

    setAddingToProject(true);
    try {
      console.log(`📤 Adding scanner to project ${projectId}...`);
      console.log(`   Scanner name: ${currentScannerName}`);
      console.log(`   Code length: ${currentTransformedCode.length}`);

      // CRITICAL: Strip any thinking text before saving
      const cleanCode = stripThinkingText(currentTransformedCode);
      console.log(`✅ Cleaned code: ${cleanCode.length} chars (removed ${currentTransformedCode.length - cleanCode.length} chars)`);

      // Create scanner directory
      const scannerId = `scanner_${Date.now()}`;
      const response = await fetch(`http://localhost:5666/api/save-scanner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          scanner_id: scannerId,
          scanner_name: currentScannerName,
          scanner_code: cleanCode  // Use cleaned code!
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Scanner added to project:', result);

        // Dispatch event to notify scan page to refresh projects
        window.dispatchEvent(new CustomEvent('scannerAddedToProject'));

        // Add success message to chat
        const successMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          content: `✅ **Successfully added scanner to project!**

• **Scanner:** ${currentScannerName}
• **Project:** ${projectId}
• **Scanner ID:** ${scannerId}

You can now run this scanner from the Projects dashboard.`,
          type: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);

        setShowProjectModal(false);
        setSelectedProject(null);
      } else {
        const error = await response.json();
        throw new Error(error.detail || error.message || 'Failed to add scanner');
      }
    } catch (error) {
      console.error('Error adding to project:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        content: `❌ **Failed to add scanner to project**

Error: ${error instanceof Error ? error.message : 'Unknown error'}

Make sure the backend is running and has write permissions.`,
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setAddingToProject(false);
    }
  };

  // Handle creating a new project with custom name
  const handleCreateNewProject = async (projectName: string) => {
    if (!currentTransformedCode || !currentScannerName) return;

    setAddingToProject(true);
    try {
      const scannerId = `scanner_${Date.now()}`;

      // CRITICAL: Clean the code before saving
      const cleanCode = stripThinkingText(currentTransformedCode);
      console.log(`✅ Cleaned code for new project: ${cleanCode.length} chars`);

      const response = await fetch('http://localhost:5666/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: `Auto-generated project for ${currentScannerName} scanners`,
          code: cleanCode,
          aggregation_method: 'union',
          tags: ['scanner', 'auto-generated', currentScannerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
          function_name: currentScannerName.replace(/[^a-zA-Z0-9]/g, '_')
        })
      });

      if (response.ok) {
        const result = await response.json();

        // Now add the scanner to the new project
        const saveResponse = await fetch(`http://localhost:5666/api/save-scanner`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: result.id,
            scanner_id: scannerId,
            scanner_name: currentScannerName,
            scanner_code: cleanCode  // Use cleaned code!
          })
        });

        if (saveResponse.ok) {
          // Dispatch event to notify scan page to refresh projects
          window.dispatchEvent(new CustomEvent('scannerAddedToProject'));

          const successMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            content: `✅ **Successfully created project and added scanner!**

• **Project:** ${projectName}
• **Scanner:** ${currentScannerName}
• **Project ID:** ${result.id}

A new project has been created with your custom name.`,
            type: 'assistant',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, successMessage]);
          setShowProjectModal(false);
          setSelectedProject(null);
        }
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        content: `❌ **Failed to create project**

Error: ${error instanceof Error ? error.message : 'Unknown error'}

Please try again or create a project manually in the Projects dashboard.`,
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setAddingToProject(false);
    }
  };

  // Generate smart project name from scanner name
  const generateProjectName = (scannerName: string): string => {
    // Remove common suffixes and clean up
    let cleanName = scannerName
      .replace(/copy\s*\d*$/gi, '')  // Remove "copy 3", "copy", etc.
      .replace(/v\d+(\.\d+)*$/gi, '') // Remove version numbers like "v2.1"
      .replace(/_\d+$/g, '')          // Remove trailing underscores + numbers
      .replace(/\d+$/g, '')           // Remove trailing numbers
      .replace(/[-_]+/g, ' ')        // Replace hyphens/underscores with spaces
      .trim();

    // Capitalize first letter of each word
    const titleCase = cleanName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Add "Project" suffix if not already present
    if (!titleCase.toLowerCase().includes('project')) {
      return `${titleCase} Project`;
    }

    return titleCase;
  };

  // Create a new project with smart naming
  const createProjectFromScanner = async (scannerName: string, code: string): Promise<string | null> => {
    try {
      const projectName = generateProjectName(scannerName);
      const scannerId = `scanner_${Date.now()}`;

      console.log('🔨 Creating project:', projectName);
      console.log('📝 Scanner:', scannerName);
      console.log('📍 Current page:', window.location.pathname);

      // Check if we're on the backtest page
      const isBacktestPage = window.location.pathname === '/backtest';

      if (isBacktestPage) {
        console.log('🎯 BACKTEST PAGE DETECTED - Using localStorage instead of API');

        // Create backtest project directly in localStorage with ALL required statistics
        const backtestProject = {
          id: `backtest_${Date.now()}`,
          name: projectName,
          description: `Backtest project for ${scannerName} scanner`,
          created_at: new Date().toISOString(),
          status: 'pending',
          scanner_name: scannerName,
          scanner_code: code,
          trades: [],
          execution_wedges: [], // Empty array for execution wedges
          statistics: {
            // Core statistics
            total_trades: 0,
            winning_trades: 0,
            losing_trades: 0,
            win_rate: 0,
            total_return: 0,
            total_pnl: 0,
            sharpe_ratio: 0,
            sortino_ratio: 0,
            calmar_ratio: 0,
            profit_factor: 0,
            cagr: 0,
            max_drawdown: 0,
            // Trade statistics
            avg_win: 0,
            avg_loss: 0,
            largest_win: 0,
            largest_loss: 0,
            max_consecutive_wins: 0,
            max_consecutive_losses: 0,
            avg_holding_period: 0,
            // Risk statistics
            volatility: 0,
            var_95: 0,
            cvar_95: 0,
            avg_drawdown: 0,
            recovery_factor: 0,
            // Validation statistics
            is_return: 0,
            oos_return: 0,
            walk_forward_avg: 0,
            stability_score: 0,
            overfitting_score: 0,
            monte_carlo_confidence: 0
          }
        };

        // Save to localStorage
        const existingProjects = JSON.parse(localStorage.getItem('backtestProjects') || '[]');
        const updatedProjects = [backtestProject, ...existingProjects];
        localStorage.setItem('backtestProjects', JSON.stringify(updatedProjects));

        console.log('✅ Backtest project saved to localStorage:', backtestProject.id);

        // Dispatch special backtest event
        window.dispatchEvent(new CustomEvent('backtestProjectAdded', {
          detail: backtestProject
        }));
        console.log('📡 Dispatched backtestProjectAdded event');

        return backtestProject.id;
      }

      // Normal scan page flow - use API
      console.log('📊 SCAN PAGE - Using API');

      const response = await fetch('http://localhost:5666/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: `Auto-generated project for ${scannerName} scanners`,
          code: code,
          aggregation_method: 'union',
          tags: ['scanner', 'auto-generated', scannerName.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
          function_name: scannerName.replace(/[^a-zA-Z0-9]/g, '_')
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Created project:', result.id, result.name);

        // Now add the scanner to the new project
        console.log('💾 Saving scanner to project...');
        const saveResponse = await fetch(`http://localhost:5666/api/save-scanner`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: result.id,
            scanner_id: scannerId,
            scanner_name: scannerName,
            scanner_code: code
          })
        });

        if (saveResponse.ok) {
          console.log('✅ Scanner saved successfully!');
          // Dispatch event to notify scan page to refresh projects
          window.dispatchEvent(new CustomEvent('scannerAddedToProject'));
          console.log('📡 Dispatched scannerAddedToProject event');
          return result.id;
        } else {
          const errorText = await saveResponse.text();
          console.error('❌ Failed to save scanner:', saveResponse.status, errorText);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to create project:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Exception in createProjectFromScanner:', error);
    }
    return null;
  };

  // Handle "Add to Project" button click
  const handleAddToProject = async (scannerName: string, code: string) => {
    setCurrentScannerName(scannerName);
    setCurrentTransformedCode(code);

    const projectList = await fetchProjects();
    const smartProjectName = generateProjectName(scannerName);

    // 🎯 CRITICAL FIX: Check if this is a fresh chat (new conversation) vs continuing an existing project
    // A fresh chat should create a NEW project, not add to an existing one
    const isFreshChat = messages.length <= 3; // First few messages = new conversation

    if (projectList.length === 0 || isFreshChat) {
      // Create NEW project for fresh chats or when no projects exist
      const creatingMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `🔨 **Creating new project:** "${smartProjectName}"\n\nAdding scanner to new project...`,
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, creatingMessage]);

      const newProjectId = await createProjectFromScanner(scannerName, code);
      if (newProjectId) {
        const successMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          content: `✅ **Successfully created new project!**

• **Project:** ${smartProjectName}
• **Scanner:** ${scannerName}
• **Project ID:** ${newProjectId}

A new project has been created for this formatted scanner.`,
          type: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          content: `❌ **Failed to create project**

Unable to create project. Please try again.`,
          type: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      return;
    }

    // For existing chats with multiple projects, check for matching project
    const existingProject = projectList.find((p: Project) =>
      p.name.toLowerCase().includes(smartProjectName.toLowerCase().replace(' project', '')) ||
      smartProjectName.toLowerCase().includes(p.name.toLowerCase())
    );

    if (existingProject) {
      // Found matching project, add to it
      addToProject(existingProject.id);
      return;
    }

    // Multiple projects but no match - show modal to select
    setShowProjectModal(true);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCurrentInput(`📎 Uploaded: ${file.name}`);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('FileReader did not return a string'));
        }
      };
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  };

  const transformCode = async (code: string, fileName?: string) => {
    console.log('🚀 Starting transformation in RenataV2Chat...');
    console.log('   File:', fileName);
    console.log('   Code length:', code.length);

    const response = await fetch('/api/renata_v2/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_code: code,
        scanner_name: fileName?.replace('.py', '') || undefined,
        date_range: '2024-01-01 to 2024-12-31',
        verbose: true
      })
    });

    console.log('   Response status:', response.status);

    const data = await response.json();

    console.log('📥 Response data:', {
      success: data.success,
      generated_code_exists: !!data.generated_code,
      generated_code_length: data.generated_code?.length || 0,
      corrections_made: data.corrections_made,
      errors: data.errors?.length || 0
    });

    let responseContent = '';
    if (data.success) {
      // Extract scanner name from generated code
      let scannerName = fileName?.replace('.py', '') || 'unknown_scanner';
      if (data.generated_code) {
        const classMatch = data.generated_code.match(/class\s+(\w+)\s*:/);
        if (classMatch) {
          scannerName = classMatch[1];
        }
      }

      responseContent = `✅ **Transformation Complete!**

I've successfully transformed your code to the EdgeDev Standard.

**Summary:**
• ${data.corrections_made || 0} corrections applied
• All validation checks passed
• Code is ready for use

Here's your transformed code:
`;
    } else {
      responseContent = `❌ **Transformation Failed**

${data.errors?.join('\n') || 'Unknown error'}`;
    }

    // Extract scanner name from generated code
    let scannerName = fileName?.replace('.py', '') || 'unknown_scanner';
    if (data.generated_code) {
      const classMatch = data.generated_code.match(/class\s+(\w+)\s*:/);
      if (classMatch) {
        scannerName = classMatch[1];
      }
    }

    return {
      content: responseContent,
      generated_code: data.generated_code,
      validation_results: data.validation_results,
      scannerName: scannerName
    };
  };

  const sendMessage = async () => {
    if (!currentInput.trim() && !selectedFile) return;
    if (isLoading) return;

    // If file is selected, transform it
    if (selectedFile) {
      try {
        const fileContent = await readFileContent(selectedFile);

        // Include user's message if they typed one
        const messageContent = currentInput.trim()
          ? `${currentInput.trim()}\n\n📎 File: ${selectedFile.name}`
          : `📎 File: ${selectedFile.name}`;

        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          content: messageContent,
          type: 'user',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const messageToSend = currentInput.trim();
        setCurrentInput('');
        setSelectedFile(null);
        setIsLoading(true);

        const result = await transformCode(fileContent, selectedFile.name);

        // CRITICAL: Strip thinking text before displaying/saving
        const generatedCode = result.generated_code || '';
        const cleanedCode = stripThinkingText(generatedCode);
        console.log(`🧹 Cleaned transformed code: ${generatedCode.length} → ${cleanedCode.length} chars`);

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: result.content,
          type: 'assistant',
          timestamp: new Date(),
          transformedCode: cleanedCode,
          validationResults: result.validation_results,
          scannerName: result.scannerName
        };

        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error in file transformation:', error);
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to read file'}`,
          type: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsLoading(false);
      }
      return;
    }

    // Normal chat - use chat API
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentInput,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const inputToSend = currentInput;
    setCurrentInput('');
    setIsLoading(true);

    try {
      // Build conversation history
      const chatHistory = messages.map(msg => ({
        role: msg.type,
        content: msg.content
      }));

      // Add current message
      chatHistory.push({
        role: 'user',
        content: inputToSend
      });

      const response = await fetch('/api/renata/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await response.json();

      let responseContent = '';
      let agentType: keyof typeof AGENTS = 'orchestrator';
      let agentsUsed: string[] = [];

      if (data.success) {
        responseContent = data.message;

        // Detect which agent responded based on message content
        if (responseContent.includes('🔍') || responseContent.includes('Code Analyzer')) {
          agentType = 'code_analyzer';
        } else if (responseContent.includes('🔧') || responseContent.includes('Parameter Extractor')) {
          agentType = 'parameter_extractor';
        } else if (responseContent.includes('✨') || responseContent.includes('Code Formatter')) {
          agentType = 'code_formatter';
        } else if (responseContent.includes('⚡') || responseContent.includes('Optimizer')) {
          agentType = 'optimizer';
        } else if (responseContent.includes('📝') || responseContent.includes('Documentation')) {
          agentType = 'documentation';
        } else if (responseContent.includes('✅') || responseContent.includes('Validator')) {
          agentType = 'validator';
        }

        // Extract agents used from response if available
        if (data.context?.agentsUsed) {
          agentsUsed = data.context.agentsUsed;
        }
      } else {
        responseContent = `❌ ${data.error || 'Chat failed'}`;
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        type: 'assistant',
        timestamp: new Date(),
        agent: agentType,
        agentsUsed: agentsUsed
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: '❌ Error: Failed to connect to chat service. Please make sure the backend is running.',
        type: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Simple Header */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 100%)',
        borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Brain style={{ width: '20px', height: '20px', color: '#D4AF37' }} />
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#D4AF37', letterSpacing: '0.5px' }}>
              Renata
            </div>
            {conversationName && (
              <div style={{
                padding: '4px 10px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#D4AF37',
                fontWeight: '500',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {conversationName}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={startNewConversation}
              style={{
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#888',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = '#888';
              }}
              title="New conversation"
            >
              New
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              style={{
                padding: '8px',
                background: showHistory ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: showHistory ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: showHistory ? '#D4AF37' : '#888',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!showHistory) {
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                  e.currentTarget.style.color = '#D4AF37';
                }
              }}
              onMouseLeave={(e) => {
                if (!showHistory) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = '#888';
                }
              }}
              title="Chat history"
            >
              <History style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: '12px',
              marginBottom: '16px',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{ display: 'flex', gap: '10px', maxWidth: '90%', flexDirection: message.type === 'user' ? 'row-reverse' : 'row' }}>
              {/* Avatar Container */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {/* Avatar with Agent Icon */}
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: message.type === 'user'
                      ? 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)'
                      : `linear-gradient(135deg, ${AGENTS[message.agent || 'orchestrator'].color}20 0%, ${AGENTS[message.agent || 'orchestrator'].color}10 100%)`,
                    border: message.type === 'user'
                      ? '1px solid rgba(212, 175, 55, 0.4)'
                      : `1px solid ${AGENTS[message.agent || 'orchestrator'].color}40`,
                    boxShadow: message.type === 'user'
                      ? '0 4px 12px rgba(212, 175, 55, 0.3)'
                      : `0 2px 8px ${AGENTS[message.agent || 'orchestrator'].color}30`,
                    color: message.type === 'user' ? '#000' : AGENTS[message.agent || 'orchestrator'].color
                  }}
                >
                  {message.type === 'user' ? (
                    'U'
                  ) : (
                    React.createElement(AGENTS[message.agent || 'orchestrator'].icon, {
                      style: { width: '22px', height: '22px' }
                    })
                  )}
                </div>

                {/* Agent Badge */}
                {message.type === 'assistant' && message.agent && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: AGENTS[message.agent].color,
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '9px',
                      fontWeight: '700',
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      border: '2px solid #0f0f0f',
                      zIndex: 10
                    }}
                  >
                    {AGENTS[message.agent].name.split(' ')[0]}
                  </div>
                )}
              </div>


              {/* Message Content */}
              <div
                style={{
                  background: message.type === 'user'
                    ? 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)'
                    : 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.03) 100%)',
                  border: message.type === 'user'
                    ? '1px solid rgba(212, 175, 55, 0.4)'
                    : '1px solid rgba(212, 175, 55, 0.15)',
                  borderRadius: '8px',
                  padding: '14px',
                  maxWidth: '100%',
                  boxShadow: message.type === 'user'
                    ? '0 4px 12px rgba(212, 175, 55, 0.25), 0 0 0 1px rgba(212, 175, 55, 0.1)'
                    : '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.05)',
                  color: message.type === 'user' ? '#000' : '#e5e5e5'
                }}
              >
                <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  {message.type === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
                        strong: ({ children }) => <strong style={{ color: '#D4AF37', fontWeight: '700' }}>{children}</strong>,
                        em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                        code: ({ children }) => (
                          <code style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '13px',
                            color: '#10B981'
                          }}>{children}</code>
                        ),
                        ul: ({ children }) => <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>{children}</ol>,
                        li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                        h1: ({ children }) => <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#D4AF37', marginTop: '12px', marginBottom: '8px' }}>{children}</h1>,
                        h2: ({ children }) => <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#D4AF37', marginTop: '10px', marginBottom: '6px' }}>{children}</h2>,
                        h3: ({ children }) => <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#D4AF37', marginTop: '8px', marginBottom: '6px' }}>{children}</h3>,
                        blockquote: ({ children }) => (
                          <blockquote style={{
                            borderLeft: '3px solid #D4AF37',
                            paddingLeft: '12px',
                            margin: '8px 0',
                            fontStyle: 'italic',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>{children}</blockquote>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                  )}
                </div>

                {/* Agents Used Indicator */}
                {message.type === 'assistant' && message.agentsUsed && message.agentsUsed.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap',
                      padding: '8px 12px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderRadius: '6px',
                      border: '1px solid rgba(212, 175, 55, 0.1)'
                    }}>
                      <Activity style={{ width: '14px', height: '14px', color: '#D4AF37' }} />
                      <span style={{ fontSize: '11px', color: '#888', fontWeight: '600', letterSpacing: '0.5px' }}>
                        AGENTS:
                      </span>
                      {message.agentsUsed.map((agentKey: string, idx: number) => {
                        const agent = AGENTS[agentKey as keyof typeof AGENTS] || AGENTS.orchestrator;
                        const AgentIcon = agent.icon;
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 8px',
                              background: `${agent.color}15`,
                              borderRadius: '4px',
                              border: `1px solid ${agent.color}30`,
                              fontSize: '10px',
                              fontWeight: '600',
                              color: agent.color
                            }}
                          >
                            <AgentIcon style={{ width: '12px', height: '12px' }} />
                            <span>{agent.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Transformed Code Display */}
                {message.transformedCode && (
                  <div style={{ marginTop: '16px' }}>
                    <div
                      style={{
                        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginTop: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(212, 175, 55, 0.1)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '10px',
                        paddingBottom: '10px',
                        borderBottom: '1px solid rgba(212, 175, 55, 0.15)'
                      }}>
                        <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981' }} />
                        <span style={{ color: '#D4AF37', fontSize: '13px', fontWeight: '600', letterSpacing: '0.3px' }}>
                          Transformed Code (EdgeDev Standard)
                        </span>
                      </div>
                      <textarea
                        readOnly
                        value={stripThinkingText(message.transformedCode || '')}
                        style={{
                          width: '100%',
                          minHeight: '180px',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: '1px solid rgba(212, 175, 55, 0.2)',
                          borderRadius: '6px',
                          padding: '12px',
                          color: '#10B981',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          resize: 'vertical',
                          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                        }}
                      />
                      <button
                        onClick={() => {
                          // CRITICAL: Use currentTransformedCode, not message.transformedCode
                          // This ensures we always save the latest/cleanest version
                          const codeToSave = currentTransformedCode || message.transformedCode;
                          const nameToUse = message.scannerName || currentScannerName;

                          if (codeToSave && nameToUse) {
                            console.log('💾 Saving to project with CURRENT transformed code');
                            console.log(`   Code length: ${codeToSave.length}`);
                            console.log(`   Scanner name: ${nameToUse}`);
                            handleAddToProject(nameToUse, codeToSave);
                          } else {
                            console.error('❌ No code or scanner name available');
                          }
                        }}
                        style={{
                          width: '100%',
                          marginTop: '12px',
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
                          border: '1px solid rgba(212, 175, 55, 0.4)',
                          borderRadius: '6px',
                          color: '#000',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(212, 175, 55, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3)';
                        }}
                      >
                        <Plus style={{ width: '16px', height: '16px' }} />
                        Add to Project
                      </button>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div style={{
                  fontSize: '11px',
                  opacity: 0.5,
                  marginTop: '10px',
                  fontWeight: '500',
                  color: message.type === 'user' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.4)',
                  letterSpacing: '0.3px'
                }}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '10px', maxWidth: '90%' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  boxShadow: '0 2px 8px rgba(212, 175, 55, 0.15)'
                }}
              >
                <Loader2 style={{ width: '18px', height: '18px', color: '#D4AF37', animation: 'spin 1s linear infinite' }} />
              </div>
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(212, 175, 55, 0.03) 100%)',
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.05)'
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#D4AF37',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite'
                  }}></div>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#D4AF37',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite 0.2s'
                  }}></div>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#D4AF37',
                    borderRadius: '50%',
                    animation: 'bounce 1s infinite 0.4s'
                  }}></div>
                </div>
                <span style={{ fontSize: '14px', color: '#e5e5e5', fontWeight: '500' }}>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
        padding: '16px',
        background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.05) 0%, transparent 100%)'
      }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '8px',
              color: '#D4AF37',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              letterSpacing: '0.3px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.25) 0%, rgba(212, 175, 55, 0.15) 100%)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(212, 175, 55, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
            }}
          >
            <Upload style={{ width: '16px', height: '16px' }} />
            Upload Scanner
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".py,.txt"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          {selectedFile && (
            <div style={{
              padding: '10px 16px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#10B981',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
            }}>
              <CheckCircle2 style={{ width: '16px', height: '16px' }} />
              {selectedFile.name}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste Python scanner code here or upload a file..."
            disabled={isLoading}
            rows={3}
            style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              color: '#fff',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'monospace',
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.4)';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(212, 175, 55, 0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)';
              e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0, 0, 0, 0.3)';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={(!currentInput.trim() && !selectedFile) || isLoading}
            style={{
              padding: '12px 20px',
              background: (!currentInput.trim() && !selectedFile) || isLoading
                ? 'rgba(212, 175, 55, 0.2)'
                : 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '8px',
              color: (!currentInput.trim() && !selectedFile) || isLoading ? 'rgba(212, 175, 55, 0.5)' : '#000',
              fontSize: '14px',
              fontWeight: '700',
              cursor: (!currentInput.trim() && !selectedFile) || isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: (!currentInput.trim() && !selectedFile) || isLoading
                ? 'none'
                : '0 4px 12px rgba(212, 175, 55, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.1)',
              letterSpacing: '0.3px'
            }}
            onMouseEnter={(e) => {
              if (!((!currentInput.trim() && !selectedFile) || isLoading)) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(212, 175, 55, 0.4), 0 0 0 1px rgba(212, 175, 55, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 175, 55, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.1)';
            }}
          >
            <Send style={{ width: '16px', height: '16px' }} />
            Send
          </button>
        </div>

        <div style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.4)',
          marginTop: '12px',
          textAlign: 'center',
          fontWeight: '500',
          letterSpacing: '0.3px'
        }}>
          Press Enter to send • Shift + Enter for new line
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Project Selection Modal */}
      {showProjectModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowProjectModal(false)}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #111111 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '400px',
              maxWidth: '500px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(212, 175, 55, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(212, 175, 55, 0.15)'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: '#D4AF37',
                letterSpacing: '0.3px'
              }}>
                Select Project
              </h3>
              <button
                onClick={() => setShowProjectModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              marginBottom: '20px'
            }}>
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => addToProject(project.id)}
                  disabled={addingToProject}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    marginBottom: '8px',
                    background: selectedProject === project.id
                      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'
                      : 'rgba(0, 0, 0, 0.4)',
                    border: selectedProject === project.id
                      ? '1px solid rgba(212, 175, 55, 0.4)'
                      : '1px solid rgba(212, 175, 55, 0.15)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: addingToProject ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    opacity: addingToProject ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!addingToProject) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = selectedProject === project.id
                      ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 100%)'
                      : 'rgba(0, 0, 0, 0.4)';
                    e.currentTarget.style.borderColor = selectedProject === project.id
                      ? 'rgba(212, 175, 55, 0.4)'
                      : 'rgba(212, 175, 55, 0.15)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#D4AF37' }}>
                      {project.name || project.title}
                    </span>
                    {selectedProject === project.id && (
                      <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981' }} />
                    )}
                  </div>
                  {project.description && (
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: '4px'
                    }}>
                      {project.description}
                    </div>
                  )}
                </button>
              ))}

              {/* Option to create new project with smart name */}
              {currentScannerName && (
                <button
                  onClick={() => {
                    const smartName = generateProjectName(currentScannerName);
                    setShowProjectModal(false);
                    handleCreateNewProject(smartName);
                  }}
                  disabled={addingToProject}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    marginTop: '12px',
                    marginBottom: '8px',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                    border: '1px dashed rgba(16, 185, 129, 0.4)',
                    borderRadius: '8px',
                    color: '#10B981',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: addingToProject ? 'not-allowed' : 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    opacity: addingToProject ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!addingToProject) {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)';
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                  }}
                >
                  <Plus style={{ width: '16px', height: '16px' }} />
                  Create "{generateProjectName(currentScannerName)}"
                </button>
              )}
            </div>

            {addingToProject && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                borderRadius: '8px',
                color: '#D4AF37',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                Adding to project...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadConversation={loadConversation}
      />
    </div>
  );
}
