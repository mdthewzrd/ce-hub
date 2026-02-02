'use client';

import { useEffect } from 'react';

export default function ReviewPage() {
  useEffect(() => {
    // Redirect to the static HTML file with cache-busting
    const cacheBuster = `?v=${Date.now()}`;
    window.location.href = `/review.html${cacheBuster}`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
      <div className="text-xl">Loading review page...</div>
    </div>
  );
}
