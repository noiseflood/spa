import { readFileSync } from 'fs';
import { join } from 'path';
import plugin from 'tailwindcss/plugin';

// Read and parse colors.css at build time
function loadColors() {
  const colorsPath = join(__dirname, 'styles/colors.css');
  const cssContent = readFileSync(colorsPath, 'utf-8');

  const colors: Record<string, string> = {};

  // Extract all color variables from CSS
  const regex = /--color-([^:]+):\s*([^;]+);/g;
  let match;

  while ((match = regex.exec(cssContent)) !== null) {
    const colorName = match[1];
    const colorValue = match[2].trim();
    colors[colorName] = colorValue;
  }

  return colors;
}

// This plugin automatically reads colors from colors.css and registers them as Tailwind utilities
export default plugin(function() {}, {
  theme: {
    extend: {
      colors: loadColors()
    }
  }
});