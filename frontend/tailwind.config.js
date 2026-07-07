/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        background: '#050505',
        surface: '#0A0A0A',
        surfaceHover: '#111111',
        border: 'rgba(255, 255, 255, 0.06)',
        muted: '#71717a',
        navy: {
          900: '#050505',
          800: '#0A0A0A',
          700: '#111111',
          600: '#1A1A1A',
          light: '#222222',
          deep: '#000000',
        },
        gold: {
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
        },
        accent: {
          teal: '#6fffe9',
          blue: '#3B82F6',
        }
      },
      backgroundImage: {
        'noise': "url('/noise.png')",
        'glow': 'radial-gradient(ellipse 50% 40% at 50% -10%, rgba(59,130,246,0.06), transparent)',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
