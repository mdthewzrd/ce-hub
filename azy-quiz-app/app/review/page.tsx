'use client';

import { useEffect, useState } from 'react';

export default function ReviewPage() {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch the HTML content
    fetch('/review.html')
      .then(res => res.text())
      .then(html => {
        setHtmlContent(html);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load review page:', err);
        setIsLoading(false);
      });
  }, []);

  // Reference modal functions - added here because scripts in dangerouslySetInnerHTML don't execute
  useEffect(() => {
    (window as any).openReferenceModal = () => {
      const modal = document.getElementById('reference-modal');
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    };

    (window as any).closeReferenceModal = () => {
      const modal = document.getElementById('reference-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    };

    // Close modal on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        ((window as any).closeReferenceModal)();
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Close modal when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const modal = document.getElementById('reference-modal');
      if (modal && e.target === modal) {
        ((window as any).closeReferenceModal)();
      }
    };
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-xl">Loading review page...</div>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-xl text-red-500">Failed to load review page</div>
      </div>
    );
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
