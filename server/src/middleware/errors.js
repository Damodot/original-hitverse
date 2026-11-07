import multer from 'multer';
import { ZodError } from 'zod';
import { config } from '../config.js';

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    // A missing field gets a plain "X is required" instead of zod's type message.
    if (issue?.code === 'invalid_type' && /received undefined/.test(issue.message) && issue.path.length) {
      const field = String(issue.path.at(-1)).replace(/([A-Z])/g, ' $1').toLowerCase();
      return res.status(400).json({ error: `${field[0].toUpperCase()}${field.slice(1)} is required` });
    }
    return res.status(400).json({ error: issue?.message ?? 'Invalid input' });
  }
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE'
      ? `That file is too big. The limit is ${config.maxAudioMb} MB.`
      : 'That upload looks wrong. Choose one audio file and, optionally, one cover image.';
    return res.status(400).json({ error: msg });
  }
  if (err?.code === 11000 && err.keyPattern?.isrc) return res.status(409).json({ error: 'Another song on HitVerse already has this ISRC', field: 'isrc' });
  if (err?.name === 'CastError') return res.status(400).json({ error: 'Invalid id' });
  console.error(err);
  res.status(err.status ?? 500).json({ error: err.expose ? err.message : 'Something went wrong' });
}
