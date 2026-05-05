import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        red:    { DEFAULT: '#B91C1C', dark: '#991B1B', light: '#FEE2E2' },
        cream:  { DEFAULT: '#FFFBF2', dark: '#FFF3D6' },
        green:  { DEFAULT: '#14532D', dark: '#166534' },
        gold:   { DEFAULT: '#B45309' },
        ink:    '#2D1500',
        muted:  '#78350F',
        border: '#D97706',
        brand:  '#1A0800',
      },
      fontFamily: {
        sans:     ['Barlow', 'sans-serif'],
        condensed:['Barlow Condensed', 'sans-serif'],
        serif:    ['Playfair Display', 'serif'],
      },
      boxShadow: {
        brand: '0 4px 20px rgba(26,8,0,0.13)',
      },
    },
  },
  plugins: [],
} satisfies Config
