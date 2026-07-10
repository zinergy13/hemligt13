import { supabase } from "@/integrations/supabase/client";

export const AMENITY_OPTIONS = [
  { value: "wifi", label: "Wifi" },
  { value: "bastu", label: "Bastu" },
  { value: "eldstad", label: "Eldstad" },
  { value: "ski-in-ski-out", label: "Ski-in / Ski-out" },
  { value: "diskmaskin", label: "Diskmaskin" },
  { value: "tvattmaskin", label: "Tvättmaskin" },
  { value: "torktumlare", label: "Torktumlare" },
  { value: "parkering", label: "Parkering" },
  { value: "tv", label: "TV" },
  { value: "husdjur-ok", label: "Husdjur OK" },
  { value: "rokfritt", label: "Rökfritt" },
  { value: "barnvanligt", label: "Barnvänligt" },
] as const;

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || "stuga"}-${suffix}`;
}

export function publicImageUrl(path: string): string {
  const { data } = supabase.storage.from("cabin-images").getPublicUrl(path);
  return data.publicUrl;
}

export type CabinStatus = "draft" | "published" | "paused";

export type CabinWithImages = {
  id: string;
  host_id: string;
  slug: string;
  title: string;
  description: string | null;
  area_slug: string;
  address: string | null;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  price_per_night: number;
  cleaning_fee: number;
  amenities: string[];
  status: CabinStatus;
  instant_book: boolean;
  min_nights: number | null;
  check_in_weekday: number | null;
  cabin_images: { url: string; is_cover: boolean; sort_order: number }[];
};

export function coverImage(cabin: { cabin_images?: { url: string; is_cover: boolean; sort_order: number }[] }): string | null {
  const imgs = cabin.cabin_images ?? [];
  if (imgs.length === 0) return null;
  const cover = imgs.find((i) => i.is_cover);
  if (cover) return cover.url;
  return [...imgs].sort((a, b) => a.sort_order - b.sort_order)[0].url;
}