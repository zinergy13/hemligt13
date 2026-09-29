import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Sends the gift-card email for an existing card. Admin only; the recipient
// and amount come from the stored gift card, never from the browser.
export const sendGiftCardEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().min(4).max(64) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: card, error } = await context.supabase
      .from("gift_cards" as any)
      .select("code, amount_ore, issued_to_email, issued_to_name, message, expires_at")
      .eq("code", data.code)
      .maybeSingle();
    if (error || !card) return { success: false, error: "Presentkortet hittades inte" };
    const c = card as any;
    if (!c.issued_to_email) return { success: false, error: "Mottagaren saknar e-post" };

    const { sendTemplatedEmailCore } = await import("@/lib/email/send-core.server");
    const res = await sendTemplatedEmailCore({
      templateName: "gift-card",
      recipientEmail: c.issued_to_email,
      idempotencyKey: `gift-card-${c.code}`,
      templateData: {
        recipientName: c.issued_to_name || undefined,
        code: c.code,
        amountKr: Math.round(c.amount_ore / 100),
        expiresAt: c.expires_at ? new Date(c.expires_at).toLocaleDateString("sv-SE") : undefined,
        message: c.message || undefined,
      },
    });
    const body = res.body as { success?: boolean; error?: string; reason?: string };
    if (res.status >= 300 || body.success === false) {
      return { success: false, error: body.error || body.reason || "send_failed" };
    }
    return { success: true };
  });
