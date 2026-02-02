'use client';

import React, { useEffect, useState } from 'react';
import { QuizResponses } from '@/lib/types';
import ProductCard from '@/components/results/ProductCard';
import { getRecommendations, type Product, type ScoredProduct } from '@/lib/recommendationEngine';

export default function ResultsPage() {
  const [products, setProducts] = useState<ScoredProduct[]>([]);
  const [responses, setResponses] = useState<QuizResponses | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get quiz responses from sessionStorage
    let savedResponses: QuizResponses | null = null;
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('quizResponses');
      if (stored) {
        savedResponses = JSON.parse(stored);
        setResponses(savedResponses);
      }
    }

    // Get recommendations based on quiz responses
    const allProducts = getMockProducts();
    const recommended = savedResponses
      ? getRecommendations(allProducts, savedResponses, 12)
      : allProducts.slice(0, 12).map(p => ({
          ...p,
          score: 50,
          matchReasons: ['Featured vintage pick']
        }));

    setProducts(recommended);
    setLoading(false);
  }, []);

  const getResponseSummary = () => {
    if (!responses) return '';

    const parts: string[] = [];
    if (responses.face_shape && responses.face_shape !== 'not_sure') {
      parts.push(formatLabel(responses.face_shape));
    }
    if (responses.material) {
      parts.push(formatLabel(responses.material));
    }
    if (responses.styles && responses.styles.length > 0) {
      const styleLabels = responses.styles.map(s => formatLabel(s));
      parts.push(styleLabels.join(' & '));
    }
    if (responses.use_case) {
      parts.push(`for ${formatLabel(responses.use_case)}`);
    }

    return parts.length > 0 ? `Your style: ${parts.join(', ')}` : 'Your personalized picks';
  };

  const formatLabel = (value: string): string => {
    return value.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <main className="min-h-screen bg-azyr-warm-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <a
            href="https://azyrspecs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <h1 className="text-5xl font-serif font-bold text-azyr-black mb-1 tracking-tight">
              AZYR
            </h1>
          </a>
          <p className="text-xs font-sans tracking-widest text-gray-500 uppercase">
            Vintage Eyewear
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-2 border-gray-200 border-t-azyr-black rounded-full animate-spin mb-6"></div>
            <p className="font-serif text-gray-700 text-lg">Curating your vintage picks...</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif text-azyr-black mb-2">
                Your Personalized Picks
              </h2>
              <p className="font-sans text-gray-600 text-sm">
                {getResponseSummary()}
              </p>
            </div>

            {/* Discount Banner */}
            <div className="bg-azyr-black text-white text-center py-4 px-4 mb-12">
              <p className="font-serif text-xl mb-1">
                15% Off Your First Order
              </p>
              <p className="font-sans text-gray-200 text-sm">
                Use code <span className="font-mono font-semibold bg-white/10 px-2 py-0.5 rounded">AZYR15</span> at checkout
              </p>
            </div>

            {/* Products Grid - Matching AZYR clean grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Browse Full Collection */}
            <div className="text-center py-12 border-t border-gray-200">
              <h3 className="font-serif text-2xl text-azyr-black mb-2">
                Explore More Vintage Treasures
              </h3>
              <p className="font-sans text-gray-600 mb-6 text-sm max-w-md mx-auto">
                Browse our full collection of curated vintage eyewear
              </p>
              <a
                href="https://azyrspecs.com/collections/in-stock"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-2 px-6 border border-gray-900 text-gray-900 font-sans text-xs uppercase tracking-wide hover:bg-gray-900 hover:text-white transition-all duration-300"
              >
                Browse Full Collection
              </a>
            </div>

            {/* Expert Disclaimer */}
            <div className="max-w-2xl mx-auto py-8 px-6 bg-azyr-cream/30 rounded-sm">
              <p className="font-serif text-azyr-black text-sm leading-relaxed text-center">
                <em>Please don't feel limited by these recommendations. This quiz is meant to guide you, not restrict you. The most important factor is finding frames that make you feel confident and express your unique style.</em>
              </p>
            </div>

            {/* Contact CTA */}
            <div className="text-center py-8">
              <h3 className="font-serif text-lg text-gray-900 mb-2">
                Need Help Choosing?
              </h3>
              <p className="font-sans text-gray-600 mb-4 text-sm">
                Our vintage eyewear experts are here to help
              </p>
              <a
                href="https://azyrspecs.com/pages/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block py-2 px-6 bg-azyr-black text-white font-sans text-xs uppercase tracking-wide hover:bg-gray-800 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center mt-12 py-8 border-t border-gray-200">
          <p className="font-sans text-xs text-gray-500 tracking-wide">
            Sustainable • One-of-a-Kind • Handpicked
          </p>
          <p className="font-sans text-xs text-gray-400 mt-2">
            <a
              href="https://azyrspecs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
            >
              azyrspecs.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

// TODO: Replace with actual API call
function getMockProducts(): Product[] {
  return [
    {
      id: '1',
      title: '"Sunlit Whisper" 1980s Silhouette Sunglasses',
      handle: 'sunlit-whisper-1980s-silhouette-sunglasses',
      vendor: 'Silhouette',
      price: '$250.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2121.jpg?v=1764429023',
        'https://azyrspecs.com/cdn/shop/files/IMG_2122.jpg?v=1764429023'
      ],
      url: 'https://azyrspecs.com/products/sunlit-whisper-1980s-silhouette-sunglasses',
      style: 'aviator',
      material: 'wire',
      face_shapes: ['heart', 'oval', 'square', 'diamond'],
      use_cases: ['day', 'going_out', 'casual'],
      vibes: ['luxury', 'classic'],
      lens_types: ['polarized', 'rx', 'tinted'],
    },
    {
      id: '2',
      title: '"Roseglass Drift" 1990s Brendel Sunglasses',
      handle: 'roseglass-drift-1990s-brendel-sunglasses',
      vendor: 'Brendel',
      price: '$150.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2117.jpg?v=1764428201',
        'https://azyrspecs.com/cdn/shop/files/IMG_2118.jpg?v=1764428201'
      ],
      url: 'https://azyrspecs.com/products/roseglass-drift-1990s-brendel-sunglasses',
      style: 'cat_eye',
      material: 'acetate',
      face_shapes: ['heart', 'oval', 'round', 'square', 'diamond'],
      use_cases: ['night', 'going_out', 'casual'],
      vibes: ['retro', 'trendy'],
      lens_types: ['rx', 'tinted', 'custom'],
    },
    {
      id: '3',
      title: '"Cinematic Edge" 1990s Bellagio Sunglasses',
      handle: 'cinematic-edge-1990s-bellagio-sunglasses',
      vendor: 'Bellagio',
      price: '$175.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2109.jpg?v=1764427049',
        'https://azyrspecs.com/cdn/shop/files/IMG_2110.jpg?v=1764427049'
      ],
      url: 'https://azyrspecs.com/products/cinematic-edge-1990s-bellagio-sunglasses',
      style: 'square',
      material: 'acetate',
      face_shapes: ['oval', 'round'],
      use_cases: ['night', 'going_out', 'at_desk'],
      vibes: ['edgy', 'luxury'],
      lens_types: ['blue_light', 'rx', 'custom'],
    },
    {
      id: '4',
      title: '"Dual Horizon" 1980s John Sterling Sunglasses',
      handle: 'dual-horizon-1980s-john-sterling-sunglasses',
      vendor: 'John Sterling',
      price: '$200.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2222.jpg?v=1764424923',
        'https://azyrspecs.com/cdn/shop/files/IMG_2223.jpg?v=1764424923'
      ],
      url: 'https://azyrspecs.com/products/dual-horizon-1980s-john-sterling-sunglasses',
      style: 'rectangle',
      material: 'wire',
      face_shapes: ['heart', 'oval', 'round', 'diamond'],
      use_cases: ['day', 'at_desk', 'casual'],
      vibes: ['classic', 'retro'],
      lens_types: ['blue_light', 'rx', 'tinted'],
    },
    {
      id: '5',
      title: '"Actress Mode" 1980s Sophia Loren Glasses',
      handle: 'actress-mode-1980s-sophia-loren-glasses',
      vendor: 'Sophia Loren',
      price: '$250.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2129.jpg?v=1764331886',
        'https://azyrspecs.com/cdn/shop/files/IMG_2132.jpg?v=1764331886'
      ],
      url: 'https://azyrspecs.com/products/actress-mode-1980s-sophia-loren-glasses',
      style: 'cat_eye',
      material: 'acetate',
      face_shapes: ['heart', 'oval', 'round', 'square', 'diamond'],
      use_cases: ['going_out', 'night', 'casual'],
      vibes: ['luxury', 'trendy'],
      lens_types: ['rx', 'tinted', 'custom'],
    },
    {
      id: '6',
      title: '"Burnt Honey" 1980s Diplomat Sunglasses',
      handle: 'burnt-honey-1980s-diplomat-sunglasses',
      vendor: 'Diplomat',
      price: '$200.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2125.jpg?v=1764331165',
        'https://azyrspecs.com/cdn/shop/files/IMG_2126.jpg?v=1764331165'
      ],
      url: 'https://azyrspecs.com/products/burnt-honey-1980s-diplomat-sunglasses',
      style: 'wayfarer',
      material: 'acetate',
      face_shapes: ['heart', 'oval', 'round', 'square'],
      use_cases: ['day', 'casual', 'at_desk'],
      vibes: ['classic', 'retro'],
      lens_types: ['polarized', 'rx', 'tinted'],
    },
    {
      id: '7',
      title: '"Boxer Briefs" 1990s Calvin Klein Sunglasses',
      handle: 'boxer-briefs-1990s-calvin-klein-sunglasses',
      vendor: 'Calvin Klein',
      price: '$200.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2113.jpg?v=1764330348',
        'https://azyrspecs.com/cdn/shop/files/IMG_2114.jpg?v=1764330348'
      ],
      url: 'https://azyrspecs.com/products/boxer-briefs-1990s-calvin-klein-sunglasses',
      style: 'round',
      material: 'wire',
      face_shapes: ['heart', 'square', 'diamond'],
      use_cases: ['night', 'at_desk', 'casual'],
      vibes: ['retro', 'classic'],
      lens_types: ['blue_light', 'rx', 'tinted'],
    },
    {
      id: '8',
      title: '"Blue Mirage" 1990s Metal Vista Sunglasses',
      handle: 'blue-mirage-1990s-metal-vista-sunglasses',
      vendor: 'Metal Vista',
      price: '$300.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2137.jpg?v=1764259174',
        'https://azyrspecs.com/cdn/shop/files/IMG_2138.jpg?v=1764259174'
      ],
      url: 'https://azyrspecs.com/products/blue-mirage-1990s-metal-vista-sunglasses',
      style: 'aviator',
      material: 'wire',
      face_shapes: ['heart', 'oval', 'square', 'diamond'],
      use_cases: ['day', 'sport', 'casual'],
      vibes: ['luxury', 'modern'],
      lens_types: ['polarized', 'rx', 'tinted'],
    },
    {
      id: '9',
      title: '"Golden Hour" 1980s Cazal Sunglasses',
      handle: 'golden-hour-1980s-cazal-sunglasses',
      vendor: 'Cazal',
      price: '$350.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2141.jpg?v=1764259174',
        'https://azyrspecs.com/cdn/shop/files/IMG_2142.jpg?v=1764259174'
      ],
      url: 'https://azyrspecs.com/products/golden-hour-1980s-cazal-sunglasses',
      style: 'square',
      material: 'acetate',
      face_shapes: ['oval', 'round'],
      use_cases: ['going_out', 'night', 'casual'],
      vibes: ['edgy', 'luxury', 'trendy'],
      lens_types: ['rx', 'tinted', 'custom'],
    },
    {
      id: '10',
      title: '"Midnight Rose" 1990s Alpina Sunglasses',
      handle: 'midnight-rose-1990s-alpina-sunglasses',
      vendor: 'Alpina',
      price: '$180.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2145.jpg?v=1764259174',
        'https://azyrspecs.com/cdn/shop/files/IMG_2146.jpg?v=1764259174'
      ],
      url: 'https://azyrspecs.com/products/midnight-rose-1990s-alpina-sunglasses',
      style: 'round',
      material: 'acetate',
      face_shapes: ['heart', 'square', 'diamond'],
      use_cases: ['night', 'going_out', 'casual'],
      vibes: ['retro', 'trendy'],
      lens_types: ['rx', 'tinted', 'custom'],
    },
    {
      id: '11',
      title: '"Desert Storm" 1980s Porsche Design Sunglasses',
      handle: 'desert-storm-1980s-porsche-design-sunglasses',
      vendor: 'Porsche Design',
      price: '$280.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2151.jpg?v=1764259174',
        'https://azyrspecs.com/cdn/shop/files/IMG_2152.jpg?v=1764259174'
      ],
      url: 'https://azyrspecs.com/products/desert-storm-1980s-porsche-design-sunglasses',
      style: 'aviator',
      material: 'wire',
      face_shapes: ['heart', 'oval', 'square', 'diamond'],
      use_cases: ['day', 'sport', 'casual'],
      vibes: ['luxury', 'modern', 'classic'],
      lens_types: ['polarized', 'rx', 'tinted'],
    },
    {
      id: '12',
      title: '"Vintage Soul" 1990s Carrera Sunglasses',
      handle: 'vintage-soul-1990s-carrera-sunglasses',
      vendor: 'Carrera',
      price: '$220.00',
      images: [
        'https://azyrspecs.com/cdn/shop/files/IMG_2161.jpg?v=1764259174',
        'https://azyrspecs.com/cdn/shop/files/IMG_2162.jpg?v=1764259174'
      ],
      url: 'https://azyrspecs.com/products/vintage-soul-1990s-carrera-sunglasses',
      style: 'wayfarer',
      material: 'acetate',
      face_shapes: ['heart', 'oval', 'round', 'square'],
      use_cases: ['day', 'casual', 'going_out'],
      vibes: ['retro', 'classic', 'trendy'],
      lens_types: ['polarized', 'rx', 'tinted', 'custom'],
    },
  ];
}
