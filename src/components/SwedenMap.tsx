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
          cx={cx - 88}
          cy={cy - 4}
          r={15}
          className="fill-background stroke-primary"
          strokeWidth={2}
        />
        <text
          x={cx - 88}
          y={cy + 1}
          textAnchor="middle"
          className="fill-primary text-[14px] font-bold"
        >
          {index}
        </text>
      </g>
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        className="pointer-events-none fill-foreground font-serif text-[19px] font-semibold"
        style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 5 }}
      >
        {label}
      </text>
      <text
        x={cx}
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

const ZONES: ZoneShape[] = [
  {
    slug: "lappland",
    d: "M130 45 C 165 30, 220 32, 255 55 C 275 80, 268 125, 240 145 C 200 160, 150 155, 125 135 C 105 115, 108 65, 130 45 Z",
    hitD: "M115 30 C 160 10, 230 12, 270 40 C 295 68, 288 140, 250 165 C 200 185, 140 180, 110 155 C 85 130, 82 55, 115 30 Z",
    cx: 182,
    cy: 95,
    label: "Lapplandsfjällen",
  },
  {
    slug: "jamtland",
    d: "M115 205 C 150 185, 210 190, 250 215 C 270 245, 265 295, 235 320 C 195 340, 145 335, 118 310 C 95 285, 92 235, 115 205 Z",
    hitD: "M100 190 C 145 165, 220 170, 265 205 C 290 240, 285 305, 245 335 C 195 360, 135 355, 105 325 C 78 295, 75 220, 100 190 Z",
    cx: 182,
    cy: 265,
    label: "Jämtland",
  },
  {
    slug: "harjedalen",
    d: "M110 360 C 150 342, 215 348, 255 368 C 275 395, 268 438, 238 458 C 195 472, 140 465, 115 440 C 92 415, 88 385, 110 360 Z",
    hitD: "M95 345 C 145 322, 225 328, 270 355 C 295 385, 288 450, 250 475 C 200 495, 130 488, 100 458 C 72 425, 70 370, 95 345 Z",
    cx: 182,
    cy: 405,
    label: "Härjedalen",
  },
  {
    slug: "dalafjallen",
    d: "M105 495 C 150 475, 220 480, 260 500 C 282 530, 275 575, 242 595 C 200 610, 140 605, 115 580 C 90 555, 85 520, 105 495 Z",
    hitD: "M90 480 C 145 455, 230 460, 275 488 C 302 520, 295 590, 255 615 C 205 635, 130 628, 100 598 C 72 565, 68 505, 90 480 Z",
    cx: 182,
    cy: 540,
    label: "Dalafjällen",
  },
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
    <div className="relative mx-auto w-full max-w-2xl">
      <svg
        viewBox="0 0 400 720"
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Karta över Sveriges fjällområden"
        aria-describedby={helperId}
      >
        <path
          d="M170 20 C 220 30, 260 60, 270 110 C 285 160, 305 210, 300 260 C 295 310, 285 360, 275 410 C 265 460, 250 510, 235 560 C 220 610, 200 660, 185 690 C 170 700, 155 690, 152 670 C 148 630, 150 590, 140 550 C 125 500, 108 450, 105 400 C 102 350, 108 300, 115 250 C 122 200, 130 150, 140 100 C 150 60, 155 30, 170 20 Z"
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
          Renders as a horizontally scrollable chip row at every width so it
          adapts to both narrow sidebars and full-width hero placements. */}
      <ol
        aria-labelledby={legendLabelId}
        className="mt-3 -mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 pb-1 sm:mt-4"
      >
        {ZONES.map((z, i) => {
          const isSelected = selectedSlug === z.slug;
          const chipLabel = `${z.label}, ${counts[z.slug] ?? 0} områden${isSelected ? ", valt" : ""}`;
          const commonClasses =
            "flex shrink-0 snap-start items-center gap-2 rounded-full border px-3 py-1.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-sm";
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
              <span className="flex items-baseline gap-1 leading-tight">
                <span className="font-medium">{z.label}</span>
                <span className="text-[11px] text-muted-foreground sm:text-xs">
                  ({counts[z.slug] ?? 0})
                </span>
              </span>
            </>
          );
          return (
            <li key={z.slug} className="shrink-0">
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