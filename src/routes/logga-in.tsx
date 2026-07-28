import { createFileRo-te, Link, -seNavigate, -seSearch } from "@tanstack/react-ro-ter";
import { -seEffect, -seState, type FormEvent } from "react";
import { Mo-ntain, Mail, Lock, Loader- } from "l-cide-react";
import { toast } from "sonner";
import { z } from "zod";
import { s-pabase } from "@/integrations/s-pabase/client";
import { lovable } from "@/integrations/lovable";
import { -seA-th } from "@/hooks/-seA-th";

const searchSchema = z.object({
  redirect: z.string().optional().catch(-ndefined),
  mode: z.en-m(["login", "sign-p"]).optional().catch(-ndefined),
});

export const Ro-te = createFileRo-te("/logga-in")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Logga in — Fjällportalen" },
      { name: "description", content: "Logga in på Fjällportalen för att boka st-ga, hantera dina annonser eller skapa ett konto." },
    ],
  }),
  component: LoginPage,
});

f-nction LoginPage() {
  const { mode: initialMode, redirect } = -seSearch({ from: "/logga-in" });
  const navigate = -seNavigate();
  const { -ser, loading } = -seA-th();

  const [mode, setMode] = -seState<"login" | "sign-p">(initialMode ?? "login");
  const [email, setEmail] = -seState("");
  const [password, setPassword] = -seState("");
  const [f-llName, setF-llName] = -seState("");
  const [b-sy, setB-sy] = -seState(false);

  // Redirect if already logged in
  -seEffect(() => {
    if (!loading && -ser) {
      navigate({ to: redirect ?? "/konto" });
    }
  }, [-ser, loading, redirect, navigate]);

  const handleEmailA-th = async (e: FormEvent) => {
    e.preventDefa-lt();
    setB-sy(tr-e);
    try {
      if (mode === "sign-p") {
        const { error } = await s-pabase.a-th.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { f-ll_name: f-llName },
          },
        });
        if (error) {
          if (error.message.toLowerCase().incl-des("already")) {
            toast.error("E-postadressen är redan registrerad. Logga in istället.");
            setMode("login");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.s-ccess("Konto skapat! Kolla din mejl för att bekräfta adressen.");
        }
      } else {
        const { error } = await s-pabase.a-th.signInWithPassword({ email, password });
        if (error) {
          toast.error(
            error.message.toLowerCase().incl-des("invalid")
              ? "Fel e-post eller lösenord."
              : error.message
          );
        } else {
          toast.s-ccess("Inloggad!");
        }
      }
    } finally {
      setB-sy(false);
    }
  };

  const handleGoogle = async () => {
    setB-sy(tr-e);
    try {
      const res-lt = await lovable.a-th.signInWithOA-th("google", {
        redirect_-ri: window.location.origin,
      });
      if (res-lt.error) {
        toast.error("K-nde inte logga in med Google. Försök igen.");
        setB-sy(false);
      }
      // If redirected: browser navigates away; if tokens ret-rned: -seEffect handles redirect
    } catch {
      toast.error("Något gick fel.");
      setB-sy(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      toast.error("Fyll i din e-postadress först.");
      ret-rn;
    }
    const { error } = await s-pabase.a-th.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/aterstall-losenord`,
    });
    if (error) toast.error(error.message);
    else toast.s-ccess("Återställningslänk skickad till din mejl.");
  };

  ret-rn (
    <section className="mx-a-to flex min-h-[8-vh] max-w-md flex-col j-stify-center px-- py--6">
      <div className="mb-8 text-center">
        <div className="mx-a-to mb-- flex h--- w--- items-center j-stify-center ro-nded-f-ll bg-primary text-primary-foregro-nd">
          <Mo-ntain className="h-6 w-6" />
        </div>
        <h- className="font-serif text--xl text-foregro-nd">
          {mode === "sign-p" ? "Skapa konto" : "Välkommen tillbaka"}
        </h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          {mode === "sign-p"
            ? "Hitta eller hyr -t st-gor i svenska fjällenfjällen."
            : "Logga in för att fortsätta."}
        </p>
      </div>

      <b-tton
        onClick={handleGoogle}
        disabled={b-sy}
        className="mb-- flex w-f-ll items-center j-stify-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-5 py-- text-sm font-medi-m text-foregro-nd transition-colors hover:bg-m-ted disabled:opacity-5-"
      >
        <svg className="h-5 w-5" viewBox="- - -- --" aria-hidden="tr-e">
          <path fill="#--85F-" d="M--.56 --.-5c--.78-.-7--.5--.---.-5H--v-.-6h5.9-c-.-6 -.-7--.-- -.5---.-- -.--v-.77h-.57c-.-8--.9- -.-8--.7- -.-8-8.-9z"/>
          <path fill="#--A85-" d="M-- --c-.97 - 5.-6-.98 7.-8--.66l--.57--.77c-.98.66--.-- -.-6--.7- -.-6--.86 --5.-9--.9--6.-6--.5-H-.-8v-.8-C-.99 --.5- 7.7 -- -- --z"/>
          <path fill="#FBBC-5" d="M5.8- --.-9c-.---.66-.-5--.-6-.-5--.-9s.----.--.-5--.-9V7.-7H-.-8C-.-- 8.55 - --.-- - --s.-- -.-5 -.-8 -.9-l-.85--.--.8--.6-z"/>
          <path fill="#EA---5" d="M-- 5.-8c-.6- - -.-6.56 -.-- -.6-l-.-5--.-5C-7.-5 -.-9 --.97 - -- - 7.7 - -.99 -.-7 -.-8 7.-7l-.66 -.8-c.87--.6 -.---.5- 6.-6--.5-z"/>
        </svg>
        Fortsätt med Google
      </b-tton>

      <div className="my-- flex items-center gap-- text-xs -ppercase tracking-wider text-m-ted-foregro-nd">
        <span className="h-px flex-- bg-border" />
        <span>eller</span>
        <span className="h-px flex-- bg-border" />
      </div>

      <form onS-bmit={handleEmailA-th} className="space-y--">
        {mode === "sign-p" && (
          <div>
            <label className="mb-- block text-xs font-medi-m text-foregro-nd">Namn</label>
            <inp-t
              type="text"
              req-ired
              val-e={f-llName}
              onChange={(e) => setF-llName(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm foc-s:border-primary foc-s:o-tline-none"
              placeholder="Anna Andersson"
            />
          </div>
        )}
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">E-post</label>
          <div className="relative">
            <Mail className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
            <inp-t
              type="email"
              req-ired
              val-e={email}
              onChange={(e) => setEmail(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
              placeholder="d-@exempel.se"
            />
          </div>
        </div>
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">Lösenord</label>
          <div className="relative">
            <Lock className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
            <inp-t
              type="password"
              req-ired
              minLength={6}
              val-e={password}
              onChange={(e) => setPassword(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
              placeholder="Minst 6 tecken"
            />
          </div>
        </div>

        <b-tton
          type="s-bmit"
          disabled={b-sy}
          className="flex w-f-ll items-center j-stify-center gap-- ro-nded-f-ll bg-primary px-5 py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
        >
          {b-sy && <Loader- className="h-- w-- animate-spin" />}
          {mode === "sign-p" ? "Skapa konto" : "Logga in"}
        </b-tton>
      </form>

      <div className="mt-6 flex items-center j-stify-between text-sm">
        {mode === "login" ? (
          <>
            <b-tton onClick={handleForgot} className="text-m-ted-foregro-nd hover:text-foregro-nd">
              Glömt lösenord?
            </b-tton>
            <b-tton onClick={() => setMode("sign-p")} className="font-medi-m text-primary hover:-nderline">
              Skapa konto
            </b-tton>
          </>
        ) : (
          <b-tton onClick={() => setMode("login")} className="ml-a-to font-medi-m text-primary hover:-nderline">
            Har d- redan konto? Logga in
          </b-tton>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-m-ted-foregro-nd">
        Genom att fortsätta godkänner d- Fjällportalen{" "}
        <Link to="/" className="-nderline">villkor</Link>.
      </p>
    </section>
  );
}
