'use client';

import React from 'react';
import { CopilotKit } from '@copilotkit/react-core';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayoutWithAI: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <div className="flex min-h-screen w-full professional-container">
        {/* Main Content Area */}
        <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    </CopilotKit>
  );
};

export default MainLayoutWithAI;