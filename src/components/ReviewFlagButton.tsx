import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const REASONS = [
  "Kränkande språk",
  "Falsk information",
  "Spam eller reklam",
  "Personuppgifter",
  "Annat",
];

export function ReviewFlagButton({ reviewId }: { reviewId: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const submit = async () => {
    setSaving(true);
    const { error } = await supabase.from("review_flags" as any).insert({
      review_id: reviewId,
      reporter_id: user.id,
      reason,
    });
    setSaving(false);
    if (error) {
      if (error.code === "23505") toast.error("Du har redan anmält denna recension");
      else toast.error(error.message);
      return;
    }
    toast.success("Tack - recensionen är anmäld till moderatorerna");
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive"
      >
        <Flag className="h-3 w-3" /> Anmäl
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-6 z-20 w-64 rounded-xl border border-border bg-background p-3 shadow-lg">
            <p className="mb-2 text-xs font-semibold text-foreground">Anmäl recension</p>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs"
            >
              {REASONS.map((r) => (<option key={r} value={r}>{r}</option>))}
            </select>
            <button
              onClick={submit}
              disabled={saving}
              className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Skicka anmälan
            </button>
          </div>
        </>
      )}
    </div>
  );
}