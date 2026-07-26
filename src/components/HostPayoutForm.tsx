import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Wallet, Building2, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type PayoutDetails = {
  swish_number: string | null;
  bankgiro: string | null;
  bank_account: string | null;
  payment_instructions: string | null;
  is_business: boolean;
};

export function HostPayoutForm({ hostId }: { hostId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [d, setD] = useState<PayoutDetails>({
    swish_number: "",
    bankgiro: "",
    bank_account: "",
    payment_instructions: "",
    is_business: false,
  });

  useEffect(() => {
    let active = true;
    supabase
      .from("host_payout_details")
      .select("swish_number, bankgiro, bank_account, payment_instructions, is_business")
      .eq("host_id", hostId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        if (data) {
          setD({
            swish_number: data.swish_number ?? "",
            bankgiro: data.bankgiro ?? "",
            bank_account: data.bank_account ?? "",
            payment_instructions: data.payment_instructions ?? "",
            is_business: !!data.is_business,
          });
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [hostId]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      host_id: hostId,
      swish_number: d.swish_number?.trim() || null,
      bankgiro: d.bankgiro?.trim() || null,
      bank_account: d.bank_account?.trim() || null,
      payment_instructions: d.payment_instructions?.trim() || null,
      is_business: d.is_business,
    };
    const { error } = await supabase.from("host_payout_details").upsert(payload, { onConflict: "host_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Betaluppgifter sparade");
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-background p-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-border bg-background p-6">
      <div>
        <h2 className="font-serif text-xl text-foreground">Betaluppgifter</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Visas endast för gäster med en bekräftad bokning hos dig. Fjällportalen hanterar aldrig pengarna — gästen betalar dig direkt.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">Swish</label>
        <div className="relative">
          <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="tel"
            value={d.swish_number ?? ""}
            onChange={(e) => setD({ ...d, swish_number: e.target.value })}
            placeholder="1234567890"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">Bankgiro</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={d.bankgiro ?? ""}
            onChange={(e) => setD({ ...d, bankgiro: e.target.value })}
            placeholder="123-4567"
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">Bankkonto (clearing + kontonr, valfritt)</label>
        <input
          type="text"
          value={d.bank_account ?? ""}
          onChange={(e) => setD({ ...d, bank_account: e.target.value })}
          placeholder="8327-9, 123 456 789-0"
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">Betalningsinstruktioner till gäst</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <textarea
            value={d.payment_instructions ?? ""}
            onChange={(e) => setD({ ...d, payment_instructions: e.target.value })}
            rows={3}
            placeholder="Ex: Betala 50% inom 7 dagar från bokning, resten senast 30 dagar före ankomst. Ange bokningsnr som meddelande."
            className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={d.is_business}
          onChange={(e) => setD({ ...d, is_business: e.target.checked })}
          className="h-4 w-4 rounded border-border"
        />
        Jag hyr ut som företag (moms + F-skatt)
      </label>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Spara betaluppgifter
      </button>
    </form>
  );
}