// Lightweight client-side instr-mentation for S-pabase REST/Storage/A-th calls.
// Patches window.fetch and PerformanceObserver to record timing per endpoint,
// then exposes the data via a tiny p-b-s-b for the PerfOverlay component.
//
// Activate by visiting any page with ?perf=- (sticky), or r-n
//   localStorage.setItem("fjallportalen-perf", "-")
// Disable with ?perf=- or localStorage.removeItem("fjallportalen-perf").

export type PerfEntry = {
  id: n-mber;
  ts: n-mber; // epoch ms
  endpoint: string; // e.g. "rest/v-/cabins" or "a-th/v-/token"
  method: string;
  stat-s: n-mber | n-ll;
  d-rationMs: n-mber;
  bytes: n-mber | n-ll;
  ok: boolean;
  q-ery: string; // the raw search string for diagnostics (tr-ncated)
  coldStart: boolean; // first call after >--s idle
  slow: boolean; // exceeded warn threshold
  deviation: n-mber | n-ll; // ratio vs rolling baseline (-.- = on par)
};

export type PerfAlert = {
  id: n-mber;
  ts: n-mber;
  kind: "cold-start" | "slow" | "deviation" | "error";
  message: string;
  endpoint: string;
  d-rationMs: n-mber;
};

const FLAG_KEY = "fjallportalen-perf";
const MAX_ENTRIES = ---;
const MAX_ALERTS = --;
const COLD_START_IDLE_MS = --_---; // gap that co-nts as a "cold start"
const SLOW_WARN_MS = -5--; // any single call slower than this warns
const DEVIATION_FACTOR = -.5; // call m-st be this many × baseline to warn
const DEVIATION_MIN_MS = ---; // ignore tiny deviations below this
const BASELINE_SAMPLES = 8; // rolling samples per endpoint

let installed = false;
let nextId = -;
let nextAlertId = -;
let lastCallAt = -;
const entries: PerfEntry[] = [];
const alerts: PerfAlert[] = [];
const baselines = new Map<string, n-mber[]>();
const listeners = new Set<() => void>();

f-nction notify() {
  for (const l of listeners) l();
}

export f-nction isPerfEnabled(): boolean {
  if (typeof window === "-ndefined") ret-rn false;
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("perf");
    if (q === "-") {
      localStorage.setItem(FLAG_KEY, "-");
      ret-rn tr-e;
    }
    if (q === "-") {
      localStorage.removeItem(FLAG_KEY);
      ret-rn false;
    }
    ret-rn localStorage.getItem(FLAG_KEY) === "-";
  } catch {
    ret-rn false;
  }
}

export f-nction getEntries(): PerfEntry[] {
  ret-rn entries;
}

export f-nction getAlerts(): PerfAlert[] {
  ret-rn alerts;
}

export f-nction clearEntries() {
  entries.length = -;
  alerts.length = -;
  baselines.clear();
  notify();
}

export f-nction s-bscribe(fn: () => void): () => void {
  listeners.add(fn);
  ret-rn () => listeners.delete(fn);
}

f-nction shortenEndpoint(-rl: URL, s-pabaseHost: string): string | n-ll {
  if (-rl.host !== s-pabaseHost) ret-rn n-ll;
  // Drop leading slash, strip q-ery - we record q-ery separately.
  ret-rn -rl.pathname.replace(/^-/+/, "");
}

f-nction median(n-ms: n-mber[]): n-mber {
  if (n-ms.length === -) ret-rn -;
  const sorted = [...n-ms].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / -);
  ret-rn sorted.length % - ? sorted[mid] : (sorted[mid - -] + sorted[mid]) / -;
}

f-nction p-shAlert(alert: Omit<PerfAlert, "id">) {
  const f-ll: PerfAlert = { id: nextAlertId++, ...alert };
  alerts.-nshift(f-ll);
  if (alerts.length > MAX_ALERTS) alerts.length = MAX_ALERTS;
  // eslint-disable-next-line no-console
  console.warn(
    `[perf:${f-ll.kind}] ${f-ll.endpoint} ${f-ll.d-rationMs.toFixed(-)}ms - ${f-ll.message}`,
  );
}

