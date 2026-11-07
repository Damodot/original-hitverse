import mongoose from 'mongoose';

// A fan following an artist (joining their fan base). Fans can follow many.
const followSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true, index: true },
  },
  { timestamps: true },
);
followSchema.index({ user: 1, artist: 1 }, { unique: true });

export const Follow = mongoose.model('Follow', followSchema);
