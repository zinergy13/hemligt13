import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Mountain, Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";

const searchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
  mode: z.enum(["login", "signup"]).optional().catch(undefined),
});

export const Route = createFileRoute("/logga-in")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Logga in - Fjällportalen" },
      { name: "description", content: "Logga in på Fjällportalen för att boka stuga, hantera dina annonser eller skapa ett konto." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { mode: initialMode, redirect } = useSearch({ from: "/logga-in" });
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">(initialMode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: redirect ?? "/konto" });
    }
  }, [user, loading, redirect, navigate]);

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) {
          if (error.message.toLowerCase().includes("already")) {
            toast.error("E-postadressen är redan registrerad. Logga in istället.");
            setMode("login");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Konto skapat! Kolla din mejl för att bekräfta adressen.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error(
            error.message.toLowerCase().includes("invalid")
              ? "Fel e-post eller lösenord."
              : error.message
          );
        } else {
          toast.success("Inloggad!");
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Kunde inte logga in med Google. Försök igen.");
        setBusy(false);
      }
      // If redirected: browser navigates away; if tokens returned: useEffect handles redirect
    } catch {
      toast.error("Något gick fel.");
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      toast.error("Fyll i din e-postadress först.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/aterstall-losenord`,
    });
    if (error) toast.error(error.message);
    else toast.success("Återställningslänk skickad till din mejl.");
  };

  return (
    <section className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Mountain className="h-6 w-6" />
        </div>
        <h1 className="font-serif text-3xl text-foreground">
          {mode === "signup" ? "Skapa konto" : "Välkommen tillbaka"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Hitta eller hyr ut stugor i svenska fjällenfjällen."
            : "Logga in för att fortsätta."}
        </p>
      </div>

      <button
        onClick={handleGoogle}
        disabled={busy}
        className="mb-4 flex w-full items-center justify-center gap-3 rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Fortsätt med Google
      </button>

      <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>eller</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-3">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Namn</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              placeholder="Anna Andersson"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">E-post</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              placeholder="du@exempel.se"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Lösenord</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              placeholder="Minst 6 tecken"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signup" ? "Skapa konto" : "Logga in"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm">
        {mode === "login" ? (
          <>
            <button onClick={handleForgot} className="text-muted-foreground hover:text-foreground">
              Glömt lösenord?
            </button>
            <button onClick={() => setMode("signup")} className="font-medium text-primary hover:underline">
              Skapa konto
            </button>
          </>
        ) : (
          <button onClick={() => setMode("login")} className="ml-auto font-medium text-primary hover:underline">
            Har du redan konto? Logga in
          </button>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Genom att fortsätta godkänner du Fjällportalen{" "}
        <Link to="/" className="underline">villkor</Link>.
      </p>
    </section>
  );
}
