/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
      },
      borderRadius: {
        'large': 'var(--radius-large)',
      },
    },
  },
  plugins: [],
}