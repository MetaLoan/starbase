const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cosmic color palette
        cosmic: {
          void: '#0a0a0f',
          nebula: '#1a1a2e',
          stellar: '#16213e',
          aurora: '#0f3460',
          nova: '#e94560',
        },
        zodiac: {
          fire: '#ff6b35',
          earth: '#7cb518',
          air: '#00b4d8',
          water: '#7209b7',
        },
        planet: {
          sun: '#ffd700',
          moon: '#c0c0c0',
          mercury: '#b5651d',
          venus: '#ff69b4',
          mars: '#dc143c',
          jupiter: '#daa520',
          saturn: '#8b7355',
          uranus: '#40e0d0',
          neptune: '#4169e1',
          pluto: '#800080',
        }
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Cormorant Garamond', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'spin-slow': 'spin 60s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.05)' },
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg) translateX(50px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(50px) rotate(-360deg)' },
        }
      },
      backgroundImage: {
        'cosmic-gradient': 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)',
        'zodiac-ring': 'conic-gradient(from 0deg, #ff6b35, #7cb518, #00b4d8, #7209b7, #ff6b35)',
      }
    },
  },
  darkMode: "class",
  plugins: [heroui({
    themes: {
      dark: {
        colors: {
          background: "#0a0a0f",
          foreground: "#e8e8e8",
          primary: {
            50: "#1a1a2e",
            100: "#2a2a4e",
            200: "#3a3a6e",
            300: "#4a4a8e",
            400: "#5a5aae",
            500: "#6a6ace",
            600: "#7a7aee",
            700: "#8a8aff",
            800: "#9a9aff",
            900: "#aaaaff",
            DEFAULT: "#6a6ace",
            foreground: "#ffffff",
          },
          focus: "#e94560",
        },
      },
    },
  })],
}

