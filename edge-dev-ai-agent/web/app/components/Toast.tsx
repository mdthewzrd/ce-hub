'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps extends Toast {
  onDismiss: () => void;
}

export function Toast({ type, message, duration = 5000, onDismiss }: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration === 0) return; // Don't auto-dismiss if duration is 0

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = 100 - (elapsed / duration) * 100;
      setProgress(Math.max(0, remaining));

      if (elapsed >= duration) {
        clearInterval(interval);
        onDismiss();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-gold" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  };

  const borders = {
    success: 'border-green-500/30',
    error: 'border-red-500/30',
    info: 'border-gold/30',
    warning: 'border-yellow-500/30',
  };

  const backgrounds = {
    success: 'from-green-500/10 to-green-500/5',
    error: 'from-red-500/10 to-red-500/5',
    info: 'from-gold/10 to-gold/5',
    warning: 'from-yellow-500/10 to-yellow-500/5',
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 shadow-gold-sm animate-fade-in">
      <div className={`absolute inset-0 bg-gradient-to-br ${backgrounds[type]} opacity-50`} />
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20`} style={{
        width: `${progress}%`,
        transition: 'width 0.1s linear'
      }} />
      <div className="relative flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors duration-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

let toastId = 0;
const listeners: Set<(toasts: Toast[]) => void> = new Set();
const toasts: Toast[] = [];

export function showToast(toast: Omit<Toast, 'id'>) {
  const newToast: Toast = { ...toast, id: `toast-${toastId++}` };
  toasts.push(newToast);
  notifyListeners();
  return newToast.id;
}

export function removeToast(id: string) {
  const index = toasts.findIndex(t => t.id === id);
  if (index > -1) {
    toasts.splice(index, 1);
    notifyListeners();
  }
}

function notifyListeners() {
  listeners.forEach(listener => listener([...toasts]));
}

export function useToasts() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setLocalToasts);
    setLocalToasts([...toasts]);

    return () => {
      listeners.delete(setLocalToasts);
    };
  }, []);

  return {
    toasts: localToasts,
    show: showToast,
    remove: removeToast,
  };
}
