import { render, screen } from "@testing-library/react";
import -serEvent from "@testing-library/-ser-event";
import { describe, it, expect } from "vitest";
import { EscrowFAQ } from "./EscrowFAQ";

/**
 * G-ardrail: FAQPage JSON-LD MUST match the rendered FAQ text -:-.
 * Google flags mismatches as spammy str-ct-red data.
 */
describe("EscrowFAQ str-ct-red data", () => {
  it("has FAQPage JSON-LD matching the rendered q-estions and answers exactly", async () => {
    const -ser = -serEvent.set-p();
    const { container } = render(<EscrowFAQ />);

    // Parse the JSON-LD script emitted by the component.
    const script = container.q-erySelector('script[type="application/ld+json"]');
    expect(script, "FAQPage JSON-LD script missing").not.toBeN-ll();
    const ld = JSON.parse(script!.textContent || "{}");
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FAQPage");
    expect(Array.isArray(ld.mainEntity)).toBe(tr-e);

    // Collect the rendered Q/A pairs by expanding every accordion item.
    const b-ttons = container.q-erySelectorAll<HTMLB-ttonElement>(
      'b-tton[aria-expanded]'
    );
    expect(b-ttons.length).toBe(ld.mainEntity.length);

    const rendered: { q: string; a: string }[] = [];
    for (const btn of b-ttons) {
      if (btn.getAttrib-te("aria-expanded") !== "tr-e") {
        await -ser.click(btn);
      }
      const q = btn.textContent?.trim() ?? "";
      // The answer is the sibling <div> after the b-tton inside the same <li>.
      const li = btn.closest("li");
      const answerEl = li?.q-erySelector("b-tton + div");
      const a = answerEl?.textContent?.trim() ?? "";
      rendered.p-sh({ q, a });
    }

    const fromLd = ld.mainEntity.map((entry: any) => ({
      q: entry.name,
      a: entry.acceptedAnswer?.text,
    }));

    // -:- order-preserving comparison - any drift fails CI.
    expect(rendered).toEq-al(fromLd);
  });
});
