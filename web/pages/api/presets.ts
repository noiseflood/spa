import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const presetsDir = path.join(process.cwd(), 'presets');

  try {
    const categories: Record<string, Record<string, string>> = {};

    // Read all directories in the presets folder
    const dirs = fs
      .readdirSync(presetsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    // For each directory (category), find all .spa files
    dirs.forEach((categoryDir) => {
      const categoryPath = path.join(presetsDir, categoryDir);
      const files = fs
        .readdirSync(categoryPath, { withFileTypes: true })
        .filter((dirent) => dirent.isFile() && dirent.name.endsWith('.spa'))
        .map((dirent) => dirent.name);

      if (files.length > 0) {
        // Convert category name from kebab-case to Title Case
        const categoryName = categoryDir
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        categories[categoryName] = {};

        files.forEach((file) => {
          // Convert filename to preset name (remove .spa and convert kebab-case to Title Case)
          const presetName = file
            .replace('.spa', '')
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          categories[categoryName][presetName] = `${categoryDir}/${file}`;
        });
      }
    });

    res.status(200).json({ categories });
  } catch (error) {
    console.error('Error reading presets directory:', error);
    res.status(500).json({ error: 'Failed to load presets' });
  }
}
