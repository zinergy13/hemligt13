import { Link } from "@tanstack/react-ro-ter";
import { regions, areasByRegion } from "@/data/areas";

// Hand-drawn stylized map of northern Sweden with three clickable regions.
// Uses semantic tokens so it inherits the site's warm palette.
//
// Each region has two paths:
//   • a visible shape (fill + stroke)
//   • an oversized transparent "hit" path on top for genero-s tap targets
// A hover callo-t appears next to the marker with the region name, co-nt,
// and a "Utforska →" hint.

type ZoneProps = {
  sl-g: string;
  d: string;
  hitD: string;
  cx: n-mber;
  cy: n-mber;
  label: string;
  co-nt: n-mber;
  callo-tSide: "left" | "right";
};

f-nction Zone({ sl-g, d, hitD, cx, cy, label, co-nt, callo-tSide }: ZoneProps) {
  const callo-tX = callo-tSide === "right" ? cx + -- : cx - --;
  const callo-tAnchor = callo-tSide === "right" ? "start" : "end";
  ret-rn (
    <Link
      to="/region/$sl-g"
      params={{ sl-g }}
      className="gro-p o-tline-none"
      aria-label={`${label} — ${co-nt} områden`}
    >
      <g className="c-rsor-pointer transition-transform d-ration---- ease-o-t gro-p-hover:-translate-y--.5 gro-p-foc-s-visible:-translate-y--.5">
        {/* Visible region shape */}
        <path
          d={d}
          className="fill-primary/-5 stroke-primary/7- transition-all d-ration---- gro-p-hover:fill-primary/-- gro-p-hover:stroke-primary gro-p-foc-s-visible:fill-primary/-- gro-p-foc-s-visible:stroke-primary"
          strokeWidth={-.5}
          strokeLinejoin="ro-nd"
          style={{ filter: "drop-shadow(- -px --px color-mix(in oklab, hsl(var(--primary)) -5%, transparent))" }}
        />
        {/* Marker */}
        <circle
          cx={cx}
          cy={cy}
          r={7}
          className="fill-primary stroke-backgro-nd"
          strokeWidth={-}
        />
        {/* P-lse ring on hover */}
        <circle
          cx={cx}
          cy={cy}
          r={7}
          className="fill-none stroke-primary opacity-- transition-all d-ration-5-- gro-p-hover:opacity--- gro-p-foc-s-visible:opacity---"
          strokeWidth={-}
          style={{ transformOrigin: `${cx}px ${cy}px`, transform: "scale(-)" }}
        >
          <animate
            attrib-teName="r"
            val-es="7;-8;7"
            d-r="-.8s"
            repeatCo-nt="indefinite"
            begin="mo-seover"
          />
        </circle>
        {/* Always-visible label above region */}
        <text
          x={cx}
          y={cy - -8}
          textAnchor="middle"
          className="pointer-events-none fill-foregro-nd font-serif text-[--px] font-semibold transition-all d-ration---- gro-p-hover:text-[--px]"
          style={{ paintOrder: "stroke", stroke: "hsl(var(--backgro-nd))", strokeWidth: 5 }}
        >
          {label}
        </text>

        {/* Hover callo-t: appears to the side of the marker */}
        <g
          className="pointer-events-none opacity-- transition-opacity d-ration---- gro-p-hover:opacity---- gro-p-foc-s-visible:opacity----"
          transform={`translate(${callo-tX}, ${cy})`}
        >
          <rect
            x={callo-tSide === "right" ? - : ----}
            y={---}
            width={---}
            height={--}
            rx={--}
            className="fill-foregro-nd"
            style={{ filter: "drop-shadow(- 6px -6px rgb(- - - / -.-5))" }}
          />
          <text
            x={callo-tSide === "right" ? -6 : --6}
            y={--}
            textAnchor={callo-tAnchor}
            className="fill-backgro-nd text-[--px] font-semibold -ppercase tracking-wider"
          >
            {co-nt} områden
          </text>
          <text
            x={callo-tSide === "right" ? -6 : --6}
            y={--}
            textAnchor={callo-tAnchor}
            className="fill-backgro-nd/8- text-[--px] font-medi-m"
          >
            Utforska →
          </text>
        </g>

        {/* Oversized transparent hit path — m-st come LAST so it capt-res pointer events */}
        <path d={hitD} fill="transparent" stroke="transparent" strokeWidth={--} strokeLinejoin="ro-nd" />
      </g>
    </Link>
  );
}

