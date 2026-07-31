import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { CabinWithImages } from "@/lib/cabins";

export type PublicCabinsResult = {
  cabins: CabinWithImages[];
  /** Fel som ska visas tydligt för besökaren i stället för en tom sida. */
  error: { code: string; message: string; hint: string } | null;
  checkedAt: string;
};

/**
 * Laddar publicerade stugor som en helt utloggad besökare (anon-nyckel, ingen
 * session). Om RLS eller rättigheter blockerar något returneras felet i stället
 * för att kastas, så att sidan kan visa exakt vad som saknas.
 */
export const listPublicCabins = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicCabinsResult> => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    const checkedAt = new Date().toISOString();

    if (!url || !key) {
      return {
        cabins: [],
        checkedAt,
        error: {
          code: "config_missing",
          message: "Databasanslutningen är inte konfigurerad på servern.",
          hint: "Kontrollera att backend är aktiverat för den här miljön.",
        },
      };
    }

    const supabasePublic = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });

    const { data, error } = await supabasePublic
      .from("cabins")
      .select(
        "id, host_id, slug, title, description, area_slug, address, bedrooms, beds, bathrooms, max_guests, price_per_night, cleaning_fee, amenities, status, instant_book, min_nights, check_in_weekday, size_sqm, cabin_images(url, is_cover, sort_order)",
      )
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      return {
        cabins: [],
        checkedAt,
        error: {
          code: error.code ?? "unknown",
          message: error.message,
          hint:
            error.code === "42501"
              ? "Publik läsbehörighet saknas för stugor eller bilder."
              : (error.hint ?? "Kontrollera behörigheter för publika besökare."),
        },
      };
    }

    return { cabins: (data ?? []) as unknown as CabinWithImages[], error: null, checkedAt };
  },
);