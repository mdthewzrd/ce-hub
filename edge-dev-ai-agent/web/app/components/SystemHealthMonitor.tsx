'use client';

/**
 * System Health Monitor Component
 *
 * Displays real-time system health status
 */

import { useEffect, useState } from 'react';
import { Activity, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    frontend: boolean;
    backend: boolean;
    edgedev?: boolean;
  };
  uptime: number;
}

export function SystemHealthMonitor() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setHealth(data);
      } catch (error) {
        console.error('Health check failed:', error);
        setHealth({
          status: 'unhealthy',
          services: { frontend: true, backend: false },
          uptime: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <div className="h-2 w-2 rounded-full bg-gold/50 animate-pulse" />
        <span>Checking system health...</span>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  const getStatusIcon = (service: boolean, serviceName: string) => {
    if (service) {
      return <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    return <XCircle className="h-3 w-3 text-red-500" />;
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'unhealthy':
        return 'text-red-500';
      default:
        return 'text-text-muted';
    }
  };

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-lg border border-gold/10 bg-surface-hover/30">
      <div className="flex items-center gap-2">
        <Activity className={`h-4 w-4 ${getStatusColor()}`} />
        <span className={`text-xs font-semibold ${getStatusColor()}`}>
          {health.status.toUpperCase()}
        </span>
      </div>

      <div className="h-4 w-px bg-gold/10" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5" title="Backend">
          {getStatusIcon(health.services.backend, 'backend')}
          <span className="text-xs text-text-muted">Backend</span>
        </div>

        {health.services.edgedev !== undefined && (
          <div className="flex items-center gap-1.5" title="EdgeDev">
            {getStatusIcon(health.services.edgedev!, 'edgedev')}
            <span className="text-xs text-text-muted">EdgeDev</span>
          </div>
        )}

        <div className="h-4 w-px bg-gold/10" />

        <div className="text-xs text-text-muted" title="Uptime">
          {formatUptime(health.uptime)}
        </div>
      </div>
    </div>
  );
}
