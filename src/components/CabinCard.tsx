import { Link } from "@tanstack/react-router";
import { Users, Bed, MapPin } from "lucide-react";
import { coverImage, type CabinWithImages } from "@/lib/cabins";
import { areaBySlug } from "@/data/areas";

export function CabinCard({ cabin }: { cabin: CabinWithImages }) {
  const cover = coverImage(cabin);
  const area = areaBySlug(cabin.area_slug);
  return (
    <Link
      to="/stuga/$slug"
      params={{ slug: cabin.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-background shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-warm)]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={cabin.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
            Ingen bild
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {area?.name ?? cabin.area_slug}
        </div>
        <h3 className="font-serif text-lg leading-snug text-foreground line-clamp-2">{cabin.title}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {cabin.max_guests}</span>
            <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {cabin.beds}</span>
          </div>
          <div className="text-right">
            <div className="font-serif text-base text-foreground">{cabin.price_per_night.toLocaleString("sv-SE")} kr</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">/ natt</div>
          </div>
        </div>
      </div>
    </Link>
  );
}