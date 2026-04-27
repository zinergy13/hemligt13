import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/logga-in")({
  head: () => ({
    meta: [
      { title: "Logga in — Stuga i Sälen" },
      { name: "description", content: "Logga in på Stuga i Sälen för att boka stuga, hantera dina annonser eller skapa ett konto." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-16 md:px-6">
      <div className="w-full rounded-3xl bg-background p-8 shadow-[var(--shadow-elevated)] md:p-10">
        <h1 className="font-serif text-3xl text-foreground">Välkommen tillbaka</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Logga in för att boka eller hantera dina stugor.
        </p>

        <form className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-foreground">E-post</span>
            <input type="email" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="du@exempel.se" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">Lösenord</span>
            <input type="password" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="••••••••" />
          </label>
          <button type="button" className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Mail className="h-4 w-4" /> Logga in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Inloggning aktiveras när vi kopplar på Lovable Cloud i nästa steg. Tills dess är detta en förhandsvisning av designen.
        </p>

        <div className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          Ny här? <Link to="/hyr-ut" className="font-medium text-primary hover:underline">Skapa konto</Link>
        </div>
      </div>
    </div>
  );
}