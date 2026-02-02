'use client'

import React from 'react';
import { Table, BarChart3 } from 'lucide-react';

interface TradingViewToggleProps {
  value: 'table' | 'chart';
  onChange: (value: 'table' | 'chart') => void;
  className?: string;
}

export default function TradingViewToggle({ value, onChange, className = '' }: TradingViewToggleProps) {
  return (
    <div
      data-testid="view-toggle"
      style={{
        display: 'flex',
        backgroundColor: 'rgba(17, 17, 17, 0.8)',
        borderRadius: '10px',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        padding: '4px',
        gap: '2px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(5px)'
      }}
    >
      <button
        type="button"
        onClick={() => onChange('table')}
        aria-pressed={value === 'table'}
        aria-label="Table view"
        data-view="table"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '0.3px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: value === 'table' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
          backgroundColor: value === 'table'
            ? 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.9) 100%)'
            : 'rgba(255, 255, 255, 0.02)',
          boxShadow: value === 'table'
            ? '0 2px 8px rgba(212, 175, 55, 0.4), 0 0 20px rgba(212, 175, 55, 0.2)'
            : 'none'
        }}
        onMouseEnter={(e) => {
          if (value !== 'table') {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.target.style.color = 'rgba(255, 255, 255, 0.9)';
          }
        }}
        onMouseLeave={(e) => {
          if (value !== 'table') {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            e.target.style.color = 'rgba(255, 255, 255, 0.7)';
          }
        }}
      >
        <Table
          size={14}
          style={{
            color: value === 'table' ? '#000000' : '#D4AF37',
            filter: value === 'table' ? 'none' : 'drop-shadow(0 1px 2px rgba(212, 175, 55, 0.3))'
          }}
        />
        <span>Table</span>
      </button>

      <button
        type="button"
        onClick={() => onChange('chart')}
        aria-pressed={value === 'chart'}
        aria-label="Chart view"
        data-view="chart"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          fontWeight: '600',
          letterSpacing: '0.3px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          color: value === 'chart' ? '#000000' : 'rgba(255, 255, 255, 0.7)',
          backgroundColor: value === 'chart'
            ? 'linear-gradient(135deg, #D4AF37 0%, rgba(212, 175, 55, 0.9) 100%)'
            : 'rgba(255, 255, 255, 0.02)',
          boxShadow: value === 'chart'
            ? '0 2px 8px rgba(212, 175, 55, 0.4), 0 0 20px rgba(212, 175, 55, 0.2)'
            : 'none'
        }}
        onMouseEnter={(e) => {
          if (value !== 'chart') {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.target.style.color = 'rgba(255, 255, 255, 0.9)';
          }
        }}
        onMouseLeave={(e) => {
          if (value !== 'chart') {
            e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            e.target.style.color = 'rgba(255, 255, 255, 0.7)';
          }
        }}
      >
        <BarChart3
          size={14}
          style={{
            color: value === 'chart' ? '#000000' : '#D4AF37',
            filter: value === 'chart' ? 'none' : 'drop-shadow(0 1px 2px rgba(212, 175, 55, 0.3))'
          }}
        />
        <span>Chart</span>
      </button>
    </div>
  );
}