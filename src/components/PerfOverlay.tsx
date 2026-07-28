import { useEffect, useState } from "react";
import {
  clearEntries,
  getEntries,
  getAlerts,
  isPerfEnabled,
  subscribe,
  type PerfEntry,
  type PerfAlert,
} from "@/lib/perf";

function color(d: number) {
  if (d > 1000) return "text-red-400";
  if (d > 400) return "text-amber-400";
  return "text-emerald-400";
}

export function PerfOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [entries, setEntries] = useState<PerfEntry[]>([]);
  const [alerts, setAlerts] = useState<PerfAlert[]>([]);
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<"requests" | "alerts">("requests");

  useEffect(() => {
    setEnabled(isPerfEnabled());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setEntries([...getEntries()]);
    setAlerts([...getAlerts()]);
    return subscribe(() => {
      setEntries([...getEntries()]);
      setAlerts([...getAlerts()]);
    });
  }, [enabled]);

  if (!enabled) return null;

  const total = entries.length;
  const slow = entries.filter((e) => e.durationMs > 400).length;
  const avg = total > 0 ? entries.reduce((a, e) => a + e.durationMs, 0) / total : 0;
  const alertCount = alerts.length;

  return (
    <div className="fixed bottom-3 right-3 z-[9999] w-[360px] max-w-[92vw] rounded-lg border border-white/10 bg-black/85 font-mono text-[11px] text-white shadow-xl backdrop-blur">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-white/10 px-3 py-2 text-left"
      >
        <span className="font-semibold">
          ⚡ Perf · {total} req · avg {avg.toFixed(0)}ms · {slow} långsam
          {alertCount > 0 ? ` · ⚠ ${alertCount}` : ""}
        </span>
        <span className="opacity-60">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <>
          <div className="flex border-b border-white/10 text-[10px]">
            <button
              onClick={() => setTab("requests")}
              className={`flex-1 px-3 py-1.5 ${tab === "requests" ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              Anrop
            </button>
            <button
              onClick={() => setTab("alerts")}
              className={`flex-1 px-3 py-1.5 ${tab === "alerts" ? "bg-white/10 text-white" : "text-white/50"}`}
            >
              Varningar {alertCount > 0 ? `(${alertCount})` : ""}
            </button>
          </div>
          <div className="max-h-[320px] overflow-y-auto px-2 py-1">
            {tab === "requests" && entries.length === 0 ? (
              <div className="px-2 py-3 text-white/50">
                Väntar på anrop… Navigera/uppdatera sidan.
              </div>
            ) : tab === "requests" ? (
              <ul className="divide-y divide-white/5">
                {entries.map((e) => (
                  <li key={e.id} className="px-1 py-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate" title={`${e.endpoint}${e.query ? "?" + e.query : ""}`}>
                        <span className="text-white/50">{e.method}</span>{" "}
                        <span>{e.endpoint}</span>
                        {e.coldStart && <span className="ml-1 text-sky-300" title="Kallstart">❄</span>}
                        {e.deviation && e.deviation >= 2 && (
                          <span className="ml-1 text-amber-300" title={`×${e.deviation.toFixed(1)} mot baseline`}>
                            ×{e.deviation.toFixed(1)}
                          </span>
                        )}
                      </span>
                      <span className={`tabular-nums ${color(e.durationMs)}`}>
                        {e.durationMs.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/45">
                      <span>
                        {e.status ?? "ERR"}
                        {e.bytes != null ? ` · ${(e.bytes / 1024).toFixed(1)} KB` : ""}
                      </span>
                      <span>{new Date(e.ts).toLocaleTimeString("sv-SE")}</span>
                    </div>
                    {e.query && (
                      <div className="truncate text-[10px] text-white/35" title={e.query}>
                        ?{e.query}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : alerts.length === 0 ? (
              <div className="px-2 py-3 text-white/50">
                Inga varningar än. Långsamma svar visas här.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {alerts.map((a) => (
                  <li key={a.id} className="px-1 py-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-semibold">
                        {a.kind === "cold-start" && <span className="text-sky-300">❄ Kallstart</span>}
                        {a.kind === "slow" && <span className="text-red-300">🐢 Långsamt</span>}
                        {a.kind === "deviation" && <span className="text-amber-300">⚠ Avvikelse</span>}
                        {a.kind === "error" && <span className="text-red-400">✖ Fel</span>}
                      </span>
                      <span className={`tabular-nums ${color(a.durationMs)}`}>
                        {a.durationMs.toFixed(0)}ms
                      </span>
                    </div>
                    <div className="truncate text-[10px] text-white/70" title={a.endpoint}>
                      {a.endpoint}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/45">
                      <span className="truncate">{a.message}</span>
                      <span>{new Date(a.ts).toLocaleTimeString("sv-SE")}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-1.5 text-[10px] text-white/60">
            <span>?perf=0 för att stänga av</span>
            <button
              onClick={() => clearEntries()}
              className="rounded border border-white/20 px-2 py-0.5 hover:bg-white/10"
            >
              Rensa
            </button>
          </div>
        </>
      )}
    </div>
  );
}