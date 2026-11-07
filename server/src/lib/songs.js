import { Rating } from '../models/Rating.js';
import { Song } from '../models/Song.js';
import { User } from '../models/User.js';
import { deleteFile } from './storage.js';

/** Removes a song, its stored files, and every like pointing at it. */
export async function deleteSong(song) {
  await Song.deleteOne({ _id: song._id });
  await User.updateMany({ likes: song._id }, { $pull: { likes: song._id } });
  await Rating.deleteMany({ song: song._id });
  await Promise.all([deleteFile(song.files?.audio), deleteFile(song.files?.cover), deleteFile(song.karaoke?.file)]);
}
