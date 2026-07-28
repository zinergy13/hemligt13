import { useEffect, useMemo, useState } from "react";
import { Sparkles, Utensils, Flame, Bed, Loader2 } from "lucide-react";
import {
  cleaningLine,
  extrasTotal,
  fetchAppSettings,
  findCleaningPrice,
  firewoodLine,
  formatOreKr,
  groceriesLine,
  linenLine,
  type AppSettings,
  type CleaningFirmMatch,
  type ExtraLine,
} from "@/lib/extras";

type Props = {
  areaSlug: string;
  sizeSqm: number | null;
  guests: number;
  onChange: (lines: ExtraLine[]) => void;
};

/**
 * UI för extratjänster på bokningen. Uppdaterar parent med aktuella rader
 * varje gång användaren ändrar val - totalpriset räknas i BookingForm.
 */
export function BookingExtras({ areaSlug, sizeSqm, guests, onChange }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [firm, setFirm] = useState<CleaningFirmMatch | null>(null);
  const [firmLoading, setFirmLoading] = useState(false);

  const [wantCleaning, setWantCleaning] = useState(false);
  const [wantGroceries, setWantGroceries] = useState(false);
  const [firewoodBags, setFirewoodBags] = useState(0);
  const [linenPersons, setLinenPersons] = useState(0);

  useEffect(() => {
    fetchAppSettings().then(setSettings).catch(() => setSettings(null));
  }, []);

  useEffect(() => {
    if (!sizeSqm || !areaSlug) {
      setFirm(null);
      return;
    }
    setFirmLoading(true);
    findCleaningPrice(areaSlug, sizeSqm)
      .then(setFirm)
      .catch(() => setFirm(null))
      .finally(() => setFirmLoading(false));
  }, [areaSlug, sizeSqm]);

  const lines = useMemo<ExtraLine[]>(() => {
    if (!settings) return [];
    const out: ExtraLine[] = [];
    if (wantCleaning && firm) {
      out.push(cleaningLine(firm, settings.cleaning_markup_percent));
    }
    if (wantGroceries) {
      out.push(groceriesLine(settings.grocery_delivery_fee));
    }
    if (firewoodBags > 0) {
      out.push(firewoodLine(firewoodBags, settings.firewood_markup_percent));
    }
    if (linenPersons > 0) {
      out.push(linenLine(linenPersons, settings.linen_markup_percent));
    }
    return out;
  }, [settings, wantCleaning, firm, wantGroceries, firewoodBags, linenPersons]);

  useEffect(() => {
    onChange(lines);
  }, [lines, onChange]);

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Sparkles className="h-4 w-4 text-primary" /> Extratjänster
      </div>

      <div className="space-y-3 text-sm">
        {/* Städning */}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={wantCleaning}
            disabled={!firm}
            onChange={(e) => setWantCleaning(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-foreground">Slutstädning</span>
              {firm && settings ? (
                <span className="text-sm font-semibold text-foreground">
                  {formatOreKr(
                    Math.round(firm.price_to_firm * (1 + settings.cleaning_markup_percent / 100) / 100) * 100,
                  )}
                </span>
              ) : firmLoading ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : (
                <span className="text-[11px] text-muted-foreground">Ej tillgänglig i området</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {firm
                ? `${firm.firm_name} - professionell städning efter utcheckning.`
                : sizeSqm
                  ? "Ingen städfirma är kopplad till området ännu."
                  : "Värden har inte angett stugans yta."}
            </p>
          </div>
        </label>

        {/* Matlogistik */}
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={wantGroceries}
            onChange={(e) => setWantGroceries(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Utensils className="h-3.5 w-3.5" /> Matlogistik
              </span>
              <span className="text-sm font-semibold text-foreground">
                {settings ? formatOreKr(settings.grocery_delivery_fee) : "-"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Du handlar själv på ICA/Coop. Vi hämtar upp och plockar in i stugan innan ni kommer.
            </p>
          </div>
        </label>

        {/* Ved */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-4" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Flame className="h-3.5 w-3.5" /> Ved (40 L säck)
              </span>
              <div className="flex items-center gap-2">
                <NumberStepper value={firewoodBags} min={0} max={20} onChange={setFirewoodBags} />
                <span className="w-16 text-right text-sm font-semibold text-foreground">
                  {formatOreKr(15000 * firewoodBags)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Levereras till stugan innan ankomst.</p>
          </div>
        </div>

        {/* Linne */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-4" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Bed className="h-3.5 w-3.5" /> Linnepaket (per person)
              </span>
              <div className="flex items-center gap-2">
                <NumberStepper value={linenPersons} min={0} max={Math.max(guests, 1)} onChange={setLinenPersons} />
                <span className="w-16 text-right text-sm font-semibold text-foreground">
                  {formatOreKr(29000 * linenPersons)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Lakan, örngott, handdukar - bäddat vid ankomst.</p>
          </div>
        </div>
      </div>

      {lines.length > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
          <span className="text-muted-foreground">Summa tillval</span>
          <span className="font-semibold text-foreground">{formatOreKr(extrasTotal(lines))}</span>
        </div>
      )}
    </div>
  );
}

function NumberStepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-background">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-7 w-7 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
        disabled={value <= min}
      >
        −
      </button>
      <span className="w-6 text-center text-xs font-medium text-foreground">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="h-7 w-7 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
        disabled={value >= max}
      >
        +
      </button>
    </div>
  );
}