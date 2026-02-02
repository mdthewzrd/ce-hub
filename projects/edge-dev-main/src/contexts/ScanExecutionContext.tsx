/**
 * Global Scan Execution Context
 *
 * Provides persistent scan execution state that continues running
 * even when navigating away from the page
 */

'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Play, Square, CheckCircle, AlertCircle, Loader2, Activity } from 'lucide-react';

// Types
export interface ScanStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  progress: number;
  duration?: number;
  signals?: number;
}

export interface ScanExecution {
  id: string;
  project_id?: string;
  scanner_name: string;
  status: 'initializing' | 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  updated_at: string;
  stages: ScanStage[];
  total_signals?: number;
  execution_time?: number;
  error_message?: string;
}

interface ScanExecutionState {
  executions: Record<string, ScanExecution>;
  activeExecution: string | null;
  globalProgressVisible: boolean;
}

// Action types
type ScanAction =
  | { type: 'START_EXECUTION'; payload: ScanExecution }
  | { type: 'UPDATE_EXECUTION'; payload: { id: string; updates: Partial<ScanExecution> } }
  | { type: 'UPDATE_STAGE'; payload: { executionId: string; stageId: string; updates: Partial<ScanStage> } }
  | { type: 'COMPLETE_EXECUTION'; payload: { id: string; results: any } }
  | { type: 'FAIL_EXECUTION'; payload: { id: string; error: string } }
  | { type: 'CANCEL_EXECUTION'; payload: { id: string } }
  | { type: 'SET_GLOBAL_PROGRESS_VISIBLE'; payload: boolean }
  | { type: 'CLEAR_EXECUTION'; payload: string };

// Reducer
function scanExecutionReducer(state: ScanExecutionState, action: ScanAction): ScanExecutionState {
  switch (action.type) {
    case 'START_EXECUTION':
      // Validate payload to prevent undefined errors
      if (!action.payload || !action.payload.id) {
        console.error('START_EXECUTION: Invalid payload', action.payload);
        return state;
      }
      return {
        ...state,
        executions: {
          ...state.executions,
          [action.payload.id]: action.payload
        },
        activeExecution: action.payload.id
      };

    case 'UPDATE_EXECUTION':
      // Validate payload to prevent undefined errors
      if (!action.payload || !action.payload.id) {
        console.error('UPDATE_EXECUTION: Invalid payload', action.payload);
        return state;
      }
      return {
        ...state,
        executions: {
          ...state.executions,
          [action.payload.id]: {
            ...state.executions[action.payload.id],
            ...action.payload.updates,
            updated_at: new Date().toISOString()
          }
        }
      };

    case 'UPDATE_STAGE':
      // Validate payload to prevent undefined errors
      if (!action.payload || !action.payload.executionId || !action.payload.stageId) {
        console.error('UPDATE_STAGE: Invalid payload', action.payload);
        return state;
      }
      const { executionId, stageId, updates } = action.payload;
      return {
        ...state,
        executions: {
          ...state.executions,
          [executionId]: {
            ...state.executions[executionId],
            stages: state.executions[executionId].stages.map(stage =>
              stage.id === stageId ? { ...stage, ...updates } : stage
            ),
            updated_at: new Date().toISOString()
          }
        }
      };

    case 'COMPLETE_EXECUTION':
      // Validate payload to prevent undefined errors
      if (!action.payload || !action.payload.id) {
        console.error('COMPLETE_EXECUTION: Invalid payload', action.payload);
        return state;
      }
      return {
        ...state,
        executions: {
          ...state.executions,
          [action.payload.id]: {
            ...state.executions[action.payload.id],
            status: 'completed',
            updated_at: new Date().toISOString(),
            ...action.payload.results
          }
        }
      };

    case 'FAIL_EXECUTION':
      // Validate payload to prevent undefined errors
      if (!action.payload || !action.payload.id) {
        console.error('FAIL_EXECUTION: Invalid payload', action.payload);
        return state;
      }
      return {
        ...state,
        executions: {
          ...state.executions,
          [action.payload.id]: {
            ...state.executions[action.payload.id],
            status: 'failed',
            error_message: action.payload.error,
            updated_at: new Date().toISOString()
          }
        }
      };

    case 'CANCEL_EXECUTION':
      // Validate payload to prevent undefined errors
      if (!action.payload || !action.payload.id) {
        console.error('CANCEL_EXECUTION: Invalid payload', action.payload);
        return state;
      }
      return {
        ...state,
        executions: {
          ...state.executions,
          [action.payload.id]: {
            ...state.executions[action.payload.id],
            status: 'cancelled',
            updated_at: new Date().toISOString()
          }
        },
        activeExecution: state.activeExecution === action.payload.id ? null : state.activeExecution
      };

    case 'SET_GLOBAL_PROGRESS_VISIBLE':
      return {
        ...state,
        globalProgressVisible: action.payload
      };

    case 'CLEAR_EXECUTION':
      // Validate payload to prevent undefined errors
      if (!action.payload) {
        console.error('CLEAR_EXECUTION: Invalid payload', action.payload);
        return state;
      }
      const newExecutions = { ...state.executions };
      delete newExecutions[action.payload];
      return {
        ...state,
        executions: newExecutions,
        activeExecution: state.activeExecution === action.payload ? null : state.activeExecution
      };

    default:
      return state;
  }
}

