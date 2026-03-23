/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      },
      colors: {
        ink: '#111827',
        brand: '#0F766E',
        accent: '#F59E0B',
        mist: '#ECFEFF'
      }
    }
  },
  plugins: []
};
