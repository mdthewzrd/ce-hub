/**
 * Renata Chat History Management System
 *
 * Features:
 * - AI-generated conversation names based on first user message
 * - Tree navigation by day/week
 * - Persistent localStorage storage
 * - Delete operations (individual, by day, by week)
 */

import { Clock, Calendar, CalendarDays, MessageSquare } from 'lucide-react';

// ==================== TYPES ====================

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agent?: string;
  transformedCode?: string;
  scannerName?: string;
}

export interface ChatConversation {
  id: string;
  name: string; // AI-generated from first message
  firstMessage: string; // Original first user message
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatDay {
  date: string; // ISO date string (YYYY-MM-DD)
  conversations: ChatConversation[];
  count: number;
}

export interface ChatWeek {
  weekStart: string; // ISO date string
  weekEnd: string;
  days: ChatDay[];
  count: number;
}

export type HistoryView = 'conversations' | 'day' | 'week' | 'all';

// ==================== STORAGE KEYS ====================

const STORAGE_KEY = 'renata_chat_history';
const DELETED_KEY = 'renata_chat_deleted';

// ==================== AI NAMING ====================

/**
 * Generate a concise, strategic name for a conversation based on first user message
 */
export function generateConversationName(firstMessage: string): string {
  const trimmed = firstMessage.trim().toLowerCase();

  // Common patterns with keyword extraction
  const patterns = [
    { regex: /transform|convert|v31|edge.?dev|standard/i, name: 'Transformation to V31' },
    { regex: /backside|para.?b|d2|d3|gap.?up/i, name: 'Backside Para B Scanner' },
    { regex: /a\s*\+|parabolic|surge/i, name: 'A+ Parabolic Scanner' },
    { regex: /lc\s*d2|d2\s*extended|frontside/i, name: 'LC D2 Scanner' },
    { regex: /lc\s*d3|d3\s*extended/i, name: 'LC D3 Scanner' },
    { regex: /breakout|momentum/i, name: 'Breakout Scanner' },
    { regex: /volume|vol.?filter/i, name: 'Volume Analysis' },
    { regex: /parameter|param|config/i, name: 'Parameter Optimization' },
    { regex: /bug|fix|error|issue/i, name: 'Bug Fix Request' },
    { regex: /test|validate|check/i, name: 'Validation Request' },
    { regex: /upload|file|scanner/i, name: 'Scanner Upload' },
    { regex: /help|how.?to|tutorial|guide/i, name: 'Help & Guidance' },
    { regex: /api|endpoint|route/i, name: 'API Integration' },
    { regex: /optimize|performance|speed/i, name: 'Performance Tuning' },
    { regex: /add.?to|project|save/i, name: 'Project Management' },
  ];

  // Check patterns
  for (const pattern of patterns) {
    if (pattern.regex.test(trimmed)) {
      return pattern.name;
    }
  }

  // Fallback: Extract key words from message (limit to 3-4 words)
  const words = trimmed
    .replace(/[^\w\s]/g, ' ') // Remove special chars
    .split(/\s+/)
    .filter(w => w.length > 3) // Only meaningful words
    .slice(0, 4); // Max 4 words

  if (words.length > 0) {
    const title = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  }

  return 'New Chat';
}

// ==================== HISTORY STORAGE ====================

/**
 * Load all conversations from localStorage
 */
export function loadAllConversations(): ChatConversation[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data = JSON.parse(stored);
    const deletedIds = new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'));

    return data
      .filter((conv: any) => !deletedIds.has(conv.id))
      .map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
  } catch (error) {
    console.error('Failed to load chat history:', error);
    return [];
  }
}

/**
 * Save all conversations to localStorage
 */
export function saveAllConversations(conversations: ChatConversation[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save chat history:', error);
  }
}

/**
 * Save a new conversation
 */
export function saveConversation(conversation: ChatConversation): void {
  const conversations = loadAllConversations();

  // Check if updating existing
  const existingIndex = conversations.findIndex(c => c.id === conversation.id);
  if (existingIndex >= 0) {
    conversations[existingIndex] = conversation;
  } else {
    conversations.unshift(conversation);
  }

  // Limit to 100 most recent
  if (conversations.length > 100) {
    conversations.splice(100);
  }

  saveAllConversations(conversations);
}

/**
 * Mark conversations as deleted (soft delete)
 */
export function deleteConversations(ids: string[]): void {
  if (typeof window === 'undefined') return;

  try {
    const deletedIds = new Set(JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'));
    ids.forEach(id => deletedIds.add(id));
    localStorage.setItem(DELETED_KEY, JSON.stringify([...deletedIds]));
  } catch (error) {
    console.error('Failed to delete conversations:', error);
  }
}

/**
 * Clear deleted list (restore all)
 */
export function clearDeletedConversations(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DELETED_KEY);
}

// ==================== TREE ORGANIZATION ====================

/**
 * Organize conversations by day
 */
export function organizeByDay(conversations: ChatConversation[]): ChatDay[] {
  const dayMap = new Map<string, ChatConversation[]>();

  conversations.forEach(conv => {
    const dateKey = new Date(conv.createdAt).toISOString().split('T')[0];
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, []);
    }
    dayMap.get(dateKey)!.push(conv);
  });

  return Array.from(dayMap.entries())
    .map(([date, convs]) => ({
      date,
      conversations: convs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      count: convs.length
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Organize conversations by week
 */
export function organizeByWeek(conversations: ChatConversation[]): ChatWeek[] {
  const weekMap = new Map<string, ChatConversation[]>();

  conversations.forEach(conv => {
    const date = new Date(conv.createdAt);
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekKey = weekStart.toISOString().split('T')[0];
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(conv);
  });

  return Array.from(weekMap.entries())
    .map(([weekStart, convs]) => {
      const weekEndDate = new Date(weekStart);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      const days = organizeByDay(convs).filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= new Date(weekStart) && dayDate <= weekEndDate;
      });

      return {
        weekStart,
        weekEnd: weekEndDate.toISOString().split('T')[0],
        days,
        count: convs.length
      };
    })
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

/**
 * Get start of week (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get display text for date
 */
export function getDayDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}

/**
 * Get display text for week range
 */
export function getWeekDisplay(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);

  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `${startStr} - ${endStr}`;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
