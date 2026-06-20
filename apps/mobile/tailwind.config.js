/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // iOS system semantic colours (dark mode — app is locked dark)
      colors: {
        groupedBg: '#000000', // systemGroupedBackground (screen)
        cell: '#1C1C1E', // secondarySystemGroupedBackground (cells/cards/inputs)
        cell2: '#2C2C2E', // tertiarySystemGroupedBackground (pressed / elevated)
        label: '#FFFFFF', // label
        secondaryLabel: 'rgba(235,235,245,0.6)',
        tertiaryLabel: 'rgba(235,235,245,0.3)',
        separator: 'rgba(84,84,88,0.6)',
        fill: 'rgba(120,120,128,0.36)',
        fill3: 'rgba(118,118,128,0.24)', // segmented / chip track
        tint: '#d4fd80', // brand accent (lime) — use /opacity for variants
        red: '#FF453A', // you owe + destructive
        green: '#30D158', // owed to you
      },
    },
  },
  plugins: [],
};
