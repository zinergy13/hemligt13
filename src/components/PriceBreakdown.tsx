import { AlertTriangle, Sparkles, CalendarClock, TrendingUp, TrendingDown } from "lucide-react";
import type { Quote } from "@/lib/pricing";

function kr(n: number) {
  return `${n.toLocaleString("sv-SE")} kr`;
}

export function PriceBreakdown({ quote }: { quote: Quote }) {
  if (quote.nights === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Prisberäkning</span>
        <span>{quote.nights} nätter</span>
      </div>

      <ul className="space-y-2">
        {quote.lines.map((line, i) => {
          if (line.kind === "cleaning") {
            return (
              <li key={i} className="flex items-start justify-between gap-3 text-muted-foreground">
                <span>{line.label}</span>
                <span>{kr(line.subtotal)}</span>
              </li>
            );
          }
          if (line.kind === "adjustment") {
            const negative = line.subtotal < 0;
            return (
              <li key={i} className="space-y-0.5">
                <div className={`flex items-start justify-between gap-3 ${negative ? "text-primary" : "text-amber-700 dark:text-amber-300"}`}>
                  <span className="flex items-center gap-1.5 font-medium">
                    {negative ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                    {line.label}
                  </span>
                  <span className="font-medium">{negative ? "−" : "+"}{kr(Math.abs(line.subtotal))}</span>
                </div>
                {line.note && <div className="pl-5 text-xs text-muted-foreground">{line.note}</div>}
              </li>
            );
          }
          return (
            <li key={i} className="space-y-0.5">
              <div className="flex items-start justify-between gap-3 text-foreground">
                <span className="flex items-center gap-1.5">
                  {line.kind === "season" && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                  <span className="font-medium">{line.label}</span>
                </span>
                <span className="font-medium">{kr(line.subtotal)}</span>
              </div>
              <div className="pl-5 text-xs text-muted-foreground">
                {kr(line.rate)} × {line.nights} {line.nights === 1 ? "natt" : "nätter"}
                {line.weeklyDiscount > 0 && (
                  <span className="text-primary"> · veckopris −{kr(line.weeklyDiscount)}</span>
                )}
                {line.weekendSurcharge > 0 && (
                  <span> · helgtillägg +{kr(line.weekendSurcharge)} ({line.weekendNights} helgnätter)</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
        <span>Totalt till värden</span>
        <span>{kr(quote.total)}</span>
      </div>

      {quote.warnings.length > 0 && (
        <div className="space-y-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5">
          {quote.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              {w.toLowerCase().includes("incheckning") || w.toLowerCase().includes("utcheckning") ? (
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              )}
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}