/**
 * Memory Management API
 * Log cleanup, session management, and state snapshots
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMemoryManagement, type LogEntry } from '@/services/memoryManagementService';

// GET /api/memory - Retrieve logs, sessions, snapshots, stats
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'stats';
    const sessionId = searchParams.get('session_id');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const memoryService = getMemoryManagement();

    let result;

    switch (action) {
      case 'logs':
        // Get logs with optional filters
        const level = searchParams.get('level') as LogEntry['level'] | undefined;
        const category = searchParams.get('category') || undefined;
        const source = searchParams.get('source') || undefined;
        const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined;

        result = {
          success: true,
          logs: memoryService.getLogs({
            level,
            category,
            source,
            since,
            limit
          })
        };
        break;

      case 'sessions':
        // Get sessions
        const projectId = searchParams.get('project_id');
        const isArchived = searchParams.get('is_archived');
        const currentSession = memoryService.getCurrentSession();

        result = {
          success: true,
          sessions: memoryService.getSessions({
            project_id: projectId || undefined,
            is_archived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
            limit
          }),
          current_session: currentSession
        };
        break;

      case 'session':
        // Get specific session
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'session_id is required'
          }, { status: 400 });
        }
        const session = memoryService.getSession(sessionId);
        result = {
          success: !!session,
          session: session
        };
        break;

      case 'messages':
        // Get messages for session
        if (!sessionId) {
          return NextResponse.json({
            success: false,
            error: 'session_id is required'
          }, { status: 400 });
        }
        result = {
          success: true,
          messages: memoryService.getMessages(sessionId, limit),
          organization: memoryService.organizeMessagesBySession(sessionId)
        };
        break;

      case 'search_messages':
        // Search messages
        const query = searchParams.get('q');
        if (!query) {
          return NextResponse.json({
            success: false,
            error: 'Search query (q) is required'
          }, { status: 400 });
        }
        result = {
          success: true,
          results: memoryService.searchMessages(query, sessionId || undefined)
        };
        break;

      case 'snapshots':
        // Get state snapshots
        result = {
          success: true,
          snapshots: memoryService.getSnapshots(limit)
        };
        break;

      case 'snapshot':
        // Get specific snapshot
        const snapshotId = searchParams.get('snapshot_id');
        if (!snapshotId) {
          return NextResponse.json({
            success: false,
            error: 'snapshot_id is required'
          }, { status: 400 });
        }
        const snapshot = memoryService.loadSnapshot(snapshotId);
        result = {
          success: !!snapshot,
          snapshot: snapshot
        };
        break;

      case 'export_snapshot':
        // Export snapshot as JSON
        const exportId = searchParams.get('snapshot_id');
        if (!exportId) {
          return NextResponse.json({
            success: false,
            error: 'snapshot_id is required'
          }, { status: 400 });
        }
        const exported = memoryService.exportSnapshot(exportId);
        if (exported) {
          return NextResponse.json({
            success: true,
            snapshot_json: exported
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'Snapshot not found'
          }, { status: 404 });
        }

      case 'export_all':
        // Export all data
        result = {
          success: true,
          data_json: memoryService.exportAllData()
        };
        break;

      case 'retention_policy':
        // Get retention policy
        result = {
          success: true,
          policy: memoryService.getRetentionPolicy()
        };
        break;

      case 'stats':
      default:
        // Get service statistics
        result = {
          success: true,
          stats: memoryService.getStats()
        };
        break;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Memory GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/memory - Create sessions, add logs/messages, import data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const memoryService = getMemoryManagement();

    let result;

    switch (action) {
      case 'add_log':
        // Add log entry
        const log = memoryService.addLog({
          level: data.level || 'info',
          category: data.category || 'general',
          source: data.source || 'api',
          message: data.message,
          data: data.data
        });
        result = {
          success: true,
          log: log
        };
        break;

      case 'clear_logs':
        // Clear logs
        const deleted = memoryService.clearLogs(data.filters);
        result = {
          success: true,
          deleted: deleted
        };
        break;

      case 'create_session':
        // Create new session
        const newSession = memoryService.createSession(data.name, {
          description: data.description,
          project_id: data.project_id,
          metadata: data.metadata
        });
        result = {
          success: true,
          session: newSession
        };
        break;

      case 'update_session':
        // Update session
        const updated = memoryService.updateSession(data.session_id, {
          name: data.name,
          description: data.description,
          metadata: data.metadata
        });
        result = {
          success: updated,
          message: updated ? 'Session updated successfully' : 'Session not found'
        };
        break;

      case 'archive_session':
        // Archive session
        const archived = memoryService.archiveSession(data.session_id);
        result = {
          success: archived,
          message: archived ? 'Session archived successfully' : 'Session not found'
        };
        break;

      case 'delete_session':
        // Delete session
        const deletedSession = memoryService.deleteSession(data.session_id);
        result = {
          success: deletedSession,
          message: deletedSession ? 'Session deleted successfully' : 'Session not found'
        };
        break;

      case 'set_current_session':
        // Set current session
        memoryService.setCurrentSession(data.session_id);
        const current = memoryService.getCurrentSession();
        result = {
          success: !!current,
          session: current
        };
        break;

      case 'add_message':
        // Add message to session
        const message = memoryService.addMessage({
          session_id: data.session_id,
          role: data.role,
          content: data.content,
          metadata: data.metadata
        });
        result = {
          success: true,
          message: message
        };
        break;

      case 'save_snapshot':
        // Save state snapshot
        const snapshot = memoryService.saveSnapshot(data.name, data.state_data, {
          description: data.description,
          is_auto_save: data.is_auto_save
        });
        result = {
          success: true,
          snapshot: snapshot
        };
        break;

      case 'delete_snapshot':
        // Delete snapshot
        const deletedSnapshot = memoryService.deleteSnapshot(data.snapshot_id);
        result = {
          success: deletedSnapshot,
          message: deletedSnapshot ? 'Snapshot deleted successfully' : 'Snapshot not found'
        };
        break;

      case 'import_snapshot':
        // Import snapshot from JSON
        const importedSnapshot = memoryService.importSnapshot(data.snapshot_json);
        if (importedSnapshot) {
          result = {
            success: true,
            snapshot: importedSnapshot
          };
        } else {
          result = {
            success: false,
            error: 'Failed to import snapshot'
          };
        }
        break;

      case 'import_all':
        // Import all data from JSON
        const importResult = memoryService.importAllData(data.data_json);
        result = importResult;
        break;

      case 'set_retention_policy':
        // Update retention policy
        memoryService.setRetentionPolicy(data.policy);
        result = {
          success: true,
          message: 'Retention policy updated successfully',
          policy: memoryService.getRetentionPolicy()
        };
        break;

      case 'start_auto_cleanup':
        // Start automated cleanup
        memoryService.startAutoCleanup();
        result = {
          success: true,
          message: 'Auto-cleanup started successfully'
        };
        break;

      case 'stop_auto_cleanup':
        // Stop automated cleanup
        memoryService.stopAutoCleanup();
        result = {
          success: true,
          message: 'Auto-cleanup stopped successfully'
        };
        break;

      case 'perform_cleanup':
        // Perform immediate cleanup
        const cleanupStats = (memoryService as any).performFullCleanup();
        result = {
          success: true,
          stats: cleanupStats
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: add_log, clear_logs, create_session, update_session, archive_session, delete_session, set_current_session, add_message, save_snapshot, delete_snapshot, import_snapshot, import_all, set_retention_policy, start_auto_cleanup, stop_auto_cleanup, perform_cleanup'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Memory POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/memory - Delete logs, sessions, snapshots
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'delete';

    const memoryService = getMemoryManagement();

    let result;

    if (action === 'clear_logs') {
      const filters = {
        level: searchParams.get('level') as LogEntry['level'] | undefined,
        category: searchParams.get('category') || undefined,
        source: searchParams.get('source') || undefined,
        olderThan: searchParams.get('older_than') ? new Date(searchParams.get('older_than')!) : undefined
      };

      const deleted = memoryService.clearLogs(filters);
      result = {
        success: true,
        deleted: deleted
      };
    } else if (action === 'delete_session' && searchParams.get('session_id')) {
      const deleted = memoryService.deleteSession(searchParams.get('session_id')!);
      result = {
        success: deleted,
        message: deleted ? 'Session deleted successfully' : 'Session not found'
      };
    } else if (action === 'delete_snapshot' && searchParams.get('snapshot_id')) {
      const deleted = memoryService.deleteSnapshot(searchParams.get('snapshot_id')!);
      result = {
        success: deleted,
        message: deleted ? 'Snapshot deleted successfully' : 'Snapshot not found'
      };
    } else {
      result = {
        success: false,
        error: 'Missing required parameters or unknown action'
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Memory DELETE API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
