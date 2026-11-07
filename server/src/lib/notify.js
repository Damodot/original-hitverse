import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

/** Saves an in-app notification. Never throws: a failed notification shouldn't fail the action behind it. */
export async function notify(userIds, { type, title, body, link }) {
  const ids = [].concat(userIds).filter(Boolean);
  if (!ids.length) return;
  try {
    await Notification.insertMany(ids.map((user) => ({ user, type, title, body, link })));
  } catch (err) {
    console.error('[notify] failed:', err.message);
  }
}

export async function notifyAdmins(payload) {
  const admins = await User.find({ role: 'admin' }).select('_id').lean();
  await notify(admins.map((a) => a._id), payload);
}
