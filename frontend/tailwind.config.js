/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0A0E1A',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
          light: '#243049',
          deep: '#070A12',
        },
        gold: {
          400: '#F3C68F',
          500: '#D4AF37',
          600: '#AA882C',
        },
        accent: {
          teal: '#6fffe9',
          blue: '#5BC0BE',
        }
      },
    },
  },
  plugins: [],
}

