'use client';

import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-serif text-azyr-taupe">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-sm font-serif text-azyr-black">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full bg-azyr-cream rounded-sm h-1 overflow-hidden">
        <div
          className="bg-azyr-black h-full transition-all duration-500 ease-out relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 animate-elegantShimmer"></div>
        </div>
      </div>
    </div>
  );
}
