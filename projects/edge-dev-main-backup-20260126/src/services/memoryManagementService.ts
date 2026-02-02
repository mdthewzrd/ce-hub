/**
 * Memory Management Service
 * Log cleanup, session organization, and state save/load system
 */

// ========== TYPES ==========

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  data?: any;
  source: string;
}

export interface Session {
  id: string;
  name: string;
  description?: string;
  project_id?: string;
  created_at: Date;
  updated_at: Date;
  message_count: number;
  last_activity: Date;
  metadata?: Record<string, any>;
  is_archived: boolean;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface StateSnapshot {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  state_data: {
    parameters?: Record<string, any>;
    columns?: any[];
    templates?: any[];
    sessions?: any[];
    metadata?: Record<string, any>;
  };
  is_auto_save: boolean;
  version: string;
}

export interface RetentionPolicy {
  log_retention_days: number;
  max_log_entries: number;
  session_retention_days: number;
  max_sessions: number;
  auto_archive_sessions: boolean;
  cleanup_frequency_hours: number;
}

export interface CleanupStats {
  logs_deleted: number;
  sessions_archived: number;
  sessions_deleted: number;
  space_freed_bytes: number;
  last_cleanup: Date;
  next_cleanup: Date;
}

// ========== SERVICE ==========

class MemoryManagementService {
  private logs: Map<string, LogEntry> = new Map();
  private sessions: Map<string, Session> = new Map();
  private chatMessages: Map<string, ChatMessage[]> = new Map(); // session_id -> messages
  private snapshots: Map<string, StateSnapshot> = new Map();

  private retentionPolicy: RetentionPolicy = {
    log_retention_days: 7,
    max_log_entries: 10000,
    session_retention_days: 30,
    max_sessions: 100,
    auto_archive_sessions: true,
    cleanup_frequency_hours: 24
  };

  private cleanupInterval: NodeJS.Timeout | null = null;
  private currentSessionId: string | null = null;

  // ========== LOG MANAGEMENT ==========

  addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): LogEntry {
    const log: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry
    };

    this.logs.set(log.id, log);

    // Check if we need to trigger cleanup
    if (this.logs.size > this.retentionPolicy.max_log_entries) {
      this.performLogCleanup();
    }

