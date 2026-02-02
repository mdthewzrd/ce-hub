'use client';

import { useEffect, useState, useRef } from 'react';

export default function ReviewV2Page() {
  const [products, setProducts] = useState<any[]>([]);
  const [productTags, setProductTags] = useState<Record<string, any>>({});
  const [pendingTags, setPendingTags] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'reviewed' | 'unreviewed'>('all');
  const reviewedProducts = useRef<Set<string>>(new Set());
  const [showCustomLens, setShowCustomLens] = useState<Record<string, boolean>>({});
  const [customLensValue, setCustomLensValue] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProductData();
  }, []);

  const loadProductData = async () => {
    try {
      // Fetch products with tags from API
      const response = await fetch('/api/products');
      const productsData = await response.json();

      const tags: Record<string, any> = {};
      const productsList: any[] = [];

      productsData.forEach((p: any) => {
        tags[p.handle] = {
          style: p.style || '',
          material: p.material || '',
          face_shapes: p.face_shapes || [],
          use_cases: p.use_cases || [],
          lens_types: p.lens_types || [],
        };

        productsList.push({
          handle: p.handle,
          title: p.title,
          vendor: p.vendor,
          image: p.image,
        });
      });

      setProductTags(tags);
      setProducts(productsList);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const toggleSingle = (handle: string, category: string, value: string) => {
    setPendingTags(prev => {
      const newPending = { ...prev };
      newPending[handle] = newPending[handle] || {};
      const currentPending = newPending[handle][category];

      if (currentPending === value) {
        delete newPending[handle][category];
      } else {
        newPending[handle][category] = value;
      }

      return newPending;
    });
  };

  const toggleMultiple = (handle: string, category: string, value: string) => {
    setPendingTags(prev => {
      const newPending = { ...prev };
      newPending[handle] = newPending[handle] || {};

      if (!newPending[handle][category]) {
        const saved = productTags[handle]?.[category] || [];
        newPending[handle][category] = [...saved];
      }

      const arr = newPending[handle][category];
      const index = arr.indexOf(value);

      if (index > -1) {
        arr.splice(index, 1);
        if (arr.length === 0) {
          delete newPending[handle][category];
        }
      } else {
        arr.push(value);
      }

      return newPending;
    });
  };

  const getButtonState = (handle: string, category: string, value: string) => {
    const saved = productTags[handle]?.[category];
    const pending = pendingTags[handle]?.[category];

    if (category === 'face_shapes' || category === 'use_cases' || category === 'lens_types') {
      const savedArr = Array.isArray(saved) ? saved : [];
      const pendingArr = Array.isArray(pending) ? pending : [];
      return { selected: savedArr.includes(value), pending: pendingArr.includes(value) };
    } else {
      return { selected: saved === value, pending: pending === value };
    }
  };

  const saveChanges = async (handle: string) => {
    const pending = pendingTags[handle];
    if (!pending) return;

    const newTags = { ...productTags[handle], ...pending };
    setProductTags(prev => ({ ...prev, [handle]: newTags }));
    setPendingTags(prev => {
      const newPending = { ...prev };
      delete newPending[handle];
      return newPending;
    });

    // Save to server
    try {
      await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...productTags, [handle]: newTags }),
      });
    } catch (e) {
      console.error('Failed to save:', e);
    }
  };

  const markReviewed = (handle: string) => {
    reviewedProducts.current.add(handle);
    forceUpdate();
  };

  const forceUpdate = () => {
    setProducts([...products]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-xl">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  const filteredProducts = products.filter(p => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'reviewed') return reviewedProducts.current.has(p.handle);
    if (selectedFilter === 'unreviewed') return !reviewedProducts.current.has(p.handle);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 p-4 bg-[#1a1a24] rounded-lg border border-[#2a2a3a]">
          <h1 className="text-2xl font-bold mb-2">AZYR Product Tag Review (V2)</h1>
          <p className="text-gray-400">
            AI-selected tags are highlighted in green. Click to modify, then save.
          </p>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded ${selectedFilter === 'all' ? 'bg-green-600' : 'bg-[#2a2a3a]'}`}
            >
              All ({products.length})
            </button>
            <button
              onClick={() => setSelectedFilter('unreviewed')}
              className={`px-4 py-2 rounded ${selectedFilter === 'unreviewed' ? 'bg-green-600' : 'bg-[#2a2a3a]'}`}
            >
              Needs Review ({products.length - reviewedProducts.current.size})
            </button>
            <button
              onClick={() => setSelectedFilter('reviewed')}
              className={`px-4 py-2 rounded ${selectedFilter === 'reviewed' ? 'bg-green-600' : 'bg-[#2a2a3a]'}`}
            >
              Reviewed ({reviewedProducts.current.size})
            </button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const tags = productTags[product.handle] || {};
            const pending = pendingTags[product.handle] || {};
            const isReviewed = reviewedProducts.current.has(product.handle);

            return (
              <div
                key={product.handle}
                className={`bg-[#1a1a24] rounded-lg border border-[#2a2a3a] p-4 ${isReviewed ? 'opacity-50' : ''}`}
              >
                <div className="mb-4">
                  <img
                    src={product.image || 'https://via.placeholder.com/300'}
                    alt={product.title}
                    className="w-full aspect-square object-cover rounded bg-[#13131a]"
                  />
                </div>

                <h3 className="font-semibold mb-1">{product.title}</h3>
                <p className="text-sm text-gray-400 mb-4">{product.vendor}</p>

                {/* Style */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 uppercase">Style</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['aviator', 'cat_eye', 'round', 'rectangle', 'square', 'wayfarer'].map((style) => {
                      const state = getButtonState(product.handle, 'style', style);
                      return (
                        <button
                          key={style}
                          onClick={() => toggleSingle(product.handle, 'style', style)}
                          className={`px-3 py-1 text-sm rounded ${
                            state.pending
                              ? 'border-2 border-orange-500 bg-orange-500/20 text-orange-500'
                              : state.selected
                              ? 'border-2 border-green-500 bg-green-500/20 text-green-500'
                              : 'border border-[#2a2a3a] bg-[#13131a]'
                          }`}
                        >
                          {style.replace('_', '-')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Material */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 uppercase">Material</label>
                  <div className="flex gap-2 mt-1">
                    {['wire', 'acetate'].map((material) => {
                      const state = getButtonState(product.handle, 'material', material);
                      return (
                        <button
                          key={material}
                          onClick={() => toggleSingle(product.handle, 'material', material)}
                          className={`px-3 py-1 text-sm rounded ${
                            state.pending
                              ? 'border-2 border-orange-500 bg-orange-500/20 text-orange-500'
                              : state.selected
                              ? 'border-2 border-green-500 bg-green-500/20 text-green-500'
                              : 'border border-[#2a2a3a] bg-[#13131a]'
                          }`}
                        >
                          {material === 'wire' ? 'Wire/Metal' : 'Acetate/Plastic'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Face Shapes */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 uppercase">Face Shapes</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['heart', 'oval', 'round', 'square', 'diamond'].map((shape) => {
                      const state = getButtonState(product.handle, 'face_shapes', shape);
                      return (
                        <button
                          key={shape}
                          onClick={() => toggleMultiple(product.handle, 'face_shapes', shape)}
                          className={`px-2 py-1 text-xs rounded ${
                            state.pending
                              ? 'border-2 border-orange-500 bg-orange-500/20 text-orange-500'
                              : state.selected
                              ? 'border-2 border-green-500 bg-green-500/20 text-green-500'
                              : 'border border-[#2a2a3a] bg-[#13131a]'
                          }`}
                        >
                          {shape === 'heart' ? '♥ Heart' : shape.charAt(0).toUpperCase() + shape.slice(1)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Use Cases */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 uppercase">Use Cases</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {['day', 'night', 'going_out', 'casual', 'sport', 'at_desk'].map((useCase) => {
                      const state = getButtonState(product.handle, 'use_cases', useCase);
                      return (
                        <button
                          key={useCase}
                          onClick={() => toggleMultiple(product.handle, 'use_cases', useCase)}
                          className={`px-2 py-1 text-xs rounded ${
                            state.pending
                              ? 'border-2 border-orange-500 bg-orange-500/20 text-orange-500'
                              : state.selected
                              ? 'border-2 border-green-500 bg-green-500/20 text-green-500'
                              : 'border border-[#2a2a3a] bg-[#13131a]'
                          }`}
                        >
                          {useCase === 'going_out' ? '🎉 Going Out' :
                           useCase === 'at_desk' ? '💼 At Desk' :
                           useCase === 'day' ? '☀️ Day' :
                           useCase === 'night' ? '🌙 Night' :
                           useCase === 'casual' ? '😌 Casual' :
                           useCase === 'sport' ? '🏃 Sport' : useCase}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lens Types */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 uppercase">Lens Options</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      { value: 'polarized', label: '🕶️ Polarized' },
                      { value: 'shield', label: '🛡️ Shield' },
                      { value: 'butterfly', label: '🦋 Butterfly' },
                      { value: 'geometric', label: '📐 Geometric' },
                      { value: 'tinted', label: '🌈 Tinted' },
                      { value: 'rx', label: '💊 Prescription' },
                      { value: 'blue_light', label: '💡 Blue Light' },
                    ].map((lens) => {
                      const state = getButtonState(product.handle, 'lens_types', lens.value);
                      return (
                        <button
                          key={lens.value}
                          onClick={() => toggleMultiple(product.handle, 'lens_types', lens.value)}
                          className={`px-2 py-1 text-xs rounded ${
                            state.pending
                              ? 'border-2 border-orange-500 bg-orange-500/20 text-orange-500'
                              : state.selected
                              ? 'border-2 border-green-500 bg-green-500/20 text-green-500'
                              : 'border border-[#2a2a3a] bg-[#13131a]'
                          }`}
                        >
                          {lens.label}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setShowCustomLens(prev => ({ ...prev, [product.handle]: true }))}
                      className="px-2 py-1 text-xs rounded border-2 border-dashed border-amber-500 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                    >
                      + Custom
                    </button>
                  </div>

                  {/* Custom Lens Input */}
                  {showCustomLens[product.handle] && (
                    <div className="mt-2 p-2 bg-[#13131a] border-2 border-dashed border-amber-500 rounded">
                      <input
                        type="text"
                        value={customLensValue[product.handle] || ''}
                        onChange={(e) => setCustomLensValue(prev => ({ ...prev, [product.handle]: e.target.value }))}
                        placeholder="Enter custom lens type/shape..."
                        className="w-full px-3 py-2 bg-[#1a1a24] border border-[#2a2a3a] rounded text-white text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            const value = customLensValue[product.handle]?.trim();
                            if (value) {
                            toggleMultiple(product.handle, 'lens_types', value);
                            setCustomLensValue(prev => ({ ...prev, [product.handle]: '' }));
                            setShowCustomLens(prev => ({ ...prev, [product.handle]: false }));
                            }
                          }}
                          className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setShowCustomLens(prev => ({ ...prev, [product.handle]: false }));
                            setCustomLensValue(prev => ({ ...prev, [product.handle]: '' }));
                          }}
                          className="flex-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  {Object.keys(pending).length > 0 && (
                    <button
                      onClick={() => saveChanges(product.handle)}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save Changes
                    </button>
                  )}
                  <button
                    onClick={() => markReviewed(product.handle)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {isReviewed ? '✓ Reviewed' : 'Mark Reviewed'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
