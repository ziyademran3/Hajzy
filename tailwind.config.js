/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // use class strategy so ThemeProvider controls it
  theme: {
    extend: {
      colors: {
        hajzy: {
          bg: '#0F172A', // Slate 900 (background)
          card: '#1E293B', // Slate 800 (cards)
          text: '#F8FAFC', // Slate 50 (primary text)
          muted: '#94A3B8', // Slate 400 (secondary text)
          primary: '#14B8A6', // Teal 500
          secondary: '#0F766E', // Teal 700
          border: '#334155', // Slate 700 (borders)
          'bottom-nav': '#1E293B', // bottom nav background (same as card)
          'badge-overlay': 'rgba(0,0,0,0.5)', // semi-transparent dark overlay for badges
        },
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        sans: ['Cairo', 'sans-serif'],
        mono: ['Cairo', 'sans-serif'],
      },
      fontSize: {
        xs: 'var(--type-12)',
        sm: 'var(--type-14)',
        base: 'var(--type-16)',
        lg: 'var(--type-20)',
        xl: 'var(--type-20)',
        '2xl': 'var(--type-24)',
        '3xl': 'var(--type-32)',
        '4xl': 'var(--type-32)',
        '5xl': 'var(--type-32)',
        '6xl': 'var(--type-32)',
        '7xl': 'var(--type-32)',
        '8xl': 'var(--type-32)',
        '9xl': 'var(--type-32)',
      },
      fontWeight: {
        normal: '400',
        medium: '400',
        semibold: '600',
        bold: '700',
        extrabold: '700',
        black: '700',
      },
      boxShadow: {
        'hajzy-soft': '0 6px 20px rgba(2,6,23,0.35)',
      },
      borderRadius: {
        'hajzy-lg': '14px',
      },
    },
  },
  plugins: [],
}
