#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Copy presets to public
const presetsDir = path.join(__dirname, '../presets');
const publicPresetsDir = path.join(__dirname, '../public/presets');

// Create public/presets directory if it doesn't exist
if (!fs.existsSync(publicPresetsDir)) {
  fs.mkdirSync(publicPresetsDir, { recursive: true });
}

// Copy all preset files recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(presetsDir, publicPresetsDir);

// Generate presets.json index with categories
function generatePresetCategories(dir) {
  const categories = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const categoryDir = entry.name;
      const categoryPath = path.join(dir, categoryDir);
      const files = fs.readdirSync(categoryPath);
      
      // Convert directory name to title case (e.g., "ui-feedback" -> "UI Feedback")
      const categoryName = categoryDir
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      categories[categoryName] = {};
      
      // Add all .spa files in this category
      for (const file of files) {
        if (file.endsWith('.spa')) {
          const fileName = file.replace(/\.spa$/, '');
          // Convert file name to title case (e.g., "button-click" -> "Button Click")
          const presetName = fileName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          categories[categoryName][presetName] = `${categoryDir}/${file}`;
        }
      }
    }
  }

  return categories;
}

const categories = generatePresetCategories(presetsDir);

// Also generate a simple list for index.tsx
const allFiles = [];
Object.values(categories).forEach(category => {
  Object.values(category).forEach(filePath => {
    allFiles.push(filePath.replace('.spa', ''));
  });
});

// Write to public directory for static export
const publicPresetsJsonPath = path.join(__dirname, '../public/presets.json');
fs.writeFileSync(publicPresetsJsonPath, JSON.stringify(allFiles, null, 2));

const totalPresets = Object.values(categories).reduce((sum, cat) => sum + Object.keys(cat).length, 0);
console.log(`Generated presets.json with ${Object.keys(categories).length} categories and ${totalPresets} presets`);

// Copy schema file
const schemaPath = path.join(__dirname, '../../schema/spa-v1.schema.json');
const publicSchemaPath = path.join(__dirname, '../public/ns.json');
fs.copyFileSync(schemaPath, publicSchemaPath);

console.log('Copied schema to public/ns.json');
