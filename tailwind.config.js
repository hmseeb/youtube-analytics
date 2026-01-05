/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      colors: {
        youtube: {
          red: '#ff0050',
          lightred: '#ff4d4d',
        },
        accent: {
          cyan: '#00d4ff',
          green: '#00ff88',
          gold: '#ffd700',
          purple: '#a855f7',
        },
      },
      animation: {
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'slide-in': 'slideIn 0.6s ease-out',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
