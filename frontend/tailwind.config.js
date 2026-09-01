/** @type {import('tailwindcss').Config} */

// Colors are CSS variables holding space-separated RGB channels, so the same
// utility works in both themes AND still supports opacity modifiers
// (bg-accent1/10). See DESIGN.md §2 — never hardcode a hex in a component.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        surface2: token('surface-2'),
        border: token('border'),
        borderStrong: token('border-strong'),
        text: token('text'),
        text2: token('text-2'),
        muted: token('muted'),
        accent1: token('accent1'),
        accent2: token('accent2'),
        highlight: token('highlight'),
        warning: token('warning'),
        danger: token('danger'),
        onAccent: token('on-accent'),
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      // DESIGN.md §3 — a 1.20 scale. `base` is 14px, the app's body size.
      fontSize: {
        xs: ['0.6875rem', { lineHeight: '1rem' }], // 11
        sm: ['0.75rem', { lineHeight: '1.125rem' }], // 12
        base: ['0.875rem', { lineHeight: '1.375rem' }], // 14
        md: ['1rem', { lineHeight: '1.5rem' }], // 16
        lg: ['1.1875rem', { lineHeight: '1.625rem' }], // 19
        xl: ['1.4375rem', { lineHeight: '1.875rem' }], // 23
        '2xl': ['1.75rem', { lineHeight: '2.125rem' }], // 28
        '3xl': ['2.125rem', { lineHeight: '2.5rem' }], // 34
      },
      borderRadius: {
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      // Soft, warm-black, never a glow. DESIGN.md §5.
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.06), 0 4px 16px -8px rgb(var(--shadow) / 0.18)',
        lift: '0 1px 2px rgb(var(--shadow) / 0.08), 0 12px 32px -12px rgb(var(--shadow) / 0.28)',
        pop: '0 2px 4px rgb(var(--shadow) / 0.10), 0 24px 56px -20px rgb(var(--shadow) / 0.36)',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.97)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1s ease-in-out infinite',
        'fade-in': 'fade-in 0.24s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scale-in 0.18s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-right': 'slide-in-right 0.22s cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
}
