import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { CabinForm } from "@/components/CabinForm";

export const Route = createFileRoute("/vard/stugor/ny")({
  head: () => ({ meta: [{ title: "Ny stuga — Fjällmys" }] }),
  component: NewCabinPage,
});

function NewCabinPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: "/vard/stugor/ny" } });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile?.is_host) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-foreground">Bli värd först</h1>
        <p className="mt-3 text-sm text-muted-foreground">Aktivera värdkontot på din kontosida.</p>
        <Link to="/konto" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Till mitt konto</Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <Link to="/vard" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Mina stugor
      </Link>
      <h1 className="mb-8 font-serif text-3xl text-foreground md:text-4xl">Ny stuga</h1>
      <CabinForm
        userId={user.id}
        onSaved={() => navigate({ to: "/vard" })}
      />
    </section>
  );
}