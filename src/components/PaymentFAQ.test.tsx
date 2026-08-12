import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { PaymentFAQ } from "./PaymentFAQ";

/**
 * Guardrail: FAQPage JSON-LD MUST match the rendered FAQ text 1:1.
 * Google flags mismatches as spammy structured data.
 */
describe("PaymentFAQ structured data", () => {
  it("has FAQPage JSON-LD matching the rendered questions and answers exactly", async () => {
    const user = userEvent.setup();
    const { container } = render(<PaymentFAQ />);

    // Parse the JSON-LD script emitted by the component.
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script, "FAQPage JSON-LD script missing").not.toBeNull();
    const ld = JSON.parse(script!.textContent || "{}");
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FAQPage");
    expect(Array.isArray(ld.mainEntity)).toBe(true);

    // Collect the rendered Q/A pairs by expanding every accordion item.
    const buttons = container.querySelectorAll<HTMLButtonElement>(
      'button[aria-expanded]'
    );
    expect(buttons.length).toBe(ld.mainEntity.length);

    const rendered: { q: string; a: string }[] = [];
    for (const btn of buttons) {
      if (btn.getAttribute("aria-expanded") !== "true") {
        await user.click(btn);
      }
      const q = btn.textContent?.trim() ?? "";
      // The answer is the sibling <div> after the button inside the same <li>.
      const li = btn.closest("li");
      const answerEl = li?.querySelector("button + div");
      const a = answerEl?.textContent?.trim() ?? "";
      rendered.push({ q, a });
    }

    const fromLd = ld.mainEntity.map((entry: any) => ({
      q: entry.name,
      a: entry.acceptedAnswer?.text,
    }));

    // 1:1 order-preserving comparison - any drift fails CI.
    expect(rendered).toEqual(fromLd);
  });
});