    return log;
  }

  getLogs(filters?: {
    level?: LogEntry['level'];
    category?: string;
    source?: string;
    since?: Date;
    until?: Date;
    limit?: number;
  }): LogEntry[] {
    let logs = Array.from(this.logs.values());

    if (filters) {
      if (filters.level) {
        logs = logs.filter(l => l.level === filters.level);
      }
      if (filters.category) {
        logs = logs.filter(l => l.category === filters.category);
      }
      if (filters.source) {
        logs = logs.filter(l => l.source === filters.source);
      }
      if (filters.since) {
        logs = logs.filter(l => l.timestamp >= filters.since!);
      }
      if (filters.until) {
        logs = logs.filter(l => l.timestamp <= filters.until!);
      }
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }
    }

    // Sort by timestamp descending
    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return logs;
  }

  clearLogs(filters?: {
    level?: LogEntry['level'];
    category?: string;
    source?: string;
    olderThan?: Date;
  }): number {
    let toDelete: string[] = [];

    this.logs.forEach((log, id) => {
      let shouldDelete = false;

      if (filters) {
        if (filters.level && log.level === filters.level) shouldDelete = true;
        if (filters.category && log.category === filters.category) shouldDelete = true;
        if (filters.source && log.source === filters.source) shouldDelete = true;
        if (filters.olderThan && log.timestamp < filters.olderThan) shouldDelete = true;
      }

      if (shouldDelete) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => this.logs.delete(id));
    return toDelete.length;
  }

  private performLogCleanup(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionPolicy.log_retention_days);

    const deleted = this.clearLogs({ olderThan: cutoffDate });

    if (deleted > 0) {
      this.addLog({
        level: 'info',
        category: 'cleanup',
        source: 'MemoryManagementService',
        message: `Cleaned up ${deleted} old log entries`
      });
    }
  }

  // ========== SESSION MANAGEMENT ==========

  createSession(name: string, options?: {
    description?: string;
    project_id?: string;
    metadata?: Record<string, any>;
  }): Session {
    const session: Session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: options?.description,
      project_id: options?.project_id,
      created_at: new Date(),
      updated_at: new Date(),
      message_count: 0,
      last_activity: new Date(),
      metadata: options?.metadata,
      is_archived: false
    };

    this.sessions.set(session.id, session);
    this.chatMessages.set(session.id, []);

    this.addLog({
      level: 'info',
      category: 'session',
      source: 'MemoryManagementService',
      message: `Created session: ${name}`,
      data: { session_id: session.id }
    });

    return session;
  }

  getSession(sessionId: string): Session | null {
    return this.sessions.get(sessionId) || null;
  }

  getSessions(filters?: {
    project_id?: string;
    is_archived?: boolean;
    limit?: number;
  }): Session[] {
    let sessions = Array.from(this.sessions.values());

    if (filters) {
      if (filters.project_id) {
        sessions = sessions.filter(s => s.project_id === filters.project_id);
      }
      if (filters.is_archived !== undefined) {
        sessions = sessions.filter(s => s.is_archived === filters.is_archived);
      }
      if (filters.limit) {
        sessions = sessions.slice(0, filters.limit);
      }
    }

    // Sort by updated_at descending
    sessions.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());

    return sessions;
  }

  updateSession(sessionId: string, updates: {
    name?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    Object.assign(session, updates, { updated_at: new Date() });
    this.sessions.set(sessionId, session);
    return true;
  }

  archiveSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.is_archived = true;
    session.updated_at = new Date();
    this.sessions.set(sessionId, session);

    this.addLog({
      level: 'info',
      category: 'session',
      source: 'MemoryManagementService',
      message: `Archived session: ${session.name}`,
      data: { session_id: sessionId }
    });

    return true;
  }

  deleteSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    this.sessions.delete(sessionId);
    this.chatMessages.delete(sessionId);

    this.addLog({
      level: 'info',
      category: 'session',
      source: 'MemoryManagementService',
      message: `Deleted session: ${session.name}`,
      data: { session_id: sessionId }
    });

    return true;
  }

  setCurrentSession(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  getCurrentSession(): Session | null {
    if (!this.currentSessionId) return null;
    return this.getSession(this.currentSessionId);
  }

  // ========== CHAT MEMORY ==========

  addMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    if (!message.session_id) {
      throw new Error('Session ID is required');
    }

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...message
    };

    const messages = this.chatMessages.get(chatMessage.session_id) || [];
    messages.push(chatMessage);
    this.chatMessages.set(chatMessage.session_id, messages);

    // Update session
    const session = this.sessions.get(chatMessage.session_id);
    if (session) {
      session.message_count = messages.length;
      session.last_activity = new Date();
      session.updated_at = new Date();
      this.sessions.set(chatMessage.session_id, session);
    }

    return chatMessage;
  }

  getMessages(sessionId: string, limit?: number): ChatMessage[] {
    const messages = this.chatMessages.get(sessionId) || [];

    if (limit) {
      return messages.slice(-limit);
    }

    return messages;
  }

  searchMessages(query: string, sessionId?: string): ChatMessage[] {
    const allMessages: ChatMessage[] = [];

    if (sessionId) {
      allMessages.push(...this.getMessages(sessionId));
    } else {
      this.chatMessages.forEach((msgs) => {
        allMessages.push(...msgs);
      });
    }

    const queryLower = query.toLowerCase();
    return allMessages.filter(msg =>
      msg.content.toLowerCase().includes(queryLower) ||
      msg.metadata?.description?.toLowerCase().includes(queryLower)
    );
  }

  organizeMessagesBySession(sessionId: string): {
    systemMessages: ChatMessage[];
    userMessages: ChatMessage[];
    assistantMessages: ChatMessage[];
    byDate: Record<string, ChatMessage[]>;
  } {
    const messages = this.getMessages(sessionId);

    const organization = {
      systemMessages: messages.filter(m => m.role === 'system'),
      userMessages: messages.filter(m => m.role === 'user'),
      assistantMessages: messages.filter(m => m.role === 'assistant'),
      byDate: {} as Record<string, ChatMessage[]>
    };

    // Group by date
    messages.forEach(msg => {
      const dateKey = msg.timestamp.toISOString().split('T')[0];
      if (!organization.byDate[dateKey]) {
        organization.byDate[dateKey] = [];
      }
      organization.byDate[dateKey].push(msg);
    });

    return organization;
  }

  // ========== STATE SNAPSHOTS ==========

  saveSnapshot(name: string, stateData: StateSnapshot['state_data'], options?: {
    description?: string;
    is_auto_save?: boolean;
  }): StateSnapshot {
    const snapshot: StateSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: options?.description,
      created_at: new Date(),
      state_data: stateData,
      is_auto_save: options?.is_auto_save || false,
      version: '1.0.0'
    };

    this.snapshots.set(snapshot.id, snapshot);

    this.addLog({
      level: 'info',
      category: 'snapshot',
      source: 'MemoryManagementService',
      message: `Saved state snapshot: ${name}`,
      data: { snapshot_id: snapshot.id, is_auto_save: snapshot.is_auto_save }
    });

    return snapshot;
  }

  loadSnapshot(snapshotId: string): StateSnapshot | null {
    return this.snapshots.get(snapshotId) || null;
  }

  getSnapshots(limit?: number): StateSnapshot[] {
    let snapshots = Array.from(this.snapshots.values());

    // Sort by created_at descending
    snapshots.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    if (limit) {
      snapshots = snapshots.slice(0, limit);
    }

    return snapshots;
  }

  deleteSnapshot(snapshotId: string): boolean {
    const deleted = this.snapshots.delete(snapshotId);

    if (deleted) {
      this.addLog({
        level: 'info',
        category: 'snapshot',
        source: 'MemoryManagementService',
        message: `Deleted state snapshot: ${snapshotId}`
      });
    }

    return deleted;
  }

  exportSnapshot(snapshotId: string): string | null {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return null;

    return JSON.stringify(snapshot, null, 2);
  }

  importSnapshot(jsonString: string): StateSnapshot | null {
    try {
      const snapshot = JSON.parse(jsonString) as StateSnapshot;
      snapshot.id = `snap_${Date.now()}_imported`;
      snapshot.created_at = new Date(snapshot.created_at);

      this.snapshots.set(snapshot.id, snapshot);

      this.addLog({
        level: 'info',
        category: 'snapshot',
        source: 'MemoryManagementService',
        message: `Imported state snapshot: ${snapshot.name}`,
        data: { snapshot_id: snapshot.id }
      });

      return snapshot;
    } catch (error) {
      this.addLog({
        level: 'error',
        category: 'snapshot',
        source: 'MemoryManagementService',
        message: `Failed to import snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return null;
    }
  }

  // ========== AUTOMATED CLEANUP ==========

  startAutoCleanup(): void {
    if (this.cleanupInterval) {
      this.stopAutoCleanup();
    }

    // Run cleanup immediately
    this.performFullCleanup();

    // Schedule periodic cleanup
    const frequencyMs = this.retentionPolicy.cleanup_frequency_hours * 60 * 60 * 1000;
    this.cleanupInterval = setInterval(() => {
      this.performFullCleanup();
    }, frequencyMs);

    this.addLog({
      level: 'info',
      category: 'cleanup',
      source: 'MemoryManagementService',
      message: `Started auto-cleanup (every ${this.retentionPolicy.cleanup_frequency_hours}h)`
    });
  }

  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;

      this.addLog({
        level: 'info',
        category: 'cleanup',
        source: 'MemoryManagementService',
        message: 'Stopped auto-cleanup'
      });
    }
  }

  private performFullCleanup(): CleanupStats {
    const stats: CleanupStats = {
      logs_deleted: 0,
      sessions_archived: 0,
      sessions_deleted: 0,
      space_freed_bytes: 0,
      last_cleanup: new Date(),
      next_cleanup: new Date(Date.now() + this.retentionPolicy.cleanup_frequency_hours * 60 * 60 * 1000)
    };

    // Clean up old logs
    const logCutoff = new Date();
    logCutoff.setDate(logCutoff.getDate() - this.retentionPolicy.log_retention_days);
    stats.logs_deleted = this.clearLogs({ olderThan: logCutoff });

    // Archive old sessions
    const sessionCutoff = new Date();
    sessionCutoff.setDate(sessionCutoff.getDate() - this.retentionPolicy.session_retention_days);

    this.sessions.forEach((session, id) => {
      if (!session.is_archived && session.last_activity < sessionCutoff) {
        if (this.retentionPolicy.auto_archive_sessions) {
          this.archiveSession(id);
          stats.sessions_archived++;
        } else {
          this.deleteSession(id);
          stats.sessions_deleted++;
        }
      }
    });

    // Limit total number of sessions
    const allSessions = Array.from(this.sessions.values());
    const activeSessions = allSessions.filter(s => !s.is_archived);
    if (activeSessions.length > this.retentionPolicy.max_sessions) {
      const toDelete = activeSessions
        .sort((a, b) => a.last_activity.getTime() - b.last_activity.getTime())
        .slice(0, activeSessions.length - this.retentionPolicy.max_sessions);

      toDelete.forEach(session => {
        this.deleteSession(session.id);
        stats.sessions_deleted++;
      });
    }

    // Delete old auto-save snapshots (keep last 10)
    const autoSnapshots = Array.from(this.snapshots.values())
      .filter(s => s.is_auto_save)
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    if (autoSnapshots.length > 10) {
      const toDelete = autoSnapshots.slice(10);
      toDelete.forEach(snap => {
        this.deleteSnapshot(snap.id);
        stats.space_freed_bytes += JSON.stringify(snap).length;
      });
    }

    this.addLog({
      level: 'info',
      category: 'cleanup',
      source: 'MemoryManagementService',
      message: 'Full cleanup completed',
      data: stats
    });

    return stats;
  }

  // ========== RETENTION POLICY ==========

  getRetentionPolicy(): RetentionPolicy {
    return { ...this.retentionPolicy };
  }

  setRetentionPolicy(policy: Partial<RetentionPolicy>): void {
    this.retentionPolicy = { ...this.retentionPolicy, ...policy };

    this.addLog({
      level: 'info',
      category: 'policy',
      source: 'MemoryManagementService',
      message: 'Updated retention policy',
      data: this.retentionPolicy
    });
  }

  // ========== STATISTICS ==========

  getStats(): {
    logs: {
      total: number;
      by_level: Record<string, number>;
      by_category: Record<string, number>;
    };
    sessions: {
      total: number;
      active: number;
      archived: number;
      total_messages: number;
    };
    snapshots: {
      total: number;
      auto_saves: number;
      manual_saves: number;
    };
    retention_policy: RetentionPolicy;
    last_cleanup?: CleanupStats;
  } {
    const logs = Array.from(this.logs.values());
    const sessions = Array.from(this.sessions.values());
    const snapshots = Array.from(this.snapshots.values());

    const logsByLevel: Record<string, number> = {};
    const logsByCategory: Record<string, number> = {};

    logs.forEach(log => {
      logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
      logsByCategory[log.category] = (logsByCategory[log.category] || 0) + 1;
    });

    return {
      logs: {
        total: logs.length,
        by_level: logsByLevel,
        by_category: logsByCategory
      },
      sessions: {
        total: sessions.length,
        active: sessions.filter(s => !s.is_archived).length,
        archived: sessions.filter(s => s.is_archived).length,
        total_messages: sessions.reduce((sum, s) => sum + s.message_count, 0)
      },
      snapshots: {
        total: snapshots.length,
        auto_saves: snapshots.filter(s => s.is_auto_save).length,
        manual_saves: snapshots.filter(s => !s.is_auto_save).length
      },
      retention_policy: this.retentionPolicy
    };
  }

  // ========== IMPORT/EXPORT ==========

  exportAllData(): string {
    const data = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      logs: Array.from(this.logs.values()),
      sessions: Array.from(this.sessions.values()),
      chat_messages: Object.fromEntries(this.chatMessages),
      snapshots: Array.from(this.snapshots.values()),
      retention_policy: this.retentionPolicy
    };

    return JSON.stringify(data, null, 2);
  }

  importAllData(jsonString: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const data = JSON.parse(jsonString);

      let imported = 0;
      const errors: string[] = [];

      // Import logs
      if (Array.isArray(data.logs)) {
        data.logs.forEach((log: LogEntry) => {
          try {
            log.timestamp = new Date(log.timestamp);
            this.logs.set(log.id, log);
            imported++;
          } catch (e) {
            errors.push(`Failed to import log ${log.id}`);
          }
        });
      }

      // Import sessions
      if (Array.isArray(data.sessions)) {
        data.sessions.forEach((session: Session) => {
          try {
            session.created_at = new Date(session.created_at);
            session.updated_at = new Date(session.updated_at);
            session.last_activity = new Date(session.last_activity);
            this.sessions.set(session.id, session);
            imported++;
          } catch (e) {
            errors.push(`Failed to import session ${session.id}`);
          }
        });
      }

      // Import chat messages
      if (data.chat_messages) {
        Object.entries(data.chat_messages).forEach(([sessionId, messages]: [string, any]) => {
          try {
            const parsedMessages = (messages as ChatMessage[]).map(m => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }));
            this.chatMessages.set(sessionId, parsedMessages);
            imported++;
          } catch (e) {
            errors.push(`Failed to import messages for session ${sessionId}`);
          }
        });
      }

      // Import snapshots
      if (Array.isArray(data.snapshots)) {
        data.snapshots.forEach((snapshot: StateSnapshot) => {
          try {
            snapshot.created_at = new Date(snapshot.created_at);
            this.snapshots.set(snapshot.id, snapshot);
            imported++;
          } catch (e) {
            errors.push(`Failed to import snapshot ${snapshot.id}`);
          }
        });
      }

      this.addLog({
        level: 'info',
        category: 'import',
        source: 'MemoryManagementService',
        message: `Imported ${imported} items`,
        data: { imported, errors: errors.length }
      });

      return { success: true, imported, errors };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

// Singleton instance
let instance: MemoryManagementService | null = null;

export const getMemoryManagement = (): MemoryManagementService => {
  if (!instance) {
    instance = new MemoryManagementService();
  }
  return instance;
};

export type { MemoryManagementService };
