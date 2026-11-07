// Streams files stored in GridFS. Supports range requests so the player can seek.
import { pipeline } from 'node:stream/promises';
import { Router } from 'express';
import mongoose from 'mongoose';
import { getBucket } from '../lib/storage.js';

const router = Router();

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Not found' });
  const id = new mongoose.Types.ObjectId(req.params.id);
  const [file] = await getBucket().find({ _id: id }).limit(1).toArray();
  if (!file) return res.status(404).json({ error: 'Not found' });

  const etag = `"${file._id}"`;
  const size = file.length;
  // A file id never points at different bytes, so browsers can cache it for good.
  res.set({
    'Content-Type': file.metadata?.contentType ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
    ETag: etag,
  });
  if (req.headers['if-none-match'] === etag) return res.status(304).end();

  let start = 0;
  let end = size - 1;
  const range = req.headers.range;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (m && (m[1] || m[2])) {
      if (m[1]) {
        start = Number(m[1]);
        if (m[2]) end = Math.min(Number(m[2]), size - 1);
      } else {
        start = Math.max(0, size - Number(m[2])); // "bytes=-500" means the last 500 bytes
      }
    }
    if (!m || !(m[1] || m[2]) || start > end) {
      res.set('Content-Range', `bytes */${size}`);
      return res.status(416).end();
    }
    res.status(206).set('Content-Range', `bytes ${start}-${end}/${size}`);
  }
  res.set('Content-Length', String(end - start + 1));
  if (req.method === 'HEAD' || size === 0) return res.end();

  try {
    await pipeline(getBucket().openDownloadStream(id, { start, end: end + 1 }), res);
  } catch {
    // The listener skipped ahead or closed the tab; nothing to do.
  }
});

export default router;
