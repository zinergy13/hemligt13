import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cabinReviewsQuery, averageRating, type ReviewWithProfile } from "@/lib/social";
import { ReviewFlagButton } from "@/components/ReviewFlagButton";

function Stars({ value, size = 4 }: { value: number; size?: number }) {
  return (
    <div className="flex" aria-label={`${value} av 5 stjärnor`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-${size} w-${size} ${
            n <= value ? "fill-primary text-primary" : "text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewsSection({ cabinId }: { cabinId: string }) {
  const q = useQuery(cabinReviewsQuery(cabinId));
  const reviews = q.data ?? [];
  const { avg, count } = averageRating(reviews);

  return (
    <section className="mt-10">
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-serif text-2xl text-foreground">Recensioner</h2>
        {count > 0 && (
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Stars value={Math.round(avg)} />
            <span className="font-medium">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground">({count})</span>
          </div>
        )}
      </div>

      {q.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Laddar recensioner…
        </div>
      ) : reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
          Inga recensioner ännu. Var först med att dela din upplevelse efter din vistelse.
        </p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ReviewItem({ review }: { review: ReviewWithProfile }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const name = review.profiles?.full_name || "Gäst";
  const initials = name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const isMine = user?.id === review.guest_id;

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reviews").delete().eq("id", review.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recension borttagen");
      qc.invalidateQueries({ queryKey: ["reviews", "cabin", review.cabin_id] });
      if (user) qc.invalidateQueries({ queryKey: ["reviews", "mine", user.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Kunde inte ta bort"),
  });

  return (
    <li className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {initials || "?"}
          </span>
          <div>
            <div className="text-sm font-medium text-foreground">{name}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString("sv-SE", {
                year: "numeric",
                month: "long",
              })}
            </div>
          </div>
        </div>
        <Stars value={review.rating} />
      </div>
      {review.comment && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">{review.comment}</p>
      )}
      {isMine && (
        <button
          onClick={() => del.mutate()}
          className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" /> Ta bort min recension
        </button>
      )}
      {!isMine && (
        <div className="mt-3">
          <ReviewFlagButton reviewId={review.id} />
        </div>
      )}
    </li>
  );
}

export function ReviewForm({
  bookingId,
  cabinId,
  onDone,
}: {
  bookingId: string;
  cabinId: string;
  onDone?: () => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      toast.error("Välj mellan 1 och 5 stjärnor");
      return;
    }
    const trimmed = comment.trim().slice(0, 1000);
    setSaving(true);
    const { error } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      cabin_id: cabinId,
      guest_id: user.id,
      rating,
      comment: trimmed || null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tack för din recension!");
    qc.invalidateQueries({ queryKey: ["reviews", "cabin", cabinId] });
    qc.invalidateQueries({ queryKey: ["reviews", "mine", user.id] });
    onDone?.();
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
      <div>
        <label className="mb-2 block text-xs font-medium text-foreground">Betyg</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="p-1"
              aria-label={`${n} stjärnor`}
            >
              <Star
                className={`h-6 w-6 ${
                  n <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">Kommentar (valfritt)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="Hur var din vistelse?"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={saving || rating < 1}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Publicera recension
      </button>
    </form>
  );
}