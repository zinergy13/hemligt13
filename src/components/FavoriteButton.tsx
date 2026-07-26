import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { myFavoritesQuery } from "@/lib/social";

type Variant = "card" | "inline";

export function FavoriteButton({ cabinId, variant = "card" }: { cabinId: string; variant?: Variant }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const favQ = useQuery({ ...myFavoritesQuery(user?.id ?? ""), enabled: !!user });
  const isFav = !!user && (favQ.data ?? []).includes(cabinId);

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not-authed");
      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("cabin_id", cabinId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, cabin_id: cabinId });
        if (error) throw error;
      }
    },
    onMutate: async () => {
      if (!user) return;
      await qc.cancelQueries({ queryKey: ["favorites", user.id] });
      const prev = qc.getQueryData<string[]>(["favorites", user.id]) ?? [];
      qc.setQueryData<string[]>(
        ["favorites", user.id],
        isFav ? prev.filter((id) => id !== cabinId) : [...prev, cabinId],
      );
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (user && ctx?.prev) qc.setQueryData(["favorites", user.id], ctx.prev);
      toast.error(err instanceof Error ? err.message : "Kunde inte spara favorit");
    },
    onSettled: () => {
      if (user) qc.invalidateQueries({ queryKey: ["favorites", user.id] });
    },
  });

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate({ to: "/logga-in", search: { redirect: window.location.pathname } });
      return;
    }
    setBusy(true);
    try {
      await toggle.mutateAsync();
      if (!isFav) toast.success("Sparad i favoriter");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
          isFav
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-background text-foreground hover:bg-muted"
        } disabled:opacity-60`}
        aria-pressed={isFav}
        aria-label={isFav ? "Ta bort favorit" : "Spara favorit"}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
        )}
        {isFav ? "Sparad" : "Spara"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md backdrop-blur transition-transform hover:scale-105 disabled:opacity-60"
      aria-pressed={isFav}
      aria-label={isFav ? "Ta bort favorit" : "Spara favorit"}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 ${isFav ? "fill-primary text-primary" : "text-foreground"}`} />
      )}
    </button>
  );
}