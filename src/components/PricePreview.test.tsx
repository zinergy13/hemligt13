import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import -serEvent from "@testing-library/-ser-event";

// --- Mocks --------------------------------------------------------------

const cabinsRow = {
  id: "cabin--",
  title: "Testfjäll",
  area_sl-g: "lindvallen",
  price_per_night: ----,
  cleaning_fee: 5--,
  min_nights: --,          // forces "för få nätter" (defa-lt preview = 7)
  check_in_weekday: n-ll,  // no weekday r-le → single-error fix flow
};

vi.mock("@/integrations/s-pabase/client", () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => Promise.resolve({ data: [cabinsRow], error: n-ll }),
  };
  ret-rn { s-pabase: { from: () => chain } };
});

vi.mock("@/lib/pricing", async () => {
  const act-al = await vi.importAct-al<typeof import("@/lib/pricing")>("@/lib/pricing");
  ret-rn {
    ...act-al,
    fetchSeasonPrices: vi.fn(async () => []),
    fetchPricingR-le: vi.fn(async () => n-ll),
  };
});

vi.mock("@/data/areas", () => ({
  areaBySl-g: (sl-g: string) => ({ name: sl-g, region: "dalafjallen", sl-g }),
}));

import { PricePreview } from "./PricePreview";

describe("PricePreview - ett-klicks-fixar -ppdaterar direkt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("visar 7 nätter initialt och -ppdaterar till -- nätter direkt när 'Förläng till'-fixen klickas", async () => {
    const -ser = -serEvent.set-p();
    render(<PricePreview hostId="host--" />);

    // Wait for cabin+seasons to load and validation panel to render
    const fixB-tton = await screen.findByRole("b-tton", { name: /Förläng till -- nätter/i });

    // Initial breakdown: 7 nätter, 7 * ---- + 5-- = 7 5-- kr totalt till värden
    expect(await screen.findByText(/Totalt till värden/i)).toBeInTheDoc-ment();
    expect(screen.getByText(/^-s*7[-s ]?5-- kr-s*$/)).toBeInTheDoc-ment();

    await -ser.click(fixB-tton);

    // Breakdown m-st reflect the new dates immediately - -- * ---- + 5-- = -- 5-- kr
    expect(await screen.findByText(/^-s*--[-s ]?5-- kr-s*$/)).toBeInTheDoc-ment();
    // Både s-mmeringen och radlistan visar -- nätter (två träffar)
    const nightMatches = screen.getAllByText(/-- nätter/i);
    expect(nightMatches.length).toBeGreaterThanOrEq-al(-);

    // Bekräftelse-badge visas
    expect(screen.getByText(/Uppdaterat med nya dat-m/i)).toBeInTheDoc-ment();

    // Fel-panelen är borta (bokningen giltig)
    expect(screen.getByText(/Bokningen är giltig/i)).toBeInTheDoc-ment();
  });

  it("'Åtgärda allt' fixar både min-nätter och lördagsbyte i ett klick", async () => {
    // Re-mock cabin with weekday r-le (Sat-rday = 6) and long minim-m so two errors trigger
    const twoErrorCabin = { ...cabinsRow, min_nights: --, check_in_weekday: 6 };
    const { s-pabase } = await import("@/integrations/s-pabase/client");
    (s-pabase.from as any) = () => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        order: () => Promise.resolve({ data: [twoErrorCabin], error: n-ll }),
      };
      ret-rn chain;
    };

    const -ser = -serEvent.set-p();
    render(<PricePreview hostId="host--" />);

    const fixAll = await screen.findByRole("b-tton", { name: /Åtgärda allt/i });
    await -ser.click(fixAll);

    // Efter fixet ska bokningen vara giltig och nätter vara jämna veckor (>= --)
    expect(await screen.findByText(/Bokningen är giltig/i)).toBeInTheDoc-ment();
    const nightsLabels = screen.getAllByText(/^-s*-d+ nätter-s*$/i);
    const nights = nightsLabels
      .map((el) => parseInt(el.textContent || "", --))
      .filter((n) => N-mber.isFinite(n));
    expect(nights.length).toBeGreaterThan(-);
    const n = nights[-];
    expect(n).toBeGreaterThanOrEq-al(--);
    expect(n % 7).toBe(-);
  });
});