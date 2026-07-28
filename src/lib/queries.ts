import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BookingStatus } from "@/lib/bookings";
import type { CommissionStatus } from "@/lib/commission";

// Cache defaults: 1 min fresh, 10 min in cache. After inactivity, the
// previously-cached data renders instantly while a background refetch runs.
const STALE = 60_000;
const GC = 10 * 60_000;

export type HostBalance = {
  earned_count: number;
  earned_amount: number;
  invoiced_count: number;
  invoiced_amount: number;
  paid_count: number;
  paid_amount: number;
  total_owed: number;
};

export type HostCommissionRow = {
  id: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  total_price: number;
  commission_amount: number;
  commission_status: CommissionStatus;
  commission_earned_at: string | null;
  commission_invoiced_at: string | null;
  commission_paid_at: string | null;
  cabins: { title: string; slug: string } | null;
};

export type HostInvoice = {
  id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  booking_count: number;
  status: string;
  issued_at: string;
  due_date: string | null;
  ocr_reference: string | null;
  commission_net: number;
  extras_net: number;
  vat_amount: number;
};

/**
 * Aggregate the host balance from already-fetched commission rows. This
 * removes a separate round-trip to the `host_balances` view — the view is
 * just a SUM/COUNT over the same booking rows we already load on this page.
 */
export function computeHostBalance(rows: HostCommissionRow[]): HostBalance {
  const b: HostBalance = {
    earned_count: 0,
    earned_amount: 0,
    invoiced_count: 0,
    invoiced_amount: 0,
    paid_count: 0,
    paid_amount: 0,
    total_owed: 0,
  };
  for (const r of rows) {
    const amt = r.commission_amount ?? 0;
    if (r.commission_status === "earned") {
      b.earned_count += 1;
      b.earned_amount += amt;
      b.total_owed += amt;
    } else if (r.commission_status === "invoiced") {
      b.invoiced_count += 1;
      b.invoiced_amount += amt;
      b.total_owed += amt;
    } else if (r.commission_status === "paid") {
      b.paid_count += 1;
      b.paid_amount += amt;
    }
  }
  return b;
}

export const hostCommissionRowsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["host", userId, "commission-rows"],
    staleTime: STALE,
    gcTime: GC,
    queryFn: async (): Promise<HostCommissionRow[]> => {
      const { data } = await supabase
        .from("bookings")
        .select(
          "id, check_in, check_out, status, total_price, commission_amount, commission_status, commission_earned_at, commission_invoiced_at, commission_paid_at, cabins(title, slug)",
        )
        .eq("host_id", userId)
        .order("check_out", { ascending: false });
      return (data as unknown as HostCommissionRow[]) ?? [];
    },
  });

export const hostInvoicesQuery = (userId: string) =>
  queryOptions({
    queryKey: ["host", userId, "invoices"],
    staleTime: STALE,
    gcTime: GC,
    queryFn: async (): Promise<HostInvoice[]> => {
      const { data } = await supabase
        .from("host_invoices")
        .select(
          "id, invoice_number, period_start, period_end, total_amount, booking_count, status, issued_at, due_date, ocr_reference, commission_net, extras_net, vat_amount",
        )
        .eq("host_id", userId)
        .order("issued_at", { ascending: false });
      return (data as unknown as HostInvoice[]) ?? [];
    },
  });

export const commissionFeeQuery = () =>
  queryOptions({
    queryKey: ["app-settings", "commission-per-booking"],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async (): Promise<number> => {
      const { data } = await supabase
        .from("app_settings")
        .select("commission_per_booking")
        .eq("id", 1)
        .maybeSingle();
      return data?.commission_per_booking ?? 40000;
    },
  });

export type HostBookingRow = {
  id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  nights: number;
  guests: number;
  total_price: number;
  guest_message: string | null;
  cabins: {
    slug: string;
    title: string;
    area_slug: string;
    cabin_images: { url: string; is_cover: boolean; sort_order: number }[];
  } | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export const hostBookingsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["host", userId, "bookings"],
    staleTime: STALE,
    gcTime: GC,
    queryFn: async (): Promise<HostBookingRow[]> => {
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(
          "*, cabins(slug, title, area_slug, cabin_images(url, is_cover, sort_order))",
        )
        .eq("host_id", userId)
        .order("created_at", { ascending: false });
      if (error) return [];
      const guestIds = Array.from(new Set((bookings ?? []).map((b) => b.guest_id)));
      const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      if (guestIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", guestIds);
        for (const p of profs ?? []) {
          profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
        }
      }
      return (bookings ?? []).map((b) => ({
        ...b,
        profiles: profileMap.get(b.guest_id) ?? null,
      })) as unknown as HostBookingRow[];
    },
  });

export type GuestBookingRow = {
  id: string;
  host_id: string;
  cabin_id: string;
  check_in: string;
  check_out: string;
  status: BookingStatus;
  nights: number;
  guests: number;
  total_price: number;
  cabins: {
    slug: string;
    title: string;
    area_slug: string;
    cabin_images: { url: string; is_cover: boolean; sort_order: number }[];
  } | null;
};

export const guestBookingsQuery = (userId: string) =>
  queryOptions({
    queryKey: ["guest", userId, "bookings"],
    staleTime: STALE,
    gcTime: GC,
    queryFn: async (): Promise<GuestBookingRow[]> => {
      const { data } = await supabase
        .from("bookings")
        .select(
          "*, cabins(slug, title, area_slug, cabin_images(url, is_cover, sort_order))",
        )
        .eq("guest_id", userId)
        .order("check_in", { ascending: false });
      return (data as unknown as GuestBookingRow[]) ?? [];
    },
  });