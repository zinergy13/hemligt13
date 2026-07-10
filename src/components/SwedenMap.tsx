import { Link } from "@tanstack/react-router";
import { regions, areasByRegion } from "@/data/areas";

// Hand-drawn stylized map of northern Sweden with three clickable regions.
// Uses semantic tokens so it inherits the site's warm palette.
//
// Each region has two paths:
//   • a visible shape (fill + stroke)
//   • an oversized transparent "hit" path on top for generous tap targets
// A hover callout appears next to the marker with the region name, count,
// and a "Utforska →" hint.

type ZoneProps = {
  slug: string;
  d: string;
  hitD: string;
  cx: number;
  cy: number;
  label: string;
  count: number;
  calloutSide: "left" | "right";
};

function Zone({ slug, d, hitD, cx, cy, label, count, calloutSide }: ZoneProps) {
  const calloutX = calloutSide === "right" ? cx + 30 : cx - 30;
  const calloutAnchor = calloutSide === "right" ? "start" : "end";
  return (
    <Link
      to="/region/$slug"
      params={{ slug }}
      className="group outline-none"
      aria-label={`${label} — ${count} områden`}
    >
      <g className="cursor-pointer transition-transform duration-300 ease-out group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5">
        {/* Visible region shape */}
        <path
          d={d}
          className="fill-primary/15 stroke-primary/70 transition-all duration-300 group-hover:fill-primary/40 group-hover:stroke-primary group-focus-visible:fill-primary/40 group-focus-visible:stroke-primary"
          strokeWidth={2.5}
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 4px 12px color-mix(in oklab, hsl(var(--primary)) 15%, transparent))" }}
        />
        {/* Marker */}
        <circle
          cx={cx}
          cy={cy}
          r={7}
          className="fill-primary stroke-background"
          strokeWidth={3}
        />
        {/* Pulse ring on hover */}
        <circle
          cx={cx}
          cy={cy}
          r={7}
          className="fill-none stroke-primary opacity-0 transition-all duration-500 group-hover:opacity-40 group-focus-visible:opacity-40"
          strokeWidth={2}
          style={{ transformOrigin: `${cx}px ${cy}px`, transform: "scale(1)" }}
        >
          <animate
            attributeName="r"
            values="7;18;7"
            dur="1.8s"
            repeatCount="indefinite"
            begin="mouseover"
          />
        </circle>
        {/* Always-visible label above region */}
        <text
          x={cx}
          y={cy - 18}
          textAnchor="middle"
          className="pointer-events-none fill-foreground font-serif text-[22px] font-semibold transition-all duration-300 group-hover:text-[24px]"
          style={{ paintOrder: "stroke", stroke: "hsl(var(--background))", strokeWidth: 5 }}
        >
          {label}
        </text>

        {/* Hover callout: appears to the side of the marker */}
        <g
          className="pointer-events-none opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          transform={`translate(${calloutX}, ${cy})`}
        >
          <rect
            x={calloutSide === "right" ? 0 : -140}
            y={-20}
            width={140}
            height={40}
            rx={20}
            className="fill-foreground"
            style={{ filter: "drop-shadow(0 6px 16px rgb(0 0 0 / 0.25))" }}
          />
          <text
            x={calloutSide === "right" ? 16 : -16}
            y={-3}
            textAnchor={calloutAnchor}
            className="fill-background text-[12px] font-semibold uppercase tracking-wider"
          >
            {count} områden
          </text>
          <text
            x={calloutSide === "right" ? 16 : -16}
            y={13}
            textAnchor={calloutAnchor}
            className="fill-background/80 text-[11px] font-medium"
          >
            Utforska →
          </text>
        </g>

        {/* Oversized transparent hit path — must come LAST so it captures pointer events */}
        <path d={hitD} fill="transparent" stroke="transparent" strokeWidth={40} strokeLinejoin="round" />
      </g>
    </Link>
  );
}

export function SwedenMap() {
  const counts: Record<string, number> = Object.fromEntries(
    regions.map((r) => [r.slug, areasByRegion(r.slug).length])
  );

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <svg
        viewBox="0 0 400 620"
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Karta över Sveriges fjällområden"
      >
        {/* Faint Sweden outline */}
        <path
          d="M170 20 C 220 30, 260 60, 270 110 C 285 160, 305 210, 300 260 C 295 310, 275 360, 260 410 C 245 460, 220 520, 200 570 C 180 585, 160 580, 155 560 C 150 520, 155 480, 140 440 C 120 400, 105 350, 110 300 C 115 250, 125 200, 130 150 C 135 100, 145 50, 170 20 Z"
          className="fill-muted/30 stroke-border"
          strokeWidth={1.5}
        />

        {/* Jämtland — upper (larger, more generous) */}
        <Zone
          slug="jamtland"
          d="M115 105 C 150 85, 210 90, 250 115 C 270 145, 265 195, 235 220 C 195 240, 145 235, 118 210 C 95 185, 92 135, 115 105 Z"
          hitD="M100 90 C 145 65, 220 70, 265 105 C 290 140, 285 205, 245 235 C 195 260, 135 255, 105 225 C 78 195, 75 120, 100 90 Z"
          cx={182}
          cy={165}
          label="Jämtland"
          count={counts.jamtland ?? 0}
          calloutSide="right"
        />

        {/* Härjedalen — middle */}
        <Zone
          slug="harjedalen"
          d="M110 250 C 150 232, 215 238, 255 258 C 275 285, 268 328, 238 348 C 195 362, 140 355, 115 330 C 92 305, 88 275, 110 250 Z"
          hitD="M95 235 C 145 212, 225 218, 270 245 C 295 275, 288 340, 250 365 C 200 385, 130 378, 100 348 C 72 315, 70 260, 95 235 Z"
          cx={182}
          cy={295}
          label="Härjedalen"
          count={counts.harjedalen ?? 0}
          calloutSide="left"
        />

        {/* Dalafjällen — lower */}
        <Zone
          slug="dalafjallen"
          d="M105 385 C 150 365, 220 370, 260 390 C 282 420, 275 465, 242 485 C 200 500, 140 495, 115 470 C 90 445, 85 410, 105 385 Z"
          hitD="M90 370 C 145 345, 230 350, 275 378 C 302 410, 295 480, 255 505 C 205 525, 130 518, 100 488 C 72 455, 68 395, 90 370 Z"
          cx={182}
          cy={430}
          label="Dalafjällen"
          count={counts.dalafjallen ?? 0}
          calloutSide="right"
        />
      </svg>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Peka eller tryck på en region för att se alla områden och stugor
      </p>
    </div>
  );
}