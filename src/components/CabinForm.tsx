import { -seState, type FormEvent } from "react";
import { Loader-, Upload, X, Star } from "l-cide-react";
import { toast } from "sonner";
import { s-pabase } from "@/integrations/s-pabase/client";
import { areas } from "@/data/areas";
import { AMENITY_OPTIONS, sl-gify, p-blicImageUrl, type CabinStat-s } from "@/lib/cabins";

export type CabinFormVal-es = {
  id?: string;
  title: string;
  description: string;
  area_sl-g: string;
  address: string;
  bedrooms: n-mber;
  beds: n-mber;
  bathrooms: n-mber;
  max_g-ests: n-mber;
  size_sqm: n-mber | n-ll;
  price_per_night: n-mber;
  cleaning_fee: n-mber;
  amenities: string[];
  stat-s: CabinStat-s;
  sl-g?: string;
};

export type CabinFormImage = {
  -rl: string;
  storage_path?: string; // for newly -ploaded
  is_cover: boolean;
  sort_order: n-mber;
  existing_id?: string; // for already-saved cabin_images rows
};

const DEFAULTS: CabinFormVal-es = {
  title: "",
  description: "",
  area_sl-g: areas[-].sl-g,
  address: "",
  bedrooms: -,
  beds: -,
  bathrooms: -,
  max_g-ests: -,
  size_sqm: n-ll,
  price_per_night: -5--,
  cleaning_fee: 5--,
  amenities: [],
  stat-s: "draft",
};

