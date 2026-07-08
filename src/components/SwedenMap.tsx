import { Link } from "@tanstack/react-router";
import { regions, areasByRegion } from "@/data/areas";

// Hand-drawn stylized map of northern Sweden with three clickable regions.
// Uses semantic tokens so it inherits the site's warm palette.
//
// Approximate positions (SVG viewBox 400x600, portrait-ish Sweden shape):
//   Jämtland      — upper area
//   Härjedalen    — middle
//   Dalafjällen   — lower

type ZoneProps = {
  slug: string;
  d: string;
  cx: number;
  cy: number;
  label: string;
  count: number;
};

function Zone({ slug, d, cx, cy, label, count }: ZoneProps) {
  return (
    <Link
      to="/region/$slug"
      params={{ slug }}
      className="group focus:outline-none"
      aria-label={`${label} — ${count} områden`}
    >
      <g className="transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <path
          d={d}
          className="fill-primary/15 stroke-primary/60 transition-colors duration-300 group-hover:fill-primary/35 group-focus-visible:fill-primary/35"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <circle cx={cx} cy={cy} r={5} className="fill-primary" />
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          className="fill-foreground font-serif text-[22px] font-semibold"
          style={{ paintOrder: "stroke", stroke: "hsl(var(--background))", strokeWidth: 4 }}
        >
          {label}
        </text>
        <text
          x={cx}
          y={cy + 22}
          textAnchor="middle"
          className="fill-muted-foreground text-[12px] font-medium"
          style={{ paintOrder: "stroke", stroke: "hsl(var(--background))", strokeWidth: 3 }}
        >
          {count} områden
        </text>
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
        viewBox="0 0 400 600"
        className="h-auto w-full"
        role="img"
        aria-label="Karta över Sveriges fjällområden"
      >
        {/* Faint Sweden outline */}
        <path
          d="M170 20 C 220 30, 260 60, 270 110 C 285 160, 305 210, 300 260 C 295 310, 275 360, 260 410 C 245 460, 220 520, 200 570 C 180 585, 160 580, 155 560 C 150 520, 155 480, 140 440 C 120 400, 105 350, 110 300 C 115 250, 125 200, 130 150 C 135 100, 145 50, 170 20 Z"
          className="fill-muted/40 stroke-border"
          strokeWidth={1.5}
        />
        {/* Jämtland — upper */}
        <Zone
          slug="jamtland"
          d="M130 130 C 155 115, 200 120, 235 135 C 250 160, 245 195, 220 210 C 190 220, 155 215, 135 195 C 120 175, 118 150, 130 130 Z"
          cx={180}
          cy={170}
          label="Jämtland"
          count={counts.jamtland ?? 0}
        />
        {/* Härjedalen — middle */}
        <Zone
          slug="harjedalen"
          d="M125 245 C 155 230, 205 235, 240 250 C 255 275, 250 310, 225 325 C 190 335, 155 330, 135 310 C 118 290, 115 265, 125 245 Z"
          cx={180}
          cy={285}
          label="Härjedalen"
          count={counts.harjedalen ?? 0}
        />
        {/* Dalafjällen — lower */}
        <Zone
          slug="dalafjallen"
          d="M120 365 C 155 350, 210 355, 245 370 C 260 400, 255 435, 225 450 C 190 460, 150 455, 130 435 C 112 415, 108 385, 120 365 Z"
          cx={180}
          cy={410}
          label="Dalafjällen"
          count={counts.dalafjallen ?? 0}
        />
      </svg>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Klicka på en region för att se alla områden och stugor
      </p>
    </div>
  );
}