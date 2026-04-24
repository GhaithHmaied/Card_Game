/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          DEFAULT: '#1a5c2e',
          dark: '#0f3d1d',
          light: '#24783c',
        },
        card: {
          back: '#1e3a5f',
          front: '#fefefe',
        },
        gold: '#d4a843',
      },
      animation: {
        'card-deal': 'cardDeal 0.4s ease-out',
        'card-play': 'cardPlay 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-in',
      },
      keyframes: {
        cardDeal: {
          '0%': { transform: 'translate(0, -100px) rotate(-10deg)', opacity: '0' },
          '100%': { transform: 'translate(0, 0) rotate(0deg)', opacity: '1' },
        },
        cardPlay: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1) translateY(-20px)' },
          '100%': { transform: 'scale(1) translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
