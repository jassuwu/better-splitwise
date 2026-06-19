/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: '#0b0d11', // app background
        surface: '#161a20', // card
        surface2: '#1e232b', // elevated / chip
        hairline: '#2a2f39',
        muted: '#8b929e', // secondary text
        owed: '#37d399', // green — owed to you
        owe: '#ff6b6b', // red — you owe
        brand: '#7c5cff', // super·splitwise violet
        'brand-soft': '#a594ff',
      },
    },
  },
  plugins: [],
};
