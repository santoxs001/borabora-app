import type { Config } from 'tailwindcss';

/**
 * HEY design tokens.
 * Every value here has a CSS-variable twin in src/styles/globals.css so that
 * runtime theming (and any future light mode) never needs a rebuild.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0B0B0D',
          50: '#16161A',
          100: '#121216',
        },
        bone: {
          DEFAULT: '#F4F2EE',
          dim: 'rgba(244,242,238,0.62)',
          faint: 'rgba(244,242,238,0.38)',
        },
        graphite: {
          DEFAULT: '#2A2A2F',
          light: '#3A3A42',
          dark: '#1C1C21',
        },
        ultraviolet: {
          DEFAULT: '#7A3CFF',
          bright: '#9463FF',
          deep: '#5A22D6',
          wash: 'rgba(122,60,255,0.14)',
        },
        signal: {
          online: '#3DDC97',
          warn: '#FFB020',
          danger: '#FF4D6A',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
      },
      borderRadius: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '22px',
        xl: '28px',
        '2xl': '34px',
        card: '26px',
      },
      boxShadow: {
        card: '0 18px 48px -18px rgba(0,0,0,0.85)',
        float: '0 12px 32px -10px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(122,60,255,0.35), 0 12px 40px -8px rgba(122,60,255,0.5)',
        'glow-sm': '0 6px 22px -8px rgba(122,60,255,0.65)',
      },
      backdropBlur: {
        xs: '3px',
      },
      spacing: {
        nav: '76px',
        'safe-b': 'env(safe-area-inset-bottom)',
      },
      transitionTimingFunction: {
        hey: 'cubic-bezier(0.22, 1, 0.36, 1)',
        snap: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        'dot-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.35)', opacity: '0.65' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'sheet-in': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.92)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'ring-out': {
          from: { transform: 'scale(0.6)', opacity: '0.9' },
          to: { transform: 'scale(2.4)', opacity: '0' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(-16px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'dot-pulse': 'dot-pulse 1.6s cubic-bezier(0.22,1,0.36,1) infinite',
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.3s ease both',
        'sheet-in': 'sheet-in 0.34s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scale-in 0.32s cubic-bezier(0.34,1.56,0.64,1) both',
        'ring-out': 'ring-out 2s cubic-bezier(0.22,1,0.36,1) infinite',
        shimmer: 'shimmer 1.6s infinite',
        'toast-in': 'toast-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
