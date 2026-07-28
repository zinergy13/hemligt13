import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { User, Phone, FileText, Home, Loader2, LogOut, Check, ShieldCheck, Heart, Mail, MapPin, Hash } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HostPayoutForm } from "@/components/HostPayoutForm";
import { SeasonPricingManager } from "@/components/SeasonPricingManager";
import { PricePreview } from "@/components/PricePreview";
import { PriceAlertsManager } from "@/components/PriceAlertsManager";

export const Route = createFileRoute("/konto")({
  head: () => ({ meta: [{ title: "Mitt konto — Fjällportalen" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, profile, isAdmin, loading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Sverige");
  const [personalNumber, setPersonalNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [becomingHost, setBecomingHost] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/logga-in", search: { redirect: "/konto" } });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setBio(profile.bio ?? "");
      setEmail(profile.email ?? user?.email ?? "");
      setAddressLine(profile.address_line ?? "");
      setPostalCode(profile.postal_code ?? "");
      setCity(profile.city ?? "");
      setCountry(profile.country ?? "Sverige");
      setPersonalNumber(profile.personal_number ?? "");
    }
  }, [profile, user]);

  if (loading || !user || !profile) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !addressLine.trim() || !postalCode.trim() || !city.trim()) {
      toast.error("Fyll i namn, telefon och adress för att kunna boka/hyra ut.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        bio,
        email: email || null,
        address_line: addressLine || null,
        postal_code: postalCode || null,
        city: city || null,
        country: country || null,
        personal_number: personalNumber || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profil sparad!");
      await refreshProfile();
    }
  };

  const handleBecomeHost = async () => {
    setBecomingHost(true);
    const [{ error: profileError }, { error: roleError }] = await Promise.all([
      supabase.from("profiles").update({ is_host: true }).eq("id", user.id),
      supabase.from("user_roles").insert({ user_id: user.id, role: "host" }),
    ]);
    setBecomingHost(false);
    // Ignore unique constraint violation on role (already host)
    if (profileError) {
      toast.error(profileError.message);
      return;
    }
    if (roleError && !roleError.message.includes("duplicate")) {
      toast.error(roleError.message);
      return;
    }
    toast.success("Du är nu värd! Lägg upp din första stuga.");
    await refreshProfile();
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Utloggad");
    navigate({ to: "/" });
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">Mitt konto</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
        >
          <LogOut className="h-4 w-4" /> Logga ut
        </button>
      </div>

      {/* Värd-status */}
      <div className={`mb-8 rounded-2xl border p-5 ${profile.is_host ? "border-primary/30 bg-primary/5" : "border-dashed border-border bg-muted/30"}`}>
        {profile.is_host ? (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg text-foreground">Du är värd</h3>
              <p className="mt-1 text-sm text-muted-foreground">Hantera dina annonser och bokningar.</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  to="/vard/stugor/ny"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  + Lägg upp stuga
                </Link>
                <Link
                  to="/vard"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                >
                  Mina stugor →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Home className="h-4 w-4 text-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg text-foreground">Vill du hyra ut din stuga?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Aktivera värdkontot så kan du lägga upp annonser, sätta priser och ta emot bokningar.
              </p>
              <button
                onClick={handleBecomeHost}
                disabled={becomingHost}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {becomingHost && <Loader2 className="h-4 w-4 animate-spin" />}
                Bli värd
              </button>
            </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mb-8 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-lg text-foreground">Administratör</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Hantera provisionsavgift och fakturastatus för alla värdar.
              </p>
              <Link to="/admin" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Till admin-panelen →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Profilformulär */}
      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border border-border bg-background p-6">
        <div>
          <h2 className="font-serif text-xl text-foreground">Personuppgifter</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Krävs för att boka och hyra ut. Endast du själv och administratörer kan se dina uppgifter.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Fullständigt namn *</label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              placeholder="För- och efternamn"
              required
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">E-post *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                placeholder="namn@exempel.se"
                required
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Telefon *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                placeholder="+46 70 123 45 67"
                required
              />
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Gatuadress *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              placeholder="Storgatan 1"
              required
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Postnummer *</label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
              placeholder="123 45"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Ort *</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
              placeholder="Stockholm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Land</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 px-3 text-sm focus:border-primary focus:outline-none"
              placeholder="Sverige"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Personnummer {profile.is_host ? "*" : "(valfritt för gäster)"}
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={personalNumber}
              onChange={(e) => setPersonalNumber(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              placeholder="ÅÅÅÅMMDD-XXXX"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Används för fakturering och myndighetsrapportering. Endast du och admin ser detta.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Om dig</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              placeholder="Berätta lite om dig själv..."
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Spara ändringar
        </button>
      </form>

      {profile.is_host && (
        <div className="mt-8">
          <HostPayoutForm hostId={user.id} />
        </div>
      )}

      {profile.is_host && (
        <div className="mt-8">
          <SeasonPricingManager hostId={user.id} />
        </div>
      )}

      {profile.is_host && (
        <div className="mt-8">
          <PricePreview hostId={user.id} />
        </div>
      )}

      <div className="mt-8">
        <PriceAlertsManager />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-background p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-xl text-foreground">Mina favoriter</h2>
            <p className="mt-1 text-sm text-muted-foreground">Se stugor du sparat för senare.</p>
            <Link to="/favoriter" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Till mina favoriter →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
