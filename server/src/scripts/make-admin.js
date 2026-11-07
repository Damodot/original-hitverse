// Usage: npm run make-admin -- you@example.com         (gives that account admin rights)
//        npm run make-admin -- you@example.com --remove
// The account must already exist, so sign up on the site first.
import mongoose from 'mongoose';
import { connectDb } from '../db.js';
import { User } from '../models/User.js';

const email = process.argv[2]?.trim().toLowerCase();
const remove = process.argv.includes('--remove');
if (!email || !email.includes('@')) {
  console.error('Usage: npm run make-admin -- you@example.com [--remove]');
  process.exit(1);
}

await connectDb();
const user = await User.findOneAndUpdate({ email }, { role: remove ? 'user' : 'admin' }, { new: true });
if (!user) {
  console.error(`No account with the email ${email}. Sign up on the site first, then run this again.`);
  process.exitCode = 1;
} else {
  console.log(remove ? `${email} is no longer an admin.` : `${email} is now an admin. Open /app/admin after signing in.`);
}
await mongoose.disconnect();
