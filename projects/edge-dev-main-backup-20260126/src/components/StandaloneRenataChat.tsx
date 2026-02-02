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

const StandaloneRenataChat: React.FC = () => {
  // AI Personalities (similar to 6565 platform)
  const personalities: AIPersonality[] = [
    {
      id: 'renata',
      name: 'Renata',
      icon: <Bot className="h-4 w-4" />,
      systemPrompt: `You are Renata, an expert AI trading assistant for Renata. You specialize in scanner analysis, AI-powered pattern splitting, trading strategy insights, troubleshooting, and performance optimization. Be concise, practical, and focused on trading and scanner optimization.`,
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
  const [currentPersonality, setCurrentPersonality] = useState<AIPersonality>(personalities[0]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: '1',
      content: `Hello! I'm ${currentPersonality.name}, your AI trading assistant. I can help you with scanner analysis, strategy optimization, troubleshooting, and trading insights. How can I assist you today?`,
      role: 'assistant',
      timestamp: new Date(),
      type: 'general'
    };
    setMessages([welcomeMessage]);
  }, [currentPersonality]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Please upload a file smaller than 10MB.');
      return;
    }

    const content = await file.text();
    setFileContent(content);
    setUploadedFile(file);

    // Auto-format Python files
    if (file.name.endsWith('.py')) {
      setInputValue(`Please format this Python trading scanner code:\n\n\`\`\`python\n${content}\n\`\`\``);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !uploadedFile) || isProcessing) return;

    let messageContent = inputValue.trim();

    // Include file content if uploaded
    if (fileContent && uploadedFile) {
      const fileExt = uploadedFile.name.endsWith('.py') ? 'python' : 'text';
      messageContent += '\n\n📎 **Uploaded File:** ' + uploadedFile.name + '\n\n**File Content:**\n```' + fileExt + '\n' + fileContent + '\n```';
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
      type: 'general'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Clear file state
    setUploadedFile(null);
    setFileContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    try {
      const response = await fetch('/api/renata/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          personality: currentPersonality.id,
          systemPrompt: currentPersonality.systemPrompt,
          context: {
            page: window.location.pathname,
            timestamp: new Date().toISOString(),
            platform: 'Renata Edge-Dev',
            features: ['Scanner Analysis', 'AI Splitting', 'Parameter Optimization']
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || 'I apologize, but I encountered an issue processing your request.',
        role: 'assistant',
        timestamp: new Date(),
        type: determineMessageType(userMessage.content)
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

  if (isMinimized) {
    return (
      <div className="h-12 bg-black border-t border-yellow-500/30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className={`${currentPersonality.color}`}>
            {currentPersonality.icon}
          </div>
          <span className="text-white text-sm font-medium">{currentPersonality.name}</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="text-gray-400 hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-full bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-yellow-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`${currentPersonality.color}`}>
              {currentPersonality.icon}
            </div>
            <span className="font-semibold">{currentPersonality.name} AI</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={clearChat}
              className="text-gray-400 hover:text-white p-1 rounded"
              title="Clear Chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white p-1 rounded"
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Personality Selector */}
        <div className="flex gap-1">
          {personalities.map((personality) => (
            <button
              key={personality.id}
              onClick={() => setCurrentPersonality(personality)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                currentPersonality.id === personality.id
                  ? 'bg-yellow-500 text-black font-bold'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-yellow-600 hover:text-black'
              }`}
            >
              <span className={personality.color}>{personality.icon}</span>
              {personality.name}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                {message.role === 'user' ? (
                  <User className="h-4 w-4 text-blue-400" />
                ) : (
                  <div className={currentPersonality.color}>
                    {currentPersonality.icon}
                  </div>
                )}
              </div>
              <div
                className={`rounded-lg p-3 text-sm ${
                  message.role === 'user'
                    ? 'bg-yellow-500 text-black font-medium'
                    : 'bg-gray-900 text-gray-100 border border-gray-700'
                }`}
              >
                {message.type && message.role === 'assistant' && (
                  <div className={`inline-block px-2 py-1 rounded text-xs mb-2 ${getMessageTypeColor(message.type)}`}>
                    {message.type}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex gap-3 justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 mt-1">
                <div className={currentPersonality.color}>
                  {currentPersonality.icon}
                </div>
              </div>
              <div className="bg-gray-800 text-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-yellow-500/30">
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => {
              setInputValue('Help me optimize my scanner parameters for better results');
              handleSendMessage();
            }}
            disabled={isProcessing}
            className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
          >
            <TrendingUp className="h-3 w-3" />
            Optimize Scanner
          </button>
          <button
            onClick={() => {
              setInputValue('Analyze my latest scan results and provide trading insights');
              handleSendMessage();
            }}
            disabled={isProcessing}
            className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            <BarChart3 className="h-3 w-3" />
            Analyze Results
          </button>
          <button
            onClick={() => {
              setInputValue('Help me debug upload issues and parameter problems');
              handleSendMessage();
            }}
            disabled={isProcessing}
            className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Settings className="h-3 w-3" />
            Debug Issues
          </button>
        </div>

        {/* File Upload Display */}
        {uploadedFile && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-gray-800 rounded border border-yellow-500/30">
            <File className="h-4 w-4 text-yellow-500" />
            <span className="text-yellow-500 text-sm flex-1">{uploadedFile.name}</span>
            <span className="text-gray-400 text-xs">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".py,.txt,.json,.csv,.md"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Ask ${currentPersonality.name} about scanners, or upload a Python file...`}
            disabled={isProcessing}
            className="flex-1 bg-gray-900 text-white border border-yellow-500/30 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-yellow-500 border border-yellow-500/50 rounded px-3 py-2 transition-colors"
            title="Upload Python File"
          >
            <Upload className="h-4 w-4" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={(!inputValue.trim() && !uploadedFile) || isProcessing}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-medium rounded px-4 py-2 transition-colors border border-yellow-400"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StandaloneRenataChat;