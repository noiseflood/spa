/**
 * Integration tests for SPA core library
 */

const fs = require('fs');
const path = require('path');

// Import the built library
const { parseSPA, validateSPA } = require('../dist/spa.cjs.js');

describe('SPA Core Integration', () => {
  const examplesDir = path.join(__dirname, '../../../examples');

  describe('Parser', () => {
    it('should parse a simple tone element', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="440" dur="1.0" amp="0.5"/>
</spa>`;

      const doc = parseSPA(xml);
      expect(doc).toBeDefined();
      expect(doc.version).toBe('1.0');
      expect(doc.sounds).toHaveLength(1);
      expect(doc.sounds[0].type).toBe('tone');
    });

    it('should parse a group with multiple elements', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <group>
    <tone wave="sine" freq="440" dur="1.0"/>
    <noise color="white" dur="0.5"/>
  </group>
</spa>`;

      const doc = parseSPA(xml);
      expect(doc).toBeDefined();
      expect(doc.sounds).toHaveLength(1);
      expect(doc.sounds[0].type).toBe('group');
      expect(doc.sounds[0].sounds).toHaveLength(2);
    });

    it('should parse automation parameters', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" dur="1.0"
        freq.start="200" freq.end="800" freq.curve="exp"/>
</spa>`;

      const doc = parseSPA(xml);
      const tone = doc.sounds[0];
      expect(tone.freq).toEqual({
        start: 200,
        end: 800,
        curve: 'exp',
      });
    });
  });

  describe('Example Files', () => {
    // Get all .spa files from examples directory
    const getExampleFiles = (dir) => {
      const files = [];
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...getExampleFiles(fullPath));
        } else if (item.endsWith('.spa')) {
          files.push(fullPath);
        }
      }

      return files;
    };

    const exampleFiles = getExampleFiles(examplesDir);

    test.each(exampleFiles)('should parse %s', (filePath) => {
      const xml = fs.readFileSync(filePath, 'utf8');
      const doc = parseSPA(xml);

      expect(doc).toBeDefined();
      expect(doc.version).toBe('1.0');
      expect(doc.sounds).toBeDefined();
      expect(Array.isArray(doc.sounds)).toBe(true);
    });
  });

  describe('Validator', () => {
    it('should validate a correct SPA document', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine" freq="440" dur="1.0"/>
</spa>`;

      const result = validateSPA(xml);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch invalid wave type', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="invalid" freq="440" dur="1.0"/>
</spa>`;

      const result = validateSPA(xml);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should catch missing required attributes', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<spa xmlns="https://spa.audio/ns" version="1.0">
  <tone wave="sine"/>
</spa>`;

      const result = validateSPA(xml);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
