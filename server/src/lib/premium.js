// Premium: what fans pay for. Karaoke and DJ mode are Premium; admins always have them.
// Works on a full user document or a plain (lean) one.
export const isPremium = (user) => Boolean(user?.premium?.until && new Date(user.premium.until) > new Date());
export const hasPremium = (user) => user?.role === 'admin' || isPremium(user);

// The plans and their prices live in lib/pricing.js with the rest of HitVerse's prices.
export { premiumPlans } from './pricing.js';
