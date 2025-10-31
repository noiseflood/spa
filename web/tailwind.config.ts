import type { Config } from 'tailwindcss';
import autoColors from './tailwind-auto-colors';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'roboto-mono': ['Roboto Mono', 'monospace'],
        mono: ['Roboto Mono', 'monospace'],
      },
      animation: {
        glow: 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          from: {
            filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))',
          },
          to: {
            filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.8))',
          },
        },
      },
    },
  },
  plugins: [autoColors],
};

export default config;
