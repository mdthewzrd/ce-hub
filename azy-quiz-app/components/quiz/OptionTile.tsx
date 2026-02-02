'use client';

import React from 'react';

interface OptionTileProps {
  option: {
    value: string;
    label: string;
    icon?: string;
    image?: string;
  };
  selected?: boolean;
  onClick: () => void;
  type: 'single' | 'multi';
}

export default function OptionTile({
  option,
  selected = false,
  onClick,
  type,
}: OptionTileProps) {
  const baseClasses = `
    relative cursor-pointer transition-all duration-300
    border rounded-sm p-4 flex flex-col items-center justify-center gap-3
    ${selected
      ? 'border-azyr-black bg-azyr-cream shadow-md'
      : 'border-azyr-taupe/30 bg-white hover:border-azyr-charcoal'
    }
    min-h-[380px]
  `;

  const imageDisplay = option.image && (
    <img
      src={option.image}
      alt={option.label}
      className={`
        object-contain
        ${selected ? 'opacity-100' : 'opacity-70'}
        transition-opacity duration-300
        w-full h-auto max-h-[280px]
      `}
    />
  );

  const iconDisplay = !option.image && option.icon && (
    <div className={`text-5xl ${selected ? 'opacity-100' : 'opacity-60'}`}>
      {getIcon(option.icon)}
    </div>
  );

  const checkbox = type === 'multi' && (
    <div className={`
      absolute top-3 right-3 w-5 h-5 rounded-sm border flex items-center justify-center
      ${selected
        ? 'border-azyr-black bg-azyr-black'
        : 'border-azyr-taupe'
      }
    `}>
      {selected && (
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </div>
  );

  return (
    <button className={baseClasses} onClick={onClick}>
      {checkbox}
      {imageDisplay || iconDisplay}
      <span className={`
        font-serif text-lg
        ${selected ? 'text-azyr-black' : 'text-azyr-charcoal'}
      `}>
        {option.label}
      </span>
    </button>
  );
}

function getIcon(iconName: string): React.ReactNode {
  const icons: Record<string, React.ReactNode> = {
    // Face shapes
    heart: '♡',
    oval: '○',
    round: '●',
    square: '■',
    diamond: '◆',
    triangle: '△',
    question: '?',

    // Materials
    wire: '✦',
    acetate: '◼',

    // Frame styles
    'round-frame': '○',
    'cat-eye': '◈',
    rectangle: '▭',
    wayfarer: '◆',
    'square-frame': '■',
  };

  return icons[iconName] || '•';
}
