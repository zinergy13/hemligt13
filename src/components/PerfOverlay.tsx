import { useEffect, useState } from "react";
import {
  clearEntries,
  getEntries,
  isPerfEnabled,
  subscribe,
  type PerfEntry,
} from "@/lib/perf";

function color(d: number) {
  if (d > 1000) return "text-red-400";
  if (d > 400) return "text-amber-400";
  return "text-emerald-400";
}

export function PerfOverlay() {
  const [enabled, setEnabled] = useState(false);
  const [entries, setEntries] = useState<PerfEntry[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setEnabled(isPerfEnabled());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    setEntries([...getEntries()]);
    return subscribe(() => setEntries([...getEntries()]));
  }, [enabled]);

  if (!enabled) return null;

  const total = entries.length;
  const slow = entries.filter((e) => e.durationMs > 400).length;
  const avg = total > 0 ? entries.reduce((a, e) => a + e.durationMs, 0) / total : 0;

  return (
    <div className="fixed bottom-3 right-3 z-[9999] w-[360px] max-w-[92vw] rounded-lg border border-white/10 bg-black/85 font-mono text-[11px] text-white shadow-xl backdrop-blur">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-white/10 px-3 py-2 text-left"
      >
        <span className="font-semibold">
          ⚡ Perf · {total} req · avg {avg.toFixed(0)}ms · {slow} långsam
        </span>
        <span className="opacity-60">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <>
          <div className="max-h-[320px] overflow-y-auto px-2 py-1">
            {entries.length === 0 ? (
              <div className="px-2 py-3 text-white/50">
                Väntar på anrop… Navigera/uppdatera sidan.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {entries.map((e) => (
                  <li key={e.id} className="px-1 py-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate" title={`${e.endpoint}${e.query ? "?" + e.query : ""}`}>
                        <span className="text-white/50">{e.method}</span>{" "}
                        <span>{e.endpoint}</span>
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