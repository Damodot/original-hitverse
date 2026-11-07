// Premium membership: karaoke and DJ mode. Until card payments are connected, admins switch it on for people.
import mongoose from 'mongoose';
import { notify } from '../../lib/notify.js';
import { hasPremium, isPremium, premiumPlans } from '../../lib/premium.js';
import { pricing } from '../../lib/pricing.js';
import { User } from '../../models/User.js';
import { requireAdmin } from '../context.js';
import { fail, notFound } from '../errors.js';

const DAY = 24 * 60 * 60 * 1000;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const self = async (u, ctx) => String(u._id) === String(ctx.userId) || (await ctx.user())?.role === 'admin';
const premiumOf = (u) => ({
  active: isPremium(u),
  until: u.premium?.until ?? null,
  plan: u.premium?.plan ?? null,
  source: u.premium?.source ?? null,
});

export const premiumResolvers = {
  Query: {
    premiumPlans: () => premiumPlans(),
    pricing: () => pricing(),
  },
  Mutation: {
    // Adds days to someone's Premium (from today, or from when it ends if it's still running). 0 days ends it.
    adminSetPremium: async (_, { userId, days, plan }, ctx) => {
      const admin = await requireAdmin(ctx);
      if (!mongoose.isValidObjectId(userId)) throw notFound('Account');
      if (!Number.isInteger(days) || days < 0 || days > 3660) throw fail('Days must be between 0 and 3660');
      const user = await User.findById(userId);
      if (!user) throw notFound('Account');
      if (days === 0) {
        user.premium = { until: new Date(), plan: user.premium?.plan, source: 'admin', grantedBy: admin._id, updatedAt: new Date() };
      } else {
        const from = isPremium(user) ? new Date(user.premium.until).getTime() : Date.now();
        user.premium = { until: new Date(from + days * DAY), plan: plan ?? 'gift', source: 'admin', grantedBy: admin._id, updatedAt: new Date() };
      }
      await user.save();
      if (days > 0) {
        await notify(user._id, {
          type: 'premium',
          title: 'You’re on HitVerse Premium',
          body: `Karaoke and DJ mode are yours until ${user.premium.until.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
          link: '/app/premium',
        });
      }
      return user;
    },
  },
  Admin: {
    // Find accounts by name or email; with no search, everyone who's Premium now.
    premiumMembers: async (_, { search }, ctx) => {
      await requireAdmin(ctx);
      const q = search?.trim();
      const filter = q
        ? { $or: ['firstName', 'lastName', 'email'].map((f) => ({ [f]: new RegExp(escapeRegex(q.slice(0, 80)), 'i') })) }
        : { 'premium.until': { $gt: new Date() } };
      return User.find(filter).select('firstName lastName email role premium').sort({ 'premium.until': -1, createdAt: -1 }).limit(50);
    },
  },
  User: {
    hasPremium: async (u, _, ctx) => ((await self(u, ctx)) ? hasPremium(u) : false),
    premium: async (u, _, ctx) => ((await self(u, ctx)) ? premiumOf(u) : null),
  },
};
