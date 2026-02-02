'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  MessageCircle,
  Send,
  Bot,
  User,
  X,
  Minimize2,
  Paperclip,
  Upload,
  File,
  Clock,
  Trash2,
  Edit2,
  Lightbulb,
  Sparkles,
  Trophy,
  CheckCircle,
  AlertCircle,
  Image,
  ImageIcon
} from 'lucide-react';
import { renataLearning } from '../services/renataLearningEngine';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  type?: 'conversion' | 'troubleshooting' | 'analysis' | 'general' | 'self_correction' | 'code_format';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    actions?: { addToProject?: boolean; showFullCode?: boolean };
    formattedCode?: string;
    scannerType?: string;
    cacheBuster?: number;
    codeKey?: string;
  };
  data?: {
    correctedCode?: string;
    confidence?: number;
    appliedChanges?: string[];
    requiresManualIntervention?: boolean;
    formattedCode?: string;
  };
}

// Chat History Types
interface ChatHistoryItem {
  id: string;
  name: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

// LocalStorage key
const CHAT_HISTORY_KEY = 'renata_chat_history';

// Smart chat naming function - Enhanced for better intelligence
const generateChatName = (firstUserMessage: string): string => {
  const lowerMessage = firstUserMessage.toLowerCase();

  // Enhanced keyword patterns for intelligent naming
  const patterns = [
    // Scanner types
    { keywords: ['backside', 'para b'], name: 'Backside B Para Scanner' },
    { keywords: ['backside', 'scanner'], name: 'Backside Scanner' },
    { keywords: ['a+', 'para'], name: 'A+ Para Scanner' },
    { keywords: ['half a+', 'a_plus'], name: 'Half A+ Scanner' },
    { keywords: ['a plus', 'aplus'], name: 'A+ Scanner' },
    { keywords: ['lc d2', 'lc_d2'], name: 'LC D2 Scanner' },
    { keywords: ['lc frontside', 'lc_frontside'], name: 'LC Frontside Scanner' },
    { keywords: ['parabolic', 'daily'], name: 'Daily Parabolic Scanner' },
    { keywords: ['gap', 'scan'], name: 'Gap Scanner' },
    { keywords: ['momentum', 'moving average', 'trend'], name: 'Momentum Scanner' },
    { keywords: ['scanner', 'scan', 'screener', 'filter'], name: 'Scanner Builder' },
    // Technical indicators
    { keywords: ['rsi', 'relative strength'], name: 'RSI Indicator' },
    { keywords: ['macd', 'moving average convergence'], name: 'MACD Strategy' },
    { keywords: ['bollinger', 'bollinger band'], name: 'Bollinger Bands' },
    { keywords: ['stochastic', 'stoch'], name: 'Stochastic Oscillator' },
    { keywords: ['williams', 'williams %r'], name: 'Williams %R' },
    { keywords: ['cci', 'commodity channel'], name: 'CCI Indicator' },
    { keywords: ['atr', 'average true range'], name: 'ATR Indicator' },
    { keywords: ['indicator', 'signal'], name: 'Indicator Creation' },
    // Trading strategies
    { keywords: ['breakout', 'break out'], name: 'Breakout Strategy' },
    { keywords: ['mean reversion', 'revert'], name: 'Mean Reversion' },
    { keywords: ['pairs trading', 'pair trade'], name: 'Pairs Trading' },
    { keywords: ['arbitrage', 'arb'], name: 'Arbitrage Strategy' },
    { keywords: ['swing trading', 'swing trade'], name: 'Swing Trading' },
    { keywords: ['day trading', 'day trade'], name: 'Day Trading' },
    { keywords: ['scalp', 'scalping'], name: 'Scalping Strategy' },
    { keywords: ['strategy', 'trading system'], name: 'Strategy Development' },
    // Analysis & testing
    { keywords: ['backtest', 'back testing', 'performance'], name: 'Backtesting Session' },
    { keywords: ['optimize', 'optimization', 'tune'], name: 'Parameter Optimization' },
    { keywords: ['parameter', 'settings'], name: 'Parameter Settings' },
    { keywords: ['analyze', 'analysis', 'research'], name: 'Market Analysis' },
    { keywords: ['paper trade', 'paper trading'], name: 'Paper Trading' },
    // Coding & debugging
    { keywords: ['debug', 'error', 'fix', 'issue', 'bug'], name: 'Code Debugging' },
    { keywords: ['upload', 'format', 'formatting'], name: 'Code Formatting' },
    { keywords: ['python', 'script'], name: 'Python Development' },
    { keywords: ['refactor', 'clean up'], name: 'Code Refactoring' },
    { keywords: ['function', 'method', 'class'], name: 'Function Development' },
    // Data & charts
    { keywords: ['chart', 'plotting', 'visualization', 'graph'], name: 'Chart Analysis' },
    { keywords: ['data', 'dataset', 'historical'], name: 'Data Analysis' },
    { keywords: ['candlestick', 'ohlc', 'candle'], name: 'Candlestick Analysis' },
    { keywords: ['volume', 'liquidity'], name: 'Volume Analysis' },
    { keywords: ['price action', 'price action'], name: 'Price Action' },
    // Execution & orders
    { keywords: ['entry', 'exit', 'signal'], name: 'Entry/Exit Signals' },
    { keywords: ['order', 'execution', 'fill'], name: 'Order Management' },
    { keywords: ['position', 'sizing', 'portfolio'], name: 'Position Management' },
    { keywords: ['stop loss', 'take profit', 'risk'], name: 'Risk Management' },
    // Timeframes
    { keywords: ['5min', '5 min', '5-minute'], name: '5min Strategy' },
    { keywords: ['15min', '15 min', '15-minute'], name: '15min Strategy' },
    { keywords: ['hourly', '1 hour', '1hour'], name: 'Hourly Strategy' },
    { keywords: ['daily', '1 day', 'end of day'], name: 'Daily Strategy' },
    // General
    { keywords: ['help', 'how to', 'tutorial'], name: 'Help & Tutorial' },
    { keywords: ['explain', 'what is', 'why'], name: 'Learning Session' },
    { keywords: ['example', 'demo', 'sample'], name: 'Demo Session' }
  ];

  // Check for matching patterns - prioritize longer, more specific matches
  const sortedPatterns = patterns.sort((a, b) => {
    const aMaxLen = Math.max(...a.keywords.map(k => k.length));
    const bMaxLen = Math.max(...b.keywords.map(k => k.length));
    return bMaxLen - aMaxLen; // Descending order
  });

  for (const pattern of sortedPatterns) {
    if (pattern.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return pattern.name;
    }
  }

  // Extract key phrases if no pattern match - improved logic
  const words = firstUserMessage.split(' ').filter(w => w.length > 2);
  if (words.length >= 2) {
    const keyPhrase = words.slice(0, Math.min(3, words.length)).join(' ');
    const truncated = keyPhrase.charAt(0).toUpperCase() + keyPhrase.slice(1, 30);
    return truncated + (words.length > 3 ? '...' : '');
  }

  // Single word fallback
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1, 20);
  }

  // Fallback with timestamp
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `Trading Chat ${dateStr}`;
};

