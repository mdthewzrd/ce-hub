'use client';

import React from 'react';
import { BarChart3, TrendingUp, CheckCircle, Clock, Database } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  type: string;
  status: 'uploaded' | 'backtested' | 'running';
  tickers: number;
  score: number;
  created: string;
}

interface LeftNavigationProps {
  strategies: Strategy[];
  selectedStrategy?: string;
  onStrategySelect: (strategyId: string) => void;
}

const LeftNavigation: React.FC<LeftNavigationProps> = ({
  strategies,
  selectedStrategy,
  onStrategySelect
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <Database className="w-4 h-4 text-primary" />;
      case 'backtested':
        return <BarChart3 className="w-4 h-4 text-primary" />;
      case 'running':
        return <TrendingUp className="w-4 h-4 profit-text" />;
      default:
        return <Clock className="w-4 h-4 studio-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'text-primary';
      case 'backtested':
        return 'text-primary';
      case 'running':
        return 'profit-text';
      default:
        return 'studio-muted';
    }
  };

  return (
    <div className="w-64 studio-bg border-r studio-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b studio-border">
        <h2 className="text-lg font-medium studio-text">Strategies</h2>
        <div className="text-sm studio-muted">{strategies.length} loaded</div>
      </div>

      {/* Strategy List */}
      <div className="flex-1 overflow-auto">
        {strategies.length === 0 ? (
          <div className="p-4 text-center">
            <Database className="w-8 h-8 mx-auto mb-2 studio-muted opacity-50" />
            <div className="text-sm studio-muted">No strategies loaded</div>
            <div className="text-xs studio-muted mt-1">
              Create a systematic scan to upload your first strategy
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {strategies.map((strategy) => (
              <button
                key={strategy.id}
                onClick={() => onStrategySelect(strategy.id)}
                className={`w-full p-3 rounded-lg border transition-all text-left ${
                  selectedStrategy === strategy.id
                    ? 'studio-surface border-primary/30 studio-text'
                    : 'studio-surface border-studio-border studio-muted hover:studio-text hover:bg-studio-surface/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(strategy.status)}
                    <span className="text-sm font-medium">{strategy.name}</span>
                  </div>
                  {strategy.status === 'uploaded' && (
                    <CheckCircle className="w-4 h-4 profit-text" />
                  )}
                </div>

                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className={getStatusColor(strategy.status)}>{strategy.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tickers:</span>
                    <span>{strategy.tickers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Score:</span>
                    <span className="text-primary number-font">{strategy.score.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{strategy.created}</span>
                  </div>
                </div>

                <div className={`mt-2 text-xs px-2 py-1 rounded ${
                  strategy.status === 'uploaded'
                    ? 'bg-primary/20 text-primary'
                    : strategy.status === 'backtested'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-profit/20 profit-text'
                }`}>
                  {strategy.status === 'uploaded' && 'Ready for Backtest'}
                  {strategy.status === 'backtested' && 'Backtest Complete'}
                  {strategy.status === 'running' && 'Live Trading'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t studio-border">
        <button className="w-full px-3 py-2 text-sm btn-secondary">
          + New Strategy
        </button>
      </div>
    </div>
  );
};

export default LeftNavigation;