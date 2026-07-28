import { useState, type FormEvent } from "react";
import { Loader2, Upload, X, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { areas } from "@/data/areas";
import { AMENITY_OPTIONS, slugify, publicImageUrl, type CabinStatus } from "@/lib/cabins";

export type CabinFormValues = {
  id?: string;
  title: string;
  description: string;
  area_slug: string;
  address: string;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  max_guests: number;
  size_sqm: number | null;
  price_per_night: number;
  cleaning_fee: number;
  amenities: string[];
  status: CabinStatus;
  slug?: string;
};

export type CabinFormImage = {
  url: string;
  storage_path?: string; // for newly uploaded
  is_cover: boolean;
  sort_order: number;
  existing_id?: string; // for already-saved cabin_images rows
};

const DEFAULTS: CabinFormValues = {
  title: "",
  description: "",
  area_slug: areas[0].slug,
  address: "",
  bedrooms: 1,
  beds: 2,
  bathrooms: 1,
  max_guests: 4,
  size_sqm: null,
  price_per_night: 1500,
  cleaning_fee: 500,
  amenities: [],
  status: "draft",
};

export function CabinForm({
  userId,
  initialValues,
  initialImages = [],
  onSaved,
}: {
  userId: string;
  initialValues?: Partial<CabinFormValues>;
  initialImages?: CabinFormImage[];
  onSaved: (cabinId: string, slug: string) => void;
}) {
  const [v, setV] = useState<CabinFormValues>({ ...DEFAULTS, ...initialValues });
  const [images, setImages] = useState<CabinFormImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(v.id);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const cabinFolder = v.id ?? "draft-" + Date.now();
      const next: CabinFormImage[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${cabinFolder}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("cabin-images").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) {
          toast.error(`Kunde inte ladda upp ${file.name}: ${error.message}`);
          continue;
        }
        next.push({
          url: publicImageUrl(path),
          storage_path: path,
          is_cover: images.length === 0 && next.length === 0,
          sort_order: images.length + next.length,
        });
      }
      setImages((prev) => [...prev, ...next]);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const out = prev.filter((_, i) => i !== index);
      // ensure one cover
      if (!out.some((i) => i.is_cover) && out.length > 0) out[0].is_cover = true;
      return out.map((img, i) => ({ ...img, sort_order: i }));
    });
  };

  const setCover = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, is_cover: i === index })));
  };

  const toggleAmenity = (val: string) => {
    setV((s) => ({
      ...s,
      amenities: s.amenities.includes(val)
        ? s.amenities.filter((a) => a !== val)
        : [...s.amenities, val],
    }));
  };

  const handleSubmit = async (e: FormEvent, publish: boolean) => {
    e.preventDefault();
    if (uploading) {
      toast.error("Vänta tills alla bilder har laddats upp.");
      return;
    }
    if (!v.title.trim()) {
      toast.error("Titel krävs");
      return;
    }
    if (publish && (!v.size_sqm || v.size_sqm < 5)) {
      toast.error("Ange stugans yta (kvm) innan publicering - behövs för att räkna städpris.");
      return;
    }
    setSaving(true);
    try {
      const status: CabinStatus = publish ? "published" : v.status;
      const slug = v.slug ?? slugify(v.title);
      const payload = {
        host_id: userId,
        slug,
        title: v.title.trim(),
        description: v.description.trim() || null,
        area_slug: v.area_slug,
        address: v.address.trim() || null,
        bedrooms: v.bedrooms,
        beds: v.beds,
        bathrooms: v.bathrooms,
        max_guests: v.max_guests,
        size_sqm: v.size_sqm,
        price_per_night: v.price_per_night,
        cleaning_fee: v.cleaning_fee,
        amenities: v.amenities,
        status,
      };

      let cabinId = v.id;
      if (cabinId) {
        const { error } = await supabase.from("cabins").update(payload).eq("id", cabinId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("cabins").insert(payload).select("id, slug").single();
        if (error) throw error;
        cabinId = data.id;
      }

      if (!cabinId) throw new Error("Misslyckades skapa stuga");

      // Sync images without briefly deleting rows that should remain.
      const retainedIds = images.flatMap((img) => img.existing_id ? [img.existing_id] : []);
      if (isEdit) {
        let deleteQuery = supabase.from("cabin_images").delete().eq("cabin_id", cabinId);
        if (retainedIds.length > 0) deleteQuery = deleteQuery.not("id", "in", `(${retainedIds.join(",")})`);
        const { error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;

        for (const [i, img] of images.entries()) {
          if (!img.existing_id) continue;
          const { error: updateError } = await supabase
            .from("cabin_images")
            .update({ url: img.url, is_cover: img.is_cover, sort_order: i })
            .eq("id", img.existing_id)
            .eq("cabin_id", cabinId);
          if (updateError) throw updateError;
        }
      }

      const newImages = images.filter((img) => !img.existing_id);
      if (newImages.length > 0) {
        const rows = newImages.map((img) => ({
          cabin_id: cabinId!,
          url: img.url,
          is_cover: img.is_cover,
          sort_order: images.indexOf(img),
        }));
        const { error: imgErr } = await supabase.from("cabin_images").insert(rows);
        if (imgErr) throw imgErr;
      }

      toast.success(publish ? "Stugan är publicerad!" : "Sparat som utkast");
      onSaved(cabinId, slug);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Något gick fel";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="space-y-8" onSubmit={(e) => handleSubmit(e, false)}>
      {/* Grunduppgifter */}
      <section className="space-y-4 rounded-2xl border border-border bg-background p-6">
        <h2 className="font-serif text-xl text-foreground">1. Grunduppgifter</h2>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Titel *</label>
          <input
            type="text"
            value={v.title}
            onChange={(e) => setV((s) => ({ ...s, title: e.target.value }))}
            placeholder="Mysig stuga med bastu i Lindvallen"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Område *</label>
            <select
              value={v.area_slug}
              onChange={(e) => setV((s) => ({ ...s, area_slug: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            >
              {areas.map((a) => (
                <option key={a.slug} value={a.slug}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Adress (valfritt)</label>
            <input
              type="text"
              value={v.address}
              onChange={(e) => setV((s) => ({ ...s, address: e.target.value }))}
              placeholder="Vägnamn 12"
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Beskrivning</label>
          <textarea
            value={v.description}
            onChange={(e) => setV((s) => ({ ...s, description: e.target.value }))}
            rows={5}
            placeholder="Beskriv stugan, läget, vad som ingår..."
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      </section>

      {/* Kapacitet & pris */}
      <section className="space-y-4 rounded-2xl border border-border bg-background p-6">
        <h2 className="font-serif text-xl text-foreground">2. Kapacitet & pris</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { key: "bedrooms" as const, label: "Sovrum" },
            { key: "beds" as const, label: "Bäddar" },
            { key: "bathrooms" as const, label: "Badrum" },
            { key: "max_guests" as const, label: "Max gäster" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-foreground">{label}</label>
              <input
                type="number"
                min={0}
                value={v[key]}
                onChange={(e) => setV((s) => ({ ...s, [key]: Number(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          ))}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Yta (kvm) *
            <span className="ml-2 font-normal text-muted-foreground">Krävs för att räkna städpris till gästen</span>
          </label>
          <input
            type="number"
            min={0}
            step={1}
            value={v.size_sqm ?? ""}
            onChange={(e) => {
              const n = Number(e.target.value);
              setV((s) => ({ ...s, size_sqm: Number.isFinite(n) && n > 0 ? n : null }));
            }}
            placeholder="t.ex. 65"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none md:max-w-xs"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Pris per natt (SEK)</label>
            <input
              type="number"
              min={0}
              step={100}
              value={v.price_per_night}
              onChange={(e) => setV((s) => ({ ...s, price_per_night: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Städavgift (SEK)</label>
            <input
              type="number"
              min={0}
              step={50}
              value={v.cleaning_fee}
              onChange={(e) => setV((s) => ({ ...s, cleaning_fee: Number(e.target.value) || 0 }))}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Bekvämligheter */}
      <section className="space-y-4 rounded-2xl border border-border bg-background p-6">
        <h2 className="font-serif text-xl text-foreground">3. Bekvämligheter</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {AMENITY_OPTIONS.map((opt) => {
            const checked = v.amenities.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                  checked ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAmenity(opt.value)}
                  className="h-4 w-4 accent-primary"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </section>

      {/* Bilder */}
      <section className="space-y-4 rounded-2xl border border-border bg-background p-6">
        <h2 className="font-serif text-xl text-foreground">4. Bilder</h2>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-10 text-center hover:bg-muted/60">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Klicka för att ladda upp bilder</span>
          <span className="text-xs text-muted-foreground">JPG/PNG, flera samtidigt</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading && (
            <span className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Laddar upp...
            </span>
          )}
        </label>

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {images.map((img, i) => (
              <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <img src={img.url} alt="" className="h-full w-full object-cover" />
                {img.is_cover && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    <Star className="h-3 w-3" /> Cover
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  {!img.is_cover && (
                    <button
                      type="button"
                      onClick={() => setCover(i)}
                      className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-foreground"
                    >
                      Sätt som cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="ml-auto rounded-full bg-white/90 p-1 text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Actions */}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-border bg-background/95 px-4 py-4 backdrop-blur md:mx-0 md:rounded-2xl md:border md:px-6">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          {saving && <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />}
          Spara som utkast
        </button>
        <button
          type="button"
          onClick={(e) => handleSubmit(e, true)}
          disabled={saving || uploading}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {saving && <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />}
          {isEdit ? "Spara & publicera" : "Publicera stugan"}
        </button>
      </div>
    </form>
  );
}