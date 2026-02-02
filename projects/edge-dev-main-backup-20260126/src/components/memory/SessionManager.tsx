/**
 * Session Manager Component
 * Manage chat sessions, organize memory, and control cleanup
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FolderOpen,
  Plus,
  Trash2,
  Edit,
  Archive,
  ArchiveRestore,
  Search,
  Download,
  Upload,
  Settings,
  Clock,
  MessageSquare,
  Check,
  X,
  Play,
  Pause
} from 'lucide-react';

interface Session {
  id: string;
  name: string;
  description?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_activity: string;
  is_archived: boolean;
}

interface RetentionPolicy {
  log_retention_days: number;
  max_log_entries: number;
  session_retention_days: number;
  max_sessions: number;
  auto_archive_sessions: boolean;
  cleanup_frequency_hours: number;
}

interface SessionManagerProps {
  onSessionSelect?: (sessionId: string) => void;
  currentSessionId?: string;
}

export function SessionManager({ onSessionSelect, currentSessionId }: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [retentionPolicy, setRetentionPolicy] = useState<RetentionPolicy | null>(null);
  const [autoCleanupRunning, setAutoCleanupRunning] = useState(false);

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [projectId, setProjectId] = useState('');

  // Load sessions
  useEffect(() => {
    async function loadSessions() {
      setLoading(true);
      try {
        const response = await fetch('/api/memory?action=sessions');
        const data = await response.json();

        if (data.success) {
          setSessions(data.sessions || []);
        }
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [showArchived]);

  // Load retention policy
  useEffect(() => {
    async function loadPolicy() {
      try {
        const response = await fetch('/api/memory?action=retention_policy');
        const data = await response.json();

        if (data.success) {
          setRetentionPolicy(data.policy);
        }
      } catch (error) {
        console.error('Failed to load retention policy:', error);
      }
    }

    loadPolicy();
  }, []);

  // Create session
  const createSession = async () => {
    if (!sessionName.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_session',
          name: sessionName,
          description: sessionDescription,
          project_id: projectId || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateForm(false);
        setSessionName('');
        setSessionDescription('');
        setProjectId('');

        // Reload sessions
        const sessionsResponse = await fetch('/api/memory?action=sessions');
        const sessionsData = await sessionsResponse.json();
        if (sessionsData.success) {
          setSessions(sessionsData.sessions || []);
        }
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  // Update session
  const updateSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_session',
          session_id: sessionId,
          name: sessionName,
          description: sessionDescription
        })
      });

      const data = await response.json();

      if (data.success) {
        setEditingSession(null);

        // Reload sessions
        const sessionsResponse = await fetch('/api/memory?action=sessions');
        const sessionsData = await sessionsResponse.json();
        if (sessionsData.success) {
          setSessions(sessionsData.sessions || []);
        }
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  // Archive session
  const archiveSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive_session',
          session_id: sessionId
        })
      });

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
      }
    } catch (error) {
      console.error('Failed to archive session:', error);
    }
  };

  // Delete session
  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_session',
          session_id: sessionId
        })
      });

      if (response.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        setSelectedSessions(prev => {
          const newSet = new Set(prev);
          newSet.delete(sessionId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // Set current session
  const setCurrentSession = async (sessionId: string) => {
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_current_session',
          session_id: sessionId
        })
      });

      if (onSessionSelect) {
        onSessionSelect(sessionId);
      }
    } catch (error) {
      console.error('Failed to set current session:', error);
    }
  };

  // Toggle session selection
  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  // Bulk archive
  const bulkArchive = async () => {
    for (const sessionId of selectedSessions) {
      await archiveSession(sessionId);
    }
    setSelectedSessions(new Set());
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedSessions.size} sessions?`)) {
      return;
    }

    for (const sessionId of selectedSessions) {
      await deleteSession(sessionId);
    }
    setSelectedSessions(new Set());
  };

  // Export sessions
  const exportSessions = async () => {
    try {
      const response = await fetch('/api/memory?action=export_all');
      const data = await response.json();

      if (data.success) {
        const blob = new Blob([data.data_json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `memory_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export sessions:', error);
    }
  };

  // Start auto cleanup
  const startAutoCleanup = async () => {
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_auto_cleanup' })
      });
      setAutoCleanupRunning(true);
    } catch (error) {
      console.error('Failed to start auto cleanup:', error);
    }
  };

  // Stop auto cleanup
  const stopAutoCleanup = async () => {
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop_auto_cleanup' })
      });
      setAutoCleanupRunning(false);
    } catch (error) {
      console.error('Failed to stop auto cleanup:', error);
    }
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (session.description && session.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesArchive = showArchived ? session.is_archived : !session.is_archived;
    return matchesSearch && matchesArchive;
  });

  if (loading) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg bg-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Session Manager
          </h3>
          <p className="text-sm text-muted-foreground">
            Organize and manage chat sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="gap-2"
          >
            <Archive className="w-4 h-4" />
            {showArchived ? 'Active' : 'Archived'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportSessions}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Session
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Create Session Form */}
      {showCreateForm && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Create New Session</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateForm(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div>
            <Label>Session Name *</Label>
            <Input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="My Trading Strategy Session"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={sessionDescription}
              onChange={(e) => setSessionDescription(e.target.value)}
              placeholder="Describe this session..."
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Project ID (optional)</Label>
            <Input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="project-123"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </Button>
            <Button onClick={createSession}>
              <Plus className="w-4 h-4 mr-2" />
              Create Session
            </Button>
          </div>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedSessions.size > 0 && (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-accent">
          <span className="text-sm">{selectedSessions.size} sessions selected</span>
          <Button
            variant="outline"
            size="sm"
            onClick={bulkArchive}
            className="gap-2"
          >
            <Archive className="w-4 h-4" />
            Archive
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={bulkDelete}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      )}

      {/* Session List */}
      <div className="space-y-2">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {showArchived
              ? 'No archived sessions found'
              : 'No sessions found. Create your first session to get started.'}
          </div>
        ) : (
          filteredSessions.map(session => {
            const isSelected = selectedSessions.has(session.id);
            const isCurrent = session.id === currentSessionId;

            return (
              <Card
                key={session.id}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected ? 'border-primary bg-accent' : ''
                } ${isCurrent ? 'border-primary' : ''}`}
                onClick={() => setCurrentSession(session.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSessionSelection(session.id);
                    }}
                    className="mt-1"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{session.name}</h4>
                      {isCurrent && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                      {session.is_archived && (
                        <Badge variant="secondary" className="text-xs">Archived</Badge>
                      )}
                    </div>

                    {session.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {session.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {session.message_count} messages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last active: {new Date(session.last_activity).toLocaleDateString()}
                      </span>
                      {session.project_id && (
                        <span>Project: {session.project_id}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSession(session);
                        setSessionName(session.name);
                        setSessionDescription(session.description || '');
                      }}
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveSession(session.id);
                      }}
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Edit Session Dialog */}
      {editingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 rounded-lg max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Edit Session</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingSession(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Session Name</Label>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditingSession(null)}
              >
                Cancel
              </Button>
              <Button onClick={() => updateSession(editingSession.id)}>
                <Check className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stats */}
      <div className="pt-4 border-t text-sm text-muted-foreground flex justify-between">
        <span>Total: {sessions.length} sessions</span>
        <div className="flex items-center gap-2">
          {autoCleanupRunning ? (
            <Button
              variant="outline"
              size="sm"
              onClick={stopAutoCleanup}
              className="gap-1"
            >
              <Pause className="w-3 h-3" />
              Auto-cleanup ON
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={startAutoCleanup}
              className="gap-1"
            >
              <Play className="w-3 h-3" />
              Auto-cleanup OFF
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
