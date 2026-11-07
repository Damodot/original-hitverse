import mongoose from 'mongoose';

// An artist's public profile and fan base. Created when an artist is approved (or by the seed for DAMODOT),
// then filled in by the artist during onboarding.
const socialsSchema = new mongoose.Schema({
  instagram: String, tiktok: String, x: String, youtube: String, facebook: String, website: String,
}, { _id: false });

const artistSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    bio: { type: String, trim: true, maxlength: 3000, default: '' },
    genre: { type: String, trim: true, maxlength: 60, default: '' },
    location: { type: String, trim: true, maxlength: 80, default: '' },
    avatar: { type: String, default: '' },
    banner: { type: String, default: '' },
    socials: { type: socialsSchema, default: () => ({}) },
    // What the fans are called: "Disturbers" (plural) and "Disturber" (one fan).
    fanBase: {
      name: { type: String, trim: true, maxlength: 40, default: '' },
      member: { type: String, trim: true, maxlength: 40, default: '' },
    },
    // Shown to fans repping this fan base, e.g. "You're an official Disturber".
    welcome: { type: String, trim: true, maxlength: 140, default: '' },
    gallery: { type: [{ _id: false, src: String, title: String, alt: String }], default: [] },
    showcaseVideo: { type: String, default: '' },
    showcasePoster: { type: String, default: '' },
    featured: { type: Boolean, default: false, index: true },
    verified: { type: Boolean, default: false },
    onboarded: { type: Boolean, default: false },
    followerCount: { type: Number, default: 0, min: 0 },
    // Image files stored in the database (so replacing them can delete the old ones).
    files: { avatar: { type: mongoose.Schema.Types.ObjectId, default: null }, banner: { type: mongoose.Schema.Types.ObjectId, default: null } },
  },
  { timestamps: true },
);

export const Artist = mongoose.model('Artist', artistSchema);
