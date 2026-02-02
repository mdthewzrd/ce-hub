/**
 * Clean, Professional Scan Progress Display
 *
 * Shows scan execution progress with a minimal terminal-like interface
 * without code clutter, focusing on stage progress and key metrics
 */

'use client'

import React, { useEffect, useState } from 'react';
import {
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Loader2,
  Activity,
  TrendingUp,
  Clock,
  Target,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useScanExecution, ScanStage } from '@/contexts/ScanExecutionContext';

interface ScanProgressDisplayProps {
  className?: string;
  executionId?: string;
  minimized?: boolean;
  onToggleMinimized?: () => void;
}

const ScanProgressDisplay: React.FC<ScanProgressDisplayProps> = ({
  className = '',
  executionId,
  minimized = false,
  onToggleMinimized
}) => {
  const { state, cancelExecution, setGlobalProgressVisible } = useScanExecution();
  const [isMinimized, setIsMinimized] = useState(minimized);

  const activeExecution = executionId
    ? state.executions[executionId]
    : state.activeExecution
      ? state.executions[state.activeExecution]
      : null;

  // Auto-minimize after completion
  useEffect(() => {
    if (activeExecution?.status === 'completed' && !isMinimized) {
      setTimeout(() => {
        setIsMinimized(true);
        onToggleMinimized?.();
      }, 5000);
    }
  }, [activeExecution?.status, isMinimized, onToggleMinimized]);

  // Close when manually minimized and completed
  const handleClose = () => {
    setGlobalProgressVisible(false);
    if (activeExecution) {
      cancelExecution(activeExecution.id);
    }
  };

  const getStatusIcon = () => {
    switch (activeExecution?.status) {
      case 'initializing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'running':
        return <Activity className="h-4 w-4 text-blue-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (activeExecution?.status) {
      case 'initializing':
        return 'text-blue-400';
      case 'running':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'cancelled':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    switch (activeExecution?.status) {
      case 'initializing': return 'Initializing';
      case 'running': return 'Running';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStageIcon = (stage: ScanStage) => {
    switch (stage.status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-gray-500" />;
      case 'running':
        return <Loader2 className="h-3 w-3 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-400" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatDuration = () => {
    if (!activeExecution?.started_at) return '0s';

    const startTime = new Date(activeExecution.started_at);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();

    if (activeExecution.execution_time) {
      return `${(activeExecution.execution_time / 1000).toFixed(1)}s`;
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ${diffSeconds % 60}s`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m`;
  };

  const getProgressPercentage = () => {
    if (!activeExecution?.stages) return 0;

    const totalProgress = activeExecution.stages.reduce((sum, stage) => {
      return sum + (stage.status === 'completed' ? 100 : stage.progress);
    }, 0);

    return Math.round(totalProgress / activeExecution.stages.length);
  };

  if (!activeExecution || !state.globalProgressVisible) {
    return null;
  }

  if (isMinimized) {
    return (
      <Card className={`fixed bottom-4 right-4 w-80 bg-gray-900 border-gray-700 shadow-xl ${className}`}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            <Badge variant="secondary" className="bg-gray-800 text-gray-300">
              {getProgressPercentage()}%
            </Badge>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-400">
              {activeExecution.total_signals || 0} signals
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            {activeExecution.status === 'running' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              >
                <Square className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 w-96 bg-gray-900 border-gray-700 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-sm font-semibold text-white">
              {activeExecution.scanner_name}
            </h3>
            <p className={`text-xs capitalize ${getStatusColor()}`}>
              {getStatusText()} • {formatDuration()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-lg font-bold text-white">
              {activeExecution.total_signals || 0}
            </div>
            <div className="text-xs text-gray-400">signals</div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            <Minimize2 className="h-3 w-3" />
          </Button>

          {activeExecution.status === 'running' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
            >
              <Square className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Overall Progress */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Overall Progress</span>
          <span className="text-xs text-gray-400">{getProgressPercentage()}%</span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>

      {/* Stages */}
      <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
        {activeExecution.stages.map((stage, index) => (
          <div
            key={stage.id}
            className={`flex items-center space-x-3 p-2 rounded ${
              stage.status === 'completed'
                ? 'bg-green-900/20 border border-green-800/50'
                : stage.status === 'running'
                ? 'bg-blue-900/20 border border-blue-800/50'
                : stage.status === 'failed'
                ? 'bg-red-900/20 border border-red-800/50'
                : 'bg-gray-800'
            }`}
          >
            <div className="flex-shrink-0">
              {getStageIcon(stage)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white">
                  {stage.name}
                </span>
                <span className={`text-xs ${
                  stage.status === 'completed'
                    ? 'text-green-400'
                    : stage.status === 'running'
                    ? 'text-blue-400'
                    : stage.status === 'failed'
                    ? 'text-red-400'
                    : 'text-gray-500'
                }`}>
                  {stage.status}
                </span>
              </div>

              {stage.message && (
                <p className="text-xs text-gray-400 truncate">
                  {stage.message}
                </p>
              )}

              {(stage.status === 'running' || stage.progress > 0) && (
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      {Math.round(stage.progress)}%
                    </span>
                    {stage.signals && (
                      <span className="text-xs text-blue-400">
                        {stage.signals} found
                      </span>
                    )}
                  </div>
                  <Progress
                    value={stage.progress}
                    className="h-1"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ScanProgressDisplay;