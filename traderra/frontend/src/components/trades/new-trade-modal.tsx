'use client'

import { useState } from 'react'
import { X, Calendar, DollarSign, TrendingUp, TrendingDown, Clock, Target, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewTradeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (trade: any) => void
}

export function NewTradeModal({ isOpen, onClose, onSave }: NewTradeModalProps) {
  const [formData, setFormData] = useState({
    symbol: '',
    side: 'Long' as 'Long' | 'Short',
    quantity: '',
    entryPrice: '',
    exitPrice: '',
    entryTime: '',
    exitTime: '',
    strategy: '',
    notes: '',
    tags: '',
    stopLoss: '',
    takeProfit: '',
    commission: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.symbol.trim()) newErrors.symbol = 'Symbol is required'
    if (!formData.quantity || Number(formData.quantity) <= 0) newErrors.quantity = 'Valid quantity is required'
    if (!formData.entryPrice || Number(formData.entryPrice) <= 0) newErrors.entryPrice = 'Valid entry price is required'
    if (!formData.exitPrice || Number(formData.exitPrice) <= 0) newErrors.exitPrice = 'Valid exit price is required'
    if (!formData.entryTime) newErrors.entryTime = 'Entry time is required'
    if (!formData.exitTime) newErrors.exitTime = 'Exit time is required'
    if (!formData.strategy.trim()) newErrors.strategy = 'Strategy is required'

    // Validate exit time is after entry time
    if (formData.entryTime && formData.exitTime && formData.exitTime <= formData.entryTime) {
      newErrors.exitTime = 'Exit time must be after entry time'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateMetrics = () => {
    const quantity = Number(formData.quantity) || 0
    const entryPrice = Number(formData.entryPrice) || 0
    const exitPrice = Number(formData.exitPrice) || 0
    const commission = Number(formData.commission) || 0

    const grossPnL = formData.side === 'Long'
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity

    const netPnL = grossPnL - commission
    const pnlPercent = entryPrice > 0 ? (grossPnL / (entryPrice * quantity)) * 100 : 0
    const positionValue = entryPrice * quantity

    return { grossPnL, netPnL, pnlPercent, positionValue }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    const metrics = calculateMetrics()

    // Calculate duration
    const entryDateTime = new Date(formData.entryTime)
    const exitDateTime = new Date(formData.exitTime)
    const durationMs = exitDateTime.getTime() - entryDateTime.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)
    const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    const newTrade = {
      id: `trade_${Date.now()}`,
      date: formData.entryTime.split('T')[0],
      symbol: formData.symbol.toUpperCase(),
      side: formData.side,
      quantity: Number(formData.quantity),
      entryPrice: Number(formData.entryPrice),
      exitPrice: Number(formData.exitPrice),
      pnl: metrics.netPnL,
      pnlPercent: metrics.pnlPercent,
      commission: Number(formData.commission) || 0,
      duration,
      strategy: formData.strategy,
      notes: formData.notes,
      stopLoss: Number(formData.stopLoss) || null,
      takeProfit: Number(formData.takeProfit) || null,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      entryTime: formData.entryTime,
      exitTime: formData.exitTime,
      createdAt: new Date().toISOString(),
    }

    onSave(newTrade)
    onClose()

    // Reset form
    setFormData({
      symbol: '',
      side: 'Long',
      quantity: '',
      entryPrice: '',
      exitPrice: '',
      entryTime: '',
      exitTime: '',
      strategy: '',
      notes: '',
      tags: '',
      stopLoss: '',
      takeProfit: '',
      commission: '',
    })
    setErrors({})
  }

  const { grossPnL, netPnL, pnlPercent, positionValue } = calculateMetrics()

  const strategies = [
    'Momentum', 'Scalp', 'Reversal', 'Swing', 'Gap Fill', 'Range',
    'Breakout', 'FOMO', 'News', 'Fade', 'Support/Resistance'
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 studio-surface rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-xl font-semibold studio-text">Add New Trade</h2>
            <p className="text-sm studio-muted">Enter your trade details below</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            <X className="h-5 w-5 studio-muted" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {/* Trade Basics */}
            <div>
              <h3 className="text-lg font-semibold studio-text mb-4">Trade Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                    className={cn(
                      'w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary uppercase',
                      errors.symbol && 'border-red-500'
                    )}
                    placeholder="AAPL"
                  />
                  {errors.symbol && <p className="text-red-400 text-xs mt-1">{errors.symbol}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Side *
                  </label>
                  <select
                    value={formData.side}
                    onChange={(e) => handleInputChange('side', e.target.value)}
                    className="w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="Long">Long</option>
                    <option value="Short">Short</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    className={cn(
                      'w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary',
                      errors.quantity && 'border-red-500'
                    )}
                    placeholder="100"
                    min="1"
                  />
                  {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity}</p>}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-semibold studio-text mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Entry Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entryPrice}
                    onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                    className={cn(
                      'w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary',
                      errors.entryPrice && 'border-red-500'
                    )}
                    placeholder="150.00"
                  />
                  {errors.entryPrice && <p className="text-red-400 text-xs mt-1">{errors.entryPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Exit Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.exitPrice}
                    onChange={(e) => handleInputChange('exitPrice', e.target.value)}
                    className={cn(
                      'w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary',
                      errors.exitPrice && 'border-red-500'
                    )}
                    placeholder="155.00"
                  />
                  {errors.exitPrice && <p className="text-red-400 text-xs mt-1">{errors.exitPrice}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Stop Loss
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.stopLoss}
                    onChange={(e) => handleInputChange('stopLoss', e.target.value)}
                    className="w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="145.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Take Profit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.takeProfit}
                    onChange={(e) => handleInputChange('takeProfit', e.target.value)}
                    className="w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="160.00"
                  />
                </div>
              </div>
            </div>

            {/* Timing */}
            <div>
              <h3 className="text-lg font-semibold studio-text mb-4">Timing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Entry Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.entryTime}
                    onChange={(e) => handleInputChange('entryTime', e.target.value)}
                    className={cn(
                      'w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary',
                      errors.entryTime && 'border-red-500'
                    )}
                  />
                  {errors.entryTime && <p className="text-red-400 text-xs mt-1">{errors.entryTime}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Exit Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.exitTime}
                    onChange={(e) => handleInputChange('exitTime', e.target.value)}
                    className={cn(
                      'w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary',
                      errors.exitTime && 'border-red-500'
                    )}
                  />
                  {errors.exitTime && <p className="text-red-400 text-xs mt-1">{errors.exitTime}</p>}
                </div>
              </div>
            </div>

            {/* Strategy & Notes */}
            <div>
              <h3 className="text-lg font-semibold studio-text mb-4">Strategy & Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Strategy *
                  </label>
                  <select
                    value={formData.strategy}
                    onChange={(e) => handleInputChange('strategy', e.target.value)}
                    className={cn(
                      'w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary',
                      errors.strategy && 'border-red-500'
                    )}
                  >
                    <option value="">Select Strategy</option>
                    {strategies.map(strategy => (
                      <option key={strategy} value={strategy}>{strategy}</option>
                    ))}
                  </select>
                  {errors.strategy && <p className="text-red-400 text-xs mt-1">{errors.strategy}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium studio-text mb-2">
                    Commission
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commission}
                    onChange={(e) => handleInputChange('commission', e.target.value)}
                    className="w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="0.50"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium studio-text mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className="w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="earnings, gap-up, momentum"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium studio-text mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full p-3 studio-surface studio-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                  placeholder="Trade reasoning, setup details, market conditions..."
                />
              </div>
            </div>

            {/* Live Metrics Preview */}
            {(formData.quantity && formData.entryPrice && formData.exitPrice) && (
              <div className="studio-surface rounded-lg p-4">
                <h3 className="text-lg font-semibold studio-text mb-4">Trade Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm studio-muted">Position Value</div>
                    <div className="text-lg font-semibold studio-text">${positionValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-sm studio-muted">Gross P&L</div>
                    <div className={cn(
                      'text-lg font-semibold',
                      grossPnL >= 0 ? 'text-trading-profit' : 'text-trading-loss'
                    )}>
                      ${grossPnL.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm studio-muted">Net P&L</div>
                    <div className={cn(
                      'text-lg font-semibold',
                      netPnL >= 0 ? 'text-trading-profit' : 'text-trading-loss'
                    )}>
                      ${netPnL.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm studio-muted">Return %</div>
                    <div className={cn(
                      'text-lg font-semibold',
                      pnlPercent >= 0 ? 'text-trading-profit' : 'text-trading-loss'
                    )}>
                      {pnlPercent > 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="text-sm studio-muted">
            * Required fields
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn-primary"
            >
              Add Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}