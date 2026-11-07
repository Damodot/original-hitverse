import mongoose from 'mongoose';

// A live voice or video room an artist opens for fans they pick. The call itself runs on LiveKit; this is
// who may join, and when.
const liveRoomSchema = new mongoose.Schema(
  {
    artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true, index: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    kind: { type: String, enum: ['audio', 'video'], required: true },
    status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'live', index: true },
    // Only these fans (plus the host and admins) can join.
    invitees: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
    // Fans the host removed: they can't come back to this room.
    removed: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
    // Off: fans join muted and raise a hand; the host lets them speak.
    fansCanSpeak: { type: Boolean, default: true },
    startsAt: Date,
    startedAt: Date,
    endedAt: Date,
  },
  { timestamps: true },
);
liveRoomSchema.index({ invitees: 1, status: 1 });

export const LiveRoom = mongoose.model('LiveRoom', liveRoomSchema);
