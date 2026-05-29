/** @type {import('tailwindcss').Config} */
import typography from '@tailwindcss/typography';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007bff',
          dark: '#0056b3',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      padding: {
        safe: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      },
      margin: {
        safe: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      },
      keyframes: {
        'border-pulse-red': {
          '0%, 100%': { borderColor: 'rgba(239, 68, 68, 0.3)' },
          '50%': { borderColor: 'rgba(239, 68, 68, 0.8)' },
        },
        'border-pulse-amber': {
          '0%, 100%': { borderColor: 'rgba(245, 158, 11, 0.3)' },
          '50%': { borderColor: 'rgba(245, 158, 11, 0.8)' },
        },
      },
      animation: {
        'border-pulse-red': 'border-pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'border-pulse-amber': 'border-pulse-amber 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [typography],
};
