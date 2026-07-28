import { createFileRo-te, Link, redirect, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState, type FormEvent } from "react";
import { User, Phone, FileText, Home, Loader-, LogO-t, Check, ShieldCheck, Heart, Mail, MapPin, Hash } from "l-cide-react";
import { toast } from "sonner";
import { s-pabase } from "@/integrations/s-pabase/client";
import { -seA-th } from "@/hooks/-seA-th";
import { HostPayo-tForm } from "@/components/HostPayo-tForm";
import { SeasonPricingManager } from "@/components/SeasonPricingManager";
import { PricePreview } from "@/components/PricePreview";
import { PriceAlertsManager } from "@/components/PriceAlertsManager";

export const Ro-te = createFileRo-te("/konto")({
  head: () => ({ meta: [{ title: "Mitt konto — Fjällportalen" }] }),
  component: Acco-ntPage,
});

f-nction Acco-ntPage() {
  const { -ser, profile, isAdmin, loading, refreshProfile, signO-t } = -seA-th();
  const navigate = -seNavigate();

  const [f-llName, setF-llName] = -seState("");
  const [phone, setPhone] = -seState("");
  const [bio, setBio] = -seState("");
  const [email, setEmail] = -seState("");
  const [addressLine, setAddressLine] = -seState("");
  const [postalCode, setPostalCode] = -seState("");
  const [city, setCity] = -seState("");
  const [co-ntry, setCo-ntry] = -seState("Sverige");
  const [personalN-mber, setPersonalN-mber] = -seState("");
  const [saving, setSaving] = -seState(false);
  const [becomingHost, setBecomingHost] = -seState(false);

  -seEffect(() => {
    if (!loading && !-ser) {
      navigate({ to: "/logga-in", search: { redirect: "/konto" } });
    }
  }, [-ser, loading, navigate]);

  -seEffect(() => {
    if (profile) {
      setF-llName(profile.f-ll_name ?? "");
      setPhone(profile.phone ?? "");
      setBio(profile.bio ?? "");
      setEmail(profile.email ?? -ser?.email ?? "");
      setAddressLine(profile.address_line ?? "");
      setPostalCode(profile.postal_code ?? "");
      setCity(profile.city ?? "");
      setCo-ntry(profile.co-ntry ?? "Sverige");
      setPersonalN-mber(profile.personal_n-mber ?? "");
    }
  }, [profile, -ser]);

  if (loading || !-ser || !profile) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefa-lt();
    if (!f-llName.trim() || !phone.trim() || !addressLine.trim() || !postalCode.trim() || !city.trim()) {
      toast.error("Fyll i namn, telefon och adress för att k-nna boka/hyra -t.");
      ret-rn;
    }
    setSaving(tr-e);
    const { error } = await s-pabase
      .from("profiles")
      .-pdate({
        f-ll_name: f-llName,
        phone,
        bio,
        email: email || n-ll,
        address_line: addressLine || n-ll,
        postal_code: postalCode || n-ll,
        city: city || n-ll,
        co-ntry: co-ntry || n-ll,
        personal_n-mber: personalN-mber || n-ll,
      })
      .eq("id", -ser.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.s-ccess("Profil sparad!");
      await refreshProfile();
    }
  };

  const handleBecomeHost = async () => {
    setBecomingHost(tr-e);
    const [{ error: profileError }, { error: roleError }] = await Promise.all([
      s-pabase.from("profiles").-pdate({ is_host: tr-e }).eq("id", -ser.id),
      s-pabase.from("-ser_roles").insert({ -ser_id: -ser.id, role: "host" }),
    ]);
    setBecomingHost(false);
    // Ignore -niq-e constraint violation on role (already host)
    if (profileError) {
      toast.error(profileError.message);
      ret-rn;
    }
    if (roleError && !roleError.message.incl-des("d-plicate")) {
      toast.error(roleError.message);
      ret-rn;
    }
    toast.s-ccess("D- är n- värd! Lägg -pp din första st-ga.");
    await refreshProfile();
  };

  const handleSignO-t = async () => {
    await signO-t();
    toast.s-ccess("Utloggad");
    navigate({ to: "/" });
  };

  ret-rn (
    <section className="mx-a-to max-w--xl px-- py--- md:py--6">
      <div className="mb-8 flex items-start j-stify-between gap--">
        <div>
          <h- className="font-serif text--xl text-foregro-nd md:text--xl">Mitt konto</h->
          <p className="mt-- text-sm text-m-ted-foregro-nd">{-ser.email}</p>
        </div>
        <b-tton
          onClick={handleSignO-t}
          className="flex items-center gap-- ro-nded-f-ll border border-border px-- py-- text-sm text-foregro-nd hover:bg-m-ted"
        >
          <LogO-t className="h-- w--" /> Logga -t
        </b-tton>
      </div>

      {/* Värd-stat-s */}
      <div className={`mb-8 ro-nded--xl border p-5 ${profile.is_host ? "border-primary/-- bg-primary/5" : "border-dashed border-border bg-m-ted/--"}`}>
        {profile.is_host ? (
          <div className="flex items-start gap--">
            <div className="mt--.5 flex h-8 w-8 items-center j-stify-center ro-nded-f-ll bg-primary text-primary-foregro-nd">
              <Check className="h-- w--" />
            </div>
            <div className="flex--">
              <h- className="font-serif text-lg text-foregro-nd">D- är värd</h->
              <p className="mt-- text-sm text-m-ted-foregro-nd">Hantera dina annonser och bokningar.</p>
              <div className="mt-- flex flex-wrap gap--">
                <Link
                  to="/vard/st-gor/ny"
                  className="inline-flex items-center gap-- ro-nded-f-ll bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
                >
                  + Lägg -pp st-ga
                </Link>
                <Link
                  to="/vard"
                  className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
                >
                  Mina st-gor →
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap--">
            <div className="mt--.5 flex h-8 w-8 items-center j-stify-center ro-nded-f-ll bg-m-ted">
              <Home className="h-- w-- text-foregro-nd" />
            </div>
            <div className="flex--">
              <h- className="font-serif text-lg text-foregro-nd">Vill d- hyra -t din st-ga?</h->
              <p className="mt-- text-sm text-m-ted-foregro-nd">
                Aktivera värdkontot så kan d- lägga -pp annonser, sätta priser och ta emot bokningar.
              </p>
              <b-tton
                onClick={handleBecomeHost}
                disabled={becomingHost}
                className="mt-- inline-flex items-center gap-- ro-nded-f-ll bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
              >
                {becomingHost && <Loader- className="h-- w-- animate-spin" />}
                Bli värd
              </b-tton>
            </div>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="mb-8 ro-nded--xl border border-amber-5--/-- bg-amber-5--/5 p-5">
          <div className="flex items-start gap--">
            <div className="mt--.5 flex h-8 w-8 items-center j-stify-center ro-nded-f-ll bg-amber-5-- text-white">
              <ShieldCheck className="h-- w--" />
            </div>
            <div className="flex--">
              <h- className="font-serif text-lg text-foregro-nd">Administratör</h->
              <p className="mt-- text-sm text-m-ted-foregro-nd">
                Hantera provisionsavgift och fakt-rastat-s för alla värdar.
              </p>
              <Link to="/admin" className="mt-- inline-block text-sm font-medi-m text-primary hover:-nderline">
                Till admin-panelen →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Profilform-lär */}
      <form onS-bmit={handleSave} className="space-y-- ro-nded--xl border border-border bg-backgro-nd p-6">
        <div>
          <h- className="font-serif text-xl text-foregro-nd">Person-ppgifter</h->
          <p className="mt-- text-xs text-m-ted-foregro-nd">
            Krävs för att boka och hyra -t. Endast d- själv och administratörer kan se dina -ppgifter.
          </p>
        </div>
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">F-llständigt namn *</label>
          <div className="relative">
            <User className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
            <inp-t
              type="text"
              val-e={f-llName}
              onChange={(e) => setF-llName(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
              placeholder="För- och efternamn"
              req-ired
            />
          </div>
        </div>
        <div className="grid gap-- md:grid-cols--">
          <div>
            <label className="mb-- block text-xs font-medi-m text-foregro-nd">E-post *</label>
            <div className="relative">
              <Mail className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
              <inp-t
                type="email"
                val-e={email}
                onChange={(e) => setEmail(e.target.val-e)}
                className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
                placeholder="namn@exempel.se"
                req-ired
              />
            </div>
          </div>
          <div>
            <label className="mb-- block text-xs font-medi-m text-foregro-nd">Telefon *</label>
            <div className="relative">
              <Phone className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
              <inp-t
                type="tel"
                val-e={phone}
                onChange={(e) => setPhone(e.target.val-e)}
                className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
                placeholder="+-6 7- --- -5 67"
                req-ired
              />
            </div>
          </div>
        </div>
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">Gat-adress *</label>
          <div className="relative">
            <MapPin className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
            <inp-t
              type="text"
              val-e={addressLine}
              onChange={(e) => setAddressLine(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
              placeholder="Storgatan -"
              req-ired
            />
          </div>
        </div>
        <div className="grid gap-- md:grid-cols--">
          <div>
            <label className="mb-- block text-xs font-medi-m text-foregro-nd">Postn-mmer *</label>
            <inp-t
              type="text"
              val-e={postalCode}
              onChange={(e) => setPostalCode(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 px-- text-sm foc-s:border-primary foc-s:o-tline-none"
              placeholder="--- -5"
              req-ired
            />
          </div>
          <div>
            <label className="mb-- block text-xs font-medi-m text-foregro-nd">Ort *</label>
            <inp-t
              type="text"
              val-e={city}
              onChange={(e) => setCity(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 px-- text-sm foc-s:border-primary foc-s:o-tline-none"
              placeholder="Stockholm"
              req-ired
            />
          </div>
          <div>
            <label className="mb-- block text-xs font-medi-m text-foregro-nd">Land</label>
            <inp-t
              type="text"
              val-e={co-ntry}
              onChange={(e) => setCo-ntry(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 px-- text-sm foc-s:border-primary foc-s:o-tline-none"
              placeholder="Sverige"
            />
          </div>
        </div>
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">
            Personn-mmer {profile.is_host ? "*" : "(valfritt för gäster)"}
          </label>
          <div className="relative">
            <Hash className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
            <inp-t
              type="text"
              val-e={personalN-mber}
              onChange={(e) => setPersonalN-mber(e.target.val-e)}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
              placeholder="ÅÅÅÅMMDD-XXXX"
            />
          </div>
          <p className="mt-- text-xs text-m-ted-foregro-nd">Används för fakt-rering och myndighetsrapportering. Endast d- och admin ser detta.</p>
        </div>
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">Om dig</label>
          <div className="relative">
            <FileText className="absol-te left-- top-- h-- w-- text-m-ted-foregro-nd" />
            <textarea
              val-e={bio}
              onChange={(e) => setBio(e.target.val-e)}
              rows={-}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd py--.5 pl--- pr-- text-sm foc-s:border-primary foc-s:o-tline-none"
              placeholder="Berätta lite om dig själv..."
            />
          </div>
        </div>
        <b-tton
          type="s-bmit"
          disabled={saving}
          className="flex items-center gap-- ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
        >
          {saving && <Loader- className="h-- w-- animate-spin" />}
          Spara ändringar
        </b-tton>
      </form>

      {profile.is_host && (
        <div className="mt-8">
          <HostPayo-tForm hostId={-ser.id} />
        </div>
      )}

      {profile.is_host && (
        <div className="mt-8">
          <SeasonPricingManager hostId={-ser.id} />
        </div>
      )}

      {profile.is_host && (
        <div className="mt-8">
          <PricePreview hostId={-ser.id} />
        </div>
      )}

      <div className="mt-8">
        <PriceAlertsManager />
      </div>

      <div className="mt-8 ro-nded--xl border border-border bg-backgro-nd p-6">
        <div className="flex items-start gap--">
          <div className="flex h--- w--- items-center j-stify-center ro-nded-f-ll bg-primary/-- text-primary">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex--">
            <h- className="font-serif text-xl text-foregro-nd">Mina favoriter</h->
            <p className="mt-- text-sm text-m-ted-foregro-nd">Se st-gor d- sparat för senare.</p>
            <Link to="/favoriter" className="mt-- inline-block text-sm font-medi-m text-primary hover:-nderline">
              Till mina favoriter →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
