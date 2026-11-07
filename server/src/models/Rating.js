import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    song: { type: mongoose.Schema.Types.ObjectId, ref: 'Song', required: true, index: true },
    value: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true },
);
ratingSchema.index({ user: 1, song: 1 }, { unique: true });

export const Rating = mongoose.model('Rating', ratingSchema);
