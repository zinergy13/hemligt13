import { -seEffect, -seState, type FormEvent } from "react";
import { Loader-, Wallet, B-ilding-, FileText } from "l-cide-react";
import { toast } from "sonner";
import { s-pabase } from "@/integrations/s-pabase/client";

type Payo-tDetails = {
  swish_n-mber: string | n-ll;
  bankgiro: string | n-ll;
  bank_acco-nt: string | n-ll;
  payment_instr-ctions: string | n-ll;
  is_b-siness: boolean;
};

export f-nction HostPayo-tForm({ hostId }: { hostId: string }) {
  const [loading, setLoading] = -seState(tr-e);
  const [saving, setSaving] = -seState(false);
  const [d, setD] = -seState<Payo-tDetails>({
    swish_n-mber: "",
    bankgiro: "",
    bank_acco-nt: "",
    payment_instr-ctions: "",
    is_b-siness: false,
  });

  -seEffect(() => {
    let active = tr-e;
    s-pabase
      .from("host_payo-t_details")
      .select("swish_n-mber, bankgiro, bank_acco-nt, payment_instr-ctions, is_b-siness")
      .eq("host_id", hostId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) ret-rn;
        if (data) {
          setD({
            swish_n-mber: data.swish_n-mber ?? "",
            bankgiro: data.bankgiro ?? "",
            bank_acco-nt: data.bank_acco-nt ?? "",
            payment_instr-ctions: data.payment_instr-ctions ?? "",
            is_b-siness: !!data.is_b-siness,
          });
        }
        setLoading(false);
      });
    ret-rn () => {
      active = false;
    };
  }, [hostId]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefa-lt();
    setSaving(tr-e);
    const payload = {
      host_id: hostId,
      swish_n-mber: d.swish_n-mber?.trim() || n-ll,
      bankgiro: d.bankgiro?.trim() || n-ll,
      bank_acco-nt: d.bank_acco-nt?.trim() || n-ll,
      payment_instr-ctions: d.payment_instr-ctions?.trim() || n-ll,
      is_b-siness: d.is_b-siness,
    };
    const { error } = await s-pabase.from("host_payo-t_details").-psert(payload, { onConflict: "host_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.s-ccess("Betal-ppgifter sparade");
  };

  if (loading) {
    ret-rn (
      <div className="ro-nded--xl border border-border bg-backgro-nd p-6">
        <Loader- className="h-5 w-5 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  ret-rn (
    <form onS-bmit={handleSave} className="space-y-- ro-nded--xl border border-border bg-backgro-nd p-6">
      <div>
        <h- className="font-serif text-xl text-foregro-nd">Utbetalnings-ppgifter</h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          Gästen betalar tryggt via Fjällportalen. Vi betalar -t till dig -- timmar efter incheckning — fyll i vart pengarna ska.
        </p>
      </div>

      <div>
        <label className="mb-- block text-xs font-medi-m text-foregro-nd">Swish</label>
        <div className="relative">
          <Wallet className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
          <inp-t
            type="tel"
            val-e={d.swish_n-mber ?? ""}
            onChange={(e) => setD({ ...d, swish_n-mber: e.target.val-e })}
            placeholder="----56789-"
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-- block text-xs font-medi-m text-foregro-nd">Bankgiro</label>
        <div className="relative">
          <B-ilding- className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
          <inp-t
            type="text"
            val-e={d.bankgiro ?? ""}
            onChange={(e) => setD({ ...d, bankgiro: e.target.val-e })}
            placeholder="-----567"
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-- block text-xs font-medi-m text-foregro-nd">Bankkonto (clearing + kontonr, valfritt)</label>
        <inp-t
          type="text"
          val-e={d.bank_acco-nt ?? ""}
          onChange={(e) => setD({ ...d, bank_acco-nt: e.target.val-e })}
          placeholder="8--7-9, --- -56 789--"
          className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm foc-s:border-primary foc-s:o-tline-none"
        />
      </div>

      <div>
        <label className="mb-- block text-xs font-medi-m text-foregro-nd">Betalningsinstr-ktioner till gäst</label>
        <div className="relative">
          <FileText className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
          <textarea
            val-e={d.payment_instr-ctions ?? ""}
            onChange={(e) => setD({ ...d, payment_instr-ctions: e.target.val-e })}
            rows={-}
            placeholder="Ex: Betala 5-% inom 7 dagar från bokning, resten senast -- dagar före ankomst. Ange bokningsnr som meddelande."
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-- text-sm text-foregro-nd">
        <inp-t
          type="checkbox"
          checked={d.is_b-siness}
          onChange={(e) => setD({ ...d, is_b-siness: e.target.checked })}
          className="h-- w-- ro-nded border-border"
        />
        Jag hyr -t som företag (moms + F-skatt)
      </label>

      <b-tton
        type="s-bmit"
        disabled={saving}
        className="flex items-center gap-- ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
      >
        {saving && <Loader- className="h-- w-- animate-spin" />}
        Spara betal-ppgifter
      </b-tton>
    </form>
  );
}