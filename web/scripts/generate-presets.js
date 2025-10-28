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

// Generate presets.json index
function getAllSpaFiles(dir, baseDir = dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getAllSpaFiles(fullPath, baseDir));
    } else if (entry.name.endsWith('.spa')) {
      const relativePath = path.relative(baseDir, fullPath);
      // Remove .spa extension
      files.push(relativePath.replace(/\.spa$/, '').replace(/\\/g, '/'));
    }
  }

  return files;
}

const spaFiles = getAllSpaFiles(presetsDir);
const presetsJsonPath = path.join(__dirname, '../public/presets.json');
fs.writeFileSync(presetsJsonPath, JSON.stringify(spaFiles, null, 2));

console.log(`Generated presets.json with ${spaFiles.length} presets`);

// Copy schema file
const schemaPath = path.join(__dirname, '../../schema/spa-v1.0.schema.json');
const publicSchemaPath = path.join(__dirname, '../public/ns.json');
fs.copyFileSync(schemaPath, publicSchemaPath);

console.log('Copied schema to public/ns.json');
