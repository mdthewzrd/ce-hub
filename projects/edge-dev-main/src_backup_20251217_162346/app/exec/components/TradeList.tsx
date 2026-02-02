'use client';

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff
} from 'lucide-react';

interface ExecutionTrade {
  id: string;
  symbol: string;
  entryTime: string;
  exitTime?: string;
  entryPrice: number;
  exitPrice?: number;
  shares: number;
  pnl?: number;
  entryReason: string;
  exitReason?: string;
  rPnl?: number;
  status: 'open' | 'closed';
}

interface TradeListProps {
  currentTrades: ExecutionTrade[];
  closedTrades: ExecutionTrade[];
}

type SortField = 'entryTime' | 'exitTime' | 'pnl' | 'entryPrice' | 'shares';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'open' | 'closed' | 'winners' | 'losers';

const TradeList: React.FC<TradeListProps> = ({ currentTrades, closedTrades }) => {
  const [activeTab, setActiveTab] = useState<'current' | 'closed' | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('entryTime');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());

  // Combine and filter trades
  const allTrades = useMemo(() => {
    const combined = [...currentTrades, ...closedTrades];

    let filtered = combined;

    // Apply tab filter
    if (activeTab === 'current') {
      filtered = currentTrades;
    } else if (activeTab === 'closed') {
      filtered = closedTrades;
    }

    // Apply additional filters
    switch (filter) {
      case 'open':
        filtered = filtered.filter(t => t.status === 'open');
        break;
      case 'closed':
        filtered = filtered.filter(t => t.status === 'closed');
        break;
      case 'winners':
        filtered = filtered.filter(t => (t.pnl || 0) > 0);
        break;
      case 'losers':
        filtered = filtered.filter(t => (t.pnl || 0) < 0);
        break;
    }

    return filtered;
  }, [currentTrades, closedTrades, activeTab, filter]);

  // Sort trades
  const sortedTrades = useMemo(() => {
    return [...allTrades].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'entryTime':
          aValue = new Date(a.entryTime).getTime();
          bValue = new Date(b.entryTime).getTime();
          break;
        case 'exitTime':
          aValue = a.exitTime ? new Date(a.exitTime).getTime() : 0;
          bValue = b.exitTime ? new Date(b.exitTime).getTime() : 0;
          break;
        case 'pnl':
          aValue = a.pnl || 0;
          bValue = b.pnl || 0;
          break;
        case 'entryPrice':
          aValue = a.entryPrice;
          bValue = b.entryPrice;
          break;
        case 'shares':
          aValue = a.shares;
          bValue = b.shares;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [allTrades, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleDetails = (tradeId: string) => {
    const newShowDetails = new Set(showDetails);
    if (newShowDetails.has(tradeId)) {
      newShowDetails.delete(tradeId);
    } else {
      newShowDetails.add(tradeId);
    }
    setShowDetails(newShowDetails);
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const getPnLColor = (pnl?: number) => {
    if (!pnl) return 'studio-muted';
    return pnl >= 0 ? 'profit-text' : 'loss-text';
  };

  const getStatusBadge = (trade: ExecutionTrade) => {
    if (trade.status === 'open') {
      return (
        <div className="inline-flex items-center px-2 py-1 rounded-md border border-primary text-primary bg-primary/10 text-xs">
          <Activity className="h-3 w-3 mr-1" />
          Open
        </div>
      );
    } else {
      const pnl = trade.pnl || 0;
      return (
        <div className={`inline-flex items-center px-2 py-1 rounded-md border text-xs ${
          pnl >= 0
            ? 'border-[var(--trading-profit)] text-[var(--trading-profit)] bg-[var(--trading-profit)]/10'
            : 'border-[var(--trading-loss)] text-[var(--trading-loss)] bg-[var(--trading-loss)]/10'
        }`}>
          {pnl >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
          {pnl >= 0 ? 'Profit' : 'Loss'}
        </div>
      );
    }
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="h-8 px-2 studio-muted hover:studio-text hover:studio-surface font-normal btn-ghost flex items-center"
    >
      {children}
      {sortField === field && (
        sortDirection === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
      )}
    </button>
  );

  return (
    <div className="studio-card">
      <div className="section-header">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <Activity className="section-icon text-primary" />
            <h2 className="section-title studio-text">Trade History</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="form-input text-sm px-2 py-1 min-w-[120px]"
            >
              <option value="all">All Trades</option>
              <option value="open">Open Only</option>
              <option value="closed">Closed Only</option>
              <option value="winners">Winners Only</option>
              <option value="losers">Losers Only</option>
            </select>
          </div>
        </div>
      </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 studio-surface p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 text-sm rounded-md transition-all ${
              activeTab === 'all'
                ? 'btn-primary'
                : 'studio-muted hover:studio-text hover:studio-surface'
            }`}
          >
            All ({currentTrades.length + closedTrades.length})
          </button>
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-2 text-sm rounded-md transition-all ${
              activeTab === 'current'
                ? 'btn-primary'
                : 'studio-muted hover:studio-text hover:studio-surface'
            }`}
          >
            Open ({currentTrades.length})
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`px-3 py-2 text-sm rounded-md transition-all ${
              activeTab === 'closed'
                ? 'btn-primary'
                : 'studio-muted hover:studio-text hover:studio-surface'
            }`}
          >
            Closed ({closedTrades.length})
          </button>
        </div>

        <div className="mt-6">
        {sortedTrades.length === 0 ? (
          <div className="text-center py-8 studio-muted">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg mb-2 studio-text">No trades found</div>
            <div className="text-sm">
              {activeTab === 'current' ? 'No open positions' : 'No trade history available'}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 pb-2 border-b studio-border text-sm">
              <div className="col-span-2">
                <SortButton field="entryTime">Entry Time</SortButton>
              </div>
              <div className="col-span-2">
                <SortButton field="entryPrice">Entry Price</SortButton>
              </div>
              <div className="col-span-1">
                <SortButton field="shares">Shares</SortButton>
              </div>
              <div className="col-span-2">Exit Time</div>
              <div className="col-span-1">Exit Price</div>
              <div className="col-span-1">
                <SortButton field="pnl">P&L</SortButton>
              </div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Details</div>
            </div>

            {/* Table Rows */}
            {sortedTrades.map((trade) => (
              <div key={trade.id} className="space-y-2">
                <div className="grid grid-cols-12 gap-2 py-2 hover:studio-surface rounded-lg px-2 text-sm">
                  <div className="col-span-2 studio-text">
                    {formatTime(trade.entryTime)}
                  </div>
                  <div className="col-span-2 studio-text font-medium number-font">
                    {formatCurrency(trade.entryPrice)}
                  </div>
                  <div className="col-span-1 studio-muted number-font">
                    {trade.shares.toLocaleString()}
                  </div>
                  <div className="col-span-2 studio-text">
                    {trade.exitTime ? formatTime(trade.exitTime) : '-'}
                  </div>
                  <div className="col-span-1 studio-text number-font">
                    {trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}
                  </div>
                  <div className={`col-span-1 font-medium number-font ${getPnLColor(trade.pnl)}`}>
                    {trade.pnl ? formatCurrency(trade.pnl) : '-'}
                  </div>
                  <div className="col-span-2">
                    {getStatusBadge(trade)}
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() => toggleDetails(trade.id)}
                      className="h-6 w-6 p-0 studio-muted hover:studio-text btn-ghost"
                    >
                      {showDetails.has(trade.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {showDetails.has(trade.id) && (
                  <div className="ml-4 p-3 studio-surface rounded-lg border studio-border text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="studio-muted mb-2">Trade Details</div>
                        <div className="space-y-1">
                          <div>Entry Reason: <span className="studio-text">{trade.entryReason}</span></div>
                          {trade.exitReason && (
                            <div>Exit Reason: <span className="studio-text">{trade.exitReason}</span></div>
                          )}
                          <div>Position Size: <span className="studio-text number-font">{formatCurrency(trade.entryPrice * trade.shares)}</span></div>
                          {trade.rPnl && (
                            <div>R P&L: <span className={`number-font ${getPnLColor(trade.rPnl)}`}>{trade.rPnl.toFixed(2)}R</span></div>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="studio-muted mb-2">Performance</div>
                        <div className="space-y-1">
                          {trade.exitPrice && (
                            <>
                              <div>Return:
                                <span className={`number-font ${getPnLColor(trade.pnl)}`}>
                                  {(((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2)}%
                                </span>
                              </div>
                              <div>Hold Time:
                                <span className="studio-text">
                                  {trade.exitTime
                                    ? `${Math.round((new Date(trade.exitTime).getTime() - new Date(trade.entryTime).getTime()) / (1000 * 60))} min`
                                    : 'Open'
                                  }
                                </span>
                              </div>
                            </>
                          )}
                          <div>Trade ID: <span className="studio-muted number-font text-xs">{trade.id}</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Footer */}
        {sortedTrades.length > 0 && (
          <div className="mt-4 pt-4 border-t studio-border">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="studio-muted">Total Trades</div>
                <div className="studio-text font-medium number-font">{sortedTrades.length}</div>
              </div>
              <div className="text-center">
                <div className="studio-muted">Winners</div>
                <div className="profit-text font-medium number-font">
                  {sortedTrades.filter(t => (t.pnl || 0) > 0).length}
                </div>
              </div>
              <div className="text-center">
                <div className="studio-muted">Losers</div>
                <div className="loss-text font-medium number-font">
                  {sortedTrades.filter(t => (t.pnl || 0) < 0).length}
                </div>
              </div>
              <div className="text-center">
                <div className="studio-muted">Net P&L</div>
                <div className={`font-medium number-font ${getPnLColor(sortedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))}`}>
                  {formatCurrency(sortedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </div>
  );
};

export default TradeList;