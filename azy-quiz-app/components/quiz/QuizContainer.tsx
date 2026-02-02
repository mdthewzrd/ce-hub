'use client';

import React, { useState } from 'react';
import ProgressBar from './ProgressBar';
import OptionTile from './OptionTile';
import { QUIZ_CONFIG, QuizResponses, canProceed, getSelectionSummary } from '@/lib/types';

interface QuizContainerProps {
  onComplete: (responses: QuizResponses) => void;
}

export default function QuizContainer({ onComplete }: QuizContainerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<QuizResponses>({});
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const step = QUIZ_CONFIG[currentStep];
  const isLastStep = currentStep === QUIZ_CONFIG.length - 1;
  const progress = ((currentStep + 1) / QUIZ_CONFIG.length) * 100;

  const getCurrentResponse = () => {
    const stepId = step.id as keyof QuizResponses;
    return responses[stepId];
  };

  const handleSelect = (value: string) => {
    const stepId = step.id as keyof QuizResponses;

    if (step.type === 'single') {
      setResponses(prev => ({ ...prev, [stepId]: value }));
    } else {
      // Multi-select
      const current = (responses[stepId] as string[]) || [];
      const exists = current.includes(value);

      if (exists) {
        setResponses(prev => ({
          ...prev,
          [stepId]: current.filter(v => v !== value)
        }));
      } else {
        setResponses(prev => ({
          ...prev,
          [stepId]: [...current, value]
        }));
      }
    }
  };

  const isSelected = (value: string) => {
    const stepId = step.id as keyof QuizResponses;
    const response = responses[stepId];

    if (step.type === 'single') {
      return response === value;
    } else {
      return (response as string[])?.includes(value) || false;
    }
  };

  const canGoNext = () => {
    const response = getCurrentResponse();
    return canProceed(step, response);
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(responses);
    } else {
      setDirection('forward');
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (isLastStep) {
      onComplete(responses);
    } else {
      setDirection('forward');
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold text-azyr-black mb-2">
          Find Your Vintage Frame
        </h1>
        <p className="font-sans text-azyr-taupe font-light">
          Answer 5 questions to discover your perfect match
        </p>
      </div>

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} totalSteps={QUIZ_CONFIG.length} />

      {/* Selection Summary */}
      {currentStep > 0 && (
        <div className="mb-6 px-4 py-2 bg-azyr-cream inline-block">
          <span className="text-sm font-serif text-azyr-black">
            {getSelectionSummary(responses)}
          </span>
        </div>
      )}

      {/* Question */}
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-semibold text-azyr-black mb-2">
          {step.question}
        </h2>
        {step.subtitle && (
          <p className="font-sans text-azyr-taupe font-light">{step.subtitle}</p>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {step.options.map(option => (
          <OptionTile
            key={option.value}
            option={option}
            selected={isSelected(option.value)}
            onClick={() => handleSelect(option.value)}
            type={step.type}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`
            px-6 py-3 font-sans text-sm tracking-wide transition-all
            ${currentStep === 0
              ? 'text-azyr-taupe cursor-not-allowed'
              : 'text-azyr-charcoal hover:text-azyr-black'
            }
          `}
        >
          ← Back
        </button>

        <div className="flex gap-3">
          {!step.required && (
            <button
              onClick={handleSkip}
              className="px-6 py-3 font-sans text-sm tracking-wide text-azyr-taupe hover:text-azyr-black transition-all"
            >
              Skip →
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={!canGoNext()}
            className={`
              px-8 py-3 font-sans text-sm tracking-wide rounded-sm transition-all
              ${canGoNext()
                ? 'bg-azyr-black text-white hover:bg-azyr-charcoal'
                : 'bg-azyr-taupe/20 text-azyr-taupe cursor-not-allowed'
              }
            `}
          >
            {isLastStep ? 'See My Picks' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
