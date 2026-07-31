import { supabase } from "@/integrations/supabase/client";

/**
 * Loggar nekad åtkomst (RLS / saknade rättigheter) till public.access_denials
 * så att admin snabbt kan se varför t.ex. stugor inte syns för besökare.
 *
 * Vi lyssnar globalt på fetch mot Supabase REST/RPC och plockar upp svar med
 * status 401/403 eller PostgREST-koder som 42501 ("permission denied").
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

// Enkel bromskloss: max 10 loggposter per session och max 1 per unik nyckel.
const seen = new Set<string>();
let logged = 0;
const MAX_PER_SESSION = 10;

export type DenialInput = {
  source: string;
  resource?: string | null;
  operation?: string | null;
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

export async function reportAccessDenial(input: DenialInput) {
  if (typeof window === "undefined") return;
  const key = `${input.source}|${input.resource ?? ""}|${input.code ?? ""}|${input.message ?? ""}`;
  if (seen.has(key) || logged >= MAX_PER_SESSION) return;
  seen.add(key);
  logged += 1;

  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    await supabase.from("access_denials" as never).insert({
      user_id: user?.id ?? null,
      is_authenticated: !!user,
      source: input.source,
      resource: input.resource ?? null,
      operation: input.operation ?? null,
      code: input.code ?? null,
      message: input.message?.slice(0, 1000) ?? null,
      details: input.details?.slice(0, 1000) ?? null,
      hint: input.hint?.slice(0, 500) ?? null,
      route: window.location.pathname + window.location.search,
      user_agent: navigator.userAgent.slice(0, 500),
    } as never);
  } catch {
    // Loggning får aldrig störa användarupplevelsen.
  }
}

/** Hjälpare för enskilda anrop: skicka in ett PostgrestError. */
export function reportPostgrestError(
  source: string,
  error: { code?: string; message?: string; details?: string | null; hint?: string | null } | null,
  resource?: string,
) {
  if (!error) return;
  const denied = error.code === "42501" || /permission denied|row-level security|JWT/i.test(error.message ?? "");
  if (!denied) return;
  void reportAccessDenial({
    source,
    resource,
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
}

let installed = false;

export function installAccessDenialLogger() {
  if (installed || typeof window === "undefined" || !SUPABASE_URL) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input as RequestInfo, init);
    try {
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (!url.startsWith(SUPABASE_URL) || !/\/rest\/v1\//.test(url)) return response;
      // Undvik att logga själva loggningen (oändlig loop).
      if (url.includes("access_denials")) return response;
      if (response.status !== 401 && response.status !== 403) return response;

      const body = await response.clone().json().catch(() => null);
      const path = url.slice(url.indexOf("/rest/v1/") + 9).split("?")[0];
      void reportAccessDenial({
        source: "postgrest",
        resource: path,
        operation: (init?.method ?? (input as Request).method ?? "GET").toUpperCase(),
        code: body?.code ?? String(response.status),
        message: body?.message ?? response.statusText,
        details: body?.details ?? null,
        hint: body?.hint ?? null,
      });
    } catch {
      // ignorera
    }
    return response;
  };
}
