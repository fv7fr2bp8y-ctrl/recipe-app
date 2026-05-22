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
          50: '#fef9f0',
          100: '#fdf0d5',
          200: '#fbdfa6',
          300: '#f8c76d',
          400: '#f5a832',
          500: '#f28c0e',
          600: '#e36c08',
          700: '#bc4f09',
          800: '#953e0f',
          900: '#79340f',
        }
      }
    },
  },
  plugins: [],
}

