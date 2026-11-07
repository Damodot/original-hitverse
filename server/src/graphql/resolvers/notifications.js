import mongoose from 'mongoose';
import { Notification } from '../../models/Notification.js';
import { requireUser } from '../context.js';

export const notificationResolvers = {
  Query: {
    notifications: async (_, __, ctx) => {
      const user = await requireUser(ctx);
      const [items, unread] = await Promise.all([
        Notification.find({ user: user._id }).sort({ createdAt: -1 }).limit(30).lean(),
        Notification.countDocuments({ user: user._id, read: false }),
      ]);
      return { items, unread };
    },
  },
  Mutation: {
    markNotificationsRead: async (_, { ids }, ctx) => {
      const user = await requireUser(ctx);
      const valid = ids ? ids.filter((id) => mongoose.isValidObjectId(id)) : null;
      await Notification.updateMany({ user: user._id, read: false, ...(valid ? { _id: { $in: valid } } : {}) }, { read: true });
      return true;
    },
  },
};
