/**
 * AGUI CALENDAR COMPONENTS
 * Dynamic calendar interface components for Renata AI interaction
 * Enables natural language calendar operations through visual components
 */

import React, { useState, useCallback, useMemo } from 'react'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useDateRange } from '@/contexts/TraderraContext'
import { useAdvancedCalendarActions } from '@/lib/copilot-calendar-actions'
import { AguiCalendar, AguiDatePicker, AguiTradingCalendar, AguiComponentProps } from '@/types/agui'

/**
 * ENHANCED CALENDAR COMPONENT
 * Interactive calendar with trading data overlays and event highlighting
 */
export function AguiCalendarComponent({ component, onAction, onUpdate, className = '', interactive = true }: AguiComponentProps & { component: AguiCalendar }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    component.selectedDate ? parseISO(component.selectedDate) : null
  )

  // Enable CopilotKit calendar actions for dynamic interaction
  useAdvancedCalendarActions()

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    onAction?.('date-selected', {
      date: format(date, 'yyyy-MM-dd'),
      componentId: component.id
    })
  }, [component.id, onAction])

  const handleRangeSelect = useCallback((range: { start: Date; end: Date }) => {
    onAction?.('range-selected', {
      start: format(range.start, 'yyyy-MM-dd'),
      end: format(range.end, 'yyyy-MM-dd'),
      componentId: component.id
    })
  }, [component.id, onAction])

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const getDateHighlight = useCallback((date: Date) => {
    if (!component.highlightedDates) return null
    return component.highlightedDates.find(h =>
      isSameDay(parseISO(h.date), date)
    )
  }, [component.highlightedDates])

  const getDateColor = (highlight: any) => {
    if (!highlight) return ''
    switch (highlight.color) {
      case 'profit': return 'bg-green-100 text-green-800 border-green-300'
      case 'loss': return 'bg-red-100 text-red-800 border-red-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{component.title}</h3>
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          {component.tradingOverlay && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Trading View</span>
          )}
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-2 hover:bg-gray-100 rounded"
          disabled={!interactive}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <h4 className="text-lg font-medium">
          {format(currentMonth, 'MMMM yyyy')}
        </h4>

        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-2 hover:bg-gray-100 rounded"
          disabled={!interactive}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}

        {monthDays.map(date => {
          const highlight = getDateHighlight(date)
          const isSelected = selectedDate && isSameDay(date, selectedDate)

          return (
            <button
              key={date.toISOString()}
              onClick={() => interactive && handleDateSelect(date)}
              className={`
                p-2 text-sm rounded-md border transition-colors
                ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-transparent hover:bg-gray-100'}
                ${highlight ? getDateColor(highlight) : ''}
                ${!isSameMonth(date, currentMonth) ? 'text-gray-300' : 'text-gray-700'}
                ${!interactive ? 'cursor-default' : 'cursor-pointer'}
              `}
              disabled={!interactive}
              title={highlight?.label}
            >
              {format(date, 'd')}
              {highlight && (
                <div className={`w-1 h-1 rounded-full mt-1 mx-auto ${
                  highlight.type === 'earnings' ? 'bg-purple-500' :
                  highlight.type === 'options-expiry' ? 'bg-orange-500' :
                  highlight.type === 'fed-meeting' ? 'bg-red-500' :
                  'bg-blue-500'
                }`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Preset Ranges */}
      {component.presetRanges && component.presetRanges.length > 0 && (
        <div className="border-t pt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Quick Selections</h5>
          <div className="flex flex-wrap gap-2">
            {component.presetRanges.map((preset, index) => (
              <button
                key={index}
                onClick={() => onAction?.('preset-selected', { range: preset.range, componentId: component.id })}
                className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                disabled={!interactive}
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Actions */}
      {component.interactions && component.interactions.length > 0 && interactive && (
        <div className="border-t pt-4 mt-4">
          <div className="flex flex-wrap gap-2">
            {component.interactions.map((interaction, index) => (
              <button
                key={index}
                onClick={() => onAction?.(interaction.action, { componentId: component.id })}
                className="flex items-center space-x-1 text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
              >
                {interaction.icon && <span className="w-3 h-3">{interaction.icon}</span>}
                <span>{interaction.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * ENHANCED DATE PICKER COMPONENT
 * Natural language date range selection with trading patterns
 */
export function AguiDatePickerComponent({ component, onAction, onUpdate, className = '', interactive = true }: AguiComponentProps & { component: AguiDatePicker }) {
  const [naturalInput, setNaturalInput] = useState('')
  const { setCustomRange } = useDateRange()

  const handleQuickSelection = useCallback((value: string, label: string) => {
    onAction?.('quick-selection', { value, label, componentId: component.id })
  }, [component.id, onAction])

  const handleNaturalLanguageInput = useCallback(async (input: string) => {
    if (!input.trim()) return

    onAction?.('natural-language-input', {
      input: input.trim(),
      componentId: component.id
    })
    setNaturalInput('')
  }, [component.id, onAction])

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{component.title}</h3>
        <Clock className="w-5 h-5 text-gray-500" />
      </div>

      {/* Current Selection Display */}
      {component.selectedRange && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>{component.selectedRange.label}</strong>
          </div>
          <div className="text-xs text-blue-600">
            {format(parseISO(component.selectedRange.start), 'MMM d, yyyy')} - {format(parseISO(component.selectedRange.end), 'MMM d, yyyy')}
          </div>
        </div>
      )}

      {/* Natural Language Input */}
      {component.naturalLanguageInput && interactive && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Natural Language Date Selection
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              placeholder="e.g., 'Q1 2024', 'last 6 months', 'earnings season'"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageInput(naturalInput)}
            />
            <button
              onClick={() => handleNaturalLanguageInput(naturalInput)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Quick Selections */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Quick Selections</h5>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {component.quickSelections.map((selection, index) => (
            <button
              key={index}
              onClick={() => interactive && handleQuickSelection(selection.value, selection.label)}
              className={`
                p-3 text-left border rounded-lg transition-colors
                ${selection.tradingPattern
                  ? 'border-purple-200 bg-purple-50 hover:bg-purple-100'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }
                ${!interactive ? 'cursor-default opacity-60' : 'cursor-pointer'}
              `}
              disabled={!interactive}
              title={selection.description}
            >
              <div className={`font-medium text-sm ${
                selection.tradingPattern ? 'text-purple-800' : 'text-gray-800'
              }`}>
                {selection.label}
              </div>
              {selection.description && (
                <div className={`text-xs mt-1 ${
                  selection.tradingPattern ? 'text-purple-600' : 'text-gray-600'
                }`}>
                  {selection.description}
                </div>
              )}
              {selection.tradingPattern && (
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-3 h-3 text-purple-500 mr-1" />
                  <span className="text-xs text-purple-500">Trading Pattern</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Ranges */}
      {component.suggestedRanges && component.suggestedRanges.length > 0 && (
        <div className="border-t pt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Suggested for You</h5>
          <div className="space-y-2">
            {component.suggestedRanges.map((suggestion, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded border border-yellow-200">
                <div>
                  <div className="text-sm font-medium text-yellow-800">{suggestion.label}</div>
                  <div className="text-xs text-yellow-600">{suggestion.description}</div>
                </div>
                <button
                  onClick={() => interactive && handleNaturalLanguageInput(suggestion.pattern)}
                  className="text-xs px-3 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded transition-colors"
                  disabled={!interactive}
                >
                  Apply
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * TRADING CALENDAR COMPONENT
 * Advanced calendar with trading events and performance overlay
 */
export function AguiTradingCalendarComponent({ component, onAction, onUpdate, className = '', interactive = true }: AguiComponentProps & { component: AguiTradingCalendar }) {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const focusDate = parseISO(component.focusDate)

  const handleEventClick = useCallback((event: any) => {
    setSelectedEvent(event.date)
    onAction?.('event-selected', { event, componentId: component.id })
  }, [component.id, onAction])

  const handleAnalysisModeChange = useCallback((mode: string) => {
    onAction?.('analysis-mode-changed', { mode, componentId: component.id })
  }, [component.id, onAction])

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'earnings': return <TrendingUp className="w-4 h-4" />
      case 'dividend': return <CheckCircle className="w-4 h-4" />
      case 'options-expiry': return <Clock className="w-4 h-4" />
      case 'economic-data': return <AlertCircle className="w-4 h-4" />
      case 'fed-meeting': return <TrendingDown className="w-4 h-4" />
      default: return <Calendar className="w-4 h-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{component.title}</h3>
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-500">{component.timeframe}</span>
        </div>
      </div>

      {/* Analysis Mode Selector */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {['performance', 'events', 'patterns', 'correlation'].map((mode) => (
            <button
              key={mode}
              onClick={() => interactive && handleAnalysisModeChange(mode)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                component.analysisMode === mode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
              }`}
              disabled={!interactive}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Trading Events List */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-700 mb-3">Upcoming Trading Events</h5>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {component.tradingEvents.map((event, index) => (
            <div
              key={index}
              onClick={() => interactive && handleEventClick(event)}
              className={`
                flex items-center justify-between p-3 border rounded-lg transition-colors
                ${selectedEvent === event.date ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
                ${!interactive ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-1 rounded ${getImpactColor(event.impact)}`}>
                  {getEventTypeIcon(event.type)}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    {event.symbol ? `${event.symbol} - ` : ''}{event.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(parseISO(event.date), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded ${getImpactColor(event.impact)}`}>
                  {event.impact}
                </span>
                {event.confirmed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Overlay */}
      {component.performanceOverlay && component.analysisMode === 'performance' && (
        <div className="border-t pt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Performance Summary</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {component.performanceOverlay.slice(0, 3).map((perf, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500">
                  {format(parseISO(perf.date), 'MMM d')}
                </div>
                <div className={`font-medium ${perf.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${perf.pnl.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">
                  {perf.trades} trades • {(perf.winRate * 100).toFixed(1)}% win rate
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Features */}
      {component.interactiveFeatures && interactive && (
        <div className="border-t pt-4 mt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Available Actions</h5>
          <div className="flex flex-wrap gap-2">
            {component.interactiveFeatures.filter(f => f.enabled).map((feature, index) => (
              <button
                key={index}
                onClick={() => onAction?.(feature.feature, { componentId: component.id })}
                className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors"
                title={feature.description}
              >
                {feature.feature.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}