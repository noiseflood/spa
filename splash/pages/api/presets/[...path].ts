import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: pathArray } = req.query;

  if (!pathArray || !Array.isArray(pathArray)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const filePath = path.join(process.cwd(), 'presets', ...pathArray);

  // Security check to prevent directory traversal
  if (!filePath.startsWith(path.join(process.cwd(), 'presets'))) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if file exists and is a .spa file
  if (!filePath.endsWith('.spa') || !fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Preset not found' });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(content);
  } catch (error) {
    console.error('Error reading preset file:', error);
    res.status(500).json({ error: 'Failed to load preset' });
  }
}