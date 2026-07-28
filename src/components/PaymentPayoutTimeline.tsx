import { CreditCard, ShieldCheck, KeyRound, Wallet } from "lucide-react";

type Step = {
  icon: typeof CreditCard;
  title: string;
  description: string;
  when: string;
};

const steps: Step[] = [
  {
    icon: CreditCard,
    title: "Du betalar",
    description:
      "Betala tryggt med kort eller Swish när bokningen bekräftas. Full summa reserveras direkt.",
    when: "Vid bokning",
  },
  {
    icon: ShieldCheck,
    title: "Fjällportalen håller pengarna",
    description:
      "Beloppet ligger säkert hos oss fram till din vistelse — värden får inget förrän du checkat in.",
    when: "Fram till incheckning",
  },
  {
    icon: KeyRound,
    title: "Du checkar in",
    description:
      "Du får nycklar och tillträde. Om något är fel med stugan hjälper vi dig direkt.",
    when: "Incheckningsdagen",
  },
  {
    icon: Wallet,
    title: "Värden får betalt",
    description:
      "24 timmar efter incheckning släpps pengarna till värden. Avbokning >48h före incheckning ger full återbetalning.",
    when: "24h efter incheckning",
  },
];

export function PaymentPayoutTimeline() {
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
            Trygg betalning via Fjällportalen — utbetalning 24h efter incheckning.
          </p>
        </div>
        <span className="hidden shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary sm:inline-block">
          Escrow
        </span>
      </header>

      <ol className="relative space-y-4">
        <span
          aria-hidden="true"
          className="absolute left-[15px] top-2 bottom-2 w-px bg-primary/20"
        />
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <li key={step.title} className="relative flex gap-3">
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-background">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
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