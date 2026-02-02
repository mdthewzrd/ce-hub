'use client';

import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayoutWithAI: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full professional-container">
      {/* Main Content Area */}
      <div className="flex-1 w-full">
        {children}
      </div>
    </div>
  );
};

export default MainLayoutWithAI;