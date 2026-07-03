/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D1117',
        surface: '#161B22',
        surface2: '#1B222C',
        border: '#21262D',
        borderStrong: '#2B333D',
        accent1: '#0EA5E9',
        accent2: '#D97706',
        highlight: '#10B981',
        text: '#F0F6FC',
        muted: '#8B949E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(14,165,233,0.15), 0 8px 30px rgba(0,0,0,0.4)',
        card: '0 1px 2px rgba(0,0,0,0.24), 0 1px 3px rgba(0,0,0,0.12)',
        'card-hover': '0 6px 24px -6px rgba(0,0,0,0.5)',
        pop: '0 12px 40px -8px rgba(0,0,0,0.55)',
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
          '0%': { opacity: '0', transform: 'scale(0.96)' },
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
        'fade-in': 'fade-in 0.25s ease-out',
        'scale-in': 'scale-in 0.16s ease-out',
        'slide-in-right': 'slide-in-right 0.24s cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
}
