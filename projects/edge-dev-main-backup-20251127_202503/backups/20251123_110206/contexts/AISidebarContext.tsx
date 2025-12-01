'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AISidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const AISidebarContext = createContext<AISidebarContextType | undefined>(undefined);

interface AISidebarProviderProps {
  children: ReactNode;
}

export const AISidebarProvider: React.FC<AISidebarProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const value = {
    isOpen,
    toggle,
    open,
    close,
  };

  return (
    <AISidebarContext.Provider value={value}>
      {children}
    </AISidebarContext.Provider>
  );
};

export const useAISidebar = (): AISidebarContextType => {
  const context = useContext(AISidebarContext);
  if (context === undefined) {
    throw new Error('useAISidebar must be used within an AISidebarProvider');
  }
  return context;
};