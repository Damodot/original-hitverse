import mongoose from 'mongoose';

const albumSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    artist: { type: String, default: 'Damodot' },
    artistId: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', default: null, index: true },
    cover: { type: String, required: true },
    type: { type: String, enum: ['EP', 'Album'], default: 'EP' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Album = mongoose.model('Album', albumSchema);
