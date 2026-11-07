import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../../config.js';
import { clearSession, setSession } from '../../lib/auth.js';
import { sendMail } from '../../lib/mailer.js';
import { Artist } from '../../models/Artist.js';
import { User } from '../../models/User.js';
import { limit } from '../context.js';
import { fail } from '../errors.js';

const email = z.string().trim().toLowerCase().email('Enter a valid email');
const password = z.string().min(8, 'Password must be at least 8 characters').max(128);
const signupSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email,
  password,
});
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');
const AUTH_WINDOW = 15 * 60 * 1000; // 30 attempts per 15 minutes per IP

export const authResolvers = {
  Query: {
    me: async (_, __, ctx) => {
      const user = await ctx.user();
      if (!user && ctx.userId) clearSession(ctx.res); // stale cookie for a deleted account
      return user;
    },
  },
  Mutation: {
    signup: async (_, args, ctx) => {
      limit(ctx, 'auth', 30, AUTH_WINDOW);
      const data = signupSchema.parse(args);
      if (await User.exists({ email: data.email })) throw fail('An account with this email already exists', 'CONFLICT', { field: 'email' });
      const user = await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 12),
      });
      setSession(ctx.res, user._id);
      return { user };
    },
    login: async (_, args, ctx) => {
      limit(ctx, 'auth', 30, AUTH_WINDOW);
      const data = z.object({ email, password: z.string().min(1, 'Password is required') }).parse(args);
      const user = await User.findOne({ email: data.email }).select('+passwordHash');
      const ok = user && (await bcrypt.compare(data.password, user.passwordHash));
      if (!ok) throw fail('Invalid email or password', 'UNAUTHENTICATED');
      setSession(ctx.res, user._id);
      return { user };
    },
    logout: (_, __, ctx) => {
      clearSession(ctx.res);
      return true;
    },
    forgotPassword: async (_, args, ctx) => {
      limit(ctx, 'auth', 30, AUTH_WINDOW);
      const { email: addr } = z.object({ email }).parse(args);
      const user = await User.findOne({ email: addr });
      if (user) {
        const token = crypto.randomBytes(32).toString('hex');
        user.resetTokenHash = hashToken(token);
        user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();
        const link = `${config.clientUrl}/reset-password?token=${token}`;
        await sendMail({
          to: user.email,
          subject: 'Reset your HitVerse password',
          text: `Hi ${user.firstName},\n\nReset your password here (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
          html: `<p>Hi ${user.firstName},</p><p><a href="${link}">Reset your HitVerse password</a> (valid for 1 hour).</p><p>If you didn't ask for this, ignore this email.</p>`,
        });
      }
      // Same answer either way, so nobody can probe which emails have accounts.
      return 'If that email has an account, a reset link is on its way.';
    },
    resetPassword: async (_, args, ctx) => {
      limit(ctx, 'auth', 30, AUTH_WINDOW);
      const data = z.object({ token: z.string().min(10), password }).parse(args);
      const user = await User.findOne({ resetTokenHash: hashToken(data.token), resetTokenExpires: { $gt: new Date() } });
      if (!user) throw fail('This reset link is invalid or has expired');
      user.passwordHash = await bcrypt.hash(data.password, 12);
      user.resetTokenHash = undefined;
      user.resetTokenExpires = undefined;
      await user.save();
      setSession(ctx.res, user._id);
      return { user };
    },
  },
  User: {
    id: (u) => String(u._id),
    canUpload: (u) => u.canUpload(),
    artist: (u) => {
      const a = u.artist ?? {};
      return { status: a.status ?? 'none', name: a.name, bio: a.bio, link: a.link, appliedAt: a.appliedAt, reviewedAt: a.reviewedAt, note: a.note };
    },
    // Only the account itself sees which profile it owns and which fan base it reps.
    artistProfile: async (u, _, ctx) => (String(u._id) === String(ctx.userId) || (await ctx.user())?.role === 'admin'
      ? Artist.findOne({ owner: u._id }).lean()
      : null),
    repping: (u, _, ctx) => (String(u._id) === String(ctx.userId) && u.repping ? ctx.artist(u.repping) : null),
  },
};
