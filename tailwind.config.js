/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#edfafa',
          100: '#d2f3f2',
          200: '#a9e6e4',
          300: '#72d2d0',
          400: '#38b9b7',
          500: '#169f9e',
          600: '#0e8182',
          700: '#116769',
          800: '#135254',
          900: '#144547',
        }
      }
    },
  },
  plugins: [],
}
