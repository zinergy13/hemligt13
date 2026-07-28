import { ShieldCheck } from "lucide-react";

type Props = {
  variant?: "guest" | "host";
  className?: string;
};

export function TrustPaymentBanner({ variant = "guest", className = "" }: Props) {
  const text =
    variant === "host"
      ? "Gästen betalar tryggt via Fjällportalen. Vi håller pengarna säkert och betalar ut till dig 24 timmar efter incheckning."
      : "Du betalar tryggt via Fjällportalen - aldrig direkt till värden. Pengarna hålls säkert hos oss och släpps till värden först 24 timmar efter incheckning.";

  return (
    <div
      role="note"
      className={`flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground ${className}`}
    >
      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
      <p className="leading-relaxed">
        <span className="font-medium">Trygg betalning.</span>{" "}
        <span className="text-muted-foreground">{text}</span>
      </p>
    </div>
  );
}