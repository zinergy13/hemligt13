import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// --- Mocks --------------------------------------------------------------

const cabinsRow = {
  id: "cabin-1",
  title: "Testfjäll",
  area_slug: "lindvallen",
  price_per_night: 1000,
  cleaning_fee: 500,
  min_nights: 14,          // forces "för få nätter" (default preview = 7)
  check_in_weekday: null,  // no weekday rule → single-error fix flow
};

vi.mock("@/integrations/supabase/client", () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => Promise.resolve({ data: [cabinsRow], error: null }),
  };
  return { supabase: { from: () => chain } };
});

vi.mock("@/lib/pricing", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pricing")>("@/lib/pricing");
  return {
    ...actual,
    fetchSeasonPrices: vi.fn(async () => []),
    fetchPricingRule: vi.fn(async () => null),
  };
});

vi.mock("@/data/areas", () => ({
  areaBySlug: (slug: string) => ({ name: slug, region: "dalafjallen", slug }),
}));

import { PricePreview } from "./PricePreview";

describe("PricePreview – ett-klicks-fixar uppdaterar direkt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("visar 7 nätter initialt och uppdaterar till 14 nätter direkt när 'Förläng till'-fixen klickas", async () => {
    const user = userEvent.setup();
    render(<PricePreview hostId="host-1" />);

    // Wait for cabin+seasons to load and validation panel to render
    const fixButton = await screen.findByRole("button", { name: /Förläng till 14 nätter/i });

    // Initial breakdown: 7 nätter, 7 * 1000 + 500 = 7 500 kr totalt till värden
    expect(await screen.findByText(/Totalt till värden/i)).toBeInTheDocument();
    expect(screen.getByText(/^\s*7[\s ]?500 kr\s*$/)).toBeInTheDocument();

    await user.click(fixButton);

    // Breakdown must reflect the new dates immediately — 14 * 1000 + 500 = 14 500 kr
    expect(await screen.findByText(/^\s*14[\s ]?500 kr\s*$/)).toBeInTheDocument();
    // Både summeringen och radlistan visar 14 nätter (två träffar)
    const nightMatches = screen.getAllByText(/14 nätter/i);
    expect(nightMatches.length).toBeGreaterThanOrEqual(2);

    // Bekräftelse-badge visas
    expect(screen.getByText(/Uppdaterat med nya datum/i)).toBeInTheDocument();

    // Fel-panelen är borta (bokningen giltig)
    expect(screen.getByText(/Bokningen är giltig/i)).toBeInTheDocument();
  });

  it("'Åtgärda allt' fixar både min-nätter och lördagsbyte i ett klick", async () => {
    // Re-mock cabin with weekday rule (Saturday = 6) and long minimum so two errors trigger
    const twoErrorCabin = { ...cabinsRow, min_nights: 10, check_in_weekday: 6 };
    const { supabase } = await import("@/integrations/supabase/client");
    (supabase.from as any) = () => {
      const chain: any = {
        select: () => chain,
        eq: () => chain,
        order: () => Promise.resolve({ data: [twoErrorCabin], error: null }),
      };
      return chain;
    };

    const user = userEvent.setup();
    render(<PricePreview hostId="host-1" />);

    const fixAll = await screen.findByRole("button", { name: /Åtgärda allt/i });
    await user.click(fixAll);

    // Efter fixet ska bokningen vara giltig och nätter vara jämna veckor (>= 14)
    expect(await screen.findByText(/Bokningen är giltig/i)).toBeInTheDocument();
    const nightsLabels = screen.getAllByText(/^\s*\d+ nätter\s*$/i);
    const nights = nightsLabels
      .map((el) => parseInt(el.textContent || "", 10))
      .filter((n) => Number.isFinite(n));
    expect(nights.length).toBeGreaterThan(0);
    const n = nights[0];
    expect(n).toBeGreaterThanOrEqual(14);
    expect(n % 7).toBe(0);
  });
});