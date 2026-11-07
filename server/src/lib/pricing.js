// HitVerse's prices and its cut, in one place. Card payments (Paystack) aren't connected yet: when they are,
// every charge and every artist payout is worked out from here.

// HitVerse's fee on money fans pay artists (bants, battle backing, fan-base memberships, live tickets, tips).
// Artists keep the rest. It covers card fees, VAT on the fee, refunds and payouts, with about 11% left over.
export const ARTIST_FEE = 0.15;
// Founding artists pay less for their first year on HitVerse.
export const FOUNDING_FEE = 0.0999;
export const FOUNDING_MONTHS = 12;

/** What the artist and HitVerse each get from a fan's payment, in whole naira. */
export function splitPayment(amountNgn, { founding = false } = {}) {
  const fee = Math.round(amountNgn * (founding ? FOUNDING_FEE : ARTIST_FEE));
  return { artistNgn: amountNgn - fee, hitverseNgn: fee };
}

// Bants, cheapest first. Small ones are paid from coins. Bigger ones are paid directly by card or bank transfer:
// Paystack's fee is capped at ₦2,000, so a ₦1,000,000 bant costs about 0.2% to take.
export const BANTS = [
  { id: 'puff', name: 'Puff', priceNgn: 100 },
  { id: 'fire', name: 'Fire', priceNgn: 500 },
  { id: 'extinguisher', name: 'Extinguisher', priceNgn: 1_000 },
  { id: 'receipts', name: 'Receipts', priceNgn: 5_000 },
  { id: 'smoke-bomb', name: 'Smoke Bomb', priceNgn: 20_000 },
  { id: 'thunder', name: 'Thunder', priceNgn: 100_000 },
  { id: 'diamond', name: 'Diamond', priceNgn: 500_000 },
  { id: 'crown', name: 'Crown', priceNgn: 1_000_000 },
];

// Coin packs. Each stays under ₦2,500, where Paystack waives its ₦100 flat fee, so fans only pay the 1.5%.
export const TOP_UPS_NGN = [500, 1_000, 2_000];

// Premium plans. The defaults can be changed in .env without touching the code.
const price = (key, fallback) => {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : fallback;
};
export const premiumPlans = () => [
  { id: 'weekly', name: 'Weekly', days: 7, priceNgn: price('PREMIUM_WEEKLY_NGN', 300) },
  { id: 'monthly', name: 'Monthly', days: 30, priceNgn: price('PREMIUM_MONTHLY_NGN', 1_000) },
  { id: 'yearly', name: 'Yearly', days: 365, priceNgn: price('PREMIUM_YEARLY_NGN', 10_000) },
];

const percent = (x) => Math.round(x * 10_000) / 100; // 0.0999 -> 9.99, without float noise

/** Everything the site shows about money, for the pricing query. */
export const pricing = () => ({
  artistKeepsPercent: percent(1 - ARTIST_FEE),
  hitverseFeePercent: percent(ARTIST_FEE),
  foundingFeePercent: percent(FOUNDING_FEE),
  foundingMonths: FOUNDING_MONTHS,
  bants: BANTS,
  topUpsNgn: TOP_UPS_NGN,
  premiumPlans: premiumPlans(),
});
