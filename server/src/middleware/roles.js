import { User } from '../models/User.js';
import { readSession } from '../lib/auth.js';

// Used by the upload routes (GraphQL has its own checks in graphql/context.js).
function requireAuth(req, res, next) {
  const userId = readSession(req);
  if (!userId) return res.status(401).json({ error: 'You must be signed in' });
  req.userId = userId;
  next();
}

// Roles are read from the database on every request (not from the login cookie),
// so approving, rejecting or demoting someone takes effect immediately.
async function loadUser(req, res, next) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(401).json({ error: 'You must be signed in' });
  req.user = user;
  next();
}

export const signedIn = [requireAuth, loadUser];

export const adminOnly = [
  ...signedIn,
  (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admins only' })),
];

export const approvedArtist = [
  ...signedIn,
  (req, res, next) => (req.user.canUpload()
    ? next()
    : res.status(403).json({ error: 'Your artist account has to be approved before you can upload music' })),
];
