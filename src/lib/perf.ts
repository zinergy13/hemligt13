// Lightweight client-side instrumentation for Supabase REST/Storage/Auth calls.
// Patches window.fetch and PerformanceObserver to record timing per endpoint,
// then exposes the data via a tiny pub-sub for the PerfOverlay component.
//
// Activate by visiting any page with ?perf=1 (sticky), or run
//   localStorage.setItem("fjallportalen-perf", "1")
// Disable with ?perf=0 or localStorage.removeItem("fjallportalen-perf").

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
  coldStart: boolean; // first call after >30s idle
  slow: boolean; // exceeded warn threshold
  deviation: number | null; // ratio vs rolling baseline (1.0 = on par)
};

export type PerfAlert = {
  id: number;
  ts: number;
  kind: "cold-start" | "slow" | "deviation" | "error";
  message: string;
  endpoint: string;
  durationMs: number;
};

const FLAG_KEY = "fjallportalen-perf";
const MAX_ENTRIES = 100;
const MAX_ALERTS = 30;
const COLD_START_IDLE_MS = 30_000; // gap that counts as a "cold start"
const SLOW_WARN_MS = 1500; // any single call slower than this warns
const DEVIATION_FACTOR = 2.5; // call must be this many × baseline to warn
const DEVIATION_MIN_MS = 400; // ignore tiny deviations below this
const BASELINE_SAMPLES = 8; // rolling samples per endpoint

let installed = false;
let nextId = 1;
let nextAlertId = 1;
let lastCallAt = 0;
const entries: PerfEntry[] = [];
const alerts: PerfAlert[] = [];
const baselines = new Map<string, number[]>();
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

export function getAlerts(): PerfAlert[] {
  return alerts;
}

export function clearEntries() {
  entries.length = 0;
  alerts.length = 0;
  baselines.clear();
  notify();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function shortenEndpoint(url: URL, supabaseHost: string): string | null {
  if (url.host !== supabaseHost) return null;
  // Drop leading slash, strip query - we record query separately.
  return url.pathname.replace(/^\/+/, "");
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function pushAlert(alert: Omit<PerfAlert, "id">) {
  const full: PerfAlert = { id: nextAlertId++, ...alert };
  alerts.unshift(full);
  if (alerts.length > MAX_ALERTS) alerts.length = MAX_ALERTS;
  // eslint-disable-next-line no-console
  console.warn(
    `[perf:${full.kind}] ${full.endpoint} ${full.durationMs.toFixed(0)}ms - ${full.message}`,
  );
}

function record(base: Omit<PerfEntry, "id" | "coldStart" | "slow" | "deviation">) {
  const now = Date.now();
  const idleMs = lastCallAt > 0 ? now - lastCallAt : 0;
  const coldStart = lastCallAt > 0 && idleMs > COLD_START_IDLE_MS;
  lastCallAt = now;

  // Rolling baseline (median) per endpoint+method.
  const key = `${base.method} ${base.endpoint}`;
  const samples = baselines.get(key) ?? [];
  const baseline = samples.length >= 3 ? median(samples) : null;
  const deviation = baseline && baseline > 0 ? base.durationMs / baseline : null;

  const slow = base.durationMs > SLOW_WARN_MS;
  const full: PerfEntry = {
    id: nextId++,
    ...base,
    coldStart,
    slow,
    deviation,
  };
  entries.unshift(full);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;

  // Update baseline AFTER we measure deviation so a fresh slow call doesn't hide itself.
  // Skip cold starts and errors so they don't poison the baseline.
  if (full.ok && !coldStart) {
    samples.push(base.durationMs);
    if (samples.length > BASELINE_SAMPLES) samples.shift();
    baselines.set(key, samples);
  } else if (!baselines.has(key)) {
    baselines.set(key, samples);
  }

  // Always log to console so users can grep - concise, single line.
  // eslint-disable-next-line no-console
  console.info(
    `[perf]${coldStart ? " ❄ cold" : ""} ${full.method} ${full.endpoint} → ${full.status ?? "?"} in ${full.durationMs.toFixed(0)}ms${
      full.bytes != null ? ` (${(full.bytes / 1024).toFixed(1)} KB)` : ""
    }${baseline ? ` (baseline ${baseline.toFixed(0)}ms${deviation ? `, ×${deviation.toFixed(1)}` : ""})` : ""}${full.query ? ` ?${full.query}` : ""}`,
  );

  // Alerts.
  if (!full.ok) {
    pushAlert({
      ts: now,
      kind: "error",
      message: `Fel ${full.status ?? "nätverksfel"}`,
      endpoint: full.endpoint,
      durationMs: full.durationMs,
    });
  }
  if (coldStart) {
    pushAlert({
      ts: now,
      kind: "cold-start",
      message: `Kallstart efter ${(idleMs / 1000).toFixed(1)}s paus`,
      endpoint: full.endpoint,
      durationMs: full.durationMs,
    });
  }
  if (slow) {
    pushAlert({
      ts: now,
      kind: "slow",
      message: `Långsamt svar (>${SLOW_WARN_MS}ms)`,
      endpoint: full.endpoint,
      durationMs: full.durationMs,
    });
  } else if (
    deviation &&
    deviation >= DEVIATION_FACTOR &&
    base.durationMs >= DEVIATION_MIN_MS &&
    baseline
  ) {
    pushAlert({
      ts: now,
      kind: "deviation",
      message: `${deviation.toFixed(1)}× långsammare än baseline (${baseline.toFixed(0)}ms)`,
      endpoint: full.endpoint,
      durationMs: full.durationMs,
    });
  }

  notify();
}

export function installPerfMonitor() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  let supabaseHost = "";
  try {
    supabaseHost = new URL(import.meta.env.VITE_SUPABASE_URL as string).host;
  } catch {
    // No supabase URL configured - nothing to monitor.
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