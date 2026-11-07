import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    // The fan base this fan is representing right now (they can follow many and switch any time).
    repping: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', default: null },
    // 'admin' can review artist applications and remove uploads. Set with `npm run make-admin -- <email>`.
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    // Anyone can apply to be an artist. Only 'approved' artists can upload.
    artist: {
      status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none', index: true },
      name: { type: String, trim: true, maxlength: 60 },
      bio: { type: String, trim: true, maxlength: 1000 },
      link: { type: String, trim: true, maxlength: 300 },
      appliedAt: Date,
      reviewedAt: Date,
      note: { type: String, trim: true, maxlength: 500 }, // reason shown to the artist when rejected
    },
    // Premium: paid features (karaoke, DJ mode). Time-limited: it ends at `until`.
    premium: {
      until: Date,
      plan: { type: String, enum: ['weekly', 'monthly', 'yearly', 'gift'] },
      source: { type: String, enum: ['admin', 'payment'] },
      grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      updatedAt: Date,
    },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

userSchema.methods.canUpload = function canUpload() {
  return this.role === 'admin' || this.artist?.status === 'approved';
};

userSchema.methods.toPublic = function toPublic() {
  const a = this.artist ?? {};
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    canUpload: this.canUpload(),
    artist: { status: a.status ?? 'none', name: a.name, bio: a.bio, link: a.link, appliedAt: a.appliedAt, note: a.note },
  };
};

export const User = mongoose.model('User', userSchema);
