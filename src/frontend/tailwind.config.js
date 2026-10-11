/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#1a1b26',
          text: '#a9b1d6',
          green: '#9ece6a',
          red: '#f7768e',
          blue: '#7aa2f7',
          yellow: '#e0af68',
        },
      },
    },
  },
  plugins: [],
};
