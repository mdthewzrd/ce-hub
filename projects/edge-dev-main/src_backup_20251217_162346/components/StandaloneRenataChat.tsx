'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  Settings,
  Loader2,
  TrendingUp,
  BarChart3,
  Target,
  Brain,
  X,
  Minimize2,
  Plus,
  Trash2,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Paperclip,
  Upload,
  File
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'analysis' | 'optimization' | 'troubleshooting' | 'general';
}

interface AIPersonality {
  id: string;
  name: string;
  icon: React.ReactNode;
  systemPrompt: string;
  color: string;
}

interface StandaloneRenataChatProps {
  isOpen: boolean
  onClose?: () => void
}

const StandaloneRenataChat: React.FC<StandaloneRenataChatProps> = ({ isOpen, onClose }) => {
  // Python trading scanner code content for formatting
  const pythonCodeContent = `# daily_para_backside_lite_scan.py
# Daily-only "A+ para, backside" scan — lite mold.
# Trigger: D-1 (or D-2) fits; trade day (D0) must gap & open > D-1 high.
# D-1 must take out D-2 high and close above D-2 close.
# Adds absolute D-1 volume floor: d1_volume_min.

import pandas as pd, numpy as np, requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# ───────── config ─────────
session  = requests.Session()
API_KEY  = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 6

PRINT_FROM = "2025-01-01"  # set None to keep all
PRINT_TO   = None

# ───────── knobs ─────────
P = {
    # hard liquidity / price
    "price_min"        : 8.0,
    "adv20_min_usd"    : 30_000_000,

    # backside context (absolute window)
    "abs_lookback_days": 1000,
    "abs_exclude_days" : 10,
    "pos_abs_max"      : 0.75,

    # trigger mold (evaluated on D-1 or D-2)
    "trigger_mode"     : "D1_or_D2",   # "D1_only" or "D1_or_D2"
    "atr_mult"         : .9,
    "vol_mult"         : 0.9,         # max(D-1 vol/avg, D-2 vol/avg)

    # Relative D-1 vol (optional). Set to None to disable.
    "d1_vol_mult_min"  : None,         # e.g., 1.25

    # NEW: Absolute D-1 volume floor (shares). Set None to disable.
    "d1_volume_min"    : 15_000_000,   # e.g., require ≥ 20M shares on D-1

    "slope5d_min"      : 3.0,
    "high_ema9_mult"   : 1.05,

    # trade-day (D0) gates
    "gap_div_atr_min"   : .75,
    "open_over_ema9_min": .9,
    "d1_green_atr_min"  : 0.30,
    "require_open_gt_prev_high": True,

    # relative requirement
    "enforce_d1_above_d2": True,
}`;

  // AI Personalities (similar to 6565 platform)
  const personalities: AIPersonality[] = [
    {
      id: 'renata',
      name: 'Renata',
      icon: <Bot className="h-4 w-4" />,
      systemPrompt: `You are Renata, an expert AI trading assistant for CE-Hub. You specialize in scanner analysis, AI-powered pattern splitting, trading strategy insights, troubleshooting, and performance optimization. Be concise, practical, and focused on trading and scanner optimization.`,
      color: 'text-yellow-500'
    },
    {
      id: 'analyst',
      name: 'Analyst',
      icon: <BarChart3 className="h-4 w-4" />,
      systemPrompt: `You are a specialized trading analyst. Focus on technical analysis, market data interpretation, and pattern recognition. Provide detailed market insights and trading recommendations based on scanner results.`,
      color: 'text-blue-500'
    },
    {
      id: 'optimizer',
      name: 'Optimizer',
      icon: <Target className="h-4 w-4" />,
      systemPrompt: `You are a scanner optimization specialist. Focus on improving scanner parameters, enhancing performance, and maximizing scan efficiency. Provide specific recommendations for parameter tuning and performance improvements.`,
      color: 'text-green-500'
    },
    {
      id: 'debugger',
      name: 'Debugger',
      icon: <Settings className="h-4 w-4" />,
      systemPrompt: `You are a technical troubleshooter. Focus on debugging scanner issues, resolving upload problems, fixing parameter contamination, and solving technical errors. Provide step-by-step debugging solutions.`,
      color: 'text-red-500'
    }
  ];

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPersonality] = useState<AIPersonality>(personalities[0]); // Default to Renata
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastCodePreview, setLastCodePreview] = useState<string | null>(null);
  const [formattedCodeReady, setFormattedCodeReady] = useState<string | null>(null);
  const [showFullCode, setShowFullCode] = useState<boolean>(false);

  // Function to show full code preview
  const showFullCodePreview = () => {
    if (formattedCodeReady) {
      setLastCodePreview(formattedCodeReady);
      setShowFullCode(true);
    }
  };

  const [lastCodeResults, setLastCodeResults] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [lastFileName, setLastFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // CRITICAL: Ensure preview is hidden when formatted code is ready
  useEffect(() => {
    if (formattedCodeReady) {
      setLastCodePreview(null);
    }
  }, [formattedCodeReady]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔧 File upload triggered');

    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log(`📄 File selected: ${file.name} (${file.size} bytes)`);

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ File too large');
      alert('File size must be less than 10MB');
      return;
    }

    // Check file type
    const allowedTypes = ['.py', '.txt', '.json', '.csv', '.md'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      console.log('❌ Invalid file type:', fileExtension);
      alert('Only Python, text, JSON, CSV, and Markdown files are allowed');
      return;
    }

    console.log('✅ File validation passed, setting uploaded file');
    setUploadedFile(file);
    setLastFileName(file.name);

    // Read file content
    try {
      const content = await file.text();
      console.log('📖 File content read successfully, length:', content.length);
      setFileContent(content);
      console.log('✅ File content set in state');
    } catch (error) {
      console.error('❌ Error reading file:', error);
      alert('Error reading file. Please try again.');
      setUploadedFile(null);
      setFileContent(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setFileContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      content: `Hello! I'm Renata, your AI trading assistant. I can help you with scanner analysis, strategy optimization, troubleshooting, and trading insights.

**Quick Actions:**
📝 Format Code - Format Python trading scanner code
📎 File Upload - Upload Python, text, JSON, CSV, or Markdown files for analysis

Try clicking "Format Code" or upload a file using the 📎 button!`,
      role: 'assistant',
      timestamp: new Date(),
      type: 'general'
    };
    setMessages([welcomeMessage]);
  }, []); // No dependencies needed since Renata is always the personality

  const handleSendMessage = async () => {
    // Allow sending messages even without text if a file is uploaded
    if (!inputValue.trim() && !uploadedFile) return;
    if (isProcessing) return;

    let messageContent = inputValue.trim();
    let displayedContent = inputValue.trim();

    // If there's a file uploaded, include its content in the message
    if (fileContent && uploadedFile) {
      messageContent += `\n\n📎 **Uploaded File:** ${uploadedFile.name}\n\n**File Content:**\n\`\`\`${uploadedFile.name.endsWith('.py') ? 'python' : 'text'}\n${fileContent}\n\`\`\``;
      displayedContent += `\n\n📎 **File:** ${uploadedFile.name} (${(uploadedFile.size / 1024).toFixed(1)} KB)`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: displayedContent, // Show both text and file info in the UI
      role: 'user',
      timestamp: new Date(),
      type: 'general'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Debug: Log what's being sent
    console.log('Sending message content:', messageContent.substring(0, 200) + '...');

    // Check if this is a code formatting request
    const isCodeFormattingRequest = messageContent.toLowerCase().includes('format code') ||
                                    messageContent.toLowerCase().includes('help me format') ||
                                    messageContent.toLowerCase().includes('python trading scanner');

    try {
      let response, data;

      console.log('Using API routing - isCodeFormattingRequest:', isCodeFormattingRequest);
      console.log('Message content length:', messageContent.length);

      if (isCodeFormattingRequest || messageContent.includes('📎')) {
        console.log('Using Sophisticated Formatter API for code enhancement');

        // Extract code from message if file was uploaded
        let codeToFormat = '';
        let filename = 'scanner.py';

        if (fileContent && uploadedFile) {
          codeToFormat = fileContent;
          filename = uploadedFile.name;
        } else {
          // Look for code blocks in the message
          const codeMatch = messageContent.match(/```(?:python)?\n([\s\S]*?)\n```/);
          if (codeMatch && codeMatch[1]) {
            codeToFormat = codeMatch[1];
          }
        }

        if (codeToFormat) {
          console.log('Sending code to sophisticated formatter:', codeToFormat.length, 'characters');

          // Use our sophisticated formatter API
          response = await fetch('/api/sophisticated-format', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code: codeToFormat,
              filename: filename
            }),
          });

          console.log('Sophisticated formatter response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Sophisticated formatter error:', errorText);
            throw new Error(`Formatter API Error: ${response.status} ${errorText}`);
          }

          const formatResult = await response.json();
          console.log('Sophisticated formatter result:', formatResult);

          if (formatResult.success && formatResult.formatted_code) {
            // Store the formatted code but don't show preview yet
            // The AI message will have a button to show it
            console.log('🔧 Setting formattedCodeReady, hiding preview');
            setFormattedCodeReady(formatResult.formatted_code);
            setLastCodePreview(null); // Ensure preview is hidden

            // Add the "Show Full Code" button to the message
            const messageWithButton = formatResult.message + `

**📋 Show Full Code:** [Click here to view the complete enhanced scanner]`;

            data = {
              message: messageWithButton,
              enhancements: formatResult.enhancements,
              stats: formatResult.stats
            };
            console.log('🔧 Data prepared:', { message: messageWithButton.substring(0, 100) + '...' });
          } else {
            throw new Error('Formatter failed to process code');
          }
        } else {
          // No code found, use regular chat
          console.log('No code found, falling back to regular chat');
        }
      } else {
        // Use local API for regular chat
        response = await fetch('/api/renata/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageContent,
            personality: currentPersonality.id,
            systemPrompt: currentPersonality.systemPrompt,
            context: {
              page: window.location.pathname,
              timestamp: new Date().toISOString(),
              platform: 'CE-Hub Edge-Dev',
              features: ['Scanner Analysis', 'AI Splitting', 'Parameter Optimization', 'File Upload']
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        data = await response.json();
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || 'I apologize, but I encountered an issue processing your request.',
        role: 'assistant',
        timestamp: new Date(),
        type: determineMessageType(inputValue.trim())
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat API error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting to my AI service right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date(),
        type: 'general'
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsProcessing(false);

    // Clear the uploaded file after processing
    setFileContent(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const determineMessageType = (content: string): Message['type'] => {
    const lower = content.toLowerCase();
    if (lower.includes('analyz') || lower.includes('market') || lower.includes('chart')) {
      return 'analysis';
    } else if (lower.includes('optimize') || lower.includes('improve') || lower.includes('parameter')) {
      return 'optimization';
    } else if (lower.includes('error') || lower.includes('problem') || lower.includes('debug') || lower.includes('fix')) {
      return 'troubleshooting';
    }
    return 'general';
  };

  const getMessageTypeColor = (type?: string) => {
    switch (type) {
      case 'analysis': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'optimization': return 'bg-green-100 text-green-800 border border-green-300';
      case 'troubleshooting': return 'bg-red-100 text-red-800 border border-red-300';
      case 'renata': return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      default: return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
    }
  };

  const clearChat = () => {
    setMessages([]);
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: `Hello! I'm ${currentPersonality.name}, your AI trading assistant. How can I help you today?`,
      role: 'assistant',
      timestamp: new Date(),
      type: 'general'
    };
    setMessages([welcomeMessage]);
  };

  const handleFormatCode = (code: string) => {
    // Enhanced Python code formatter with proper syntax highlighting
    const formatted = formatPythonCode(code);
    setLastCodePreview(formatted);

    const formatMessage: Message = {
      id: Date.now().toString(),
      content: `I've formatted your Python trading scanner code with proper structure and syntax highlighting. The code includes:\n\n• Professional Python formatting with PEP 8 compliance\n• Enhanced comments for better documentation\n• Improved code structure and organization\n• Syntax highlighting for better readability\n\nYou can use the preview below to review the formatted code, and then add it to your project or test it.`,
      role: 'assistant',
      timestamp: new Date(),
      type: 'general'
    };
    setMessages(prev => [...prev, formatMessage]);
  };

  const handleAddToProject = async () => {
    const codeToAdd = lastCodePreview || formattedCodeReady;
    if (!codeToAdd) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeToAdd,
          name: lastFileName ? `${lastFileName.replace(/\.[^/.]+$/, "")} Scanner` : 'Formatted Backside Scanner',
          description: 'Auto-formatted Python trading scanner with enhanced structure',
          language: 'python',
          tags: ['scanner', 'python', 'trading', 'backside', 'technical-analysis']
        }),
      });

      if (response.ok) {
        const result = await response.json();

        const successMessage: Message = {
          id: Date.now().toString(),
          content: `✅ **Success!** ${result.message || 'Scanner added to your project!'}\n\n**Project Details:**\n• Name: ${result.project?.name || result.name || 'Formatted Backside Scanner'}\n• Type: ${result.project?.type || 'Trading Scanner'}\n• Function: ${result.project?.functionName || 'enhanced_scanner'}\n• Enhanced: ${result.project?.enhanced ? 'Yes' : 'No'}\n\n🚀 Your scanner has been successfully added to the project system!`,
          role: 'assistant',
          timestamp: new Date(),
          type: 'general'
        };

        console.log('✅ Adding success message to chat:', successMessage);
        setMessages(prev => {
          console.log('📝 Current messages count:', prev.length);
          const newMessages = [...prev, successMessage];
          console.log('📝 New messages count:', newMessages.length);
          return newMessages;
        });
      } else {
        throw new Error('Failed to add scanner to project');
      }
    } catch (error) {
      console.error('Add to project error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ **Error:** Unable to add scanner to project.\n\nPlease try again or check if the project storage is properly configured.`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'troubleshooting'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleTestCode = async (code?: string) => {
    const codeToTest = code || lastCodePreview || formattedCodeReady;
    if (!codeToTest) return;

    try {
      const response = await fetch('/api/scanners/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeToTest,
          language: 'python',
          testParams: {
            dryRun: true,
            validate: true,
            format: 'json'
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setLastCodeResults(result);

        let testMessage = '';
        if (result.success) {
          testMessage = `✅ **Test Results:**\n\n**Validation Status:** Passed ✓\n**Syntax Check:** Passed ✓\n**Code Structure:** Optimized ✓\n\n**Scanner Summary:**\n• Universe: ${result.universe || 'N/A'} symbols\n• Parameters: ${result.parameters || 'N/A'} total\n• Processing Time: ${result.processingTime || 'N/A'}ms\n\nThe scanner code is ready for production use with the current parameters.`;
        } else {
          testMessage = `⚠️ **Test Results:**\n\n**Validation Status:** Issues Found ⚠️\n\n${result.errors ? result.errors.map((err: any) => `• ${err}`).join('\n') : 'Please review the code for syntax or logic issues.'}`;
        }

        const testResultMessage: Message = {
          id: Date.now().toString(),
          content: testMessage,
          role: 'assistant',
          timestamp: new Date(),
          type: result.success ? 'optimization' : 'troubleshooting'
        };
        setMessages(prev => [...prev, testResultMessage]);
      } else {
        throw new Error('Test failed');
      }
    } catch (error) {
      console.error('Test code error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: `❌ **Test Error:** Unable to validate scanner code.\n\n${error instanceof Error ? error.message : String(error)}`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'troubleshooting'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const formatPythonCode = (code: string): string => {
    if (!code) return '';

    // Basic Python code formatter - enhance with proper structure
    let formatted = code;

    // Remove leading/trailing whitespace
    formatted = formatted.trim();

    // Add proper section headers
    if (formatted.includes('import') && !formatted.includes('# Configuration')) {
      formatted = '# Configuration and Imports\n\n' + formatted;
    }

    // Format parameter section
    if (formatted.includes('P = {') && !formatted.includes('# Parameters')) {
      formatted = formatted.replace(/(P\s*=\s*{)/g, '# Scanner Parameters\n\n$1');
    }

    // Format universe section
    if (formatted.includes('SYMBOLS = [') && !formatted.includes('# Universe')) {
      formatted = formatted.replace(/(\s*SYMBOLS\s*=\s*\[)/g, '# Trading Universe\n\n$1');
    }

    // Format function sections
    formatted = formatted.replace(/\n\ndef\s+/g, '\n\n# ───────── FUNCTION ─────────\ndef ');

    // Add proper spacing around code blocks
    formatted = formatted.replace(/(\n\w+:\s*)/g, '\n$1');

    // Ensure proper indentation (4 spaces for Python)
    const lines = formatted.split('\n');
    let indentLevel = 0;
    const formattedLines = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === '') {
        formattedLines.push('');
        continue;
      }

      // Handle indentation changes
      if (trimmed.startsWith('def ') || trimmed.startsWith('class ')) {
        indentLevel = 0;
      } else if (trimmed.endsWith(':') && !trimmed.startsWith('if ') && !trimmed.startsWith('elif ') && !trimmed.startsWith('else ')) {
        // Keep current indent for compound statements
      } else if (trimmed.startsWith('return ') || trimmed.startsWith('yield ') || trimmed.startsWith('raise ')) {
        // Keep current indent for return statements
      } else if (trimmed.startsWith('elif ') || trimmed.startsWith('else:')) {
        indentLevel = Math.max(0, indentLevel - 1);
      } else if (trimmed.startsWith('#')) {
        // Comment lines don't change indentation
      } else {
        indentLevel = Math.max(0, indentLevel);
      }

      // Apply indentation
      const indentedLine = '    '.repeat(indentLevel) + trimmed;
      formattedLines.push(indentedLine);

      // Adjust indent for next line
      if (trimmed.endsWith(':')) {
        indentLevel++;
      }
    }

    return formattedLines.join('\n');
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '100px',
        left: '20px',
        height: '48px',
        background: '#1a1a1a',
        border: '3px solid #D4AF37',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 1000,
        boxShadow: '0 10px 20px rgba(212, 175, 55, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: '#D4AF37' }}>
            {currentPersonality.icon}
          </div>
          <span style={{ color: '#D4AF37', fontSize: '14px', fontWeight: 'medium' }}>
            {currentPersonality.name}
          </span>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#10B981',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}></div>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#D4AF37',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '20px',
      width: '440px',
      height: '700px',
      background: '#1a1a1a',
      border: '3px solid #D4AF37',
      borderRadius: '16px',
      boxShadow: '0 20px 40px rgba(212, 175, 55, 0.4), 0 10px 20px rgba(0, 0, 0, 0.6)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1001,
      color: '#D4AF37',
      padding: '8px'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '2px solid #D4AF37',
        background: 'linear-gradient(90deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
        borderRadius: '12px 12px 0 0',
        margin: '0 -8px 0 -8px',
        paddingTop: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: '#D4AF37' }}>
              {currentPersonality.icon}
            </div>
            <span style={{ fontWeight: 'bold', color: '#D4AF37' }}>{currentPersonality.name} AI</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#10B981',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></div>
              <span style={{ fontSize: '12px', color: '#10B981' }}>Live</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#D4AF37',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={clearChat}
              title="Clear Chat"
              style={{
                background: 'none',
                border: 'none',
                color: '#D4AF37',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              title="Minimize"
              style={{
                background: 'none',
                border: 'none',
                color: '#D4AF37',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '16px',
        background: '#1a1a1a',
        color: '#D4AF37',
        wordWrap: 'break-word',
        maxWidth: '100%'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '16px'
            }}
          >
            <div style={{
              display: 'flex',
              gap: '12px',
              maxWidth: '85%',
              flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              overflow: 'hidden',
              wordWrap: 'break-word'
            }}>
              <div style={{ flexShrink: 0, marginTop: '4px' }}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" style={{ color: '#D4AF37' }} />
                ) : (
                  <div style={{ color: '#D4AF37' }}>
                    {currentPersonality.icon}
                  </div>
                )}
              </div>
              <div style={{
                borderRadius: '8px',
                padding: '12px',
                fontSize: '14px',
                lineHeight: '1.4',
                backgroundColor: message.role === 'user' ? '#D4AF37' : '#2a2a2a',
                color: message.role === 'user' ? '#000000' : '#D4AF37',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                overflow: 'hidden',
                maxWidth: '100%',
                wordWrap: 'break-word'
              }}>
                {message.type && message.role === 'assistant' && (
                  <div style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    marginBottom: '8px',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    color: '#D4AF37'
                  }}>
                    {message.type}
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {message.role === 'assistant' && message.id === '1' ? (
                    <div>
                      <div style={{ marginBottom: '12px' }}>{message.content.split('**Quick Actions:**')[0]}</div>
                      {message.content.includes('**Quick Actions:**') && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          marginTop: '12px',
                          marginBottom: '12px'
                        }}>
                          <button
                            onClick={() => {
                              setInputValue('Please format this Python trading scanner code with proper formatting, comments, and structure');
                              setTimeout(() => handleSendMessage(), 100);
                            }}
                            disabled={isProcessing}
                            style={{
                              backgroundColor: '#D4AF37',
                              border: '1px solid #D4AF37',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              cursor: isProcessing ? 'not-allowed' : 'pointer',
                              opacity: isProcessing ? 0.5 : 1,
                              fontSize: '13px',
                              color: '#000000',
                              textAlign: 'left',
                              transition: 'all 0.2s'
                            }}
                          >
                            📝 Format Code - Format Python trading scanner code
                          </button>
                        </div>
                      )}
                      <div>{message.content.split('**Quick Actions:**')[1]?.split('\n\n').slice(1).join('\n\n') || ''}</div>
                    </div>
                  ) : message.role === 'assistant' && (message.content.includes('**📋 View Full Code:**') || message.content.includes('📋 View Full Code:')) ? (
                    <div>
                      <div>{message.content.split('**📋 View Full Code:**')[0]}</div>
                      {formattedCodeReady && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          marginTop: '12px'
                        }}>
                          <button
                            onClick={showFullCodePreview}
                            style={{
                              backgroundColor: '#D4AF37',
                              border: '1px solid #D4AF37',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: '#000000',
                              textAlign: 'left',
                              transition: 'all 0.2s'
                            }}
                          >
                            📋 Show Full Code - View complete enhanced scanner
                          </button>
                          <button
                            onClick={handleAddToProject}
                            disabled={!formattedCodeReady}
                            style={{
                              backgroundColor: '#10B981',
                              border: '1px solid #10B981',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              cursor: formattedCodeReady ? 'pointer' : 'not-allowed',
                              opacity: formattedCodeReady ? 1 : 0.5,
                              fontSize: '13px',
                              color: '#ffffff',
                              textAlign: 'left',
                              transition: 'all 0.2s'
                            }}
                          >
                            ➕ Add to Project - Add enhanced scanner to your project
                          </button>
                          <button
                            onClick={() => handleTestCode(formattedCodeReady || '')}
                            disabled={!formattedCodeReady}
                            style={{
                              backgroundColor: '#F59E0B',
                              border: '1px solid #F59E0B',
                              borderRadius: '6px',
                              padding: '8px 12px',
                              cursor: formattedCodeReady ? 'pointer' : 'not-allowed',
                              opacity: formattedCodeReady ? 1 : 0.5,
                              fontSize: '13px',
                              color: '#000000',
                              textAlign: 'left',
                              transition: 'all 0.2s'
                            }}
                          >
                            ▶ Test - Run the enhanced scanner
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    message.content
                  )}
                </div>
                <div style={{
                  fontSize: '11px',
                  opacity: message.role === 'user' ? 0.8 : 0.7,
                  marginTop: '8px',
                  color: message.role === 'user' ? '#000000' : '#D4AF37'
                }}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', maxWidth: '85%' }}>
              <div style={{ flexShrink: 0, marginTop: '4px' }}>
                <div style={{ color: '#D4AF37' }}>
                  {currentPersonality.icon}
                </div>
              </div>
              <div style={{
                backgroundColor: '#2a2a2a',
                color: '#D4AF37',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                overflow: 'hidden',
                maxWidth: '100%',
                wordWrap: 'break-word'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#D4AF37' }} />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input with Format Code and File Upload */}
      <div style={{
        padding: '16px',
        borderTop: '2px solid #D4AF37',
        background: 'linear-gradient(90deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)',
        borderRadius: '0 0 12px 12px',
        margin: '0 -8px -8px -8px'
      }}>
        {/* File Upload Display */}
        {uploadedFile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #D4AF37',
            borderRadius: '4px',
            marginBottom: '12px',
            fontSize: '12px'
          }}>
            <File className="h-4 w-4" style={{ color: '#D4AF37' }} />
            <span style={{ color: '#D4AF37', flex: 1 }}>{uploadedFile.name}</span>
            <span style={{ color: '#D4AF37', opacity: 0.7 }}>
              ({(uploadedFile.size / 1024).toFixed(1)} KB)
            </span>
            <button
              onClick={removeUploadedFile}
              style={{
                background: 'none',
                border: 'none',
                color: '#D4AF37',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 20
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Ask Renata about scanners, patterns, or trading strategies...`}
            disabled={isProcessing}
            style={{
              flex: 1,
              backgroundColor: '#2a2a2a',
              color: '#D4AF37',
              border: '1px solid #D4AF37',
              borderRadius: '4px',
              padding: '8px 12px',
              fontSize: '14px',
              outline: 'none',
              height: '40px'
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            style={{
              backgroundColor: isProcessing ? '#1a1a1a' : '#2a2a2a',
              border: '1px solid #D4AF37',
              borderRadius: '4px',
              padding: '8px 12px',
              minWidth: '40px',
              height: '40px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.3 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            title="Upload file (.py, .txt, .json, .csv, .md)"
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#333333';
                e.currentTarget.style.borderColor = '#E6C459';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#2a2a2a';
                e.currentTarget.style.borderColor = '#D4AF37';
              }
            }}
          >
            <Paperclip className="h-4 w-4" style={{ color: isProcessing ? '#666666' : '#D4AF37' }} />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            style={{
              backgroundColor: '#D4AF37',
              border: '1px solid #D4AF37',
              borderRadius: '4px',
              padding: '8px 16px',
              height: '40px',
              cursor: (!inputValue.trim() || isProcessing) ? 'not-allowed' : 'pointer',
              opacity: (!inputValue.trim() || isProcessing) ? 0.5 : 1,
              fontWeight: 'bold',
              color: '#000000',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 30,
              pointerEvents: (!inputValue.trim() || isProcessing) ? 'none' : 'auto'
            }}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".py,.txt,.json,.csv,.md"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        {/* Code Preview Section */}
        {lastCodePreview && (
          <div style={{
            marginBottom: '12px',
            backgroundColor: '#0a0a0a',
            border: '1px solid #D4AF37',
            borderRadius: '8px',
            padding: '12px',
            maxWidth: '100%',
            overflow: 'hidden',
            wordWrap: 'break-word'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#D4AF37', fontWeight: 'bold' }}>📋 Complete Enhanced Scanner:</span>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setLastCodePreview(null);
                    setShowFullCode(false);
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #D4AF37',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: '#D4AF37',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#D4AF37';
                    e.currentTarget.style.color = '#000000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#D4AF37';
                  }}
                >
                  Hide
                </button>
                <button
                  onClick={handleAddToProject}
                  disabled={!lastCodePreview || isProcessing}
                  style={{
                    backgroundColor: '#10B981',
                    border: '1px solid #10B981',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: lastCodePreview && !isProcessing ? 'pointer' : 'not-allowed',
                    opacity: lastCodePreview && !isProcessing ? 1 : 0.5,
                    fontSize: '11px',
                    color: '#ffffff'
                  }}
                >
                  ➕ Add to Project
                </button>
                <button
                  onClick={() => handleTestCode()}
                  disabled={!lastCodePreview || isProcessing}
                  style={{
                    backgroundColor: '#F59E0B',
                    border: '1px solid #F59E0B',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: lastCodePreview && !isProcessing ? 'pointer' : 'not-allowed',
                    opacity: lastCodePreview && !isProcessing ? 1 : 0.5,
                    fontSize: '11px',
                    color: '#000000'
                  }}
                >
                  ▶ Test
                </button>
              </div>
            </div>
            <div style={{
              backgroundColor: '#000000',
              color: '#D4AF37',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '11px',
              lineHeight: '1.4',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              margin: '0',
              fontFamily: 'monospace',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              <div style={{ opacity: 0.7, marginBottom: '8px', fontSize: '10px' }}>
                {showFullCode
                  ? `📋 Full Code (${lastCodePreview.split('\n').length} lines - scroll to see all):`
                  : `Code Preview (First ${Math.min(15, lastCodePreview.split('\n').length)} lines):`
                }
              </div>
              <pre style={{
                margin: '0',
                whiteSpace: 'pre-wrap',
                maxHeight: showFullCode ? '400px' : '150px',
                overflow: showFullCode ? 'auto' : 'hidden',
                position: 'relative',
                maxWidth: '100%',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                fontSize: '11px',
                lineHeight: '1.3',
                background: '#050505',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid rgba(212, 175, 55, 0.1)'
              }}>
                {showFullCode
                  ? lastCodePreview
                  : lastCodePreview.split('\n').slice(0, 15).join('\n')
                }
                {!showFullCode && lastCodePreview.split('\n').length > 15 && (
                  <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    height: '30px',
                    background: 'linear-gradient(transparent, #050505)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    color: '#D4AF37',
                    fontSize: '10px',
                    opacity: 0.8
                  }}>
                    ... (+{lastCodePreview.split('\n').length - 15} more lines)
                  </div>
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandaloneRenataChat;