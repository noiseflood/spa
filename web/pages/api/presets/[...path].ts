import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: pathArray } = req.query;

  if (!pathArray || !Array.isArray(pathArray)) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  // In Next.js, when running from web directory, we need to use the correct base path
  const basePath = process.cwd().endsWith('web')
    ? process.cwd()
    : path.join(process.cwd(), 'web');

  const filePath = path.join(basePath, 'presets', ...pathArray);
  const presetsDir = path.join(basePath, 'presets');

  // Security check to prevent directory traversal
  if (!filePath.startsWith(presetsDir)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Check if file exists and is a .spa file
  if (!filePath.endsWith('.spa') || !fs.existsSync(filePath)) {
    console.error('Preset not found:', {
      requestedPath: pathArray.join('/'),
      filePath,
      exists: fs.existsSync(filePath),
      cwd: process.cwd()
    });
    return res.status(404).json({ error: 'Preset not found', details: { requestedPath: pathArray.join('/'), filePath } });
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