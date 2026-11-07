import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gql } from '@/lib/api';
import { toast } from '@/lib/toast';

export const usePremiumPlans = () =>
  useQuery({ queryKey: ['premium', 'plans'], queryFn: () => gql('query { premiumPlans { id name days priceNgn } }').then((d) => d.premiumPlans), staleTime: 10 * 60_000 });

/** HitVerse's cut, the bants and their prices, coin packs and Premium plans. Public: the landing page uses it. */
export const usePricing = () =>
  useQuery({
    queryKey: ['pricing'],
    queryFn: () => gql('query { pricing { artistKeepsPercent foundingFeePercent foundingMonths bants { id name priceNgn } topUpsNgn } }').then((d) => d.pricing),
    staleTime: 60 * 60_000,
  });

export const usePremiumMembers = (search, { enabled = true } = {}) =>
  useQuery({
    queryKey: ['admin', 'premium', search],
    queryFn: () => gql('query($q: String) { admin { premiumMembers(search: $q) { _id firstName lastName email role premium { active until plan source } } } }', { q: search || null })
      .then((d) => d.admin.premiumMembers),
    enabled,
  });

export function useSetPremium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, days, plan }) => gql('mutation($id: ID!, $d: Int!, $p: String) { adminSetPremium(userId: $id, days: $d, plan: $p) { _id premium { until } } }', { id, d: days, p: plan }),
    onSuccess: (_d, { name, days }) => {
      toast.success(days ? `${name} is Premium` : `${name}’s Premium has ended`);
      qc.invalidateQueries({ queryKey: ['admin', 'premium'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`;
