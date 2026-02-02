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

        // After HTML is loaded, extract and execute the script
        setTimeout(() => {
          initializeReviewFunctions();
        }, 100);
      })
      .catch(err => {
        console.error('Failed to load review page:', err);
        setIsLoading(false);
      });
  }, []);

  // Initialize all review page functions globally
  const initializeReviewFunctions = () => {
    const win = window as any;

    // Extract data from HTML by parsing the script content
    const scriptElements = document.querySelectorAll('script');
    scriptElements.forEach(scriptEl => {
      const content = scriptEl.textContent;
      if (content && (content.includes('productTags[') || content.includes('productImages['))) {
        try {
          // Execute in a controlled scope to extract data
          const productTags: any = {};
          const productImages: any = {};
          const reviewedProducts = new Set();
          let pendingTags: any = {};

          // Create a function with our context
          const extractor = new Function(
            'productTags', 'productImages', 'reviewedProducts', 'pendingTags',
            content + '\nreturn { productTags, productImages, reviewedProducts, pendingTags };'
          );

          const result = extractor(productTags, productImages, reviewedProducts, pendingTags);

          // Store on window
          win.productTags = result.productTags || productTags;
          win.productImages = result.productImages || productImages;
          win.reviewedProducts = result.reviewedProducts || reviewedProducts;
          win.pendingTags = result.pendingTags || pendingTags;

          console.log('Extracted data:', {
            tagsCount: Object.keys(win.productTags).length,
            imagesCount: Object.keys(win.productImages).length
          });
        } catch (e) {
          console.error('Failed to extract data from script:', e);
        }
      }
    });

    // Reference modal functions
    win.openReferenceModal = () => {
      const modal = document.getElementById('reference-modal');
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    };

    win.closeReferenceModal = () => {
      const modal = document.getElementById('reference-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    };

    // Tagging functions
    win.toggleSingle = (handle: string, category: string, value: string) => {
      const productTags = win.productTags || {};
      const pendingTags = win.pendingTags || {};

      pendingTags[handle] = pendingTags[handle] || {};
      const currentSaved = productTags[handle]?.[category];
      const currentPending = pendingTags[handle][category];

      if (currentPending === value) {
        delete pendingTags[handle][category];
      } else {
        pendingTags[handle][category] = value;
      }

      win.updateUI?.(handle, category);
      win.showSaveButton?.(handle);
    };

    win.toggleMultiple = (handle: string, category: string, value: string) => {
      const productTags = win.productTags || {};
      const pendingTags = win.pendingTags || {};

      pendingTags[handle] = pendingTags[handle] || {};
      if (!pendingTags[handle][category]) {
        const saved = productTags[handle]?.[category] || [];
        pendingTags[handle][category] = [...saved];
      }

      const arr = pendingTags[handle][category];
      const index = arr.indexOf(value);

      if (index > -1) {
        arr.splice(index, 1);
        if (arr.length === 0) {
          delete pendingTags[handle][category];
        }
      } else {
        arr.push(value);
      }

      win.updateUI?.(handle, category);
      win.showSaveButton?.(handle);
    };

    win.showSaveButton = (handle: string) => {
      const pendingTags = win.pendingTags || {};
      const saveSection = document.getElementById(`save-section-${handle}`);
      if (saveSection && Object.keys(pendingTags[handle] || {}).length > 0) {
        saveSection.classList.add('show');
      }
    };

    win.saveChanges = async (handle: string) => {
      const productTags = win.productTags || {};
      const pendingTags = win.pendingTags || {};

      if (pendingTags[handle]) {
        Object.keys(pendingTags[handle]).forEach(category => {
          const value = pendingTags[handle][category];
          if (Array.isArray(value)) {
            if (value.length === 0) {
              delete productTags[handle]?.[category];
            } else {
              productTags[handle] = productTags[handle] || {};
              productTags[handle][category] = value;
            }
          } else {
            productTags[handle] = productTags[handle] || {};
            productTags[handle][category] = value;
          }
        });

        delete pendingTags[handle];

        const saveSection = document.getElementById(`save-section-${handle}`);
        if (saveSection) saveSection.classList.remove('show');

        ['style', 'material', 'face_shapes', 'use_cases', 'lens_types'].forEach(cat => {
          win.updateUI?.(handle, cat);
        });

        win.updateSavedCount?.();
        localStorage.setItem('azyrProductTags', JSON.stringify(productTags));

        // Sync to cloud
        try {
          await fetch('/api/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productTags)
          });
        } catch (e) {
          console.error('Failed to sync:', e);
        }

        console.log(`Saved changes for ${handle}`);
      }
    };

    win.updateUI = (handle: string, category: string) => {
      const productTags = win.productTags || {};
      const pendingTags = win.pendingTags || {};

      if (category === 'face_shapes' || category === 'use_cases' || category === 'lens_types') {
        const container = document.querySelector(`[data-handle="${handle}"] #${category.replace('_', '-')}-options-${handle}`);
        if (!container) return;

        const buttons = container.querySelectorAll('.option-btn');
        const savedValues = productTags[handle]?.[category] || [];
        const pendingValues = pendingTags[handle]?.[category] || savedValues;

        buttons.forEach(btn => {
          const val = btn.getAttribute('data-value');
          btn.classList.remove('selected', 'pending');

          if (pendingValues.includes(val)) {
            btn.classList.add('pending');
          } else if (savedValues.includes(val)) {
            btn.classList.add('selected');
          }
        });
      } else {
        const container = document.querySelector(`[data-handle="${handle}"] #${category.replace('_', '-')}-options-${handle}`);
        if (!container) return;

        const buttons = container.querySelectorAll('.option-btn');
        const savedValue = productTags[handle]?.[category];
        const pendingValue = pendingTags[handle]?.[category];

        buttons.forEach(btn => {
          const val = btn.getAttribute('data-value');
          btn.classList.remove('selected', 'pending');

          if (pendingValue === val) {
            btn.classList.add('pending');
          } else if (savedValue === val) {
            btn.classList.add('selected');
          }
        });
      }
    };

    win.updateSavedCount = () => {
      const productTags = win.productTags || {};
      const savedCount = Object.keys(productTags).length;
      const countEl = document.getElementById('saved-count');
      if (countEl) countEl.textContent = savedCount;
    };

    // Custom input functions
    win.showCustomInput = (handle: string) => {
      const el = document.getElementById(`custom-input-${handle}`);
      if (el) el.classList.add('show');
      const input = document.getElementById(`custom-text-${handle}`) as HTMLInputElement;
      if (input) input.focus();
    };

    win.hideCustomInput = (handle: string) => {
      const el = document.getElementById(`custom-input-${handle}`);
      if (el) el.classList.remove('show');
      const input = document.getElementById(`custom-text-${handle}`) as HTMLInputElement;
      if (input) input.value = '';
    };

    win.saveCustom = (handle: string) => {
      const input = document.getElementById(`custom-text-${handle}`) as HTMLInputElement;
      if (!input) return;
      const value = input.value.trim();
      if (value) {
        const pendingTags = win.pendingTags || {};
        pendingTags[handle] = pendingTags[handle] || {};
        pendingTags[handle]['style'] = value;
        win.updateUI?.(handle, 'style');
        win.showSaveButton?.(handle);
        win.hideCustomInput?.(handle);
      }
    };

    win.showCustomLensInput = (handle: string) => {
      const el = document.getElementById(`custom-lens-section-${handle}`);
      if (el) el.classList.add('show');
      const input = document.getElementById(`custom-lens-input-${handle}`) as HTMLInputElement;
      if (input) input.focus();
    };

    win.cancelCustomLens = (handle: string) => {
      const el = document.getElementById(`custom-lens-section-${handle}`);
      if (el) el.classList.remove('show');
      const input = document.getElementById(`custom-lens-input-${handle}`) as HTMLInputElement;
      if (input) input.value = '';
    };

    win.saveCustomLens = (handle: string) => {
      const input = document.getElementById(`custom-lens-input-${handle}`) as HTMLInputElement;
      if (!input) return;
      const value = input.value.trim();
      if (value) {
        const pendingTags = win.pendingTags || {};
        pendingTags[handle] = pendingTags[handle] || {};
        if (!pendingTags[handle]['lens_types']) {
          pendingTags[handle]['lens_types'] = [];
        }
        if (!pendingTags[handle]['lens_types'].includes(value)) {
          pendingTags[handle]['lens_types'].push(value);
        }
        win.updateUI?.(handle, 'lens_types');
        win.showSaveButton?.(handle);
        win.cancelCustomLens?.(handle);
      }
    };

    // Mark as reviewed
    win.markReviewed = (handle: string) => {
      const reviewedProducts = win.reviewedProducts || (win.reviewedProducts = new Set());
      const card = document.querySelector(`[data-handle="${handle}"]`);
      if (card) {
        card.setAttribute('data-reviewed', 'yes');
        card.setAttribute('style', 'opacity: 0.5');
        reviewedProducts.add(handle);

        const nextCard = document.querySelector('.product-card:not([data-reviewed="yes"])');
        if (nextCard) {
          nextCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const reviewedCount = document.getElementById('reviewed-count');
        const remainingCount = document.getElementById('remaining-count');
        if (reviewedCount) reviewedCount.textContent = reviewedProducts.size;
        if (remainingCount) {
          remainingCount.textContent = document.querySelectorAll('.product-card:not([data-reviewed="yes"])').length;
        }
      }
    };

    // Filter and sort
    win.filterProducts = (filter: string) => {
      document.querySelectorAll('.filter-btn').forEach((btn: Element) => btn.classList.remove('active'));
      const target = event?.target as HTMLElement;
      if (target) target.classList.add('active');

      document.querySelectorAll('.product-card').forEach((card: Element) => {
        const reviewed = card.getAttribute('data-reviewed') === 'yes';

        if (filter === 'all') {
          card.classList.remove('hidden');
        } else if (filter === 'reviewed') {
          card.classList.toggle('hidden', !reviewed);
        } else if (filter === 'unreviewed') {
          card.classList.toggle('hidden', reviewed);
        }
      });
    };

    win.sortProducts = (sortType: string) => {
      document.querySelectorAll('.sort-btn').forEach((btn: Element) => btn.classList.remove('active'));
      const target = event?.target as HTMLElement;
      if (target) target.classList.add('active');

      const grid = document.getElementById('products-grid');
      if (!grid) return;

      const cards = Array.from(document.querySelectorAll('.product-card'));

      cards.sort((a: Element, b: Element) => {
        const titleA = a.querySelector('.product-title')?.textContent?.trim() || '';
        const titleB = b.querySelector('.product-title')?.textContent?.trim() || '';
        const reviewedA = a.getAttribute('data-reviewed') === 'yes';
        const reviewedB = b.getAttribute('data-reviewed') === 'yes';

        switch(sortType) {
          case 'az':
            return titleA.localeCompare(titleB);
          case 'za':
            return titleB.localeCompare(titleA);
          case 'reviewed':
            if (reviewedA && !reviewedB) return -1;
            if (!reviewedA && reviewedB) return 1;
            return 0;
          case 'unreviewed':
            if (!reviewedA && reviewedB) return -1;
            if (reviewedA && !reviewedB) return 1;
            return 0;
          default:
            return 0;
        }
      });

      cards.forEach(card => grid.appendChild(card));
    };

    // Image navigation
    win.navigateImage = (event: Event, handle: string, direction: number) => {
      event.stopPropagation();
      event.preventDefault();

      const productImages = win.productImages || {};
      const container = document.querySelector(`.product-image-container[data-handle="${handle}"]`);
      if (!container) return;

      const images = productImages[handle] || [];
      if (images.length <= 1) return;

      let currentIndex = parseInt(container.dataset.currentIndex || '0');
      const newIndex = (currentIndex + direction + images.length) % images.length;

      const img = container.querySelector('.product-image') as HTMLImageElement;
      if (img && images[newIndex]) {
        img.style.opacity = '0';
        setTimeout(() => {
          img.src = images[newIndex];
          img.dataset.index = newIndex.toString();
          img.style.opacity = '1';
        }, 100);
      }

      const counter = container.querySelector('.image-counter');
      if (counter) {
        counter.textContent = `${newIndex + 1}/${images.length}`;
      }

      container.dataset.currentIndex = newIndex.toString();
    };

    // Export function
    win.exportVerifiedTags = () => {
      const productTags = win.productTags || {};
      let csv = 'Handle,Style,Material,Face Shapes,Use Cases,Lens Types,Status\n';
      let count = 0;

      document.querySelectorAll('.product-card').forEach((card: Element) => {
        const handle = card.getAttribute('data-handle');
        const reviewed = card.getAttribute('data-reviewed') === 'yes';
        const tags = productTags[handle] || {};

        csv += `${handle || ''},`;
        csv += `${tags.style || ''},`;
        csv += `${tags.material || ''},`;
        csv += `${tags.face_shapes ? tags.face_shapes.join('; ') : ''},`;
        csv += `${tags.use_cases ? tags.use_cases.join('; ') : ''},`;
        csv += `${tags.lens_types ? tags.lens_types.join('; ') : ''},`;
        csv += `${reviewed ? 'REVIEWED' : 'NEEDS REVIEW'}\n`;
        count++;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `azyr_verified_tags_${date}.csv`;
      a.click();

      alert(`Exported ${count} products!\n\nEmail this file to be converted to Shopify import format.`);
    };

    // Load saved progress
    const saved = localStorage.getItem('azyrProductTags');
    if (saved) {
      try {
        const savedTags = JSON.parse(saved);
        win.productTags = win.productTags || {};
        Object.assign(win.productTags, savedTags);

        Object.keys(savedTags).forEach(handle => {
          ['style', 'material', 'face_shapes', 'use_cases', 'lens_types'].forEach(cat => {
            win.updateUI?.(handle, cat);
          });
        });

        win.updateSavedCount?.();
        console.log('Loaded saved progress from localStorage');
      } catch (e) {
        console.error('Failed to load saved progress:', e);
      }
    }

    // Load from API
    fetch('/api/tags')
      .then(res => res.json())
      .then(cloudTags => {
        if (cloudTags && Object.keys(cloudTags).length > 0) {
          win.productTags = win.productTags || {};
          Object.assign(win.productTags, cloudTags);

          Object.keys(cloudTags).forEach(handle => {
            ['style', 'material', 'face_shapes', 'use_cases', 'lens_types'].forEach(cat => {
              win.updateUI?.(handle, cat);
            });
          });

          win.updateSavedCount?.();
          console.log('Loaded tags from cloud');
        }
      })
      .catch(e => console.error('Failed to load from API:', e));
  };

  // Set up event listeners
  useEffect(() => {
    // Close modal on escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        (window as any).closeReferenceModal?.();
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Close modal when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const modal = document.getElementById('reference-modal');
      if (modal && e.target === modal) {
        (window as any).closeReferenceModal?.();
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
