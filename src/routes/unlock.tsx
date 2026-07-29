import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { Mountain, Lock, Loader2 } from "lucide-react";
import { unlockSite } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "Demoläge - Fjällportalen" },
      { name: "description", content: "Fjällportalen är under uppbyggnad. Ange lösenordet för att se demoversionen av sajten." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Demoläge - Fjällportalen" },
      { property: "og:description", content: "Fjällportalen är under uppbyggnad. Ange lösenordet för att se demoversionen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UnlockPage,
});

function UnlockPage() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(false);
    try {
      const { ok } = await unlock({ data: { password } });
      if (ok) {
        await router.invalidate();
        await router.navigate({ to: "/" });
      } else {
        setError(true);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Mountain className="h-6 w-6" />
        </div>
        <h1 className="font-serif text-3xl text-foreground">Fjällportalen - demoläge</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sajten är under uppbyggnad. Ange lösenordet för att fortsätta.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="site-password" className="mb-1 block text-xs font-medium text-foreground">
            Lösenord
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              id="site-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              placeholder="Lösenord"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">Fel lösenord. Försök igen.</p>}
        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Fortsätt
        </button>
      </form>
    </section>
  );
}