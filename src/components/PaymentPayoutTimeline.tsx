import { CreditCard, ShieldCheck, KeyRound, Wallet, Check, Loader2, XCircle } from "lucide-react";

type Step = {
  key: "pay" | "escrow" | "checkin" | "payout";
  icon: typeof CreditCard;
  title: string;
  description: string;
  when: string;
};

const steps: Step[] = [
  {
    key: "pay",
    icon: CreditCard,
    title: "Du betalar",
    description:
      "Betala tryggt med kort eller Swish när bokningen bekräftas. Full summa reserveras direkt.",
    when: "Vid bokning",
  },
  {
    key: "escrow",
    icon: ShieldCheck,
    title: "Fjällportalen håller pengarna",
    description:
      "Beloppet ligger säkert hos oss fram till din vistelse — värden får inget förrän du checkat in.",
    when: "Fram till incheckning",
  },
  {
    key: "checkin",
    icon: KeyRound,
    title: "Du checkar in",
    description:
      "Du får nycklar och tillträde. Om något är fel med stugan hjälper vi dig direkt.",
    when: "Incheckningsdagen",
  },
  {
    key: "payout",
    icon: Wallet,
    title: "Värden får betalt",
    description:
      "24 timmar efter incheckning släpps pengarna till värden. Avbokning >48h före incheckning ger full återbetalning.",
    when: "24h efter incheckning",
  },
];

export type TimelineBooking = {
  status: string | null;
  payment_status: string | null;
  check_in: string | null;
  escrow_status?: string | null;
  escrow_released_at?: string | null;
  refunded_at?: string | null;
};

type StepState = "done" | "active" | "upcoming" | "cancelled";

function computeStates(b: TimelineBooking | undefined): Record<Step["key"], StepState> {
  const s: Record<Step["key"], StepState> = {
    pay: "upcoming",
    escrow: "upcoming",
    checkin: "upcoming",
    payout: "upcoming",
  };
  if (!b) return s;

  const cancelled = b.status === "cancelled" || b.status === "declined";
  const refunded = b.payment_status === "refunded" || !!b.refunded_at;
  if (cancelled || refunded) {
    const paid = b.payment_status === "paid" || b.payment_status === "authorized";
    s.pay = paid ? "done" : "cancelled";
    s.escrow = "cancelled";
    s.checkin = "cancelled";
    s.payout = "cancelled";
    return s;
  }

  const paid = b.payment_status === "paid" || b.payment_status === "authorized";
  const released =
    !!b.escrow_released_at || b.escrow_status === "released" || b.status === "completed";

  const now = new Date();
  const checkInDate = b.check_in ? new Date(b.check_in + "T15:00:00") : null;
  const checkedIn = !!checkInDate && now >= checkInDate;

  s.pay = paid ? "done" : "active";
  if (paid) {
    if (released) {
      s.escrow = "done";
      s.checkin = "done";
      s.payout = "done";
    } else if (checkedIn) {
      s.escrow = "done";
      s.checkin = "active";
      s.payout = "upcoming";
    } else {
      s.escrow = "active";
    }
  }
  return s;
}

export function PaymentPayoutTimeline({ booking }: { booking?: TimelineBooking }) {
  const states = computeStates(booking);
  const anyCancelled = Object.values(states).includes("cancelled");
  return (
    <section
      aria-label="Betalning och utbetalning"
      className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.04] to-background p-4 sm:p-5"
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Så fungerar betalning och utbetalning
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {anyCancelled
              ? "Bokningen är avbokad — betalningen återbetalas enligt villkoren."
              : "Trygg betalning via Fjällportalen — utbetalning 24h efter incheckning."}
          </p>
        </div>
        <span
          className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide sm:inline-block ${
            anyCancelled
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          }`}
        >
          {anyCancelled ? "Avbokad" : "Escrow"}
        </span>
      </header>

      <ol className="relative space-y-4">
        <span
          aria-hidden="true"
          className="absolute left-[15px] top-2 bottom-2 w-px bg-primary/20"
        />
        {steps.map((step) => {
          const state = states[step.key];
          const Icon = step.icon;
          const bubble =
            state === "done"
              ? "bg-primary text-primary-foreground"
              : state === "active"
                ? "bg-primary/15 text-primary ring-2 ring-primary animate-pulse"
                : state === "cancelled"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-muted text-muted-foreground";
          const StatusIcon =
            state === "done" ? Check : state === "cancelled" ? XCircle : state === "active" ? Loader2 : Icon;
          return (
            <li key={step.key} className="relative flex gap-3" aria-current={state === "active" ? "step" : undefined}>
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background ${bubble}`}
              >
                <StatusIcon
                  className={`h-4 w-4 ${state === "active" ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
              </span>
              <div className={`min-w-0 flex-1 pt-0.5 ${state === "upcoming" || state === "cancelled" ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {step.title}
                    {state === "active" && (
                      <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-wide text-primary">
                        Pågår
                      </span>
                    )}
                    {state === "done" && (
                      <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-wide text-primary">
                        Klart
                      </span>
                    )}
                  </p>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {step.when}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default PaymentPayoutTimeline;