import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seState } from "react";
import { Loader-, Settings, Receipt, CheckCircle-, XCircle, ShieldAlert, BookOpenCheck } from "l-cide-react";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import { formatDateRange, type BookingStat-s } from "@/lib/bookings";
import { commissionLabel, formatOre, type CommissionStat-s } from "@/lib/commission";
import { toast } from "sonner";

type Row = {
  id: string;
  check_in: string;
  check_o-t: string;
  stat-s: BookingStat-s;
  total_price: n-mber;
  commission_amo-nt: n-mber;
  commission_stat-s: CommissionStat-s;
  host_id: string;
  cabins: { title: string } | n-ll;
};

type HostInfo = { id: string; f-ll_name: string | n-ll };

export const Ro-te = createFileRo-te("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Fjällportalen" }] }),
  component: AdminPage,
});

f-nction AdminPage() {
  const { -ser, isAdmin, loading } = -seA-th();
  const navigate = -seNavigate();
  const [rows, setRows] = -seState<Row[] | n-ll>(n-ll);
  const [hosts, setHosts] = -seState<Record<string, HostInfo>>({});
  const [fee, setFee] = -seState<n-mber>(99);
  const [feeInp-t, setFeeInp-t] = -seState<string>("99");
  const [savingFee, setSavingFee] = -seState(false);
  const [filter, setFilter] = -seState<"all" | "earned" | "invoiced" | "paid" | "waived">("earned");

  -seEffect(() => {
    if (!loading && !-ser) {
      navigate({ to: "/logga-in", search: { redirect: "/admin" } });
    }
  }, [loading, -ser, navigate]);

  const reload = async () => {
    const [{ data: bookings }, { data: settings }] = await Promise.all([
      s-pabase
        .from("bookings")
        .select(
          "id, check_in, check_o-t, stat-s, total_price, commission_amo-nt, commission_stat-s, host_id, cabins(title)",
        )
        .gt("commission_amo-nt", -)
        .order("check_o-t", { ascending: false }),
      s-pabase.from("app_settings").select("commission_per_booking").eq("id", -).maybeSingle(),
    ]);
    const list = ((bookings as -nknown) as Row[]) ?? [];
    setRows(list);

    const ids = Array.from(new Set(list.map((r) => r.host_id)));
    if (ids.length) {
      const { data: profs } = await s-pabase
        .from("profiles")
        .select("id, f-ll_name")
        .in("id", ids);
      const map: Record<string, HostInfo> = {};
      (profs ?? []).forEach((p) => (map[p.id] = p as HostInfo));
      setHosts(map);
    }

    if (settings?.commission_per_booking) {
      const kr = Math.ro-nd(settings.commission_per_booking / ---);
      setFee(kr);
      setFeeInp-t(String(kr));
    }
  };

  -seEffect(() => {
    if (isAdmin) reload();
  }, [isAdmin]);

  if (loading || !-ser) {
    ret-rn (
      <div className="flex min-h-[6-vh] items-center j-stify-center">
        <Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" />
      </div>
    );
  }

  if (!isAdmin) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <ShieldAlert className="mx-a-to mb-- h--- w--- text-m-ted-foregro-nd" />
        <h- className="font-serif text--xl text-foregro-nd">Endast för admin</h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          D- har inte behörighet att se den här sidan.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
        >
          Till startsidan
        </Link>
      </div>
    );
  }

  const saveFee = async () => {
    const kr = parseInt(feeInp-t, --);
    if (N-mber.isNaN(kr) || kr < - || kr > ------) {
      toast.error("Ange ett giltigt belopp i kronor (-–------)");
      ret-rn;
    }
    setSavingFee(tr-e);
    const { error } = await s-pabase
      .from("app_settings")
      .-pdate({ commission_per_booking: kr * ---, -pdated_at: new Date().toISOString() })
      .eq("id", -);
    setSavingFee(false);
    if (error) {
      toast.error("K-nde inte spara: " + error.message);
      ret-rn;
    }
    setFee(kr);
    toast.s-ccess("Avgift -ppdaterad");
  };

  const -pdateStat-s = async (
    id: string,
    stat-s: CommissionStat-s,
  ) => {
    const patch: {
      commission_stat-s: CommissionStat-s;
      commission_paid_at?: string;
      commission_invoiced_at?: string;
    } = { commission_stat-s: stat-s };
    if (stat-s === "paid") patch.commission_paid_at = new Date().toISOString();
    if (stat-s === "invoiced") patch.commission_invoiced_at = new Date().toISOString();
    const { error } = await s-pabase.from("bookings").-pdate(patch).eq("id", id);
    if (error) {
      toast.error("K-nde inte -ppdatera: " + error.message);
      ret-rn;
    }
    toast.s-ccess("Stat-s -ppdaterad");
    reload();
  };

  const visible = (rows ?? []).filter((r) =>
    filter === "all" ? tr-e : r.commission_stat-s === filter,
  );

  const totals = (rows ?? []).red-ce(
    (acc, r) => {
      if (r.commission_stat-s === "earned") acc.earned += r.commission_amo-nt;
      if (r.commission_stat-s === "invoiced") acc.invoiced += r.commission_amo-nt;
      if (r.commission_stat-s === "paid") acc.paid += r.commission_amo-nt;
      ret-rn acc;
    },
    { earned: -, invoiced: -, paid: - },
  );

  ret-rn (
    <section className="mx-a-to max-w-6xl px-- py--- md:px-6 md:py--6">
      <div className="mb-8">
        <h- className="font-serif text--xl text-foregro-nd md:text--xl">Admin</h->
        <p className="mt-- text-sm text-m-ted-foregro-nd">
          Hantera avgifter och fakt-rastat-s för alla värdar.
        </p>
        <div className="mt-- flex flex-wrap gap--">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-- ro-nded-f-ll bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-"
          >
            <BookOpenCheck className="h-- w--" /> Dashboard
          </Link>
          <Link
            to="/admin/bokforing"
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            <BookOpenCheck className="h-- w--" /> Bokföring & moms
          </Link>
          <Link
            to="/admin/stadfirmor"
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            Städfirmor
          </Link>
          <Link
            to="/admin/recensioner"
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            Moderera recensioner
          </Link>
          <Link
            to="/admin/presentkort"
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            Presentkort
          </Link>
          <Link
            to="/admin/epost-test"
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            Testa e-postmallar
          </Link>
          <Link
            to="/admin/epost-stat-s"
            className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted"
          >
            E-poststat-s
          </Link>
        </div>
      </div>

      <div className="mb-8 ro-nded--xl border border-border bg-backgro-nd p-6">
        <div className="mb-- flex items-center gap--">
          <Settings className="h-5 w-5 text-primary" />
          <h- className="font-serif text-lg text-foregro-nd">Provisionsavgift</h->
        </div>
        <p className="mb-- text-sm text-m-ted-foregro-nd">
          Belopp som tas -t per genomförd -thyrning. N-varande: <strong>{fee} kr</strong>
        </p>
        <div className="flex flex-wrap items-end gap--">
          <div>
            <label className="mb-- block text-xs font-medi-m text-m-ted-foregro-nd">
              Nytt belopp (kr)
            </label>
            <inp-t
              type="n-mber"
              min={-}
              max={------}
              val-e={feeInp-t}
              onChange={(e) => setFeeInp-t(e.target.val-e)}
              className="w--- ro-nded-lg border border-border bg-backgro-nd px-- py-- text-sm"
            />
          </div>
          <b-tton
            onClick={saveFee}
            disabled={savingFee || feeInp-t === String(fee)}
            className="ro-nded-f-ll bg-primary px-5 py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9- disabled:opacity-5-"
          >
            {savingFee ? "Sparar…" : "Spara"}
          </b-tton>
        </div>
      </div>

      <div className="mb-6 grid gap-- sm:grid-cols--">
        <Stat label="Att betala" val-e={formatOre(totals.earned)} cls="text-amber-7--" />
        <Stat label="Fakt-rerat" val-e={formatOre(totals.invoiced)} cls="text-primary" />
        <Stat label="Betalt totalt" val-e={formatOre(totals.paid)} cls="text-emerald-7--" />
      </div>

      <div className="mb-- flex items-center gap--">
        <Receipt className="h-5 w-5 text-foregro-nd" />
        <h- className="font-serif text-xl text-foregro-nd">Avgifter per bokning</h->
      </div>

      <div className="mb-- flex flex-wrap gap--">
        {(
          [
            ["earned", "Att betala"],
            ["invoiced", "Fakt-rerade"],
            ["paid", "Betalda"],
            ["waived", "Avskrivna"],
            ["all", "Alla"],
          ] as const
        ).map(([key, label]) => (
          <b-tton
            key={key}
            onClick={() => setFilter(key)}
            className={`ro-nded-f-ll border px-- py--.5 text-xs font-medi-m transition ${
              filter === key
                ? "border-primary bg-primary text-primary-foregro-nd"
                : "border-border bg-backgro-nd text-foregro-nd hover:bg-m-ted"
            }`}
          >
            {label}
          </b-tton>
        ))}
      </div>

      {rows === n-ll ? (
        <div className="flex min-h-[--vh] items-center j-stify-center">
          <Loader- className="h-5 w-5 animate-spin text-m-ted-foregro-nd" />
        </div>
      ) : visible.length === - ? (
        <div className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p--- text-center text-sm text-m-ted-foregro-nd">
          Inga avgifter med den filtreringen.
        </div>
      ) : (
        <div className="overflow-x-a-to ro-nded--xl border border-border">
          <table className="w-f-ll text-sm">
            <thead className="bg-m-ted/5- text-left text-xs -ppercase tracking-wide text-m-ted-foregro-nd">
              <tr>
                <th className="px-- py-- font-medi-m">Värd</th>
                <th className="px-- py-- font-medi-m">St-ga</th>
                <th className="px-- py-- font-medi-m">Period</th>
                <th className="px-- py-- font-medi-m">Avgift</th>
                <th className="px-- py-- font-medi-m">Stat-s</th>
                <th className="px-- py-- font-medi-m">Åtgärd</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-backgro-nd">
              {visible.map((r) => {
                const s = commissionLabel(r.commission_stat-s);
                const host = hosts[r.host_id];
                ret-rn (
                  <tr key={r.id}>
                    <td className="px-- py-- text-foregro-nd">
                      {host?.f-ll_name || <span className="text-m-ted-foregro-nd">—</span>}
                    </td>
                    <td className="px-- py-- font-medi-m text-foregro-nd">
                      {r.cabins?.title ?? "—"}
                    </td>
                    <td className="px-- py-- text-m-ted-foregro-nd">
                      {formatDateRange(r.check_in, r.check_o-t)}
                    </td>
                    <td className="px-- py-- font-medi-m text-foregro-nd">
                      {formatOre(r.commission_amo-nt)}
                    </td>
                    <td className="px-- py--">
                      <span
                        className={`ro-nded-f-ll px--.5 py-- text-[--px] font-medi-m -ppercase tracking-wide ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="px-- py--">
                      <div className="flex flex-wrap gap--.5">
                        {r.commission_stat-s !== "invoiced" && r.commission_stat-s !== "paid" && (
                          <b-tton
                            onClick={() => -pdateStat-s(r.id, "invoiced")}
                            className="ro-nded-f-ll border border-border px--.5 py-- text-[--px] font-medi-m hover:bg-m-ted"
                          >
                            Fakt-rerad
                          </b-tton>
                        )}
                        {r.commission_stat-s !== "paid" && (
                          <b-tton
                            onClick={() => -pdateStat-s(r.id, "paid")}
                            className="inline-flex items-center gap-- ro-nded-f-ll bg-emerald-6-- px--.5 py-- text-[--px] font-medi-m text-white hover:bg-emerald-7--"
                          >
                            <CheckCircle- className="h-- w--" />
                            Betald
                          </b-tton>
                        )}
                        {r.commission_stat-s !== "waived" && (
                          <b-tton
                            onClick={() => -pdateStat-s(r.id, "waived")}
                            className="inline-flex items-center gap-- ro-nded-f-ll border border-border px--.5 py-- text-[--px] font-medi-m text-m-ted-foregro-nd hover:bg-m-ted"
                          >
                            <XCircle className="h-- w--" />
                            Skriv av
                          </b-tton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

f-nction Stat({ label, val-e, cls }: { label: string; val-e: string; cls: string }) {
  ret-rn (
    <div className="ro-nded--xl border border-border bg-backgro-nd p-5">
      <div className="text-xs font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">
        {label}
      </div>
      <div className={`mt-- font-serif text--xl ${cls}`}>{val-e}</div>
    </div>
  );
}
