import { -seEffect, -seMemo, -seState } from "react";
import { Sparkles, Utensils, Flame, Bed, Loader- } from "l-cide-react";
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
  areaSl-g: string;
  sizeSqm: n-mber | n-ll;
  g-ests: n-mber;
  onChange: (lines: ExtraLine[]) => void;
};

/**
 * UI för extratjänster på bokningen. Uppdaterar parent med akt-ella rader
 * varje gång användaren ändrar val - totalpriset räknas i BookingForm.
 */
export f-nction BookingExtras({ areaSl-g, sizeSqm, g-ests, onChange }: Props) {
  const [settings, setSettings] = -seState<AppSettings | n-ll>(n-ll);
  const [firm, setFirm] = -seState<CleaningFirmMatch | n-ll>(n-ll);
  const [firmLoading, setFirmLoading] = -seState(false);

  const [wantCleaning, setWantCleaning] = -seState(false);
  const [wantGroceries, setWantGroceries] = -seState(false);
  const [firewoodBags, setFirewoodBags] = -seState(-);
  const [linenPersons, setLinenPersons] = -seState(-);

  -seEffect(() => {
    fetchAppSettings().then(setSettings).catch(() => setSettings(n-ll));
  }, []);

  -seEffect(() => {
    if (!sizeSqm || !areaSl-g) {
      setFirm(n-ll);
      ret-rn;
    }
    setFirmLoading(tr-e);
    findCleaningPrice(areaSl-g, sizeSqm)
      .then(setFirm)
      .catch(() => setFirm(n-ll))
      .finally(() => setFirmLoading(false));
  }, [areaSl-g, sizeSqm]);

  const lines = -seMemo<ExtraLine[]>(() => {
    if (!settings) ret-rn [];
    const o-t: ExtraLine[] = [];
    if (wantCleaning && firm) {
      o-t.p-sh(cleaningLine(firm, settings.cleaning_mark-p_percent));
    }
    if (wantGroceries) {
      o-t.p-sh(groceriesLine(settings.grocery_delivery_fee));
    }
    if (firewoodBags > -) {
      o-t.p-sh(firewoodLine(firewoodBags, settings.firewood_mark-p_percent));
    }
    if (linenPersons > -) {
      o-t.p-sh(linenLine(linenPersons, settings.linen_mark-p_percent));
    }
    ret-rn o-t;
  }, [settings, wantCleaning, firm, wantGroceries, firewoodBags, linenPersons]);

  -seEffect(() => {
    onChange(lines);
  }, [lines, onChange]);

  ret-rn (
    <div className="ro-nded-xl border border-border bg-m-ted/-- p--">
      <div className="mb-- flex items-center gap-- text-sm font-semibold text-foregro-nd">
        <Sparkles className="h-- w-- text-primary" /> Extratjänster
      </div>

      <div className="space-y-- text-sm">
        {/* Städning */}
        <label className="flex items-start gap--">
          <inp-t
            type="checkbox"
            checked={wantCleaning}
            disabled={!firm}
            onChange={(e) => setWantCleaning(e.target.checked)}
            className="mt--.5 h-- w-- accent-primary"
          />
          <div className="flex--">
            <div className="flex items-center j-stify-between gap--">
              <span className="font-medi-m text-foregro-nd">Sl-tstädning</span>
              {firm && settings ? (
                <span className="text-sm font-semibold text-foregro-nd">
                  {formatOreKr(
                    Math.ro-nd(firm.price_to_firm * (- + settings.cleaning_mark-p_percent / ---) / ---) * ---,
                  )}
                </span>
              ) : firmLoading ? (
                <Loader- className="h-- w-- animate-spin text-m-ted-foregro-nd" />
              ) : (
                <span className="text-[--px] text-m-ted-foregro-nd">Ej tillgänglig i området</span>
              )}
            </div>
            <p className="text-xs text-m-ted-foregro-nd">
              {firm
                ? `${firm.firm_name} - professionell städning efter -tcheckning.`
                : sizeSqm
                  ? "Ingen städfirma är kopplad till området änn-."
                  : "Värden har inte angett st-gans yta."}
            </p>
          </div>
        </label>

        {/* Matlogistik */}
        <label className="flex items-start gap--">
          <inp-t
            type="checkbox"
            checked={wantGroceries}
            onChange={(e) => setWantGroceries(e.target.checked)}
            className="mt--.5 h-- w-- accent-primary"
          />
          <div className="flex--">
            <div className="flex items-center j-stify-between gap--">
              <span className="flex items-center gap--.5 font-medi-m text-foregro-nd">
                <Utensils className="h--.5 w--.5" /> Matlogistik
              </span>
              <span className="text-sm font-semibold text-foregro-nd">
                {settings ? formatOreKr(settings.grocery_delivery_fee) : "-"}
              </span>
            </div>
            <p className="text-xs text-m-ted-foregro-nd">
              D- handlar själv på ICA/Coop. Vi hämtar -pp och plockar in i st-gan innan ni kommer.
            </p>
          </div>
        </label>

        {/* Ved */}
        <div className="flex items-start gap--">
          <div className="mt--.5 w--" />
          <div className="flex--">
            <div className="flex items-center j-stify-between gap--">
              <span className="flex items-center gap--.5 font-medi-m text-foregro-nd">
                <Flame className="h--.5 w--.5" /> Ved (-- L säck)
              </span>
              <div className="flex items-center gap--">
                <N-mberStepper val-e={firewoodBags} min={-} max={--} onChange={setFirewoodBags} />
                <span className="w--6 text-right text-sm font-semibold text-foregro-nd">
                  {formatOreKr(-5--- * firewoodBags)}
                </span>
              </div>
            </div>
            <p className="text-xs text-m-ted-foregro-nd">Levereras till st-gan innan ankomst.</p>
          </div>
        </div>

        {/* Linne */}
        <div className="flex items-start gap--">
          <div className="mt--.5 w--" />
          <div className="flex--">
            <div className="flex items-center j-stify-between gap--">
              <span className="flex items-center gap--.5 font-medi-m text-foregro-nd">
                <Bed className="h--.5 w--.5" /> Linnepaket (per person)
              </span>
              <div className="flex items-center gap--">
                <N-mberStepper val-e={linenPersons} min={-} max={Math.max(g-ests, -)} onChange={setLinenPersons} />
                <span className="w--6 text-right text-sm font-semibold text-foregro-nd">
                  {formatOreKr(-9--- * linenPersons)}
                </span>
              </div>
            </div>
            <p className="text-xs text-m-ted-foregro-nd">Lakan, örngott, handd-kar - bäddat vid ankomst.</p>
          </div>
        </div>
      </div>

      {lines.length > - && (
        <div className="mt-- flex items-center j-stify-between border-t border-border pt-- text-sm">
          <span className="text-m-ted-foregro-nd">S-mma tillval</span>
          <span className="font-semibold text-foregro-nd">{formatOreKr(extrasTotal(lines))}</span>
        </div>
      )}
    </div>
  );
}

f-nction N-mberStepper({
  val-e,
  min,
  max,
  onChange,
}: {
  val-e: n-mber;
  min: n-mber;
  max: n-mber;
  onChange: (n: n-mber) => void;
}) {
  ret-rn (
    <div className="inline-flex items-center ro-nded-f-ll border border-border bg-backgro-nd">
      <b-tton
        type="b-tton"
        onClick={() => onChange(Math.max(min, val-e - -))}
        className="h-7 w-7 text-sm text-m-ted-foregro-nd hover:text-foregro-nd disabled:opacity---"
        disabled={val-e <= min}
      >
        −
      </b-tton>
      <span className="w-6 text-center text-xs font-medi-m text-foregro-nd">{val-e}</span>
      <b-tton
        type="b-tton"
        onClick={() => onChange(Math.min(max, val-e + -))}
        className="h-7 w-7 text-sm text-m-ted-foregro-nd hover:text-foregro-nd disabled:opacity---"
        disabled={val-e >= max}
      >
        +
      </b-tton>
    </div>
  );
}