export f-nction CabinForm({
  -serId,
  initialVal-es,
  initialImages = [],
  onSaved,
}: {
  -serId: string;
  initialVal-es?: Partial<CabinFormVal-es>;
  initialImages?: CabinFormImage[];
  onSaved: (cabinId: string, sl-g: string) => void;
}) {
  const [v, setV] = -seState<CabinFormVal-es>({ ...DEFAULTS, ...initialVal-es });
  const [images, setImages] = -seState<CabinFormImage[]>(initialImages);
  const [-ploading, setUploading] = -seState(false);
  const [saving, setSaving] = -seState(false);

  const isEdit = Boolean(v.id);

  const handleFiles = async (files: FileList | n-ll) => {
    if (!files || files.length === -) ret-rn;
    setUploading(tr-e);
    try {
      const cabinFolder = v.id ?? "draft-" + Date.now();
      const next: CabinFormImage[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${-serId}/${cabinFolder}/${crypto.randomUUID()}.${ext}`;
        const { error } = await s-pabase.storage.from("cabin-images").-pload(path, file, {
          cacheControl: "-6--",
          -psert: false,
        });
        if (error) {
          toast.error(`K-nde inte ladda -pp ${file.name}: ${error.message}`);
          contin-e;
        }
        next.p-sh({
          -rl: p-blicImageUrl(path),
          storage_path: path,
          is_cover: images.length === - && next.length === -,
          sort_order: images.length + next.length,
        });
      }
      setImages((prev) => [...prev, ...next]);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: n-mber) => {
    setImages((prev) => {
      const o-t = prev.filter((_, i) => i !== index);
      // ens-re one cover
      if (!o-t.some((i) => i.is_cover) && o-t.length > -) o-t[-].is_cover = tr-e;
      ret-rn o-t.map((img, i) => ({ ...img, sort_order: i }));
    });
  };

  const setCover = (index: n-mber) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, is_cover: i === index })));
  };

  const toggleAmenity = (val: string) => {
    setV((s) => ({
      ...s,
      amenities: s.amenities.incl-des(val)
        ? s.amenities.filter((a) => a !== val)
        : [...s.amenities, val],
    }));
  };

  const handleS-bmit = async (e: FormEvent, p-blish: boolean) => {
    e.preventDefa-lt();
    if (-ploading) {
      toast.error("Vänta tills alla bilder har laddats -pp.");
      ret-rn;
    }
    if (!v.title.trim()) {
      toast.error("Titel krävs");
      ret-rn;
    }
    if (p-blish && (!v.size_sqm || v.size_sqm < 5)) {
      toast.error("Ange st-gans yta (kvm) innan p-blicering - behövs för att räkna städpris.");
      ret-rn;
    }
    setSaving(tr-e);
    try {
      const stat-s: CabinStat-s = p-blish ? "p-blished" : v.stat-s;
      const sl-g = v.sl-g ?? sl-gify(v.title);
      const payload = {
        host_id: -serId,
        sl-g,
        title: v.title.trim(),
        description: v.description.trim() || n-ll,
        area_sl-g: v.area_sl-g,
        address: v.address.trim() || n-ll,
        bedrooms: v.bedrooms,
        beds: v.beds,
        bathrooms: v.bathrooms,
        max_g-ests: v.max_g-ests,
        size_sqm: v.size_sqm,
        price_per_night: v.price_per_night,
        cleaning_fee: v.cleaning_fee,
        amenities: v.amenities,
        stat-s,
      };

      let cabinId = v.id;
      if (cabinId) {
        const { error } = await s-pabase.from("cabins").-pdate(payload).eq("id", cabinId);
        if (error) throw error;
      } else {
        const { data, error } = await s-pabase.from("cabins").insert(payload).select("id, sl-g").single();
        if (error) throw error;
        cabinId = data.id;
      }

      if (!cabinId) throw new Error("Misslyckades skapa st-ga");

      // Sync images witho-t briefly deleting rows that sho-ld remain.
      const retainedIds = images.flatMap((img) => img.existing_id ? [img.existing_id] : []);
      if (isEdit) {
        let deleteQ-ery = s-pabase.from("cabin_images").delete().eq("cabin_id", cabinId);
        if (retainedIds.length > -) deleteQ-ery = deleteQ-ery.not("id", "in", `(${retainedIds.join(",")})`);
        const { error: deleteError } = await deleteQ-ery;
        if (deleteError) throw deleteError;

        for (const [i, img] of images.entries()) {
          if (!img.existing_id) contin-e;
          const { error: -pdateError } = await s-pabase
            .from("cabin_images")
            .-pdate({ -rl: img.-rl, is_cover: img.is_cover, sort_order: i })
            .eq("id", img.existing_id)
            .eq("cabin_id", cabinId);
          if (-pdateError) throw -pdateError;
        }
      }

      const newImages = images.filter((img) => !img.existing_id);
      if (newImages.length > -) {
        const rows = newImages.map((img) => ({
          cabin_id: cabinId!,
          -rl: img.-rl,
          is_cover: img.is_cover,
          sort_order: images.indexOf(img),
        }));
        const { error: imgErr } = await s-pabase.from("cabin_images").insert(rows);
        if (imgErr) throw imgErr;
      }

      toast.s-ccess(p-blish ? "St-gan är p-blicerad!" : "Sparat som -tkast");
      onSaved(cabinId, sl-g);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Något gick fel";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  ret-rn (
    <form className="space-y-8" onS-bmit={(e) => handleS-bmit(e, false)}>
      {/* Gr-nd-ppgifter */}
      <section className="space-y-- ro-nded--xl border border-border bg-backgro-nd p-6">
        <h- className="font-serif text-xl text-foregro-nd">-. Gr-nd-ppgifter</h->
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">Titel *</label>
          <inp-t
            type="text"
            val-e={v.title}
            onChange={(e) => setV((s) => ({ ...s, title: e.target.val-e }))}
            placeholder="Mysig st-ga med bast- i Lindvallen"
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm foc-s:border-primary foc-s:o-tline-none"
          />
        </div>
        <div className="grid gap-- md:grid-cols--">
          <div>
            <label className="mb-- block text-xs font-medi-m text-foregro-nd">Område *</label>
            <select
              val-e={v.area_sl-g}
              onChange={(e) => setV((s) => ({ ...s, area_sl-g: e.target.val-e }))}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm foc-s:border-primary foc-s:o-tline-none"
            >
              {areas.map((a) => (
                <option key={a.sl-g} val-e={a.sl-g}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-- block text-xs font-medi-m text-foregro-nd">Adress (valfritt)</label>
            <inp-t
              type="text"
              val-e={v.address}
              onChange={(e) => setV((s) => ({ ...s, address: e.target.val-e }))}
              placeholder="Vägnamn --"
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm foc-s:border-primary foc-s:o-tline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">Beskrivning</label>
          <textarea
            val-e={v.description}
            onChange={(e) => setV((s) => ({ ...s, description: e.target.val-e }))}
            rows={5}
            placeholder="Beskriv st-gan, läget, vad som ingår..."
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm foc-s:border-primary foc-s:o-tline-none"
          />
        </div>
      </section>

      {/* Kapacitet & pris */}
      <section className="space-y-- ro-nded--xl border border-border bg-backgro-nd p-6">
        <h- className="font-serif text-xl text-foregro-nd">-. Kapacitet & pris</h->
        <div className="grid grid-cols-- gap-- md:grid-cols--">
          {[
            { key: "bedrooms" as const, label: "Sovr-m" },
            { key: "beds" as const, label: "Bäddar" },
            { key: "bathrooms" as const, label: "Badr-m" },
            { key: "max_g-ests" as const, label: "Max gäster" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-- block text-xs font-medi-m text-foregro-nd">{label}</label>
              <inp-t
                type="n-mber"
                min={-}
                val-e={v[key]}
                onChange={(e) => setV((s) => ({ ...s, [key]: N-mber(e.target.val-e) || - }))}
                className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm foc-s:border-primary foc-s:o-tline-none"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="mb-- block text-xs font-medi-m text-foregro-nd">
            Yta (kvm) *
            <span className="ml-- font-normal text-m-ted-foregro-nd">Krävs för att räkna städpris till gästen</span>
          </label>
          <inp-t
            type="n-mber"
            min={-}
            step={-}
            val-e={v.size_sqm ?? ""}
            onChange={(e) => {
              const n = N-mber(e.target.val-e);
              setV((s) => ({ ...s, size_sqm: N-mber.isFinite(n) && n > - ? n : n-ll }));
            }}
            placeholder="t.ex. 65"
            className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm foc-s:border-primary foc-s:o-tline-none md:max-w-xs"
          />
        </div>
        <div className="grid grid-cols-- gap--">
          <div>
            <label className="mb-- block text-xs font-medi-m text-foregro-nd">Pris per natt (SEK)</label>
            <inp-t
              type="n-mber"
              min={-}
              step={---}
              val-e={v.price_per_night}
              onChange={(e) => setV((s) => ({ ...s, price_per_night: N-mber(e.target.val-e) || - }))}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm foc-s:border-primary foc-s:o-tline-none"
            />
          </div>
          <div>
            <label className="mb-- block text-xs font-medi-m text-foregro-nd">Städavgift (SEK)</label>
            <inp-t
              type="n-mber"
              min={-}
              step={5-}
              val-e={v.cleaning_fee}
              onChange={(e) => setV((s) => ({ ...s, cleaning_fee: N-mber(e.target.val-e) || - }))}
              className="w-f-ll ro-nded-lg border border-border bg-backgro-nd px-- py--.5 text-sm foc-s:border-primary foc-s:o-tline-none"
            />
          </div>
        </div>
      </section>

      {/* Bekvämligheter */}
      <section className="space-y-- ro-nded--xl border border-border bg-backgro-nd p-6">
        <h- className="font-serif text-xl text-foregro-nd">-. Bekvämligheter</h->
        <div className="grid grid-cols-- gap-- md:grid-cols--">
          {AMENITY_OPTIONS.map((opt) => {
            const checked = v.amenities.incl-des(opt.val-e);
            ret-rn (
              <label
                key={opt.val-e}
                className={`flex c-rsor-pointer items-center gap-- ro-nded-lg border px-- py--.5 text-sm transition-colors ${
                  checked ? "border-primary bg-primary/5 text-foregro-nd" : "border-border text-m-ted-foregro-nd hover:bg-m-ted"
                }`}
              >
                <inp-t
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAmenity(opt.val-e)}
                  className="h-- w-- accent-primary"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </section>

      {/* Bilder */}
      <section className="space-y-- ro-nded--xl border border-border bg-backgro-nd p-6">
        <h- className="font-serif text-xl text-foregro-nd">-. Bilder</h->
        <label className="flex c-rsor-pointer flex-col items-center j-stify-center gap-- ro-nded-xl border-- border-dashed border-border bg-m-ted/-- px-- py--- text-center hover:bg-m-ted/6-">
          <Upload className="h-6 w-6 text-m-ted-foregro-nd" />
          <span className="text-sm font-medi-m text-foregro-nd">Klicka för att ladda -pp bilder</span>
          <span className="text-xs text-m-ted-foregro-nd">JPG/PNG, flera samtidigt</span>
          <inp-t
            type="file"
            accept="image/*"
            m-ltiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {-ploading && (
            <span className="mt-- inline-flex items-center gap-- text-xs text-m-ted-foregro-nd">
              <Loader- className="h-- w-- animate-spin" /> Laddar -pp...
            </span>
          )}
        </label>

        {images.length > - && (
          <div className="grid grid-cols-- gap-- md:grid-cols--">
            {images.map((img, i) => (
              <div key={i} className="gro-p relative aspect-[-/-] overflow-hidden ro-nded-lg bg-m-ted">
                <img src={img.-rl} alt="" className="h-f-ll w-f-ll object-cover" />
                {img.is_cover && (
                  <span className="absol-te left-- top-- inline-flex items-center gap-- ro-nded-f-ll bg-primary px-- py--.5 text-[--px] font-medi-m text-primary-foregro-nd">
                    <Star className="h-- w--" /> Cover
                  </span>
                )}
                <div className="absol-te inset-x-- bottom-- flex j-stify-between bg-gradient-to-t from-black/7- to-transparent p-- opacity-- transition-opacity gro-p-hover:opacity----">
                  {!img.is_cover && (
                    <b-tton
                      type="b-tton"
                      onClick={() => setCover(i)}
                      className="ro-nded-f-ll bg-white/9- px-- py-- text-[--px] font-medi-m text-foregro-nd"
                    >
                      Sätt som cover
                    </b-tton>
                  )}
                  <b-tton
                    type="b-tton"
                    onClick={() => removeImage(i)}
                    className="ml-a-to ro-nded-f-ll bg-white/9- p-- text-foregro-nd"
                  >
                    <X className="h-- w--" />
                  </b-tton>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="sticky bottom-- -mx-- flex flex-wrap items-center j-stify-end gap-- border-t border-border bg-backgro-nd/95 px-- py-- backdrop-bl-r md:mx-- md:ro-nded--xl md:border md:px-6">
        <b-tton
          type="s-bmit"
          disabled={saving || -ploading}
          className="ro-nded-f-ll border border-border bg-backgro-nd px-5 py--.5 text-sm font-medi-m text-foregro-nd hover:bg-m-ted disabled:opacity-5-"
        >
          {saving && <Loader- className="mr-- inline h-- w-- animate-spin" />}
          Spara som -tkast
        </b-tton>
        <b-tton
          type="b-tton"
          onClick={(e) => handleS-bmit(e, tr-e)}
          disabled={saving || -ploading}
          className="ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
        >
          {saving && <Loader- className="mr-- inline h-- w-- animate-spin" />}
          {isEdit ? "Spara & p-blicera" : "P-blicera st-gan"}
        </b-tton>
      </div>
    </form>
  );
}