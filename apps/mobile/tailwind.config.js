/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // graphite — money is the only color
        ink: '#07080A', // app bg (near-black graphite)
        ink2: '#0E1014', // sheet / modal floor
        surface: '#14181E', // matte card (data)
        surface2: '#1C212A', // elevated chip / input
        hairline: 'rgba(255,255,255,0.08)', // light hairline, not a gray line
        muted: '#8B929E', // secondary text
        faint: '#5B616C', // tertiary / dimmed cents / settled
        text: '#F4F6F8', // primary text (soft white)
        volt: '#B8FF3C', // THE accent — money in motion
        'volt-soft': '#D6FF8A',
        owed: '#6FE6B0', // someone owes you
        owe: '#FF8A8A', // you owe
        ember: '#FF9A6B', // state glow when you owe
        brand: '#B8FF3C', // retired violet -> brand is volt
      },
      fontFamily: {
        display: ['HankenGrotesk_600SemiBold'],
        'display-bold': ['HankenGrotesk_700Bold'],
        body: ['HankenGrotesk_400Regular'],
        'body-medium': ['HankenGrotesk_500Medium'],
        'body-semibold': ['HankenGrotesk_600SemiBold'],
        mono: ['DMMono_500Medium'],
        'mono-regular': ['DMMono_400Regular'],
      },
    },
  },
  plugins: [],
};
