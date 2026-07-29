import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STALE = 60_000;
const GC = 10 * 60_000;

export type Review = {
  id: string;
  booking_id: string;
  cabin_id: string;
  guest_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewWithProfile = Review & {
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

export type PriceAlert = {
  id: string;
  user_id: string;
  email: string;
  area_slug: string | null;
  region_slug: string | null;
  max_price_per_night: number;
  active: boolean;
  last_notified_at: string | null;
  created_at: string;
  updated_at: string;
};

export const cabinReviewsQuery = (cabinId: string) =>
  queryOptions({
    queryKey: ["reviews", "cabin", cabinId],
    staleTime: STALE,
    gcTime: GC,
    queryFn: async (): Promise<ReviewWithProfile[]> => {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("cabin_id", cabinId)
        .order("created_at", { ascending: false });
      const rows = (reviews ?? []) as Review[];
      if (rows.length === 0) return [];
      const guestIds = Array.from(new Set(rows.map((r) => r.guest_id)));
      const { data: profs } = await supabase
        .from("public_profiles" as any)
        .select("id, full_name, avatar_url")
        .in("id", guestIds) as { data: Array<{ id: string; full_name: string | null; avatar_url: string | null }> | null };
      const map = new Map((profs ?? []).map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]));
      return rows.map((r) => ({ ...r, profiles: map.get(r.guest_id) ?? null }));
    },
  });

export const myReviewsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["reviews", "mine", userId],
    staleTime: STALE,
    gcTime: GC,
    queryFn: async (): Promise<Review[]> => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("guest_id", userId);
      return (data ?? []) as Review[];
    },
  });

export const myFavoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["favorites", userId],
    staleTime: STALE,
    gcTime: GC,
    queryFn: async (): Promise<string[]> => {
      const { data } = await supabase
        .from("favorites")
        .select("cabin_id")
        .eq("user_id", userId);
      return (data ?? []).map((r) => r.cabin_id as string);
    },
  });

export const priceAlertsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["price_alerts", userId],
    staleTime: STALE,
    gcTime: GC,
    queryFn: async (): Promise<PriceAlert[]> => {
      const { data } = await supabase
        .from("price_alerts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      return (data ?? []) as PriceAlert[];
    },
  });

export function averageRating(reviews: { rating: number }[]): {
  avg: number;
  count: number;
} {
  if (reviews.length === 0) return { avg: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { avg: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}