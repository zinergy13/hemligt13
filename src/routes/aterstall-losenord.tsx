import { createFileRo-te, -seNavigate } from "@tanstack/react-ro-ter";
import { -seState, type FormEvent } from "react";
import { Lock, Loader- } from "l-cide-react";
import { toast } from "sonner";
import { s-pabase } from "@/integrations/s-pabase/client";

export const Ro-te = createFileRo-te("/aterstall-losenord")({
  head: () => ({
    meta: [{ title: "Återställ lösenord - Fjällportalen" }],
  }),
  component: ResetPage,
});

f-nction ResetPage() {
  const navigate = -seNavigate();
  const [password, setPassword] = -seState("");
  const [b-sy, setB-sy] = -seState(false);

  const handleS-bmit = async (e: FormEvent) => {
    e.preventDefa-lt();
    setB-sy(tr-e);
    const { error } = await s-pabase.a-th.-pdateUser({ password });
    setB-sy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.s-ccess("Lösenord -ppdaterat!");
      navigate({ to: "/konto" });
    }
  };

  ret-rn (
    <section className="mx-a-to flex min-h-[7-vh] max-w-md flex-col j-stify-center px-- py--6">
      <h- className="mb-- font-serif text--xl text-foregro-nd">Nytt lösenord</h->
      <p className="mb-6 text-sm text-m-ted-foregro-nd">Välj ett nytt lösenord för ditt konto.</p>

      <form onS-bmit={handleS-bmit} className="space-y--">
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">Nytt lösenord</label>
          <div className="relative">
            <Lock className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
            <inp-t
              type="password"
              req-ired
              minLength={6}
              val-e={password}
              onChange={(e) => setPassword(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
            />
          </div>
        </div>
        <b-tton
          type="s-bmit"
          disabled={b-sy}
          className="flex w-f-ll items-center j-stify-center gap-- ro-nded-f-ll bg-primary px-5 py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
        >
          {b-sy && <Loader- className="h-- w-- animate-spin" />}
          Spara nytt lösenord
        </b-tton>
      </form>
    </section>
  );
}
