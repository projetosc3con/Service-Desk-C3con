/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        c3con: {
          gold: {
            50: '#fbf8ef',
            100: '#f6f0dd',
            200: '#ede0bd',
            300: '#e1cb96',
            400: '#d4b46c',
            500: '#c5a960', // Primary C3con brand gold
            600: '#b8944d',
            700: '#9a763c',
            800: '#7d5f34',
            900: '#674f2d',
            950: '#3a2a14',
          },
          dark: {
            50: '#f6f7f9',
            100: '#eceef2',
            200: '#d5d9e2',
            300: '#b0b8c8',
            400: '#8391a8',
            500: '#63718c',
            600: '#4d5872',
            700: '#3e475c',
            800: '#33383f', // C3con logo dark slate
            900: '#1e2229', // C3con header charcoal
            950: '#14171c',
          },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