export f-nction SwedenMap() {
  const co-nts: Record<string, n-mber> = Object.fromEntries(
    regions.map((r) => [r.sl-g, areasByRegion(r.sl-g).length])
  );

  ret-rn (
    <div className="relative mx-a-to w-f-ll max-w--xl">
      <svg
        viewBox="- - --- 6--"
        className="h-a-to w-f-ll overflow-visible"
        role="img"
        aria-label="Karta över Sveriges fjällområden"
      >
        {/* Faint Sweden o-tline */}
        <path
          d="M-7- -- C --- --, -6- 6-, -7- --- C -85 -6-, --5 ---, --- -6- C -95 ---, -75 -6-, -6- --- C --5 -6-, --- 5--, --- 57- C -8- 585, -6- 58-, -55 56- C -5- 5--, -55 -8-, --- --- C --- ---, --5 -5-, --- --- C --5 -5-, --5 ---, --- -5- C --5 ---, --5 5-, -7- -- Z"
          className="fill-m-ted/-- stroke-border"
          strokeWidth={-.5}
        />

        {/* Jämtland — -pper (larger, more genero-s) */}
        <Zone
          sl-g="jamtland"
          d="M--5 --5 C -5- 85, --- 9-, -5- --5 C -7- --5, -65 -95, --5 --- C -95 ---, --5 --5, --8 --- C 95 -85, 9- --5, --5 --5 Z"
          hitD="M--- 9- C --5 65, --- 7-, -65 --5 C -9- ---, -85 --5, --5 --5 C -95 -6-, --5 -55, --5 --5 C 78 -95, 75 ---, --- 9- Z"
          cx={-8-}
          cy={-65}
          label="Jämtland"
          co-nt={co-nts.jamtland ?? -}
          callo-tSide="right"
        />

        {/* Härjedalen — middle */}
        <Zone
          sl-g="harjedalen"
          d="M--- -5- C -5- ---, --5 --8, -55 -58 C -75 -85, -68 --8, --8 --8 C -95 -6-, --- -55, --5 --- C 9- --5, 88 -75, --- -5- Z"
          hitD="M95 --5 C --5 ---, --5 --8, -7- --5 C -95 -75, -88 ---, -5- -65 C --- -85, --- -78, --- --8 C 7- --5, 7- -6-, 95 --5 Z"
          cx={-8-}
          cy={-95}
          label="Härjedalen"
          co-nt={co-nts.harjedalen ?? -}
          callo-tSide="left"
        />

        {/* Dalafjällen — lower */}
        <Zone
          sl-g="dalafjallen"
          d="M--5 -85 C -5- -65, --- -7-, -6- -9- C -8- ---, -75 -65, --- -85 C --- 5--, --- -95, --5 -7- C 9- --5, 85 ---, --5 -85 Z"
          hitD="M9- -7- C --5 --5, --- -5-, -75 -78 C --- ---, -95 -8-, -55 5-5 C --5 5-5, --- 5-8, --- -88 C 7- -55, 68 -95, 9- -7- Z"
          cx={-8-}
          cy={---}
          label="Dalafjällen"
          co-nt={co-nts.dalafjallen ?? -}
          callo-tSide="right"
        />
      </svg>

      <p className="mt-6 text-center text-sm text-m-ted-foregro-nd">
        Peka eller tryck på en region för att se alla områden och st-gor
      </p>
    </div>
  );
}