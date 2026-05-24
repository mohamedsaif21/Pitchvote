/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dce6ff',
          200: '#b9cdff',
          400: '#6b93f5',
          600: '#3355d1',
          800: '#1a2e8a',
          900: '#0d1a5c',
        },
        gold: {
          400: '#f5c842',
          500: '#e9a820',
          600: '#c4850a',
        }
      }
    }
  },
  plugins: [],
}
