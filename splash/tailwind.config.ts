import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-dark': '#4f46e5',
        secondary: '#8b5cf6',
        background: '#0f0f23',
        surface: '#1a1b3a',
        accent: '#f472b6',
      },
      animation: {
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          'from': {
            filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))'
          },
          'to': {
            filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.8))'
          }
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      }
    },
  },
  plugins: [],
}

export default config