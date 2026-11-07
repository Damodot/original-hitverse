import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['application', 'approved', 'rejected', 'song-removed', 'karaoke', 'live', 'premium'], required: true },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, maxlength: 500 },
    link: { type: String, maxlength: 200 }, // a path inside the app, e.g. /app/admin
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);
notificationSchema.index({ user: 1, createdAt: -1 });
// Old notifications clean themselves up after 90 days.
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const Notification = mongoose.model('Notification', notificationSchema);
