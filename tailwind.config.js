/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--sd-surface) / <alpha-value>)',
          raised: 'rgb(var(--sd-surface-raised) / <alpha-value>)',
          sunken: 'rgb(var(--sd-surface-sunken) / <alpha-value>)',
        },
        line: 'rgb(var(--sd-line) / <alpha-value>)',
        content: {
          DEFAULT: 'rgb(var(--sd-content) / <alpha-value>)',
          muted: 'rgb(var(--sd-content-muted) / <alpha-value>)',
        },
        brand: {
          50: '#eef4ff',
          100: '#dbe6fe',
          200: '#bfd3fe',
          300: '#93b4fd',
          400: '#608cfa',
          500: '#3b66f6',
          600: '#2547eb',
          700: '#1d35d8',
          800: '#1e2eaf',
          900: '#1e2d8a',
        },
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 180ms ease-out',
      },
    },
  },
  plugins: [],
}