// Context
const ScanExecutionContext = createContext<{
  state: ScanExecutionState;
  startExecution: (execution: Omit<ScanExecution, 'started_at' | 'updated_at'>) => void;
  updateExecution: (id: string, updates: Partial<ScanExecution>) => void;
  updateStage: (executionId: string, stageId: string, updates: Partial<ScanStage>) => void;
  completeExecution: (id: string, results: any) => void;
  failExecution: (id: string, error: string) => void;
  cancelExecution: (id: string) => void;
  clearExecution: (id: string) => void;
  setGlobalProgressVisible: (visible: boolean) => void;
} | null>(null);

// Provider component
export function ScanExecutionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(scanExecutionReducer, {
    executions: {},
    activeExecution: null,
    globalProgressVisible: false
  });

  // Load executions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('scan_executions');
      if (stored) {
        const parsedExecutions = JSON.parse(stored);
        const executionValues = Object.values(parsedExecutions) as ScanExecution[];
        if (executionValues.length > 0 && executionValues[0]) {
          dispatch({
            type: 'START_EXECUTION',
            payload: executionValues[0] // Load first execution as active
          });
        }
      }
    } catch (error) {
      console.error('Failed to load scan executions:', error);
    }
  }, []);

  // Save executions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('scan_executions', JSON.stringify(state.executions));
    } catch (error) {
      console.error('Failed to save scan executions:', error);
    }
  }, [state.executions]);

  // Actions
  const startExecution = (execution: Omit<ScanExecution, 'started_at' | 'updated_at'>) => {
    const fullExecution: ScanExecution = {
      ...execution,
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    dispatch({ type: 'START_EXECUTION', payload: fullExecution });
    dispatch({ type: 'SET_GLOBAL_PROGRESS_VISIBLE', payload: true });
  };

  const updateExecution = (id: string, updates: Partial<ScanExecution>) => {
    dispatch({ type: 'UPDATE_EXECUTION', payload: { id, updates } });
  };

  const updateStage = (executionId: string, stageId: string, updates: Partial<ScanStage>) => {
    dispatch({ type: 'UPDATE_STAGE', payload: { executionId, stageId, updates } });
  };

  const completeExecution = (id: string, results: any) => {
    dispatch({ type: 'COMPLETE_EXECUTION', payload: { id, results } });
  };

  const failExecution = (id: string, error: string) => {
    dispatch({ type: 'FAIL_EXECUTION', payload: { id, error } });
  };

  const cancelExecution = (id: string) => {
    dispatch({ type: 'CANCEL_EXECUTION', payload: { id } });
  };

  const clearExecution = (id: string) => {
    dispatch({ type: 'CLEAR_EXECUTION', payload: id });
  };

  const setGlobalProgressVisible = (visible: boolean) => {
    dispatch({ type: 'SET_GLOBAL_PROGRESS_VISIBLE', payload: visible });
  };

  const value = {
    state,
    startExecution,
    updateExecution,
    updateStage,
    completeExecution,
    failExecution,
    cancelExecution,
    clearExecution,
    setGlobalProgressVisible
  };

  return (
    <ScanExecutionContext.Provider value={value}>
      {children}
    </ScanExecutionContext.Provider>
  );
}

// Hook
export function useScanExecution() {
  const context = useContext(ScanExecutionContext);
  if (!context) {
    // Fallback for when context is not available
    console.warn('useScanExecution must be used within ScanExecutionProvider - using fallback');
    return {
      state: { executions: {}, activeExecution: null, globalProgressVisible: false },
      startExecution: () => {},
      updateExecution: () => {},
      updateStage: () => {},
      completeExecution: () => {},
      failExecution: () => {},
      cancelExecution: () => {},
      clearExecution: () => {},
      setGlobalProgressVisible: () => {}
    };
  }
  return context;
}

// Default stages for backside scanner
export const DEFAULT_SCAN_STAGES: Omit<ScanStage, 'id' | 'status'>[] = [
  {
    name: 'Initializing Scanner',
    message: 'Setting up scanner parameters and market universe...',
    progress: 0
  },
  {
    name: 'Fetching Market Data',
    message: 'Retrieving market universe data...',
    progress: 10
  },
  {
    name: 'Applying Smart Filters',
    message: 'Filtering universe with temporal analysis...',
    progress: 30
  },
  {
    name: 'Pattern Detection',
    message: 'Running backside pattern analysis...',
    progress: 60
  },
  {
    name: 'Generating Signals',
    message: 'Processing final signal results...',
    progress: 90
  },
  {
    name: 'Complete',
    message: 'Scan execution finished successfully',
    progress: 100
  }
];