// Welcome message
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  content: 'Hello! I am Renata, your AI trading assistant. I can help you with:\n\n' +
    '**Code Formatting** - Upload Python trading scanners for universal 2-stage formatting\n' +
    '**File Analysis** - Upload files for technical analysis\n' +
    '**Troubleshooting** - Get help with scanner issues\n' +
    '**Trading Insights** - Ask about trading strategies and patterns\n\n' +
    'Try uploading a Python scanner file or ask me anything!',
  role: 'assistant',
  timestamp: new Date()
};

interface SimpleRenataChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StandaloneRenataChatSimple({ isOpen, onClose }: SimpleRenataChatProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{id: string, data: string, name: string}>>([]);
  const [fileContent, setFileContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // CRITICAL: Use refs to store file data immediately (synchronous access)
  const fileContentRef = useRef<string>('');
  const uploadedFileRef = useRef<File | null>(null);

  // Chat history state
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const historyDropdownRef = useRef<HTMLDivElement>(null);

  // 🆕 Self-correction: Generate persistent session ID for conversation memory
  const [sessionId] = useState(() => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `session-${Date.now()}`;
  });
  const clockButtonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [dropdownBounds, setDropdownBounds] = useState({ left: 0, width: 0, top: 0 });
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState('');

  // Learning & Memory state
  const [showLearningSuggestions, setShowLearningSuggestions] = useState(false);
  const [learningSuggestions, setLearningSuggestions] = useState<string[]>([]);
  const [learningStats, setLearningStats] = useState({
    totalInsights: 0,
    totalPatterns: 0,
    totalKnowledge: 0,
    totalChats: 0,
    learningProgress: {
      topicsLearned: [] as string[],
      skillsAcquired: [] as string[],
      conceptsMastered: [] as string[]
    }
  });

  // Load learning stats on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLearningStats(renataLearning.getStats());
    }
  }, []);

  // Helper function to detect scanner type from code
  const detectScannerType = (code: string): string => {
    const codeLower = code.toLowerCase();

    // Detect backside B scanner patterns
    if (codeLower.includes('backside') && codeLower.includes('para b')) {
      return 'Backside B Para Scanner';
    }
    if (codeLower.includes('backside') && codeLower.includes('b')) {
      return 'Backside B Scanner';
    }

    // Detect A+ scanner patterns
    if (codeLower.includes('a+') && codeLower.includes('para')) {
      return 'A+ Para Scanner';
    }
    if (codeLower.includes('half a+') || codeLower.includes('a_plus')) {
      return 'Half A+ Scanner';
    }
    if (codeLower.includes('a plus') || codeLower.includes('aplus')) {
      return 'A+ Scanner';
    }

    // Detect LC D2 scanner patterns
    if (codeLower.includes('lc') && codeLower.includes('d2')) {
      return 'LC D2 Scanner';
    }
    if (codeLower.includes('lc') && codeLower.includes('frontside')) {
      return 'LC Frontside Scanner';
    }
    if (codeLower.includes('lc scanner')) {
      return 'LC Scanner';
    }

    // Detect parabolic scanners
    if (codeLower.includes('parabolic') && codeLower.includes('daily')) {
      return 'Daily Parabolic Scanner';
    }
    if (codeLower.includes('parabolic')) {
      return 'Parabolic Scanner';
    }

    // Detect gap scanners
    if (codeLower.includes('gap') && codeLower.includes('scan')) {
      return 'Gap Scanner';
    }

    // Detect momentum scanners
    if (codeLower.includes('momentum')) {
      return 'Momentum Scanner';
    }

    // Detect volume scanners
    if (codeLower.includes('volume') && codeLower.includes('scan')) {
      return 'Volume Scanner';
    }

    // Default fallback
    return 'Enhanced Trading Scanner';
  };

  // Simple markdown renderer
  const renderMarkdown = (text: string) => {
    if (!text) return '';

    return text
      // Bold text: **word** → <strong>word</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text: *word* → <em>word</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Headers: ## Header → <h3>Header</h3>
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // Code blocks: ```code``` → <pre><code>code</code></pre>
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      // Inline code: `code` → <code>code</code>
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Line breaks: \n → <br>
      .replace(/\n/g, '<br>');
  };

  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsed: ChatHistoryItem[] = JSON.parse(savedHistory);
        setChatHistory(parsed);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, []);

  // Auto-save current chat to localStorage on messages change
  useEffect(() => {
    if (currentChatId && messages.length >= 1) { // Save even with just welcome message
      saveCurrentChat();
    }
  }, [messages, currentChatId]);

  // 🧠 Learn from conversations and update knowledge
  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server

    if (currentChatId && messages.length >= 2) { // Only learn when there's actual conversation beyond welcome
      const learnAsync = async () => {
        try {
          const newInsights = await renataLearning.learnFromConversation(
            currentChatId,
            messages,
            {
              hasFile: uploadedFile !== null
            }
          );

          if (newInsights.length > 0) {
            console.log(`🧠 Renata learned ${newInsights.length} new insights from this conversation`);

            // Update learning stats and suggestions
            setLearningStats(renataLearning.getStats());
            const suggestions = renataLearning.getSuggestions();
            if (suggestions.length > 0) {
              setLearningSuggestions(suggestions);
              setShowLearningSuggestions(true);
            }
          }
        } catch (error) {
          console.error('Learning engine error:', error);
        }
      };

      learnAsync();
    }
  }, [messages, currentChatId, uploadedFile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking the clock button
      if (clockButtonRef.current && clockButtonRef.current.contains(event.target as Node)) {
        return;
      }
      // Close history dropdown if clicking outside
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false);
        setEditingChatId(null);
        setEditingChatName('');
      }
      // Close learning suggestions if clicking outside
      if (showLearningSuggestions) {
        // Check if we clicked outside the popup
        const target = event.target as Node;
        const popupElement = document.querySelector('[style*="z-index: 10001"]');
        if (popupElement && !popupElement.contains(target) && !clockButtonRef.current?.contains(target)) {
          setShowLearningSuggestions(false);
        }
      }
    };

    if (showHistoryDropdown || showLearningSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistoryDropdown, showLearningSuggestions]);

  // Calculate dropdown position based on popup bounds
  useEffect(() => {
    if (showHistoryDropdown && popupRef.current) {
      const popupRect = popupRef.current.getBoundingClientRect();
      const buttonRect = clockButtonRef.current?.getBoundingClientRect();
      const margin = 16; // 1rem margin on each side

      setDropdownBounds({
        left: popupRect.left + margin,
        width: popupRect.width - (margin * 2),
        top: buttonRect ? buttonRect.bottom + 8 : 0
      });
    }
  }, [showHistoryDropdown]);

  // Check for uploaded files when popup opens
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const uploadedFileData = localStorage.getItem('renataUploadedFile');
      if (uploadedFileData) {
        try {
          const fileData = JSON.parse(uploadedFileData);
          console.log('📁 Found uploaded file data:', fileData);

          // Set the file content in refs so it's available for formatting
          fileContentRef.current = fileData.content;
          uploadedFileRef.current = {
            name: fileData.name,
            size: fileData.size,
            type: fileData.type
          } as File;

          // Add a system message showing the file was uploaded
          const fileUploadMessage: Message = {
            id: Date.now().toString(),
            content: `📁 Uploaded scanner file: **${fileData.extractedName || fileData.name}**\n\nFile: ${fileData.name}\nSize: ${(fileData.size / 1024).toFixed(1)} KB\nLines: ${fileData.content.split('\n').length}\n\nI'll analyze this scanner for you. What would you like me to do?`,
            role: 'assistant',
            timestamp: new Date(),
            metadata: {
              fileName: fileData.name,
              fileSize: fileData.size,
              fileType: fileData.type,
              formattedCode: fileData.content
            }
          };

          setMessages([fileUploadMessage]);

          // Clear the uploaded file data so it doesn't get processed again
          localStorage.removeItem('renataUploadedFile');
        } catch (error) {
          console.error('Error parsing uploaded file data:', error);
        }
      }
    }
  }, [isOpen]);

  // Save current chat to history
  const saveCurrentChat = () => {
    if (!currentChatId) return;

    const updatedHistory = chatHistory.map(chat =>
      chat.id === currentChatId
        ? {
            ...chat,
            messages: messages,
            updatedAt: new Date().toISOString()
          }
        : chat
    );

    setChatHistory(updatedHistory);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  // Load chat from history
  const loadChat = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
      setCurrentChatId(chatId);
      setShowHistoryDropdown(false);
    }
  };

  // Create new chat
  const createNewChat = () => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([WELCOME_MESSAGE]);
    setUploadedFile(null);
    setFileContent('');
    fileContentRef.current = '';  // Clear refs too
    uploadedFileRef.current = null;
    setShowHistoryDropdown(false);
  };

  // Delete chat from history
  const deleteChat = (chatId: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();

    const updatedHistory = chatHistory.filter(chat => chat.id !== chatId);
    setChatHistory(updatedHistory);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));

    // If deleting current chat, start new chat
    if (chatId === currentChatId) {
      createNewChat();
    }
  };

  // Start editing chat name
  const startEditing = (chatId: string, currentName: string, e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();
    setEditingChatId(chatId);
    setEditingChatName(currentName);
  };

  // Save edited chat name
  const saveEditedName = (chatId: string) => {
    if (!editingChatName.trim()) return;

    const updatedHistory = chatHistory.map(chat =>
      chat.id === chatId
        ? { ...chat, name: editingChatName.trim(), updatedAt: new Date().toISOString() }
        : chat
    );
    setChatHistory(updatedHistory);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
    setEditingChatId(null);
    setEditingChatName('');
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingChatId(null);
    setEditingChatName('');
  };

  // Format date for display
  const formatChatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Clear chat and reset to welcome
  const clearChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setUploadedFile(null);
    setFileContent('');
    fileContentRef.current = '';  // Clear refs too
    uploadedFileRef.current = null;
    setCurrentChatId(null);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      console.log('❌ No file selected');
      return;
    }

    console.log('✅ File selected:', file.name, '(', file.size, 'bytes)');

    if (file.size > 10 * 1024 * 1024) {
      console.log('❌ File too large');
      alert('File size must be less than 10MB');
      return;
    }

    try {
      const content = await file.text();
      console.log('📖 File content loaded, length:', content.length, 'characters');
      console.log('📖 File lines:', content.split('\n').length, 'lines');
      console.log('📖 First 200 chars:', content.substring(0, 200));

      // CRITICAL: Store in refs IMMEDIATELY (synchronous, no state delay)
      fileContentRef.current = content;
      uploadedFileRef.current = file;
      console.log('✅ File stored in fileContentRef.current:', fileContentRef.current.length, 'characters');
      console.log('✅ File stored in uploadedFileRef.current:', uploadedFileRef.current?.name);

      // Also update state for UI updates (async but okay for UI)
      setFileContent(content);
      setUploadedFile(file);

      console.log(`✅ File loaded: ${file.name} (${content.length} chars, ${content.split('\n').length} lines)`);

    } catch (error) {
      console.error('❌ Error reading file:', error);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('📸 Image upload triggered, files:', files.length);

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        console.log('❌ Not an image:', file.type);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        console.log('❌ Image too large');
        alert('Image size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        const newImage = {
          id: Date.now().toString() + Math.random(),
          data: base64Data,
          name: file.name
        };

        setUploadedImages(prev => [...prev, newImage]);
        console.log('✅ Image uploaded:', file.name);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleCodeFormatting = async (code: string, filename: string) => {
    console.log('🚀 handleCodeFormatting called:');
    console.log('  filename:', filename);
    console.log('  code.length:', code.length, 'characters');
    console.log('  code.lines:', code.split('\n').length, 'lines');
    console.log('  First 300 chars:', code.substring(0, 300));

    // CRITICAL: Verify we're not sending template code
    if (code.length < 200) {
      const errorMsg = `❌ CRITICAL ERROR: Attempting to format code that is only ${code.length} characters!\n\nThis is NOT a real scanner file. Real scanner files are 200+ lines.\n\nCode being sent:\n${code.substring(0, 500)}`;
      console.error(errorMsg);
      alert(errorMsg);
      setIsTyping(false);
      return;
    }

    console.log(`✅ ALL CHECKS PASSED - Sending ${code.split('\n').length} lines to AI for formatting...`);
    console.log(`🔍 FINAL CHECK - Code being sent to API:`);

    // Show alert with details
    alert(`🚀 ABOUT TO SEND TO API:\n\nFilename: ${filename}\nCode Length: ${code.length} characters\nLines: ${code.split('\n').length}\n\nFirst 200 chars:\n${code.substring(0, 200)}\n\n✅ Click OK to send to AI (will take 30-60 seconds)`);

    console.log(`  Length: ${code.length} characters`);
    console.log(`  Lines: ${code.split('\n').length}`);
    console.log(`  First 500 chars:`, code.substring(0, 500));
    console.log(`  Last 500 chars:`, code.substring(Math.max(0, code.length - 500)));

    setIsTyping(true);

    try {
      const cacheBuster = Date.now();
      const requestBody = {
        code,
        filename,
        useAIAgent: true,
        validateOutput: true,
        maxRetries: 2,
        aiProvider: 'openrouter',
        model: 'deepseek/deepseek-coder',
        _cache: cacheBuster  // Cache-busting timestamp
      };

      console.log('📤 Request body.code length:', requestBody.code.length);
      console.log('📤 Cache buster:', cacheBuster);
      console.log('📤 Full request body:', JSON.stringify(requestBody, null, 2).substring(0, 1000));

      const response = await fetch('/api/format-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();

        // Use AI's scanner type detection first, fallback to frontend detection only if needed
        const detectedScannerType = data.scannerType || detectScannerType(data.formattedCode);

        // Create timestamped storage key for cache-busting
        const timestampedCodeKey = `formattedScannerCode_${cacheBuster}`;
        const codeMetadataKey = `formattedScannerMetadata_${cacheBuster}`;

        const assistantMessage: Message = {
          id: `${cacheBuster}`,
          content: `📝 **Code formatted successfully!**\n\n` +
            `${data.codeInfo?.originalLines} → ${data.codeInfo?.formattedLines} lines optimized\n` +
            `✅ Ready for execution with enhanced parameters\n\n` +
            `💡 Use buttons below to add to project or copy code`,
          role: 'assistant',
          timestamp: new Date(),
          metadata: {
            actions: { addToProject: true, showFullCode: true },
            formattedCode: data.formattedCode,
            scannerType: detectedScannerType,
            fileName: filename,
            cacheBuster: cacheBuster,
            codeKey: timestampedCodeKey  // Store the key for retrieval
          }
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Clear old cached formatted code
        const oldKeys = Object.keys(localStorage).filter(k => k.startsWith('formattedScannerCode_') || k === 'formattedScannerCode');
        oldKeys.forEach(key => localStorage.removeItem(key));

        // Store formatted code with timestamped key
        if (data.formattedCode) {
          localStorage.setItem(timestampedCodeKey, data.formattedCode);
          localStorage.setItem('latestFormattedCodeKey', timestampedCodeKey);
          localStorage.setItem(codeMetadataKey, JSON.stringify({
            timestamp: cacheBuster,
            scannerType: detectedScannerType,
            fileName: filename,
            v31Score: data.v31ComplianceScore
          }));
          console.log('✅ Stored formatted code with cache-busting key:', timestampedCodeKey);
        }
      } else {
        throw new Error('Formatting failed');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: '❌ **Formatting Error**\n\n' +
          'Sorry, I encountered an error while formatting your code:\n' +
          (error instanceof Error ? error.message : 'Unknown error') +
          '\n\nPlease try again or check your file format.',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    const messageContent = inputValue.trim();
    if (!messageContent) return;

    // Create new chat if this is first message
    if (!currentChatId) {
      const newChatId = Date.now().toString();
      const chatName = generateChatName(messageContent);

      const newChat: ChatHistoryItem = {
        id: newChatId,
        name: chatName,
        messages: [WELCOME_MESSAGE], // Start with welcome message
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setChatHistory(prev => {
        const updated = [newChat, ...prev];
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updated));
        return updated;
      });
      setCurrentChatId(newChatId);
    }

    // Update chat name if first user message
    if (currentChatId && messages.length === 1) {
      const chatName = generateChatName(messageContent);
      setChatHistory(prev => {
        const updated = prev.map(chat =>
          chat.id === currentChatId
            ? { ...chat, name: chatName }
            : chat
        );
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updated));
        return updated;
      });
    }

    let displayedContent = messageContent;

    // CRITICAL: Check if file is attached using REFS (not stale state)
    const actualFileContent = fileContentRef.current;
    const actualUploadedFile = uploadedFileRef.current;
    const hasFile = actualUploadedFile && actualFileContent;

    // DEBUG: Log file attachment status
    console.log('🔍 File attachment check:');
    console.log('  uploadedFile (state):', uploadedFile ? uploadedFile.name : 'NONE');
    console.log('  uploadedFileRef.current:', actualUploadedFile?.name || 'NONE');
    console.log('  fileContent (state).length:', fileContent.length, 'characters');
    console.log('  fileContentRef.current.length:', actualFileContent.length, 'characters');
    console.log('  hasFile:', hasFile);

    const fileMetadata = hasFile ? {
      fileName: actualUploadedFile.name,
      fileSize: actualUploadedFile.size,
      fileType: actualUploadedFile.name.endsWith('.py') ? 'python' : 'text'
    } : undefined;

    // Add file indicator to message content if file is attached
    if (hasFile && !displayedContent.includes('📎')) {
      displayedContent = `📎 ${actualUploadedFile.name}\n\n${displayedContent}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: displayedContent,
      role: 'user',
      timestamp: new Date(),
      metadata: fileMetadata
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // CRITICAL: Check file attachment FIRST (no minimum size check)
    console.log('🔍 FILE CHECK - fileContentRef.current.length:', fileContentRef.current.length);
    console.log('🔍 FILE CHECK - uploadedFileRef.current:', uploadedFileRef.current?.name);

    if (fileContentRef.current && uploadedFileRef.current) {
      console.log('✅ FILE FOUND IN REFS - Formatting file directly!');
      const lineCount = fileContentRef.current.split('\n').length;
      console.log(`✅ READY TO FORMAT: ${uploadedFileRef.current.name} (${lineCount} lines, ${fileContentRef.current.length} chars)`);

      handleCodeFormatting(fileContentRef.current, uploadedFileRef.current.name);

      // Clear refs
      fileContentRef.current = '';
      uploadedFileRef.current = null;
      setUploadedFile(null);
      setFileContent('');
      return;
    }

    // 🆕 Real AI response using /api/renata/chat endpoint
    // This enables self-correction and conversation memory
    try {
      console.log('🤖 Calling Renata AI chat API...');

      // 📸 Include images if uploaded
      const requestBody: any = {
        message: messageContent,
        context: {
          sessionId: sessionId,
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
        }
      };

      // Add images to request if any are uploaded
      if (uploadedImages.length > 0) {
        console.log('📸 Including', uploadedImages.length, 'images in request');
        requestBody.images = uploadedImages;
      }

      const response = await fetch('/api/renata/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Renata AI response:', data);

      // Build message object from API response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message || data.content || 'Response received',
        role: 'assistant',
        timestamp: new Date(),
        type: data.type || 'general',
        data: data.data || undefined
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Clear uploaded images after sending
      if (uploadedImages.length > 0) {
        setUploadedImages([]);
        console.log('✅ Cleared uploaded images after sending');
      }
    } catch (error) {
      console.error('❌ Error calling Renata AI:', error);

      // Fallback to helpful message on error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I encountered an error connecting to my AI services. Please try again or upload a Python file for code formatting.',
        role: 'assistant',
        timestamp: new Date(),
        type: 'general'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddToProject = async (formattedCode: string, scannerType?: string, fileName?: string) => {
    if (!formattedCode) {
      // Show error message in chat
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: '❌ No formatted code available to add to project.',
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Show processing message
    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: '🔄 Adding scanner to your project...',
      role: 'assistant',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, processingMessage]);

    try {
      // Use detected scanner type or detect from code if not provided
      const detectedType = scannerType || detectScannerType(formattedCode);

      // Create a clean project name from the scanner type
      const projectName = detectedType.replace(/ Scanner$/i, '').trim();

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${projectName}`,
          title: `🚀 ${projectName}`,
          type: 'Trading Scanner',
          functionName: 'ai_enhanced_scanner',
          code: formattedCode,
          description: `AI-formatted ${detectedType} from ${fileName || 'uploaded file'} with enhanced parameters from Renata chat`,
          enhanced: true,
          tags: ['ai-enhanced', 'renata-chat', 'scanner', 'enhanced', detectedType.toLowerCase().replace(/ /g, '-')],
          features: {
            hasParameters: true,
            hasMarketData: true,
            hasEnhancedFormatting: true,
            aiEnhanced: true
          }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Update processing message to success
        setMessages(prev => prev.map(msg =>
          msg.id === processingMessage.id
            ? {
                ...msg,
                content: `✅ **Successfully added to your dashboard!**\n\n📊 Project: ${result.project?.name || projectName}\n🆔 Project ID: ${result.id}\n✨ Ready for analysis and execution\n\n💡 Check your projects page to manage this ${detectedType}.`
              }
            : msg
        ));
      } else {
        // Update processing message to error
        setMessages(prev => prev.map(msg =>
          msg.id === processingMessage.id
            ? {
                ...msg,
                content: `❌ **Failed to add to project**\n\nError: ${result.error || 'Unknown error'}\n\n💡 Please try again or check your connection.`
              }
            : msg
        ));
      }
    } catch (error) {
      // Update processing message to error
      setMessages(prev => prev.map(msg =>
        msg.id === processingMessage.id
          ? {
              ...msg,
              content: `❌ **Connection error**\n\nCould not connect to project service. Please try again.\n\n💡 The scanner code is saved locally and you can try again later.`
            }
          : msg
      ));

      // Fallback: store in localStorage with cache-busting
      const fallbackKey = `formattedScannerCode_${Date.now()}`;
      localStorage.setItem('latestFormattedCodeKey', fallbackKey);
      localStorage.setItem(fallbackKey, formattedCode);
      localStorage.setItem('formattedScannerCode', formattedCode); // Keep for backward compatibility
    }
  };

  // 🆕 Render self-correction details (corrected code, changes, confidence)
  const renderSelfCorrectionDetails = (message: Message) => {
    if (message.type !== 'self_correction' || !message.data) return null;

    return (
      <div style={{ marginTop: '12px' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-block',
          padding: '4px 8px',
          borderRadius: '4px',
          backgroundColor: 'rgba(168, 85, 247, 0.2)',
          border: '1px solid #A855F7',
          color: '#D8B4FE',
          fontSize: '11px',
          fontWeight: '600',
          marginBottom: '8px'
        }}>
          ✓ Self-Correction
        </div>

        {/* Confidence Score */}
        {message.data.confidence && (
          <div style={{
            fontSize: '11px',
            color: '#AAA',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <span>Confidence:</span>
            <div style={{
              flex: 1,
              backgroundColor: '#333',
              borderRadius: '4px',
              height: '6px'
            }}>
              <div
                style={{
                  backgroundColor: '#A855F7',
                  height: '6px',
                  borderRadius: '4px',
                  transition: 'all 0.3s',
                  width: `${Math.round(message.data.confidence * 100)}%`
                }}
              />
            </div>
            <span>{Math.round(message.data.confidence * 100)}%</span>
          </div>
        )}

        {/* Applied Changes */}
        {message.data.appliedChanges && message.data.appliedChanges.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid #A855F7',
            borderRadius: '8px',
            padding: '8px',
            marginBottom: '8px'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#D8B4FE',
              marginBottom: '4px'
            }}>
              What changed:
            </div>
            <ul style={{
              fontSize: '11px',
              margin: 0,
              paddingLeft: '16px',
              color: '#CCC'
            }}>
              {message.data.appliedChanges.slice(0, 5).map((change, i) => (
                <li key={i} style={{ marginBottom: '2px' }}>{change}</li>
              ))}
              {message.data.appliedChanges.length > 5 && (
                <li style={{ color: '#888', fontStyle: 'italic' }}>
                  ...and {message.data.appliedChanges.length - 5} more changes
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Corrected Code */}
        {message.data.correctedCode && (
          <div style={{ marginTop: '8px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#4ADE80'
              }}>
                ✓ Corrected Code:
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.data!.correctedCode!);
                }}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #60A5FA',
                  color: '#60A5FA',
                  fontSize: '10px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                📋 Copy
              </button>
            </div>
            <pre style={{
              backgroundColor: '#0A0A0A',
              color: '#4ADE80',
              padding: '10px',
              borderRadius: '6px',
              fontSize: '11px',
              overflowX: 'auto',
              border: '1px solid #333'
            }}>
              <code>
                {message.data.correctedCode.slice(0, 500)}
                {message.data.correctedCode.length > 500 && '\n...[truncated]'}
              </code>
            </pre>
          </div>
        )}

        {/* Manual Intervention Warning */}
        {message.data.requiresManualIntervention && (
          <div style={{
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid #EAB308',
            borderRadius: '6px',
            padding: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginTop: '8px'
          }}>
            <span style={{ fontSize: '14px' }}>⚠️</span>
            <div style={{ fontSize: '11px', color: '#FDE047' }}>
              This correction may need manual review. Please verify the code before using it in production.
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        width: '420px',
        height: '600px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '16px',
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bot size={20} color="#D4AF37" />
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '600' }}>
              Renata AI Trading Assistant
            </h3>
            <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>
              Universal 2-Stage Scanner Formatting
            </p>
          </div>

          {/* Tiny History Button Next to Title */}
          <div style={{ position: 'relative', marginLeft: '0.5rem' }}>
            <button
              ref={clockButtonRef}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowLearningSuggestions(false); // Close learning if open
                setShowHistoryDropdown(prev => !prev);
              }}
              style={{
                backgroundColor: '#FFD700',
                border: '1px solid #FFD700',
                boxShadow: '0 0 8px rgba(255, 215, 0, 0.4)',
                width: '20px',
                height: '20px',
                minWidth: '20px',
                minHeight: '20px',
                padding: '0',
                cursor: 'pointer'
              }}
              className="rounded-full flex items-center justify-center transition-all hover:scale-110"
              title="Chat history"
            >
              <Clock size={12} color="#000" strokeWidth={2.5} />
            </button>

            {/* 🧠 Learning Suggestions Button */}
            {learningStats.totalInsights > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowHistoryDropdown(false); // Close history if open
                  setShowLearningSuggestions(prev => !prev);
                }}
                style={{
                  backgroundColor: showLearningSuggestions ? '#EAB308' : 'rgba(234, 179, 8, 0.2)',
                  border: '1px solid #EAB308',
                  boxShadow: showLearningSuggestions ? '0 0 12px rgba(234, 179, 8, 0.6)' : '0 0 6px rgba(234, 179, 8, 0.3)',
                  width: '20px',
                  height: '20px',
                  minWidth: '20px',
                  minHeight: '20px',
                  padding: '0',
                  cursor: 'pointer',
                  marginLeft: '0.25rem'
                }}
                className="rounded-full flex items-center justify-center transition-all hover:scale-110"
                title={`Learning: ${learningStats.totalInsights} insights, ${learningStats.totalPatterns} patterns`}
              >
                <Lightbulb size={12} color={showLearningSuggestions ? "#000" : "#EAB308"} strokeWidth={2.5} />
              </button>
            )}

            {/* History Dropdown Menu - Portal with proper positioning */}
            {showHistoryDropdown && ReactDOM.createPortal(
              <div
                ref={historyDropdownRef}
                style={{
                  position: 'fixed',
                  top: `${dropdownBounds.top}px`,
                  left: `${dropdownBounds.left}px`,
                  width: `${dropdownBounds.width}px`,
                  maxHeight: '400px',
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(255, 215, 0, 0.2)',
                  overflow: 'hidden',
                  zIndex: 10001
                }}
              >
                {/* New Chat Button */}
                <div
                  onClick={createNewChat}
                  style={{
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid rgba(255, 215, 0, 0.3)',
                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.15) 100%)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(255, 165, 0, 0.25) 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.15) 100%)';
                  }}
                >
                  <MessageCircle size={16} color="#FFD700" />
                  <span style={{
                    color: '#FFD700',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    marginLeft: '0.5rem'
                  }}>
                    New Chat
                  </span>
                </div>

                {/* Chat History List */}
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {chatHistory.length === 0 ? (
                    <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                      <Clock size={24} color="rgba(255, 215, 0, 0.4)" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ color: 'rgba(255, 215, 0, 0.6)', fontSize: '0.875rem' }}>
                        No chat history yet
                      </p>
                      <p style={{ color: 'rgba(255, 215, 0, 0.4)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Start a conversation to create history
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderBottom: chatHistory.indexOf(chat) < chatHistory.length - 1
                            ? '1px solid rgba(255, 215, 0, 0.15)'
                            : 'none',
                          background: chat.id === currentChatId
                            ? 'rgba(255, 215, 0, 0.15)'
                            : 'transparent',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Chat Info - Editable */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {editingChatId === chat.id ? (
                              <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  value={editingChatName}
                                  onChange={(e) => setEditingChatName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveEditedName(chat.id);
                                    } else if (e.key === 'Escape') {
                                      cancelEditing();
                                    }
                                  }}
                                  autoFocus
                                  style={{
                                    flex: 1,
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid rgba(255, 215, 0, 0.4)',
                                    borderRadius: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    color: '#FFD700',
                                    fontSize: '0.875rem',
                                    outline: 'none'
                                  }}
                                />
                                <button
                                  onClick={() => saveEditedName(chat.id)}
                                  style={{
                                    background: 'rgba(0, 255, 0, 0.2)',
                                    border: '1px solid rgba(0, 255, 0, 0.4)',
                                    borderRadius: '0.25rem',
                                    padding: '0.25rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Save"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={cancelEditing}
                                  style={{
                                    background: 'rgba(255, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 0, 0, 0.4)',
                                    borderRadius: '0.25rem',
                                    padding: '0.25rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <>
                                <div style={{
                                  color: '#FFD700',
                                  fontWeight: '600',
                                  fontSize: '0.875rem',
                                  marginBottom: '0.25rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {chat.name}
                                </div>
                                <div style={{
                                  color: 'rgba(255, 215, 0, 0.6)',
                                  fontSize: '0.7rem'
                                }}>
                                  {formatChatDate(chat.updatedAt)}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Action Buttons - Small */}
                          {editingChatId !== chat.id && (
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                              {/* Load Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  loadChat(chat.id);
                                  setShowHistoryDropdown(false);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)',
                                  border: '1px solid rgba(255, 215, 0, 0.4)',
                                  borderRadius: '0.25rem',
                                  padding: '0.25rem 0.5rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  color: '#FFD700',
                                  fontSize: '0.7rem',
                                  fontWeight: '600'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.35) 0%, rgba(255, 165, 0, 0.35) 100%)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)';
                                }}
                                title="Load chat"
                              >
                                Load
                              </button>

                              {/* Rename Button */}
                              <button
                                onClick={(e) => startEditing(chat.id, chat.name, e)}
                                style={{
                                  background: 'rgba(100, 150, 255, 0.15)',
                                  border: '1px solid rgba(100, 150, 255, 0.3)',
                                  borderRadius: '0.25rem',
                                  padding: '0.25rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(100, 150, 255, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(100, 150, 255, 0.15)';
                                }}
                                title="Rename chat"
                              >
                                <Edit2 size={12} color="rgba(100, 150, 255, 0.8)" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={(e) => deleteChat(chat.id, e)}
                                style={{
                                  background: 'rgba(255, 0, 0, 0.15)',
                                  border: '1px solid rgba(255, 0, 0, 0.3)',
                                  borderRadius: '0.25rem',
                                  padding: '0.25rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 0, 0, 0.3)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 0, 0, 0.15)';
                                }}
                                title="Delete chat"
                              >
                                <Trash2 size={12} color="rgba(255, 100, 100, 0.8)" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>,
              document.body
            )}

            {/* 🧠 Learning Suggestions Popup - Portal */}
            {showLearningSuggestions && ReactDOM.createPortal(
              <div
                style={{
                  position: 'fixed',
                  top: `${dropdownBounds.top}px`,
                  left: `${dropdownBounds.left}px`,
                  width: `${dropdownBounds.width}px`,
                  maxHeight: '400px',
                  zIndex: 10001,
                  backgroundColor: 'rgba(0, 0, 0, 0.98)',
                  border: '1px solid #EAB308',
                  borderRadius: '0.5rem',
                  boxShadow: '0 8px 32px rgba(234, 179, 8, 0.3)',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid rgba(234, 179, 8, 0.3)',
                  background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(234, 179, 8, 0.05) 100%)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#EAB308',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    <Lightbulb size={14} />
                    <span>Renata Learning</span>
                  </div>
                  <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.7rem',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    {learningStats.totalInsights} insights • {learningStats.totalPatterns} patterns • {learningStats.totalKnowledge} knowledge entries
                  </div>
                </div>

                {/* Scrollable Content */}
                <div style={{
                  padding: '0.75rem',
                  overflowY: 'auto',
                  maxHeight: '320px'
                }}>
                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.5rem',
                    marginBottom: '0.75rem'
                  }}>
                    <div style={{
                      background: 'rgba(234, 179, 8, 0.1)',
                      border: '1px solid rgba(234, 179, 8, 0.2)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#EAB308', fontSize: '1.25rem', fontWeight: '700' }}>
                        {learningStats.totalInsights}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                        Insights
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(234, 179, 8, 0.1)',
                      border: '1px solid rgba(234, 179, 8, 0.2)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#EAB308', fontSize: '1.25rem', fontWeight: '700' }}>
                        {learningStats.totalPatterns}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                        Patterns
                      </div>
                    </div>
                    <div style={{
                      background: 'rgba(234, 179, 8, 0.1)',
                      border: '1px solid rgba(234, 179, 8, 0.2)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#EAB308', fontSize: '1.25rem', fontWeight: '700' }}>
                        {learningStats.totalKnowledge}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.65rem' }}>
                        Knowledge
                      </div>
                    </div>
                  </div>

                  {/* Suggestions Section */}
                  {learningSuggestions.length > 0 && (
                    <div>
                      <div style={{
                        color: '#EAB308',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem'
                      }}>
                        <Sparkles size={12} />
                        <span>Suggestions</span>
                      </div>
                      {learningSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 0.75rem',
                            marginBottom: '0.375rem',
                            fontSize: '0.75rem',
                            color: 'rgba(255, 255, 255, 0.9)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(234, 179, 8, 0.15)';
                            e.currentTarget.style.borderColor = 'rgba(234, 179, 8, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          }}
                          onClick={() => {
                            // Use suggestion as input
                            setInputValue(suggestion);
                            setShowLearningSuggestions(false);
                          }}
                          title="Click to use this suggestion"
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Learning Progress */}
                  {learningStats.learningProgress && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{
                        color: '#EAB308',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem'
                      }}>
                        <Trophy size={12} />
                        <span>Progress</span>
                      </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '0.375rem',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.7rem',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}>
                        {learningStats.learningProgress.topicsLearned?.length || 0} topics learned •{' '}
                        {learningStats.learningProgress.skillsAcquired?.length || 0} skills acquired
                      </div>
                    </div>
                  )}

                  {/* Empty State */}
                  {learningSuggestions.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '1rem',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.75rem'
                    }}>
                      <Lightbulb size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                      <div>Keep chatting to generate personalized suggestions!</div>
                    </div>
                  )}
                </div>
              </div>,
              document.body
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Minimize Button - Resets to welcome and closes */}
          <button
            onClick={() => {
              clearChat();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
            title="Minimize"
          >
            <Minimize2 size={16} color="#888" />
          </button>
          {/* Close Button - Resets to welcome and closes */}
          <button
            onClick={() => {
              clearChat();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
            title="Close chat"
          >
            <X size={16} color="#888" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: '#1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start'
          }}>
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '12px',
                  flexDirection: message.role === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: message.role === 'user' ? '#333' : '#2a2a2a',
                    flexShrink: 0
                  }}
                >
                  {message.role === 'user' ? (
                    <User size={16} color="#fff" />
                  ) : (
                    <Bot size={16} color="#D4AF37" />
                  )}
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: message.role === 'user' ? '#333' : '#2a2a2a',
                    color: '#fff',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} />

                  {/* 🆕 Self-Correction Details */}
                  {renderSelfCorrectionDetails(message)}

                  {/* Scanner Type Header for Formatted Code */}
                  {message.metadata?.formattedCode && (
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      border: '1px solid #D4AF37',
                      borderRadius: '8px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#D4AF37'
                        }}>
                          📊 {message.metadata.scannerType || 'Trading Scanner'}
                        </span>
                        {message.metadata.fileName && (
                          <span style={{
                            fontSize: '12px',
                            color: '#888',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            {message.metadata.fileName}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#AAA',
                        lineHeight: '1.4'
                      }}>
                        Formatted and ready to use • Parameters preserved
                      </div>
                    </div>
                  )}

                  {/* Format button for Renata's messages - Populates formatting message */}
                  {message.role === 'assistant' && messages.indexOf(message) === 0 && (
                    <div style={{
                      marginTop: '16px',
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => {
                          // Populate formatting message (user will attach file and send together)
                          setInputValue('Please format this Python trading scanner code using Backside B architecture with 2-stage market universe optimization and pattern detection.');
                        }}
                        style={{
                          backgroundColor: '#D4AF37',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#000',
                          boxShadow: '0 2px 4px rgba(212, 175, 55, 0.2)'
                        }}
                      >
                        📝 Format Code
                      </button>
                      <span style={{
                        color: '#888',
                        fontSize: '12px',
                        textAlign: 'center'
                      }}>
                        Upload your .py file and send this message
                      </span>
                    </div>
                  )}

                  {/* Action buttons for formatted code */}
                  {message.metadata?.formattedCode && (
                    <div style={{
                      marginTop: '16px',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <button
                        onClick={() => {
                          if (message.metadata?.formattedCode) {
                            handleAddToProject(
                              message.metadata.formattedCode,
                              message.metadata.scannerType,
                              message.metadata.fileName
                            );
                          }
                        }}
                        style={{
                          backgroundColor: '#D4AF37',
                          color: '#000',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          marginRight: '8px'
                        }}
                      >
                        🚀 Add to Project
                      </button>
                      <button
                        onClick={() => {
                          if (message.metadata?.formattedCode) {
                            navigator.clipboard.writeText(message.metadata.formattedCode);
                            alert('Code copied to clipboard!');
                          }
                        }}
                        style={{
                          backgroundColor: '#444',
                          color: '#fff',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        📋 Copy Code
                      </button>
                    </div>
                  )}
                </div>
                </div>
            ))}
            {isTyping && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#2a2a2a'
                  }}
                >
                  <Bot size={16} color="#D4AF37" />
                </div>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: '#2a2a2a',
                    color: '#888',
                    fontSize: '14px'
                  }}
                >
                  Renata is thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #333',
            backgroundColor: '#1a1a1a'
          }}>
            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".py,.txt,.json,.csv,.md"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />

            {/* Image Upload */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            {uploadedFile && (
              <div style={{
                backgroundColor: '#2a2a2a',
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <File size={16} color="#D4AF37" />
                <span style={{ color: '#D4AF37', flex: 1 }}>{uploadedFile.name}</span>
                <span style={{ color: '#888', fontSize: '12px' }}>
                  ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}

            {/* 📸 Image Previews */}
            {uploadedImages.length > 0 && (
              <div style={{
                backgroundColor: '#2a2a2a',
                padding: '8px',
                borderRadius: '8px',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {uploadedImages.map(image => (
                    <div
                      key={image.id}
                      style={{
                        position: 'relative',
                        width: '80px',
                        height: '80px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid #444'
                      }}
                    >
                      <img
                        src={image.data}
                        alt={image.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      <button
                        onClick={() => removeUploadedImage(image.id)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          backgroundColor: 'rgba(220, 38, 38, 0.8)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: '0'
                        }}
                        title="Remove image"
                      >
                        <X size={12} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#888',
                  textAlign: 'center'
                }}>
                  {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''} uploaded
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message or click upload to add Python files..."
                style={{
                  flex: 1,
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />

              <button
                onClick={() => {
                  console.log('Upload button clicked!');
                  fileInputRef.current?.click();
                }}
                title="Upload Python File (.py)"
                style={{
                  backgroundColor: '#D4AF37',
                  border: '2px solid #D4AF37',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  minWidth: '44px',
                  minHeight: '44px',
                  boxShadow: '0 2px 4px rgba(212, 175, 55, 0.3)',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#B8941F';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#D4AF37';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={16} color="#000" />
                  <span style={{ color: '#000', fontSize: '12px', fontWeight: '600' }}>Upload</span>
                </div>
              </button>

              {/* 📸 Image Upload Button */}
              <button
                onClick={() => {
                  console.log('Image upload button clicked!');
                  imageInputRef.current?.click();
                }}
                title="Upload Image (PNG, JPG, GIF, WebP)"
                style={{
                  backgroundColor: '#A855F7',
                  border: '2px solid #A855F7',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  minWidth: '44px',
                  minHeight: '44px',
                  boxShadow: '0 2px 4px rgba(168, 85, 247, 0.3)',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#9333EA';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#A855F7';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <ImageIcon size={16} color="#fff" />
              </button>

              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() && uploadedImages.length === 0}
                style={{
                  backgroundColor: (!inputValue.trim() && uploadedImages.length === 0) ? '#333' : '#D4AF37',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: (!inputValue.trim() && uploadedImages.length === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Send size={16} color={(!inputValue.trim() && uploadedImages.length === 0) ? "#666" : "#000"} />
              </button>
            </div>
          </div>
    </div>
  );
}