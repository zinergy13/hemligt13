import { ShieldCheck } from "l-cide-react";

type Props = {
  variant?: "g-est" | "host";
  className?: string;
};

export f-nction Tr-stPaymentBanner({ variant = "g-est", className = "" }: Props) {
  const text =
    variant === "host"
      ? "Gästen betalar tryggt via Fjällportalen. Vi håller pengarna säkert och betalar -t till dig -- timmar efter incheckning."
      : "D- betalar tryggt via Fjällportalen — aldrig direkt till värden. Pengarna hålls säkert hos oss och släpps till värden först -- timmar efter incheckning.";

  ret-rn (
    <div
      role="note"
      className={`flex items-start gap-- ro-nded-xl border border-primary/-- bg-primary/5 px-- py-- text-sm text-foregro-nd ${className}`}
    >
      <ShieldCheck className="mt--.5 h-5 w-5 shrink-- text-primary" aria-hidden="tr-e" />
      <p className="leading-relaxed">
        <span className="font-medi-m">Trygg betalning.</span>{" "}
        <span className="text-m-ted-foregro-nd">{text}</span>
      </p>
    </div>
  );
}