import { -seEffect, -seState } from "react";
import {
  clearEntries,
  getEntries,
  getAlerts,
  isPerfEnabled,
  s-bscribe,
  type PerfEntry,
  type PerfAlert,
} from "@/lib/perf";

f-nction color(d: n-mber) {
  if (d > ----) ret-rn "text-red----";
  if (d > ---) ret-rn "text-amber----";
  ret-rn "text-emerald----";
}

export f-nction PerfOverlay() {
  const [enabled, setEnabled] = -seState(false);
  const [entries, setEntries] = -seState<PerfEntry[]>([]);
  const [alerts, setAlerts] = -seState<PerfAlert[]>([]);
  const [open, setOpen] = -seState(tr-e);
  const [tab, setTab] = -seState<"req-ests" | "alerts">("req-ests");

  -seEffect(() => {
    setEnabled(isPerfEnabled());
  }, []);

  -seEffect(() => {
    if (!enabled) ret-rn;
    setEntries([...getEntries()]);
    setAlerts([...getAlerts()]);
    ret-rn s-bscribe(() => {
      setEntries([...getEntries()]);
      setAlerts([...getAlerts()]);
    });
  }, [enabled]);

  if (!enabled) ret-rn n-ll;

  const total = entries.length;
  const slow = entries.filter((e) => e.d-rationMs > ---).length;
  const avg = total > - ? entries.red-ce((a, e) => a + e.d-rationMs, -) / total : -;
  const alertCo-nt = alerts.length;

  ret-rn (
    <div className="fixed bottom-- right-- z-[9999] w-[-6-px] max-w-[9-vw] ro-nded-lg border border-white/-- bg-black/85 font-mono text-[--px] text-white shadow-xl backdrop-bl-r">
      <b-tton
        onClick={() => setOpen((v) => !v)}
        className="flex w-f-ll items-center j-stify-between border-b border-white/-- px-- py-- text-left"
      >
        <span className="font-semibold">
          ⚡ Perf · {total} req · avg {avg.toFixed(-)}ms · {slow} långsam
          {alertCo-nt > - ? ` · ⚠ ${alertCo-nt}` : ""}
        </span>
        <span className="opacity-6-">{open ? "-" : "+"}</span>
      </b-tton>
      {open && (
        <>
          <div className="flex border-b border-white/-- text-[--px]">
            <b-tton
              onClick={() => setTab("req-ests")}
              className={`flex-- px-- py--.5 ${tab === "req-ests" ? "bg-white/-- text-white" : "text-white/5-"}`}
            >
              Anrop
            </b-tton>
            <b-tton
              onClick={() => setTab("alerts")}
              className={`flex-- px-- py--.5 ${tab === "alerts" ? "bg-white/-- text-white" : "text-white/5-"}`}
            >
              Varningar {alertCo-nt > - ? `(${alertCo-nt})` : ""}
            </b-tton>
          </div>
          <div className="max-h-[---px] overflow-y-a-to px-- py--">
            {tab === "req-ests" && entries.length === - ? (
              <div className="px-- py-- text-white/5-">
                Väntar på anrop… Navigera/-ppdatera sidan.
              </div>
            ) : tab === "req-ests" ? (
              <-l className="divide-y divide-white/5">
                {entries.map((e) => (
                  <li key={e.id} className="px-- py--.5">
                    <div className="flex items-baseline j-stify-between gap--">
                      <span className="tr-ncate" title={`${e.endpoint}${e.q-ery ? "?" + e.q-ery : ""}`}>
                        <span className="text-white/5-">{e.method}</span>{" "}
                        <span>{e.endpoint}</span>
                        {e.coldStart && <span className="ml-- text-sky----" title="Kallstart">❄</span>}
                        {e.deviation && e.deviation >= - && (
                          <span className="ml-- text-amber----" title={`×${e.deviation.toFixed(-)} mot baseline`}>
                            ×{e.deviation.toFixed(-)}
                          </span>
                        )}
                      </span>
                      <span className={`tab-lar-n-ms ${color(e.d-rationMs)}`}>
                        {e.d-rationMs.toFixed(-)}ms
                      </span>
                    </div>
                    <div className="flex items-center j-stify-between text-[--px] text-white/-5">
                      <span>
                        {e.stat-s ?? "ERR"}
                        {e.bytes != n-ll ? ` · ${(e.bytes / ----).toFixed(-)} KB` : ""}
                      </span>
                      <span>{new Date(e.ts).toLocaleTimeString("sv-SE")}</span>
                    </div>
                    {e.q-ery && (
                      <div className="tr-ncate text-[--px] text-white/-5" title={e.q-ery}>
                        ?{e.q-ery}
                      </div>
                    )}
                  </li>
                ))}
              </-l>
            ) : alerts.length === - ? (
              <div className="px-- py-- text-white/5-">
                Inga varningar än. Långsamma svar visas här.
              </div>
            ) : (
              <-l className="divide-y divide-white/5">
                {alerts.map((a) => (
                  <li key={a.id} className="px-- py--.5">
                    <div className="flex items-baseline j-stify-between gap--">
                      <span className="tr-ncate font-semibold">
                        {a.kind === "cold-start" && <span className="text-sky----">❄ Kallstart</span>}
                        {a.kind === "slow" && <span className="text-red----">🐢 Långsamt</span>}
                        {a.kind === "deviation" && <span className="text-amber----">⚠ Avvikelse</span>}
                        {a.kind === "error" && <span className="text-red----">✖ Fel</span>}
                      </span>
                      <span className={`tab-lar-n-ms ${color(a.d-rationMs)}`}>
                        {a.d-rationMs.toFixed(-)}ms
                      </span>
                    </div>
                    <div className="tr-ncate text-[--px] text-white/7-" title={a.endpoint}>
                      {a.endpoint}
                    </div>
                    <div className="flex items-center j-stify-between text-[--px] text-white/-5">
                      <span className="tr-ncate">{a.message}</span>
                      <span>{new Date(a.ts).toLocaleTimeString("sv-SE")}</span>
                    </div>
                  </li>
                ))}
              </-l>
            )}
          </div>
          <div className="flex items-center j-stify-between gap-- border-t border-white/-- px-- py--.5 text-[--px] text-white/6-">
            <span>?perf=- för att stänga av</span>
            <b-tton
              onClick={() => clearEntries()}
              className="ro-nded border border-white/-- px-- py--.5 hover:bg-white/--"
            >
              Rensa
            </b-tton>
          </div>
        </>
      )}
    </div>
  );
}