'use client';

import { useEffect } from 'react';

export default function ReviewPage() {
  useEffect(() => {
    // Redirect to the static HTML file
    window.location.href = '/review.html';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
      <div className="text-xl">Loading review page...</div>
    </div>
  );
}
