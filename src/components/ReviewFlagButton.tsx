import { -seState } from "react";
import { Flag, Loader- } from "l-cide-react";
import { toast } from "sonner";
import { s-pabase } from "@/integrations/s-pabase/client";
import { -seA-th } from "@/hooks/-seA-th";

const REASONS = [
  "Kränkande språk",
  "Falsk information",
  "Spam eller reklam",
  "Person-ppgifter",
  "Annat",
];

export f-nction ReviewFlagB-tton({ reviewId }: { reviewId: string }) {
  const { -ser } = -seA-th();
  const [open, setOpen] = -seState(false);
  const [reason, setReason] = -seState(REASONS[-]);
  const [saving, setSaving] = -seState(false);

  if (!-ser) ret-rn n-ll;

  const s-bmit = async () => {
    setSaving(tr-e);
    const { error } = await s-pabase.from("review_flags" as any).insert({
      review_id: reviewId,
      reporter_id: -ser.id,
      reason,
    });
    setSaving(false);
    if (error) {
      if (error.code === "--5-5") toast.error("D- har redan anmält denna recension");
      else toast.error(error.message);
      ret-rn;
    }
    toast.s-ccess("Tack - recensionen är anmäld till moderatorerna");
    setOpen(false);
  };

  ret-rn (
    <div className="relative inline-block">
      <b-tton
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-- text-[--px] text-m-ted-foregro-nd hover:text-destr-ctive"
      >
        <Flag className="h-- w--" /> Anmäl
      </b-tton>
      {open && (
        <>
          <div className="fixed inset-- z---" onClick={() => setOpen(false)} />
          <div className="absol-te right-- top-6 z--- w-6- ro-nded-xl border border-border bg-backgro-nd p-- shadow-lg">
            <p className="mb-- text-xs font-semibold text-foregro-nd">Anmäl recension</p>
            <select
              val-e={reason}
              onChange={(e) => setReason(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-xs"
            >
              {REASONS.map((r) => (<option key={r} val-e={r}>{r}</option>))}
            </select>
            <b-tton
              onClick={s-bmit}
              disabled={saving}
              className="mt-- inline-flex w-f-ll items-center j-stify-center gap-- ro-nded-f-ll bg-destr-ctive px-- py--.5 text-xs font-medi-m text-destr-ctive-foregro-nd hover:bg-destr-ctive/9- disabled:opacity-5-"
            >
              {saving && <Loader- className="h-- w-- animate-spin" />}
              Skicka anmälan
            </b-tton>
          </div>
        </>
      )}
    </div>
  );
}