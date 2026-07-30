import { Link } from "@tanstack/react-router";
import { useId, useRef } from "react";
import { regions, areasByRegion, type RegionSlug } from "@/data/areas";

// Hand-drawn stylized map of northern Sweden with clickable regions.
//
// Two modes:
//   • Default (no props): each region is a <Link> to /region/$slug.
//   • Controlled: pass `onSelect` and optional `selectedSlug` and the map
//     becomes an in-page picker (uses <button> semantics, no navigation).
//
// Each region has a visible shape and an oversized transparent hit path on
// top for generous tap targets. Hover/focus lifts the region and deepens the
// fill; the selected region stays highlighted. No floating overlays.

type ZoneShape = {
  slug: RegionSlug;
  d: string;
  hitD: string;
  cx: number;
  cy: number;
  label: string;
};

type ZoneProps = ZoneShape & {
  count: number;
  selected: boolean;
  index: number;
  onSelect?: (slug: RegionSlug) => void;
  onArrow?: (direction: 1 | -1) => void;
  zoneRef?: (el: SVGGElement | null) => void;
};

function ZoneBody({ d, hitD, cx, cy, label, count, selected, index }: Omit<ZoneProps, "slug" | "onSelect" | "onArrow" | "zoneRef">) {
  return (
    <g className="cursor-pointer transition-transform duration-300 ease-out group-hover:-translate-y-1 group-focus-visible:-translate-y-1">
      <path
        d={d}
        className={
          selected
            ? "fill-primary/45 stroke-primary transition-all duration-300"
            : "fill-primary/15 stroke-primary/70 transition-all duration-300 group-hover:fill-primary/35 group-hover:stroke-primary group-focus-visible:fill-primary/35 group-focus-visible:stroke-primary"
        }
        strokeWidth={selected ? 3 : 2}
        strokeLinejoin="round"
      />
      {/* Focus ring - only visible when the region receives keyboard focus */}
      <path
        d={d}
        fill="none"
        strokeWidth={4}
        strokeLinejoin="round"
        strokeDasharray="6 4"
        className="pointer-events-none stroke-ring opacity-0 group-focus-visible:opacity-100"
      />
      {/* Numbered badge that ties the region to the legend */}
      <g className="pointer-events-none">
        <circle
          cx={cx - 96}
          cy={cy - 4}
          r={15}
          className="fill-background stroke-primary"
          strokeWidth={2}
        />
        <text
          x={cx - 96}
          y={cy + 1}
          textAnchor="middle"
          className="fill-primary text-[14px] font-bold"
        >
          {index}
        </text>
      </g>
      <text
        x={cx + 10}
        y={cy}
        textAnchor="middle"
        className="pointer-events-none fill-foreground font-serif text-[19px] font-semibold"
        style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 5 }}
      >
        {label}
      </text>
      <text
        x={cx + 10}
        y={cy + 20}
        textAnchor="middle"
        className="pointer-events-none fill-muted-foreground text-[13px] font-medium"
        style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 4 }}
      >
        {count} områden
      </text>
      {/* Oversized transparent hit path - must come LAST so it captures pointer events */}
      <path d={hitD} fill="transparent" stroke="transparent" strokeWidth={24} strokeLinejoin="round" />
    </g>
  );
}

function Zone(props: ZoneProps) {
  const { slug, label, count, onSelect, selected, onArrow, zoneRef } = props;
  const ariaLabel = `${label} - ${count} områden${selected ? " (valt)" : ""}`;

  if (onSelect) {
    return (
      <g
        ref={zoneRef}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={selected}
        aria-keyshortcuts="Enter Space ArrowUp ArrowDown ArrowLeft ArrowRight Home End"
        className="group outline-none focus:outline-none"
        onClick={() => onSelect(slug)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(slug);
            return;
          }
          if (onArrow && (e.key === "ArrowDown" || e.key === "ArrowRight")) {
            e.preventDefault();
            onArrow(1);
          } else if (onArrow && (e.key === "ArrowUp" || e.key === "ArrowLeft")) {
            e.preventDefault();
            onArrow(-1);
          }
        }}
      >
        <ZoneBody {...props} />
      </g>
    );
  }

  return (
    <Link
      to="/region/$slug"
      params={{ slug }}
      className="group rounded-md outline-none focus-visible:outline-none"
      aria-label={ariaLabel}
    >
      <ZoneBody {...props} />
    </Link>
  );
}

// Blob geometry is generated from a single center line so every region gets
// the same generous width (x 96 -> 344 in a 440-wide viewBox). That width is
// what lets the longest label, "Lapplandsfjällen", sit inside its shape at
// every screen size instead of spilling out the sides.
const blob = (cy: number, pad = 0) =>
  `M${116 - pad} ${cy - 46 - pad} ` +
  `C ${158 - pad} ${cy - 74 - pad}, ${284 + pad} ${cy - 74 - pad}, ${324 + pad} ${cy - 44 - pad} ` +
  `C ${350 + pad} ${cy - 14 - pad}, ${342 + pad} ${cy + 44 + pad}, ${300 + pad} ${cy + 62 + pad} ` +
  `C ${250} ${cy + 78 + pad}, ${168 - pad} ${cy + 76 + pad}, ${132 - pad} ${cy + 58 + pad} ` +
  `C ${98 - pad} ${cy + 40 + pad}, ${92 - pad} ${cy - 22 - pad}, ${116 - pad} ${cy - 46 - pad} Z`;

