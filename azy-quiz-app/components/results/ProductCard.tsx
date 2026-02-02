'use client';

import React from 'react';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    handle: string;
    vendor: string;
    price: string;
    images: string[];
    url: string;
  };
}

type AvailabilityStatus = 'available' | 'sold_out';

export default function ProductCard({ product }: ProductCardProps) {
  // For now, all products are available
  const isSoldOut = false;

  const image1 = product.images[0];
  const image2 = product.images[1] || product.images[0];

  return (
    <div className="flex flex-col gap-1">
      {/* Product Images Container - Two Images Side-by-Side */}
      <div className="grid grid-cols-2 gap-1 aspect-[4/5] overflow-hidden bg-white">
        {/* First Image */}
        <div className="overflow-hidden bg-white">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <img
              src={image1}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </a>
        </div>

        {/* Second Image */}
        <div className="overflow-hidden bg-white">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full h-full"
          >
            <img
              src={image2}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </a>
        </div>

        {/* Sold Out Badge - overlays both images */}
        {isSoldOut && (
          <div className="col-span-2 absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
            <span className="text-xs font-semibold tracking-wider uppercase">Sold Out</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="mt-2">
        {/* Vendor Name */}
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
          {product.vendor}
        </p>

        {/* Product Title */}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-1"
        >
          <h3 className="text-sm text-gray-900 font-medium leading-tight hover:text-gray-600 transition-colors">
            {product.title}
          </h3>
        </a>

        {/* Price */}
        <p className="text-sm text-gray-900">
          {product.price}
        </p>

        {/* Add to Cart Button */}
        {!isSoldOut && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full mt-2 py-2 bg-black text-white text-xs font-medium text-center hover:bg-gray-800 transition-colors"
          >
            Add to cart
          </a>
        )}
      </div>
    </div>
  );
}
