/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        teal:    { DEFAULT: '#00d4aa', 900: '#003d30' },
        amber:   { DEFAULT: '#f59e0b' },
        long:    { DEFAULT: '#3b82f6' },
        short:   { DEFAULT: '#a855f7' },
        surface: '#0d1117',
        card:    '#111720',
        border:  '#1c2636',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Space Grotesk"', '"Noto Sans Thai"', 'sans-serif'],
      },
      backdropBlur: { '4xl': '80px' },
      keyframes: {
        pulse:   { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
        slideUp: { from: { transform: 'translateY(12px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        spin:    { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        pulse:    'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up': 'slideUp 0.3s ease',
        'fade-in':  'fadeIn 0.25s ease',
        spin:     'spin 1s linear infinite',
      },
    },
  },
  plugins: [],
};
