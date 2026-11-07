import mongoose from 'mongoose';
import { Song } from '../models/Song.js';
import { forbidden, notFound } from './errors.js';
import { requireUser } from './context.js';

/** The song if the signed-in person may edit it (admins: any; approved artists: their own uploads). */
export async function editableSong(ctx, id, select) {
  const user = await requireUser(ctx);
  if (!mongoose.isValidObjectId(id)) throw notFound('Song');
  const query = Song.findById(id);
  if (select) query.select(select);
  const song = await query;
  if (!song) throw notFound('Song');
  const own = song.uploader && String(song.uploader) === String(user._id);
  if (user.role !== 'admin' && !(own && user.canUpload())) throw forbidden('You can only edit your own songs');
  return song;
}
