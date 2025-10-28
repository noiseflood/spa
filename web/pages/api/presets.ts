import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const basePath = process.cwd().endsWith('web')
    ? process.cwd()
    : path.join(process.cwd(), 'web');

  const presetsDir = path.join(basePath, 'presets');

  try {
    // Recursively get all .spa files
    const getAllSpaFiles = (dir: string, baseDir: string = dir): string[] => {
      const files: string[] = [];
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          files.push(...getAllSpaFiles(fullPath, baseDir));
        } else if (item.endsWith('.spa')) {
          // Get relative path from presets directory
          const relativePath = path.relative(baseDir, fullPath);
          // Remove .spa extension for the response
          files.push(relativePath.replace(/\.spa$/, ''));
        }
      }

      return files;
    };

    const spaFiles = getAllSpaFiles(presetsDir);
    res.status(200).json(spaFiles);
  } catch (error) {
    console.error('Error reading presets directory:', error);
    res.status(500).json({ error: 'Failed to load presets' });
  }
}
