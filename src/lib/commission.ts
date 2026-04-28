/** Formattera öre till svenska kronor. */
export function formatOre(ore: number): string {
  return `${(ore / 100).toLocaleString("sv-SE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} kr`;
}

export type CommissionStatus =
  | "pending"
  | "earned"
  | "invoiced"
  | "paid"
  | "waived";

export function commissionLabel(status: CommissionStatus): { label: string; cls: string } {
  switch (status) {
    case "pending":
      return { label: "Väntar", cls: "bg-muted text-muted-foreground" };
    case "earned":
      return { label: "Att betala", cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400" };
    case "invoiced":
      return { label: "Fakturerad", cls: "bg-primary/10 text-primary" };
    case "paid":
      return { label: "Betald", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" };
    case "waived":
      return { label: "Avskriven", cls: "bg-muted text-muted-foreground" };
  }
}