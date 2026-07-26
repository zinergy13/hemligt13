import { supabase } from "@/integrations/supabase/client";

/**
 * Extra-tjänster (städ, matlogistik, ved, linne).
 * Alla priser i öre för konsekvent hantering med commission/booking-fee.
 */

export type ExtraServiceType = "cleaning" | "groceries" | "firewood" | "linen";

export type AppSettings = {
  cleaning_markup_percent: number;
  grocery_delivery_fee: number;
  firewood_markup_percent: number;
  linen_markup_percent: number;
};

export const DEFAULT_SETTINGS: AppSettings = {
  cleaning_markup_percent: 25,
  grocery_delivery_fee: 24900,
  firewood_markup_percent: 20,
  linen_markup_percent: 20,
};

// Gästpris per enhet (öre). PRD anger 150 kr/säck ved, 290 kr/linne per person.
export const FIREWOOD_GUEST_PRICE_ORE = 15000;
export const LINEN_GUEST_PRICE_ORE = 29000;

export type CleaningFirmMatch = {
  firm_id: string;
  firm_name: string;
  price_to_firm: number; // öre
};

/** Hämta app_settings (marginalfält). */
export async function fetchAppSettings(): Promise<AppSettings> {
  const { data } = await supabase
    .from("app_settings")
    .select("cleaning_markup_percent, grocery_delivery_fee, firewood_markup_percent, linen_markup_percent")
    .eq("id", 1)
    .maybeSingle();
  return {
    cleaning_markup_percent: data?.cleaning_markup_percent ?? DEFAULT_SETTINGS.cleaning_markup_percent,
    grocery_delivery_fee: data?.grocery_delivery_fee ?? DEFAULT_SETTINGS.grocery_delivery_fee,
    firewood_markup_percent: data?.firewood_markup_percent ?? DEFAULT_SETTINGS.firewood_markup_percent,
    linen_markup_percent: data?.linen_markup_percent ?? DEFAULT_SETTINGS.linen_markup_percent,
  };
}

/**
 * Hitta städfirma + pris för ett område och en storlek (kvm).
 * Returnerar null om ingen firma täcker området eller intervallet.
 */
export async function findCleaningPrice(
  areaSlug: string,
  sizeSqm: number,
): Promise<CleaningFirmMatch | null> {
  // Uses a SECURITY DEFINER RPC so the client does not need direct SELECT
  // access to cleaning_firms / cleaning_firm_prices (which contain internal
  // wholesale cost data).
  const { data, error } = await supabase.rpc("find_cleaning_match", {
    _area_slug: areaSlug,
    _size_sqm: sizeSqm,
  });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  return {
    firm_id: row.firm_id,
    firm_name: row.firm_name ?? "Städfirma",
    price_to_firm: row.price_to_firm,
  };
}

/** Räkna om ett kostpris till gästpris givet markup i procent. Round to nearest krona (100 öre). */
export function applyMarkup(costOre: number, markupPercent: number): number {
  const raw = costOre * (1 + markupPercent / 100);
  return Math.round(raw / 100) * 100;
}

export type ExtraLine = {
  service_type: ExtraServiceType;
  label: string;
  quantity: number;
  cost_price: number; // öre
  guest_price: number; // öre
  platform_fee: number; // öre = guest - cost
  service_provider_id?: string | null;
};

export function cleaningLine(
  match: CleaningFirmMatch,
  markupPercent: number,
): ExtraLine {
  const guest = applyMarkup(match.price_to_firm, markupPercent);
  return {
    service_type: "cleaning",
    label: `Slutstädning (${match.firm_name})`,
    quantity: 1,
    cost_price: match.price_to_firm,
    guest_price: guest,
    platform_fee: guest - match.price_to_firm,
    service_provider_id: match.firm_id,
  };
}

export function groceriesLine(deliveryFee: number): ExtraLine {
  // Kostpris = 0 (gästen handlar själv). Plattformens intäkt = leveransavgift.
  return {
    service_type: "groceries",
    label: "Matlogistik (hämta + inplock)",
    quantity: 1,
    cost_price: 0,
    guest_price: deliveryFee,
    platform_fee: deliveryFee,
  };
}

export function firewoodLine(bags: number, markupPercent: number): ExtraLine {
  // Gästpris fixt 150 kr/säck. Fjällportalens marginal = markup% av gästpriset.
  const guest = FIREWOOD_GUEST_PRICE_ORE * bags;
  const fee = Math.round((guest * markupPercent) / 100 / 100) * 100;
  return {
    service_type: "firewood",
    label: `Ved (${bags} säck${bags === 1 ? "" : "ar"} × 40 L)`,
    quantity: bags,
    cost_price: guest - fee,
    guest_price: guest,
    platform_fee: fee,
  };
}

export function linenLine(persons: number, markupPercent: number): ExtraLine {
  const guest = LINEN_GUEST_PRICE_ORE * persons;
  const fee = Math.round((guest * markupPercent) / 100 / 100) * 100;
  return {
    service_type: "linen",
    label: `Linnepaket (${persons} person${persons === 1 ? "" : "er"})`,
    quantity: persons,
    cost_price: guest - fee,
    guest_price: guest,
    platform_fee: fee,
  };
}

export function extrasTotal(lines: ExtraLine[]): number {
  return lines.reduce((sum, l) => sum + l.guest_price, 0);
}

/** Format öre → "1 234 kr". */
export function formatOreKr(ore: number): string {
  return `${Math.round(ore / 100).toLocaleString("sv-SE")} kr`;
}