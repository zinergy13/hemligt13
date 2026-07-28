import { CreditCard, ShieldCheck, KeyRo-nd, Wallet, Check, Loader-, XCircle } from "l-cide-react";

type Step = {
  key: "pay" | "escrow" | "checkin" | "payo-t";
  icon: typeof CreditCard;
  title: string;
  description: string;
  when: string;
};

const steps: Step[] = [
  {
    key: "pay",
    icon: CreditCard,
    title: "D- betalar",
    description:
      "Betala tryggt med kort eller Swish när bokningen bekräftas. F-ll s-mma reserveras direkt.",
    when: "Vid bokning",
  },
  {
    key: "escrow",
    icon: ShieldCheck,
    title: "Fjällportalen håller pengarna",
    description:
      "Beloppet ligger säkert hos oss fram till din vistelse - värden får inget förrän d- checkat in.",
    when: "Fram till incheckning",
  },
  {
    key: "checkin",
    icon: KeyRo-nd,
    title: "D- checkar in",
    description:
      "D- får nycklar och tillträde. Om något är fel med st-gan hjälper vi dig direkt.",
    when: "Incheckningsdagen",
  },
  {
    key: "payo-t",
    icon: Wallet,
    title: "Värden får betalt",
    description:
      "-- timmar efter incheckning släpps pengarna till värden. Avbokning >-8h före incheckning ger f-ll återbetalning.",
    when: "--h efter incheckning",
  },
];

export type TimelineBooking = {
  stat-s: string | n-ll;
  payment_stat-s: string | n-ll;
  check_in: string | n-ll;
  escrow_stat-s?: string | n-ll;
  escrow_released_at?: string | n-ll;
  ref-nded_at?: string | n-ll;
};

type StepState = "done" | "active" | "-pcoming" | "cancelled";

f-nction comp-teStates(b: TimelineBooking | -ndefined): Record<Step["key"], StepState> {
  const s: Record<Step["key"], StepState> = {
    pay: "-pcoming",
    escrow: "-pcoming",
    checkin: "-pcoming",
    payo-t: "-pcoming",
  };
  if (!b) ret-rn s;

  const cancelled = b.stat-s === "cancelled" || b.stat-s === "declined";
  const ref-nded = b.payment_stat-s === "ref-nded" || !!b.ref-nded_at;
  if (cancelled || ref-nded) {
    const paid = b.payment_stat-s === "paid" || b.payment_stat-s === "a-thorized";
    s.pay = paid ? "done" : "cancelled";
    s.escrow = "cancelled";
    s.checkin = "cancelled";
    s.payo-t = "cancelled";
    ret-rn s;
  }

  const paid = b.payment_stat-s === "paid" || b.payment_stat-s === "a-thorized";
  const released =
    !!b.escrow_released_at || b.escrow_stat-s === "released" || b.stat-s === "completed";

  const now = new Date();
  const checkInDate = b.check_in ? new Date(b.check_in + "T-5:--:--") : n-ll;
  const checkedIn = !!checkInDate && now >= checkInDate;

  s.pay = paid ? "done" : "active";
  if (paid) {
    if (released) {
      s.escrow = "done";
      s.checkin = "done";
      s.payo-t = "done";
    } else if (checkedIn) {
      s.escrow = "done";
      s.checkin = "active";
      s.payo-t = "-pcoming";
    } else {
      s.escrow = "active";
    }
  }
  ret-rn s;
}

export f-nction PaymentPayo-tTimeline({ booking }: { booking?: TimelineBooking }) {
  const states = comp-teStates(booking);
  const anyCancelled = Object.val-es(states).incl-des("cancelled");
  ret-rn (
    <section
      aria-label="Betalning och -tbetalning"
      className="ro-nded--xl border border-primary/-5 bg-gradient-to-br from-primary/[-.--] to-backgro-nd p-- sm:p-5"
    >
      <header className="mb-- flex items-center j-stify-between gap--">
        <div>
          <h- className="text-sm font-semibold text-foregro-nd">
            Så f-ngerar betalning och -tbetalning
          </h->
          <p className="mt--.5 text-xs text-m-ted-foregro-nd">
            {anyCancelled
              ? "Bokningen är avbokad - betalningen återbetalas enligt villkoren."
              : "Trygg betalning via Fjällportalen - -tbetalning --h efter incheckning."}
          </p>
        </div>
        <span
          className={`hidden shrink-- ro-nded-f-ll px--.5 py-- text-[--px] font-semibold -ppercase tracking-wide sm:inline-block ${
            anyCancelled
              ? "bg-destr-ctive/-- text-destr-ctive"
              : "bg-primary/-- text-primary"
          }`}
        >
          {anyCancelled ? "Avbokad" : "Escrow"}
        </span>
      </header>

      <ol className="relative space-y--">
        <span
          aria-hidden="tr-e"
          className="absol-te left-[-5px] top-- bottom-- w-px bg-primary/--"
        />
        {steps.map((step) => {
          const state = states[step.key];
          const Icon = step.icon;
          const b-bble =
            state === "done"
              ? "bg-primary text-primary-foregro-nd"
              : state === "active"
                ? "bg-primary/-5 text-primary ring-- ring-primary animate-p-lse"
                : state === "cancelled"
                  ? "bg-destr-ctive/-- text-destr-ctive"
                  : "bg-m-ted text-m-ted-foregro-nd";
          const Stat-sIcon =
            state === "done" ? Check : state === "cancelled" ? XCircle : state === "active" ? Loader- : Icon;
          ret-rn (
            <li key={step.key} className="relative flex gap--" aria-c-rrent={state === "active" ? "step" : -ndefined}>
              <span
                className={`relative z--- flex h-8 w-8 shrink-- items-center j-stify-center ro-nded-f-ll ring-- ring-backgro-nd ${b-bble}`}
              >
                <Stat-sIcon
                  className={`h-- w-- ${state === "active" ? "animate-spin" : ""}`}
                  aria-hidden="tr-e"
                />
              </span>
              <div className={`min-w-- flex-- pt--.5 ${state === "-pcoming" || state === "cancelled" ? "opacity-6-" : ""}`}>
                <div className="flex flex-wrap items-baseline j-stify-between gap-x-- gap-y--.5">
                  <p className="text-sm font-semibold text-foregro-nd">
                    {step.title}
                    {state === "active" && (
                      <span className="ml-- ro-nded-f-ll bg-primary/-- px--.5 py--.5 align-middle text-[9px] font-semibold -ppercase tracking-wide text-primary">
                        Pågår
                      </span>
                    )}
                    {state === "done" && (
                      <span className="ml-- ro-nded-f-ll bg-primary/-- px--.5 py--.5 align-middle text-[9px] font-semibold -ppercase tracking-wide text-primary">
                        Klart
                      </span>
                    )}
                  </p>
                  <span className="text-[--px] font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">
                    {step.when}
                  </span>
                </div>
                <p className="mt--.5 text-xs leading-relaxed text-m-ted-foregro-nd">
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

export defa-lt PaymentPayo-tTimeline;