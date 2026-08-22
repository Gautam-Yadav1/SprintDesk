/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Handwritten. Greetings, section heads, the wordmark, stat figures —
        // never body copy.
        display: ['Caveat', 'ui-serif', 'Georgia', 'cursive'],
        // Body, card titles, table content.
        sans: ['"Source Serif 4"', 'ui-serif', 'Georgia', 'Cambria', 'serif'],
        // Every piece of metadata: labels, dates, nav, badges, table headers.
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
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
        /**
         * `brand` is the Field Notes red. Keeping the accent on the existing
         * token name means every focus ring, primary button and active state
         * already pointed at it — no markup had to learn a new colour.
         */
        brand: {
          50: '#faf1ef',
          100: '#f5e1dd',
          200: '#e9c3bc',
          300: '#da9c91',
          400: '#c86a5a',
          500: '#b23a2e',
          600: '#9c3227',
          700: '#7f2820',
          800: '#68221b',
          900: '#561d17',
        },
        /**
         * The rest of the notebook palette, as literal ramps. These were
         * routed through CSS variables at first, which meant a missing
         * `--fn-*` resolved to an invalid colour and the priority tabs went
         * invisible rather than merely wrong. Literals cannot fail that way,
         * and the extra stops give each tab a shade that actually reads
         * against card stock in both themes. `DEFAULT` keeps `bg-kraft` and
         * friends working wherever the base tone is what's wanted.
         */
        kraft: {
          DEFAULT: '#c9a876',
          100: '#f0e3c9',
          200: '#e3d0aa',
          300: '#d6bc8e',
          400: '#c9a876',
          500: '#b08d55',
          600: '#8f6f3e',
          700: '#6f552f',
        },
        moss: {
          DEFAULT: '#3c6e47',
          100: '#dbe7dd',
          200: '#b6cdbc',
          300: '#84ab90',
          400: '#5b8a68',
          500: '#3c6e47',
          600: '#2f5738',
          700: '#24422b',
        },
        denim: {
          DEFAULT: '#4a6c8c',
          300: '#a9c0d4',
          400: '#6f90ad',
          500: '#4a6c8c',
          600: '#3a566f',
        },
      },
      borderRadius: {
        // Paper stock barely rounds. Index cards are cut, not moulded.
        sm: '0.125rem',
        DEFAULT: '0.125rem',
        md: '0.1875rem',
        lg: '0.25rem',
        xl: '0.25rem',
        '2xl': '0.375rem',
      },
      boxShadow: {
        // Offset and unblurred: a card resting on paper, lit from one side.
        sm: '2px 3px 0 var(--fn-shadow)',
        DEFAULT: '3px 4px 0 var(--fn-shadow)',
        md: '3px 4px 0 var(--fn-shadow)',
        lg: '5px 7px 0 var(--fn-shadow)',
        xl: '6px 8px 0 var(--fn-shadow)',
        '2xl': '8px 11px 0 var(--fn-shadow)',
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
