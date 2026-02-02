import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#fafafa',
        surface: {
          DEFAULT: '#0a0a0a',
          hover: '#141414',
          active: '#1a1a1a',
        },
        border: {
          DEFAULT: '#1a1a1a',
          subtle: '#0f0f0f',
          gold: 'rgba(212, 175, 55, 0.3)',
          goldlight: 'rgba(212, 175, 55, 0.15)',
        },
        primary: {
          DEFAULT: '#D4AF37',
          hover: '#c9a432',
          light: 'rgba(212, 175, 55, 0.1)',
        },
        text: {
          primary: '#fafafa',
          secondary: '#a1a1aa',
          muted: '#71717a',
          inverse: '#000000',
          gold: '#D4AF37',
        },
        gold: {
          DEFAULT: '#D4AF37',
          hover: '#c9a432',
          light: 'rgba(212, 175, 55, 0.1)',
          20: 'rgba(212, 175, 55, 0.2)',
          30: 'rgba(212, 175, 55, 0.3)',
          40: 'rgba(212, 175, 55, 0.4)',
          50: 'rgba(212, 175, 55, 0.5)',
          60: 'rgba(212, 175, 55, 0.6)',
          70: 'rgba(212, 175, 55, 0.7)',
          80: 'rgba(212, 175, 55, 0.8)',
          15: 'rgba(212, 175, 55, 0.15)',
          8: 'rgba(212, 175, 55, 0.08)',
          5: 'rgba(212, 175, 55, 0.05)',
          3: 'rgba(212, 175, 55, 0.03)',
          10: 'rgba(212, 175, 55, 0.1)',
        },
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        'gold-sm': '0 2px 8px rgba(212, 175, 55, 0.15), 0 1px 3px rgba(0, 0, 0, 0.5)',
        'gold-md': '0 4px 16px rgba(212, 175, 55, 0.2), 0 2px 6px rgba(0, 0, 0, 0.6)',
        'gold-lg': '0 8px 32px rgba(212, 175, 55, 0.25), 0 4px 12px rgba(0, 0, 0, 0.7)',
        'gold-xl': '0 16px 48px rgba(212, 175, 55, 0.3), 0 8px 16px rgba(0, 0, 0, 0.8)',
        '3d-sm': '0 1px 3px rgba(0, 0, 0, 0.8), 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        '3d-md': '0 2px 8px rgba(0, 0, 0, 0.9), 0 8px 24px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        '3d-lg': '0 4px 16px rgba(0, 0, 0, 0.95), 0 16px 48px rgba(0, 0, 0, 0.8), inset 0 2px 0 rgba(255, 255, 255, 0.1)',
        'glow-sm': '0 0 20px rgba(212, 175, 55, 0.3), 0 0 40px rgba(212, 175, 55, 0.15)',
        'glow-md': '0 0 30px rgba(212, 175, 55, 0.4), 0 0 60px rgba(212, 175, 55, 0.2)',
        'glow-lg': '0 0 40px rgba(212, 175, 55, 0.5), 0 0 80px rgba(212, 175, 55, 0.25)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
