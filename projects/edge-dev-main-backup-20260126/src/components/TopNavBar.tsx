'use client';

import React from 'react';
import { BarChart3, Github, FileText } from 'lucide-react';

/**
 * Top Navigation Bar - Site-wide header
 * Traderra-styled navigation matching 6565 platform
 */
export const TopNavBar: React.FC = () => {
  return (
    <nav className="w-full border-b border-[#1a1a1a] bg-[#111111]">
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-[#D4AF37] flex-shrink-0" />
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <span className="text-base sm:text-lg font-bold studio-text truncate">Edge-dev</span>
            <span className="hidden sm:inline text-xs px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 whitespace-nowrap">
              EXEC
            </span>
            <span className="sm:hidden text-xs px-1 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              E
            </span>
          </div>
        </div>

        {/* Center - Mode Indicator (Hidden on small screens) */}
        <div className="hidden md:flex items-center gap-2 text-sm studio-muted">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-black border border-[#1a1a1a]">
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
            <span className="whitespace-nowrap">Scanner Platform</span>
          </div>
        </div>

        {/* Right - Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* G Button - GitHub */}
          <button
            onClick={() => window.open('https://github.com', '_blank')}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333333] hover:border-[#D4AF37] transition-all duration-200 group"
            title="GitHub"
          >
            <Github className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
          </button>

          {/* N Button - Notion */}
          <button
            onClick={() => window.open('https://notion.so', '_blank')}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333333] hover:border-[#D4AF37] transition-all duration-200 group"
            title="Notion"
          >
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
          </button>

          {/* Status indicator for mobile */}
          <div className="md:hidden">
            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse"></div>
          </div>
          <div className="text-xs studio-muted">
            <span className="hidden sm:inline">Port: </span>
            <span className="font-mono text-[#D4AF37]">5657</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavBar;
