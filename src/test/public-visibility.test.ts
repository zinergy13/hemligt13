import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

/**
 * Regression guard: publicerade stugor + deras bilder MÅSTE gå att läsa
 * utan inloggning. Ett tidigare fel var att RLS-policyn anropar
 * public.has_role() och anon saknade EXECUTE på funktionen -> hela
 * läsningen nekades ("permission denied for function has_role").
 *
 * Testet körs mot databasen med den publika nyckeln. Saknas miljövariabler
 * hoppas det över.
 */
const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const d = URL && KEY ? describe : describe.skip;

// Valfria uppgifter för att även testa det inloggade fallet.
const TEST_EMAIL = import.meta.env.VITE_TEST_USER_EMAIL as string | undefined;
const TEST_PASSWORD = import.meta.env.VITE_TEST_USER_PASSWORD as string | undefined;

function client() {
  return createClient(URL!, KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

d("publicerade stugor är synliga för alla", () => {
  const supabase = client();
  let cabinIds: string[] = [];

  beforeAll(async () => {
    const { data } = await supabase
      .from("cabins")
      .select("id")
      .eq("status", "published")
      .limit(20);
    cabinIds = (data ?? []).map((c) => c.id as string);
  });

  it("utloggad kan läsa publicerade stugor utan RLS-fel", async () => {
    const { data, error } = await supabase
      .from("cabins")
      .select("id, slug, title, price_per_night, area_slug, status")
      .eq("status", "published")
      .limit(5);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect((data ?? []).every((c) => c.status === "published")).toBe(true);
  });

  it("utloggad kan läsa bilder för publicerade stugor", async () => {
    if (cabinIds.length === 0) return;
    const { data, error } = await supabase
      .from("cabin_images")
      .select("id, cabin_id, url, is_cover")
      .in("cabin_id", cabinIds)
      .limit(10);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it("utloggad ser inte opublicerade stugor", async () => {
    const { data, error } = await supabase
      .from("cabins")
      .select("id, status")
      .neq("status", "published")
      .limit(5);

    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(0);
  });

  it.runIf(Boolean(TEST_EMAIL && TEST_PASSWORD))(
    "inloggad ser minst lika många publicerade stugor som utloggad",
    async () => {
      const authed = client();
      const { error: signInError } = await authed.auth.signInWithPassword({
        email: TEST_EMAIL!,
        password: TEST_PASSWORD!,
      });
      expect(signInError).toBeNull();

      const { data, error } = await authed
        .from("cabins")
        .select("id")
        .eq("status", "published");
      expect(error).toBeNull();
      expect((data ?? []).length).toBeGreaterThanOrEqual(cabinIds.length);
      await authed.auth.signOut();
    },
  );
});