const zone = (slug: RegionSlug, label: string, cy: number): ZoneShape => ({
  slug,
  label,
  cx: 220,
  cy,
  d: blob(cy),
  hitD: blob(cy, 8),
});

const ZONES: ZoneShape[] = [
  zone("lappland", "Lapplandsfjällen", 108),
  zone("jamtland", "Jämtland", 268),
  zone("harjedalen", "Härjedalen", 428),
  zone("dalafjallen", "Dalafjällen", 588),
];

export type SwedenMapProps = {
  selectedSlug?: RegionSlug | null;
  onSelect?: (slug: RegionSlug) => void;
  helperText?: string;
};

export function SwedenMap({ selectedSlug, onSelect, helperText }: SwedenMapProps = {}) {
  const counts: Record<string, number> = Object.fromEntries(
    regions.map((r) => [r.slug, areasByRegion(r.slug).length])
  );
  const zoneRefs = useRef<Array<SVGGElement | null>>([]);
  const legendRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const helperId = useId();
  const legendLabelId = useId();

  const defaultHelper = onSelect
    ? "Tryck på en region för att filtrera resultaten"
    : "Peka eller tryck på en region för att se alla områden och stugor";

  const focusZone = (from: number, dir: 1 | -1) => {
    const next = (from + dir + ZONES.length) % ZONES.length;
    zoneRefs.current[next]?.focus();
  };

  const onLegendKey = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = ZONES.length - 1;
    let target = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") target = (i + 1) % ZONES.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") target = (i - 1 + ZONES.length) % ZONES.length;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = last;
    if (target >= 0) {
      e.preventDefault();
      legendRefs.current[target]?.focus();
    }
  };

  return (
    <div className="relative mx-auto w-full min-w-0 max-w-xl">
      <svg
        viewBox="0 0 440 700"
        className="mx-auto block h-auto w-full max-w-[440px]"
        role="img"
        aria-label="Karta över Sveriges fjällområden"
        aria-describedby={helperId}
      >
        <path
          d="M218 12 C 280 20, 336 56, 354 118 C 374 188, 388 256, 380 326 C 372 398, 352 468, 334 536 C 318 600, 292 656, 266 684 C 246 698, 226 692, 220 672 C 210 626, 204 580, 188 536 C 162 466, 122 396, 110 326 C 98 256, 100 186, 112 124 C 124 62, 162 20, 218 12 Z"
          className="fill-muted/30 stroke-border"
          strokeWidth={1.5}
        />

        {ZONES.map((z, i) => (
          <Zone
            key={z.slug}
            {...z}
            count={counts[z.slug] ?? 0}
            selected={selectedSlug === z.slug}
            index={i + 1}
            onSelect={onSelect}
            onArrow={onSelect ? (dir) => focusZone(i, dir) : undefined}
            zoneRef={onSelect ? (el) => { zoneRefs.current[i] = el; } : undefined}
          />
        ))}
      </svg>

      <p
        id={helperId}
        className="mt-4 text-center text-xs text-muted-foreground sm:mt-6 sm:text-sm"
      >
        {helperText ?? defaultHelper}
      </p>

      <h3 id={legendLabelId} className="sr-only">
        Regioner, från norr till söder
      </h3>
      {/* Region legend - orders regions north to south to mirror the map.
          A wrapping grid (2 columns on phones, 4 from sm up) keeps every chip
          reachable; the old scroll row clipped regions 3 and 4 out of sight. */}
      <ol
        aria-labelledby={legendLabelId}
        className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:grid-cols-4"
      >
        {ZONES.map((z, i) => {
          const isSelected = selectedSlug === z.slug;
          const chipLabel = `${z.label}, ${counts[z.slug] ?? 0} områden${isSelected ? ", valt" : ""}`;
          const commonClasses =
            "flex h-full w-full min-w-0 items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
          const stateClasses = isSelected
            ? "border-primary bg-primary/10 text-foreground"
            : "border-border bg-background/60 text-foreground hover:border-primary/60 hover:bg-primary/5";
          const inner = (
            <>
              <span
                className={
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold sm:h-6 sm:w-6 " +
                  (isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/15 text-primary")
                }
              >
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-medium">{z.label}</span>
                <span className="text-[11px] text-muted-foreground">
                  {counts[z.slug] ?? 0} områden
                </span>
              </span>
            </>
          );
          return (
            <li key={z.slug} className="min-w-0">
              {onSelect ? (
                <button
                  ref={(el) => { legendRefs.current[i] = el; }}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={chipLabel}
                  onKeyDown={(e) => onLegendKey(e, i)}
                  onClick={() => onSelect(z.slug)}
                  className={`${commonClasses} ${stateClasses}`}
                >
                  {inner}
                </button>
              ) : (
                <Link
                  to="/region/$slug"
                  params={{ slug: z.slug }}
                  aria-label={chipLabel}
                  aria-current={isSelected ? "true" : undefined}
                  className={`${commonClasses} ${stateClasses}`}
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}