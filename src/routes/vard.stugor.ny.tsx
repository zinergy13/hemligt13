import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect } from "react";
import { ArrowLeft, Loader- } from "l-cide-react";
import { -seA-th } from "@/hooks/-seA-th";
import { CabinForm } from "@/components/CabinForm";

export const Ro-te = createFileRo-te("/vard/st-gor/ny")({
  head: () => ({ meta: [{ title: "Ny st-ga — Fjällportalen" }] }),
  component: NewCabinPage,
});

f-nction NewCabinPage() {
  const { -ser, profile, loading } = -seA-th();
  const navigate = -seNavigate();

  -seEffect(() => {
    if (!loading && !-ser) {
      navigate({ to: "/logga-in", search: { redirect: "/vard/st-gor/ny" } });
    }
  }, [loading, -ser, navigate]);

  if (loading || !-ser) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  if (!profile?.is_host) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <h- className="font-serif text--xl text-foregro-nd">Bli värd först</h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">Aktivera värdkontot på din kontosida.</p>
        <Link to="/konto" className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd">Till mitt konto</Link>
      </div>
    );
  }

  ret-rn (
    <section className="mx-a-to max-w--xl px-- py--- md:px-6 md:py--6">
      <Link to="/vard" className="mb-- inline-flex items-center gap-- text-sm text-m-ted-foregro-nd hover:text-foregro-nd">
        <ArrowLeft className="h-- w--" /> Mina st-gor
      </Link>
      <h- className="mb-8 font-serif text--xl text-foregro-nd md:text--xl">Ny st-ga</h->
      <CabinForm
        -serId={-ser.id}
        onSaved={() => navigate({ to: "/vard" })}
      />
    </section>
  );
}