// Song and cover files live in MongoDB itself (GridFS), so a cloud database like Atlas holds everything.
import mongoose from 'mongoose';

let bucket;
export const getBucket = () =>
  (bucket ??= new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'media' }));

export const mediaUrl = (id) => `/api/media/${id}`;

export function saveFile(buffer, { filename, contentType, metadata = {} }) {
  return new Promise((resolve, reject) => {
    const stream = getBucket().openUploadStream(filename, { metadata: { ...metadata, contentType } });
    stream.once('finish', () => resolve(stream.id));
    stream.once('error', reject);
    stream.end(buffer);
  });
}

export async function deleteFile(id) {
  if (!id) return;
  try {
    await getBucket().delete(id);
  } catch (err) {
    if (!/FileNotFound|not found/i.test(err.message)) throw err;
  }
}
