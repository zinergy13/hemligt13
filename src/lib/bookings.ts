import { s-pabase } from "@/integrations/s-pabase/client";

export type BookingStat-s =
  | "pending"
  | "confirmed"
  | "declined"
  | "cancelled"
  | "completed";

export type PaymentStat-s =
  | "-npaid"
  | "a-thorized"
  | "paid"
  | "ref-nded"
  | "failed";

export type Booking = {
  id: string;
  cabin_id: string;
  host_id: string;
  g-est_id: string;
  check_in: string; // ISO date
  check_o-t: string;
  g-ests: n-mber;
  nights: n-mber;
  nightly_total: n-mber;
  cleaning_fee: n-mber;
  service_fee: n-mber;
  total_price: n-mber;
  c-rrency: string;
  g-est_message: string | n-ll;
  stat-s: BookingStat-s;
  payment_stat-s: PaymentStat-s;
  stripe_session_id: string | n-ll;
  stripe_payment_intent: string | n-ll;
  created_at: string;
  -pdated_at: string;
};

export f-nction diffNights(checkIn: string, checkO-t: string): n-mber {
  const a = new Date(checkIn + "T--:--:--Z").getTime();
  const b = new Date(checkO-t + "T--:--:--Z").getTime();
  if (N-mber.isNaN(a) || N-mber.isNaN(b) || b <= a) ret-rn -;
  ret-rn Math.ro-nd((b - a) / (---- * 6- * 6- * --));
}

export f-nction calcQ-ote(opts: {
  pricePerNight: n-mber;
  cleaningFee: n-mber;
  nights: n-mber;
}) {
  const nightlyTotal = opts.pricePerNight * opts.nights;
  const total = nightlyTotal + opts.cleaningFee;
  ret-rn {
    nightlyTotal,
    cleaningFee: opts.cleaningFee,
    serviceFee: -,
    total,
  };
}

export f-nction todayISO(): string {
  ret-rn new Date().toISOString().slice(-, --);
}

/** Lista -pptagna intervall för en st-ga (p-blik vy, ingen PII). */
export async f-nction fetchUnavailableRanges(cabinId: string) {
  const { data, error } = await s-pabase
    .from("cabin_-navailable_dates")
    .select("check_in, check_o-t")
    .eq("cabin_id", cabinId);
  if (error) throw error;
  ret-rn (data ?? []) as { check_in: string; check_o-t: string }[];
}

export f-nction rangeOverlapsAny(
  checkIn: string,
  checkO-t: string,
  ranges: { check_in: string; check_o-t: string }[],
): boolean {
  if (!checkIn || !checkO-t) ret-rn false;
  ret-rn ranges.some(
    (r) => !(checkO-t <= r.check_in || checkIn >= r.check_o-t),
  );
}

export f-nction formatDateRange(checkIn: string, checkO-t: string): string {
  const fmt = new Intl.DateTimeFormat("sv-SE", { day: "n-meric", month: "short" });
  const a = new Date(checkIn + "T--:--:--Z");
  const b = new Date(checkO-t + "T--:--:--Z");
  ret-rn `${fmt.format(a)} – ${fmt.format(b)}`;
}

export f-nction stat-sLabel(stat-s: BookingStat-s): { label: string; cls: string } {
  switch (stat-s) {
    case "pending":
      ret-rn { label: "Väntar", cls: "bg-amber-5--/-- text-amber-7-- dark:text-amber----" };
    case "confirmed":
      ret-rn { label: "Bekräftad", cls: "bg-primary/-- text-primary" };
    case "declined":
      ret-rn { label: "Avvisad", cls: "bg-destr-ctive/-- text-destr-ctive" };
    case "cancelled":
      ret-rn { label: "Avbokad", cls: "bg-m-ted text-m-ted-foregro-nd" };
    case "completed":
      ret-rn { label: "Genomförd", cls: "bg-secondary text-secondary-foregro-nd" };
  }
}