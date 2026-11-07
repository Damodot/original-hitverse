import { z } from 'zod';

// "Ade, Tolu & Kemi" or an array -> ["Ade", "Tolu", "Kemi"]
const names = z.union([z.string(), z.array(z.string())]).optional().transform((v) => {
  const list = Array.isArray(v) ? v : String(v ?? '').split(/\s*(?:,|&|\band\b|\n)\s*/i);
  return [...new Set(list.map((n) => n.trim()).filter(Boolean))].slice(0, 20);
}).refine((list) => list.every((n) => n.length <= 80), 'A name is too long');

export const creditsSchema = z.object({ writers: names, producers: names });

/** Credits to store, or undefined when both lists are empty. */
export function toCredits(input) {
  const { writers, producers } = creditsSchema.parse(input ?? {});
  return writers.length || producers.length ? { writers, producers } : undefined;
}
