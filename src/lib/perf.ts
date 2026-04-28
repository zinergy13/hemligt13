// Lightweight client-side instrumentation for Supabase REST/Storage/Auth calls.
// Patches window.fetch and PerformanceObserver to record timing per endpoint,
// then exposes the data via a tiny pub-sub for the PerfOverlay component.
//
// Activate by visiting any page with ?perf=1 (sticky), or run
//   localStorage.setItem("fjallmys-perf", "1")
// Disable with ?perf=0 or localStorage.removeItem("fjallmys-perf").

export type PerfEntry = {
  id: number;
  ts: number; // epoch ms
  endpoint: string; // e.g. "rest/v1/cabins" or "auth/v1/token"
  method: string;
  status: number | null;
  durationMs: number;
  bytes: number | null;
  ok: boolean;
  query: string; // the raw search string for diagnostics (truncated)
};

const FLAG_KEY = "fjallmys-perf";
const MAX_ENTRIES = 100;

let installed = false;
let nextId = 1;
const entries: PerfEntry[] = [];
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function isPerfEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("perf");
    if (q === "1") {
      localStorage.setItem(FLAG_KEY, "1");
      return true;
    }
    if (q === "0") {
      localStorage.removeItem(FLAG_KEY);
      return false;
    }
    return localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function getEntries(): PerfEntry[] {
  return entries;
}

export function clearEntries() {
  entries.length = 0;
  notify();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function shortenEndpoint(url: URL, supabaseHost: string): string | null {
  if (url.host !== supabaseHost) return null;
  // Drop leading slash, strip query — we record query separately.
  return url.pathname.replace(/^\/+/, "");
}

function record(entry: Omit<PerfEntry, "id">) {
  const full: PerfEntry = { id: nextId++, ...entry };
  entries.unshift(full);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  // Always log to console so users can grep — concise, single line.
  // eslint-disable-next-line no-console
  console.info(
    `[perf] ${full.method} ${full.endpoint} → ${full.status ?? "?"} in ${full.durationMs.toFixed(0)}ms${
      full.bytes != null ? ` (${(full.bytes / 1024).toFixed(1)} KB)` : ""
    }${full.query ? ` ?${full.query}` : ""}`,
  );
  notify();
}

export function installPerfMonitor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  let supabaseHost = "";
  try {
    supabaseHost = new URL(import.meta.env.VITE_SUPABASE_URL as string).host;
  } catch {
    // No supabase URL configured — nothing to monitor.
    return;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let url: URL | null = null;
    try {
      const raw =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      url = new URL(raw, window.location.origin);
    } catch {
      return originalFetch(input as RequestInfo, init);
    }

    const endpoint = shortenEndpoint(url, supabaseHost);
    if (!endpoint) {
      return originalFetch(input as RequestInfo, init);
    }

    const method = (init?.method ?? (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET")) || "GET";
    const start = performance.now();
    let res: Response;
    try {
      res = await originalFetch(input as RequestInfo, init);
    } catch (err) {
      record({
        ts: Date.now(),
        endpoint,
        method,
        status: null,
        durationMs: performance.now() - start,
        bytes: null,
        ok: false,
        query: url.search.replace(/^\?/, "").slice(0, 200),
      });
      throw err;
    }

    const durationMs = performance.now() - start;
    let bytes: number | null = null;
    const lenHeader = res.headers.get("content-length");
    if (lenHeader) {
      const n = Number(lenHeader);
      if (Number.isFinite(n)) bytes = n;
    }

    record({
      ts: Date.now(),
      endpoint,
      method,
      status: res.status,
      durationMs,
      bytes,
      ok: res.ok,
      query: url.search.replace(/^\?/, "").slice(0, 200),
    });

    return res;
  };
}