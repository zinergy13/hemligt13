import { supabase } from "@/integrations/supabase/client";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

export type PaymentStatus =
  | "unpaid"
  | "authorized"
  | "paid"
  | "refunded"
  | "failed";

export type Booking = {
  id: string;
  cabin_id: string;
  host_id: string;
  guest_id: string;
  check_in: string; // ISO date
  check_out: string;
  guests: number;
  nights: number;
  nightly_total: number;
  cleaning_fee: number;
  service_fee: number;
  total_price: number;
  currency: string;
  guest_message: string | null;
  status: BookingStatus;
  payment_status: PaymentStatus;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  created_at: string;
  updated_at: string;
};

export function diffNights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + "T00:00:00Z").getTime();
  const b = new Date(checkOut + "T00:00:00Z").getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 0;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function calcQuote(opts: {
  pricePerNight: number;
  cleaningFee: number;
  nights: number;
}) {
  const nightlyTotal = opts.pricePerNight * opts.nights;
  const total = nightlyTotal + opts.cleaningFee;
  return {
    nightlyTotal,
    cleaningFee: opts.cleaningFee,
    serviceFee: 0,
    total,
  };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Lista upptagna intervall för en stuga (publik vy, ingen PII). */
export async function fetchUnavailableRanges(cabinId: string) {
  const { data, error } = await supabase
    .from("cabin_unavailable_dates")
    .select("check_in, check_out")
    .eq("cabin_id", cabinId);
  if (error) throw error;
  return (data ?? []) as { check_in: string; check_out: string }[];
}

export function rangeOverlapsAny(
  checkIn: string,
  checkOut: string,
  ranges: { check_in: string; check_out: string }[],
): boolean {
  if (!checkIn || !checkOut) return false;
  return ranges.some(
    (r) => !(checkOut <= r.check_in || checkIn >= r.check_out),
  );
}

export function formatDateRange(checkIn: string, checkOut: string): string {
  const fmt = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" });
  const a = new Date(checkIn + "T00:00:00Z");
  const b = new Date(checkOut + "T00:00:00Z");
  return `${fmt.format(a)} – ${fmt.format(b)}`;
}

export function statusLabel(status: BookingStatus): { label: string; cls: string } {
  switch (status) {
    case "pending":
      return { label: "Väntar", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400" };
    case "confirmed":
      return { label: "Bekräftad", cls: "bg-primary/10 text-primary" };
    case "declined":
      return { label: "Avvisad", cls: "bg-destructive/10 text-destructive" };
    case "cancelled":
      return { label: "Avbokad", cls: "bg-muted text-muted-foreground" };
    case "completed":
      return { label: "Genomförd", cls: "bg-secondary text-secondary-foreground" };
  }
}