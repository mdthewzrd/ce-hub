/**
 * Renata Chat History Sidebar Component
 *
 * Tree navigation by day/week with AI-generated names
 * Delete functionality at conversation, day, and week levels
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  CalendarDays,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Trash2,
  RotateCcw
} from 'lucide-react';
import {
  loadAllConversations,
  organizeByDay,
  organizeByWeek,
  getDayDisplay,
  getWeekDisplay,
  formatTime,
  getRelativeTime,
  deleteConversations,
  clearDeletedConversations,
  type ChatConversation,
  type ChatDay,
  type ChatWeek,
  type HistoryView
} from '@/utils/renataChatHistory';

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (conversation: ChatConversation) => void;
}

type TreeNodeType = 'conversation' | 'day' | 'week';

export default function ChatHistorySidebar({
  isOpen,
  onClose,
  onLoadConversation
}: ChatHistorySidebarProps) {
  const [view, setView] = useState<HistoryView>('all');
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [days, setDays] = useState<ChatDay[]>([]);
  const [weeks, setWeeks] = useState<ChatWeek[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Load conversations
  useEffect(() => {
    const allConvs = loadAllConversations();
    setConversations(allConvs);
    setDays(organizeByDay(allConvs));
    setWeeks(organizeByWeek(allConvs));
  }, []);

  // Toggle expanded nodes
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Handle loading a conversation
  const handleLoadConversation = (conv: ChatConversation) => {
    onLoadConversation(conv);
    onClose();
  };

  // Delete handlers
  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      deleteConversations([id]);
      const updated = conversations.filter(c => c.id !== id);
      setConversations(updated);
      setDays(organizeByDay(updated));
      setWeeks(organizeByWeek(updated));
    }
  };

  const handleDeleteDay = (e: React.MouseEvent, date: string) => {
    e.stopPropagation();
    const dayConvos = days.find(d => d.date === date)?.conversations || [];
    if (confirm(`Delete all ${dayConvos.length} conversations from ${getDayDisplay(date)}?`)) {
      const ids = dayConvos.map(c => c.id);
      deleteConversations(ids);
      const updated = conversations.filter(c => !ids.includes(c.id));
      setConversations(updated);
      setDays(organizeByDay(updated));
      setWeeks(organizeByWeek(updated));
    }
  };

  const handleDeleteWeek = (e: React.MouseEvent, weekStart: string) => {
    e.stopPropagation();
    const weekConvos = weeks.find(w => w.weekStart === weekStart)?.days.flatMap(d => d.conversations) || [];
    if (confirm(`Delete all conversations from this week?`)) {
      const ids = weekConvos.map(c => c.id);
      deleteConversations(ids);
      const updated = conversations.filter(c => !ids.includes(c.id));
      setConversations(updated);
      setDays(organizeByDay(updated));
      setWeeks(organizeByWeek(updated));
    }
  };

  const handleClearAllDeleted = () => {
    if (confirm('Restore all deleted conversations?')) {
      clearDeletedConversations();
      // Reload would happen here
      window.location.reload();
    }
  };

  const handleDeleteAll = () => {
    if (confirm('⚠️ Delete ALL conversations? This cannot be undone.')) {
      const allIds = conversations.map(c => c.id);
      deleteConversations(allIds);
      setConversations([]);
      setDays([]);
      setWeeks([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'transparent',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '80%',
        maxWidth: '320px',
        maxHeight: '70%',
        background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
        background: 'rgba(0, 0, 0, 0.5)',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ color: '#D4AF37', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            Chat History
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setView('all')}
            style={{
              flex: 1,
              padding: '8px',
              background: view === 'all' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: view === 'all' ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: view === 'all' ? '#D4AF37' : '#888',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            All
          </button>
          <button
            onClick={() => setView('day')}
            style={{
              flex: 1,
              padding: '8px',
              background: view === 'day' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: view === 'day' ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: view === 'day' ? '#D4AF37' : '#888',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Calendar style={{ width: '14px', height: '14px' }} />
              Day
            </div>
          </button>
          <button
            onClick={() => setView('week')}
            style={{
              flex: 1,
              padding: '8px',
              background: view === 'week' ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: view === 'week' ? '1px solid rgba(212, 175, 55, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: view === 'week' ? '#D4AF37' : '#888',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <CalendarDays style={{ width: '14px', height: '14px' }} />
              Week
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {view === 'all' && (
          <AllConversationsView
            conversations={conversations}
            onLoadConversation={handleLoadConversation}
            onDeleteConversation={handleDeleteConversation}
          />
        )}

        {view === 'day' && (
          <DayView
            days={days}
            expandedNodes={expandedNodes}
            onToggleNode={toggleNode}
            onLoadConversation={handleLoadConversation}
            onDeleteConversation={handleDeleteConversation}
            onDeleteDay={handleDeleteDay}
          />
        )}

        {view === 'week' && (
          <WeekView
            weeks={weeks}
            expandedNodes={expandedNodes}
            onToggleNode={toggleNode}
            onLoadConversation={handleLoadConversation}
            onDeleteConversation={handleDeleteConversation}
            onDeleteWeek={handleDeleteWeek}
          />
        )}

        {conversations.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
          }}>
            <MessageSquare style={{ width: '48px', height: '48px', margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', margin: 0 }}>No chat history yet</p>
            <p style={{ fontSize: '12px', marginTop: '8px' }}>Start a conversation to see it here</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px',
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={handleClearAllDeleted}
          style={{
            flex: 1,
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#888',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
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
        >
          <RotateCcw style={{ width: '14px', height: '14px' }} />
          Restore Deleted
        </button>
        <button
          onClick={handleDeleteAll}
          style={{
            flex: 1,
            padding: '10px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '6px',
            color: '#ef4444',
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#f87171';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.color = '#ef4444';
          }}
        >
          <Trash2 style={{ width: '14px', height: '14px' }} />
          Delete All
        </button>
      </div>
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

function AllConversationsView({
  conversations,
  onLoadConversation,
  onDeleteConversation
}: {
  conversations: ChatConversation[];
  onLoadConversation: (conv: ChatConversation) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {conversations.map(conv => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          onLoadConversation={onLoadConversation}
          onDeleteConversation={onDeleteConversation}
        />
      ))}
    </div>
  );
}

function DayView({
  days,
  expandedNodes,
  onToggleNode,
  onLoadConversation,
  onDeleteConversation,
  onDeleteDay
}: {
  days: ChatDay[];
  expandedNodes: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onLoadConversation: (conv: ChatConversation) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
  onDeleteDay: (e: React.MouseEvent, date: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {days.map(day => (
        <DayNode
          key={day.date}
          day={day}
          isExpanded={expandedNodes.has(day.date)}
          onToggle={() => onToggleNode(day.date)}
          onLoadConversation={onLoadConversation}
          onDeleteConversation={onDeleteConversation}
          onDeleteDay={onDeleteDay}
        />
      ))}
    </div>
  );
}

function WeekView({
  weeks,
  expandedNodes,
  onToggleNode,
  onLoadConversation,
  onDeleteConversation,
  onDeleteWeek
}: {
  weeks: ChatWeek[];
  expandedNodes: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onLoadConversation: (conv: ChatConversation) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
  onDeleteWeek: (e: React.MouseEvent, weekStart: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {weeks.map(week => (
        <WeekNode
          key={week.weekStart}
          week={week}
          isExpanded={expandedNodes.has(week.weekStart)}
          onToggle={() => onToggleNode(week.weekStart)}
          onLoadConversation={onLoadConversation}
          onDeleteConversation={onDeleteConversation}
          onDeleteWeek={onDeleteWeek}
        />
      ))}
    </div>
  );
}

function DayNode({
  day,
  isExpanded,
  onToggle,
  onLoadConversation,
  onDeleteConversation,
  onDeleteDay
}: {
  day: ChatDay;
  isExpanded: boolean;
  onToggle: () => void;
  onLoadConversation: (conv: ChatConversation) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
  onDeleteDay: (e: React.MouseEvent, date: string) => void;
}) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: '12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isExpanded ? (
            <ChevronDown style={{ width: '16px', height: '16px', color: '#D4AF37' }} />
          ) : (
            <ChevronRight style={{ width: '16px', height: '16px', color: '#888' }} />
          )}
          <Calendar style={{ width: '16px', height: '16px', color: '#888' }} />
          <span style={{ color: '#e5e5e5', fontSize: '14px', fontWeight: '600' }}>
            {getDayDisplay(day.date)}
          </span>
          <span style={{ color: '#666', fontSize: '12px' }}>({day.count})</span>
        </div>
        <button
          onClick={(e) => onDeleteDay(e, day.date)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            opacity: 0.6,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
          title="Delete all conversations from this day"
        >
          <Trash2 style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {isExpanded && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', padding: '8px' }}>
          {day.conversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              onLoadConversation={onLoadConversation}
              onDeleteConversation={onDeleteConversation}
              compact
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekNode({
  week,
  isExpanded,
  onToggle,
  onLoadConversation,
  onDeleteConversation,
  onDeleteWeek
}: {
  week: ChatWeek;
  isExpanded: boolean;
  onToggle: () => void;
  onLoadConversation: (conv: ChatConversation) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
  onDeleteWeek: (e: React.MouseEvent, weekStart: string) => void;
}) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      <div
        onClick={onToggle}
        style={{
          padding: '12px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isExpanded ? (
            <ChevronDown style={{ width: '16px', height: '16px', color: '#D4AF37' }} />
          ) : (
            <ChevronRight style={{ width: '16px', height: '16px', color: '#888' }} />
          )}
          <CalendarDays style={{ width: '16px', height: '16px', color: '#888' }} />
          <span style={{ color: '#e5e5e5', fontSize: '14px', fontWeight: '600' }}>
            {getWeekDisplay(week.weekStart, week.weekEnd)}
          </span>
          <span style={{ color: '#666', fontSize: '12px' }}>({week.count})</span>
        </div>
        <button
          onClick={(e) => onDeleteWeek(e, week.weekStart)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            opacity: 0.6,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
          title="Delete all conversations from this week"
        >
          <Trash2 style={{ width: '14px', height: '14px' }} />
        </button>
      </div>

      {isExpanded && (
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          {week.days.map(day => (
            <div key={day.date} style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Calendar style={{ width: '14px', height: '14px', color: '#666' }} />
                <span style={{ color: '#aaa', fontSize: '13px', fontWeight: '600' }}>
                  {getDayDisplay(day.date)}
                </span>
                <span style={{ color: '#555', fontSize: '11px' }}>({day.count})</span>
              </div>
              {day.conversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  onLoadConversation={onLoadConversation}
                  onDeleteConversation={onDeleteConversation}
                  compact
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationItem({
  conversation,
  onLoadConversation,
  onDeleteConversation,
  compact = false
}: {
  conversation: ChatConversation;
  onLoadConversation: (conv: ChatConversation) => void;
  onDeleteConversation: (e: React.MouseEvent, id: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      onClick={() => onLoadConversation(conversation)}
      style={{
        padding: compact ? '8px 12px' : '12px',
        marginBottom: compact ? '6px' : '8px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.08)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: '#e5e5e5',
            fontSize: compact ? '13px' : '14px',
            fontWeight: '600',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {conversation.name}
          </div>
          <div style={{
            color: '#888',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Clock style={{ width: '12px', height: '12px' }} />
            {compact ? formatTime(conversation.createdAt) : getRelativeTime(conversation.createdAt)}
          </div>
        </div>
        <button
          onClick={(e) => onDeleteConversation(e, conversation.id)}
          style={{
            background: 'none',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            flexShrink: 0,
            opacity: 0.5,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
          title="Delete conversation"
        >
          <Trash2 style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </div>
  );
}
