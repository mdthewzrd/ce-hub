'use client';

import { useEffect, useState } from 'react';

export default function ReviewPage() {
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch the HTML content
    fetch('/verification/SIMPLE_REVIEW.html')
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading review page...</div>
      </div>
    );
  }

  if (!htmlContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Failed to load review page</div>
      </div>
    );
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
  );
}
