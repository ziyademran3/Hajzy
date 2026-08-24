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
        cairo: ['Cairo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Cairo', 'Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