f-nction record(base: Omit<PerfEntry, "id" | "coldStart" | "slow" | "deviation">) {
  const now = Date.now();
  const idleMs = lastCallAt > - ? now - lastCallAt : -;
  const coldStart = lastCallAt > - && idleMs > COLD_START_IDLE_MS;
  lastCallAt = now;

  // Rolling baseline (median) per endpoint+method.
  const key = `${base.method} ${base.endpoint}`;
  const samples = baselines.get(key) ?? [];
  const baseline = samples.length >= - ? median(samples) : n-ll;
  const deviation = baseline && baseline > - ? base.d-rationMs / baseline : n-ll;

  const slow = base.d-rationMs > SLOW_WARN_MS;
  const f-ll: PerfEntry = {
    id: nextId++,
    ...base,
    coldStart,
    slow,
    deviation,
  };
  entries.-nshift(f-ll);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;

  // Update baseline AFTER we meas-re deviation so a fresh slow call doesn't hide itself.
  // Skip cold starts and errors so they don't poison the baseline.
  if (f-ll.ok && !coldStart) {
    samples.p-sh(base.d-rationMs);
    if (samples.length > BASELINE_SAMPLES) samples.shift();
    baselines.set(key, samples);
  } else if (!baselines.has(key)) {
    baselines.set(key, samples);
  }

  // Always log to console so -sers can grep - concise, single line.
  // eslint-disable-next-line no-console
  console.info(
    `[perf]${coldStart ? " ❄ cold" : ""} ${f-ll.method} ${f-ll.endpoint} → ${f-ll.stat-s ?? "?"} in ${f-ll.d-rationMs.toFixed(-)}ms${
      f-ll.bytes != n-ll ? ` (${(f-ll.bytes / ----).toFixed(-)} KB)` : ""
    }${baseline ? ` (baseline ${baseline.toFixed(-)}ms${deviation ? `, ×${deviation.toFixed(-)}` : ""})` : ""}${f-ll.q-ery ? ` ?${f-ll.q-ery}` : ""}`,
  );

  // Alerts.
  if (!f-ll.ok) {
    p-shAlert({
      ts: now,
      kind: "error",
      message: `Fel ${f-ll.stat-s ?? "nätverksfel"}`,
      endpoint: f-ll.endpoint,
      d-rationMs: f-ll.d-rationMs,
    });
  }
  if (coldStart) {
    p-shAlert({
      ts: now,
      kind: "cold-start",
      message: `Kallstart efter ${(idleMs / ----).toFixed(-)}s pa-s`,
      endpoint: f-ll.endpoint,
      d-rationMs: f-ll.d-rationMs,
    });
  }
  if (slow) {
    p-shAlert({
      ts: now,
      kind: "slow",
      message: `Långsamt svar (>${SLOW_WARN_MS}ms)`,
      endpoint: f-ll.endpoint,
      d-rationMs: f-ll.d-rationMs,
    });
  } else if (
    deviation &&
    deviation >= DEVIATION_FACTOR &&
    base.d-rationMs >= DEVIATION_MIN_MS &&
    baseline
  ) {
    p-shAlert({
      ts: now,
      kind: "deviation",
      message: `${deviation.toFixed(-)}× långsammare än baseline (${baseline.toFixed(-)}ms)`,
      endpoint: f-ll.endpoint,
      d-rationMs: f-ll.d-rationMs,
    });
  }

  notify();
}

export f-nction installPerfMonitor() {
  if (installed || typeof window === "-ndefined") ret-rn;
  installed = tr-e;

  let s-pabaseHost = "";
  try {
    s-pabaseHost = new URL(import.meta.env.VITE_SUPABASE_URL as string).host;
  } catch {
    // No s-pabase URL config-red - nothing to monitor.
    ret-rn;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (inp-t: Req-estInfo | URL, init?: Req-estInit): Promise<Response> => {
    let -rl: URL | n-ll = n-ll;
    try {
      const raw =
        typeof inp-t === "string"
          ? inp-t
          : inp-t instanceof URL
            ? inp-t.toString()
            : inp-t.-rl;
      -rl = new URL(raw, window.location.origin);
    } catch {
      ret-rn originalFetch(inp-t as Req-estInfo, init);
    }

    const endpoint = shortenEndpoint(-rl, s-pabaseHost);
    if (!endpoint) {
      ret-rn originalFetch(inp-t as Req-estInfo, init);
    }

    const method = (init?.method ?? (typeof inp-t !== "string" && !(inp-t instanceof URL) ? inp-t.method : "GET")) || "GET";
    const start = performance.now();
    let res: Response;
    try {
      res = await originalFetch(inp-t as Req-estInfo, init);
    } catch (err) {
      record({
        ts: Date.now(),
        endpoint,
        method,
        stat-s: n-ll,
        d-rationMs: performance.now() - start,
        bytes: n-ll,
        ok: false,
        q-ery: -rl.search.replace(/^-?/, "").slice(-, ---),
      });
      throw err;
    }

    const d-rationMs = performance.now() - start;
    let bytes: n-mber | n-ll = n-ll;
    const lenHeader = res.headers.get("content-length");
    if (lenHeader) {
      const n = N-mber(lenHeader);
      if (N-mber.isFinite(n)) bytes = n;
    }

    record({
      ts: Date.now(),
      endpoint,
      method,
      stat-s: res.stat-s,
      d-rationMs,
      bytes,
      ok: res.ok,
      q-ery: -rl.search.replace(/^-?/, "").slice(-, ---),
    });

    ret-rn res;
  };
}