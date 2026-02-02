'use client';

import React, { useState } from 'react';
import QuizContainer from '@/components/quiz/QuizContainer';
import { QuizResponses } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function QuizPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleQuizComplete = async (responses: QuizResponses) => {
    setIsLoading(true);

    console.log('Quiz completed with responses:', responses);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('quizResponses', JSON.stringify(responses));
    }

    // Redirect to results page
    window.location.href = '/results';
  };

  return (
    <main className="min-h-screen bg-azyr-warm-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-serif font-bold text-azyr-black mb-1">
            AZYR
          </h1>
          <p className="text-sm font-sans tracking-widest text-azyr-taupe">
            VINTAGE EYEWEAR
          </p>
        </div>

        {/* Quiz Container */}
        <div className="bg-white rounded-sm border border-azyr-cream p-8 md:p-12 shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-2 border-azyr-taupe border-t-azyr-black rounded-full animate-spin mb-4"></div>
              <p className="font-serif text-azyr-charcoal">Curating your vintage picks...</p>
            </div>
          ) : (
            <QuizContainer onComplete={handleQuizComplete} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-azyr-taupe font-sans tracking-wide">
          <p>Sustainable • One-of-a-Kind • Handpicked</p>
        </div>
      </div>
    </main>
  );
}
