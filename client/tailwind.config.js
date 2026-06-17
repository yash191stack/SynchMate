/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0B0F17',
          card: '#151C2C',
          purple: '#8B5CF6',
          mint: '#10B981',
          pink: '#EC4899',
          border: '#0F172A',
        }
      },
      boxShadow: {
        neobrutal: '5px 5px 0px 0px #000000',
        neobrutalPink: '5px 5px 0px 0px #EC4899',
        neobrutalMint: '5px 5px 0px 0px #10B981',
        glow: '0 0 15px rgba(139, 92, 246, 0.4)',
      }
    },
  },
  plugins: [],
}
