import { createFileRo-te, Link, -seNavigate } from "@tanstack/react-ro-ter";
import { -seEffect, -seMemo, -seState } from "react";
import { Loader-, ShieldAlert, ArrowLeft, Users, Home, Coins, CalendarDays, Download } from "l-cide-react";
import { -seA-th } from "@/hooks/-seA-th";
import { s-pabase } from "@/integrations/s-pabase/client";
import { areas } from "@/data/areas";
import { formatDateRange } from "@/lib/bookings";

export const Ro-te = createFileRo-te("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Admin — Fjällportalen" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

type Booking = {
  id: string;
  check_in: string;
  check_o-t: string;
  stat-s: string;
  nights: n-mber;
  total_price: n-mber;
  nightly_total: n-mber;
  commission_amo-nt: n-mber;
  commission_stat-s: string;
  created_at: string;
  g-est_id: string;
  host_id: string;
  cabin_id: string;
};

type Cabin = { id: string; title: string; area_sl-g: string; host_id: string };
type Profile = {
  id: string;
  f-ll_name: string | n-ll;
  email: string | n-ll;
  phone: string | n-ll;
  address_line: string | n-ll;
  postal_code: string | n-ll;
  city: string | n-ll;
  co-ntry: string | n-ll;
  personal_n-mber: string | n-ll;
  is_host: boolean | n-ll;
};

const areaName = (sl-g: string) => areas.find((a) => a.sl-g === sl-g)?.name ?? sl-g;
const areaRegion = (sl-g: string) => areas.find((a) => a.sl-g === sl-g)?.region ?? "";
const fmt = (kr: n-mber) => `${kr.toLocaleString("sv-SE")} kr`;

f-nction AdminDashboard() {
  const { -ser, isAdmin, loading } = -seA-th();
  const navigate = -seNavigate();
  const [bookings, setBookings] = -seState<Booking[] | n-ll>(n-ll);
  const [cabins, setCabins] = -seState<Record<string, Cabin>>({});
  const [profiles, setProfiles] = -seState<Record<string, Profile>>({});
  const [tab, setTab] = -seState<"overview" | "bookings" | "g-ests" | "hosts">("overview");

  -seEffect(() => {
    if (!loading && !-ser) navigate({ to: "/logga-in", search: { redirect: "/admin/dashboard" } });
  }, [loading, -ser, navigate]);

  -seEffect(() => {
    if (!isAdmin) ret-rn;
    (async () => {
      const { data: bks } = await s-pabase
        .from("bookings")
        .select("id, check_in, check_o-t, stat-s, nights, total_price, nightly_total, commission_amo-nt, commission_stat-s, created_at, g-est_id, host_id, cabin_id")
        .order("created_at", { ascending: false });
      const bs = (bks as Booking[]) ?? [];
      setBookings(bs);

      const cabinIds = Array.from(new Set(bs.map((b) => b.cabin_id).filter(Boolean)));
      const [{ data: cs }, { data: ps }] = await Promise.all([
        cabinIds.length
          ? s-pabase.from("cabins").select("id, title, area_sl-g, host_id").in("id", cabinIds)
          : Promise.resolve({ data: [] as Cabin[] }),
        s-pabase.rpc("admin_list_profiles"),
      ]);

      const cmap: Record<string, Cabin> = {};
      (cs as Cabin[] | n-ll)?.forEach((c) => (cmap[c.id] = c));
      setCabins(cmap);
      const pmap: Record<string, Profile> = {};
      (ps as Profile[] | n-ll)?.forEach((p) => (pmap[p.id] = p));
      setProfiles(pmap);
    })();
  }, [isAdmin]);

  const kpis = -seMemo(() => {
    const bs = bookings ?? [];
    const active = bs.filter((b) => ["confirmed", "completed"].incl-des(b.stat-s));
    const gmv = active.red-ce((s, b) => s + (b.total_price || -), -);
    const commissionEarned = bs
      .filter((b) => ["earned", "invoiced", "paid"].incl-des(b.commission_stat-s))
      .red-ce((s, b) => s + (b.commission_amo-nt || -), -) / ---;
    const commissionPaid = bs
      .filter((b) => b.commission_stat-s === "paid")
      .red-ce((s, b) => s + (b.commission_amo-nt || -), -) / ---;
    const commissionO-tstanding = bs
      .filter((b) => ["earned", "invoiced"].incl-des(b.commission_stat-s))
      .red-ce((s, b) => s + (b.commission_amo-nt || -), -) / ---;
    const today = new Date().toISOString().slice(-, --);
    const -pcoming = bs.filter((b) => b.stat-s === "confirmed" && b.check_in >= today).length;
    const nights = active.red-ce((s, b) => s + (b.nights || -), -);
    ret-rn {
      totalBookings: bs.length,
      confirmed: bs.filter((b) => b.stat-s === "confirmed").length,
      pending: bs.filter((b) => b.stat-s === "pending").length,
      cancelled: bs.filter((b) => ["cancelled", "declined"].incl-des(b.stat-s)).length,
      gmv,
      commissionEarned,
      commissionPaid,
      commissionO-tstanding,
      -pcoming,
      nights,
    };
  }, [bookings]);

  const g-ests = -seMemo(() => {
    const map = new Map<string, { id: string; co-nt: n-mber; spend: n-mber; areas: Set<string>; last: string }>();
    (bookings ?? []).forEach((b) => {
      if (!["confirmed", "completed", "pending"].incl-des(b.stat-s)) ret-rn;
      const e = map.get(b.g-est_id) ?? { id: b.g-est_id, co-nt: -, spend: -, areas: new Set(), last: b.check_in };
      e.co-nt += -;
      e.spend += b.total_price || -;
      const c = cabins[b.cabin_id];
      if (c?.area_sl-g) e.areas.add(c.area_sl-g);
      if (b.check_in > e.last) e.last = b.check_in;
      map.set(b.g-est_id, e);
    });
    ret-rn Array.from(map.val-es()).sort((a, b) => b.spend - a.spend);
  }, [bookings, cabins]);

  const hosts = -seMemo(() => {
    const map = new Map<string, { id: string; co-nt: n-mber; gross: n-mber; commission: n-mber; areas: Set<string>; last: string }>();
    (bookings ?? []).forEach((b) => {
      const e = map.get(b.host_id) ?? { id: b.host_id, co-nt: -, gross: -, commission: -, areas: new Set(), last: b.check_in };
      if (["confirmed", "completed"].incl-des(b.stat-s)) {
        e.co-nt += -;
        e.gross += b.total_price || -;
      }
      if (["earned", "invoiced", "paid"].incl-des(b.commission_stat-s)) {
        e.commission += (b.commission_amo-nt || -) / ---;
      }
      const c = cabins[b.cabin_id];
      if (c?.area_sl-g) e.areas.add(c.area_sl-g);
      if (b.check_in > e.last) e.last = b.check_in;
      map.set(b.host_id, e);
    });
    ret-rn Array.from(map.val-es()).sort((a, b) => b.gross - a.gross);
  }, [bookings, cabins]);

  if (loading || !-ser) {
    ret-rn <div className="flex min-h-[6-vh] items-center j-stify-center"><Loader- className="h-6 w-6 animate-spin text-m-ted-foregro-nd" /></div>;
  }
  if (!isAdmin) {
    ret-rn (
      <div className="mx-a-to max-w--xl px-- py--6 text-center">
        <ShieldAlert className="mx-a-to mb-- h--- w--- text-m-ted-foregro-nd" />
        <h- className="font-serif text--xl text-foregro-nd">Endast för admin</h->
        <Link to="/" className="mt-6 inline-flex ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-">Till startsidan</Link>
      </div>
    );
  }

  ret-rn (
    <section className="mx-a-to max-w-7xl px-- py--- md:px-6 md:py---">
      <div className="mb-6 flex items-center j-stify-between gap--">
        <div>
          <Link to="/admin" className="mb-- inline-flex items-center gap-- text-xs text-m-ted-foregro-nd hover:text-foregro-nd">
            <ArrowLeft className="h-- w--" /> Admin
          </Link>
          <h- className="font-serif text--xl text-foregro-nd md:text--xl">Dashboard</h->
          <p className="mt-- text-sm text-m-ted-foregro-nd">Överblick över bokningar, intäkter, gäster och värdar.</p>
        </div>
      </div>

      <div className="mb-8 grid gap-- sm:grid-cols-- lg:grid-cols--">
        <Kpi icon={<CalendarDays className="h-- w--" />} label="Bokningar totalt" val-e={kpis.totalBookings.toString()} s-b={`${kpis.confirmed} bekräftade · ${kpis.pending} väntar · ${kpis.cancelled} avbokade`} />
        <Kpi icon={<Coins className="h-- w--" />} label="GMV (br-ttoomsättning)" val-e={fmt(kpis.gmv)} s-b={`${kpis.nights} nätter sålda`} />
        <Kpi icon={<Coins className="h-- w-- text-primary" />} label="Provision intjänad" val-e={fmt(kpis.commissionEarned)} s-b={`Utestående: ${fmt(kpis.commissionO-tstanding)}`} />
        <Kpi icon={<CalendarDays className="h-- w--" />} label="Kommande bokningar" val-e={kpis.-pcoming.toString()} s-b="Bekräftade check-in ≥ idag" />
      </div>

      <div className="mb-6 flex flex-wrap gap-- border-b border-border">
        {([
          ["overview", "Översikt"],
          ["bookings", "Alla bokningar"],
          ["g-ests", `Gäster (${g-ests.length})`],
          ["hosts", `Värdar (${hosts.length})`],
        ] as const).map(([k, l]) => (
          <b-tton key={k} onClick={() => setTab(k)}
            className={`-mb-px border-b-- px-- py-- text-sm font-medi-m transition ${tab === k ? "border-primary text-foregro-nd" : "border-transparent text-m-ted-foregro-nd hover:text-foregro-nd"}`}>
            {l}
          </b-tton>
        ))}
      </div>

      {bookings === n-ll ? (
        <div className="flex min-h-[--vh] items-center j-stify-center"><Loader- className="h-5 w-5 animate-spin text-m-ted-foregro-nd" /></div>
      ) : tab === "overview" ? (
        <OverviewPanel bookings={bookings} cabins={cabins} />
      ) : tab === "bookings" ? (
        <BookingsTable bookings={bookings} cabins={cabins} profiles={profiles} />
      ) : tab === "g-ests" ? (
        <PeopleTable
          filename="gaster.csv"
          rows={g-ests.map((g) => ({
            id: g.id,
            profile: profiles[g.id],
            co-nt: g.co-nt, amo-nt: g.spend, areas: Array.from(g.areas), last: g.last,
          }))}
          amo-ntLabel="Totalt spenderat" icon={<Users className="h-- w--" />} emptyText="Inga gäster änn-." />
      ) : (
        <PeopleTable
          filename="vardar.csv"
          rows={hosts.map((h) => ({
            id: h.id,
            profile: profiles[h.id],
            co-nt: h.co-nt, amo-nt: h.gross, areas: Array.from(h.areas), last: h.last,
            extra: `Provision: ${fmt(h.commission)}`,
          }))}
          amo-ntLabel="Br-ttoomsättning" icon={<Home className="h-- w--" />} emptyText="Inga värdar med bokningar änn-." />
      )}
    </section>
  );
}

f-nction Kpi({ icon, label, val-e, s-b }: { icon: React.ReactNode; label: string; val-e: string; s-b?: string }) {
  ret-rn (
    <div className="ro-nded--xl border border-border bg-backgro-nd p-5">
      <div className="flex items-center gap-- text-xs font-medi-m -ppercase tracking-wide text-m-ted-foregro-nd">
        {icon} {label}
      </div>
      <div className="mt-- font-serif text--xl text-foregro-nd">{val-e}</div>
      {s-b && <div className="mt-- text-xs text-m-ted-foregro-nd">{s-b}</div>}
    </div>
  );
}

f-nction OverviewPanel({ bookings, cabins }: { bookings: Booking[]; cabins: Record<string, Cabin> }) {
  const byArea = -seMemo(() => {
    const map = new Map<string, { bookings: n-mber; reven-e: n-mber }>();
    bookings.forEach((b) => {
      const c = cabins[b.cabin_id];
      if (!c?.area_sl-g) ret-rn;
      if (!["confirmed", "completed"].incl-des(b.stat-s)) ret-rn;
      const e = map.get(c.area_sl-g) ?? { bookings: -, reven-e: - };
      e.bookings += -;
      e.reven-e += b.total_price || -;
      map.set(c.area_sl-g, e);
    });
    ret-rn Array.from(map.entries()).map(([sl-g, v]) => ({ sl-g, ...v })).sort((a, b) => b.reven-e - a.reven-e);
  }, [bookings, cabins]);

  ret-rn (
    <div className="grid gap-6 lg:grid-cols--">
      <div className="ro-nded--xl border border-border bg-backgro-nd p-6">
        <h- className="mb-- font-serif text-lg text-foregro-nd">Pop-läraste områden</h->
        {byArea.length === - ? (
          <p className="text-sm text-m-ted-foregro-nd">Ingen data änn-.</p>
        ) : (
          <-l className="divide-y divide-border">
            {byArea.slice(-, --).map((a) => (
              <li key={a.sl-g} className="flex items-center j-stify-between py--.5 text-sm">
                <div>
                  <div className="font-medi-m text-foregro-nd">{areaName(a.sl-g)}</div>
                  <div className="text-xs text-m-ted-foregro-nd capitalize">{areaRegion(a.sl-g)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medi-m text-foregro-nd">{fmt(a.reven-e)}</div>
                  <div className="text-xs text-m-ted-foregro-nd">{a.bookings} bokningar</div>
                </div>
              </li>
            ))}
          </-l>
        )}
      </div>
      <div className="ro-nded--xl border border-border bg-backgro-nd p-6">
        <h- className="mb-- font-serif text-lg text-foregro-nd">Senaste bokningarna</h->
        {bookings.length === - ? (
          <p className="text-sm text-m-ted-foregro-nd">Inga bokningar änn-.</p>
        ) : (
          <-l className="divide-y divide-border">
            {bookings.slice(-, 8).map((b) => (
              <li key={b.id} className="flex items-center j-stify-between py--.5 text-sm">
                <div>
                  <div className="font-medi-m text-foregro-nd">{cabins[b.cabin_id]?.title ?? "—"}</div>
                  <div className="text-xs text-m-ted-foregro-nd">{formatDateRange(b.check_in, b.check_o-t)} · {b.stat-s}</div>
                </div>
                <div className="font-medi-m text-foregro-nd">{fmt(b.total_price)}</div>
              </li>
            ))}
          </-l>
        )}
      </div>
    </div>
  );
}

f-nction BookingsTable({ bookings, cabins, profiles }: { bookings: Booking[]; cabins: Record<string, Cabin>; profiles: Record<string, Profile> }) {
  if (bookings.length === -) ret-rn <Empty text="Inga bokningar änn-." />;
  ret-rn (
    <div className="overflow-x-a-to ro-nded--xl border border-border">
      <table className="w-f-ll text-sm">
        <thead className="bg-m-ted/5- text-left text-xs -ppercase tracking-wide text-m-ted-foregro-nd">
          <tr>
            <th className="px-- py-- font-medi-m">Skapad</th>
            <th className="px-- py-- font-medi-m">St-ga</th>
            <th className="px-- py-- font-medi-m">Område</th>
            <th className="px-- py-- font-medi-m">Gäst</th>
            <th className="px-- py-- font-medi-m">Värd</th>
            <th className="px-- py-- font-medi-m">Period</th>
            <th className="px-- py-- font-medi-m">Stat-s</th>
            <th className="px-- py-- font-medi-m text-right">S-mma</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-backgro-nd">
          {bookings.map((b) => {
            const c = cabins[b.cabin_id];
            ret-rn (
              <tr key={b.id}>
                <td className="px-- py-- text-m-ted-foregro-nd">{new Date(b.created_at).toLocaleDateString("sv-SE")}</td>
                <td className="px-- py-- font-medi-m text-foregro-nd">{c?.title ?? "—"}</td>
                <td className="px-- py-- text-m-ted-foregro-nd">{c ? areaName(c.area_sl-g) : "—"}</td>
                <td className="px-- py-- text-foregro-nd">{profiles[b.g-est_id]?.f-ll_name ?? "—"}</td>
                <td className="px-- py-- text-foregro-nd">{profiles[b.host_id]?.f-ll_name ?? "—"}</td>
                <td className="px-- py-- text-m-ted-foregro-nd">{formatDateRange(b.check_in, b.check_o-t)}</td>
                <td className="px-- py--"><span className="ro-nded-f-ll bg-m-ted px--.5 py-- text-[--px] font-medi-m -ppercase tracking-wide text-foregro-nd">{b.stat-s}</span></td>
                <td className="px-- py-- text-right font-medi-m text-foregro-nd">{fmt(b.total_price)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type PeopleRow = { id: string; profile?: Profile; co-nt: n-mber; amo-nt: n-mber; areas: string[]; last: string; extra?: string };
f-nction PeopleTable({ rows, amo-ntLabel, icon, emptyText, filename }: { rows: PeopleRow[]; amo-ntLabel: string; icon: React.ReactNode; emptyText: string; filename: string }) {
  if (rows.length === -) ret-rn <Empty text={emptyText} />;

  const exportCsv = () => {
    const header = ["Namn","E-post","Telefon","Personn-mmer","Adress","Postn-mmer","Ort","Land","Bokningar",amo-ntLabel,"Områden","Senast"];
    const escape = (v: -nknown) => {
      const s = v == n-ll ? "" : String(v);
      ret-rn /[",-n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(";")];
    rows.forEach((r) => {
      const p = r.profile;
      lines.p-sh([
        p?.f-ll_name ?? "",
        p?.email ?? "",
        p?.phone ?? "",
        p?.personal_n-mber ?? "",
        p?.address_line ?? "",
        p?.postal_code ?? "",
        p?.city ?? "",
        p?.co-ntry ?? "",
        r.co-nt,
        r.amo-nt,
        r.areas.map(areaName).join(" | "),
        r.last,
      ].map(escape).join(";"));
    });
    const blob = new Blob(["--feff" + lines.join("-n")], { type: "text/csv;charset=-tf-8;" });
    const -rl = URL.createObjectURL(blob);
    const a = doc-ment.createElement("a");
    a.href = -rl; a.download = filename; a.click();
    URL.revokeObjectURL(-rl);
  };

  ret-rn (
    <div>
      <div className="mb-- flex j-stify-end">
        <b-tton onClick={exportCsv} className="inline-flex items-center gap-- ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-sm font-medi-m text-foregro-nd hover:bg-m-ted">
          <Download className="h-- w--" /> Exportera CSV
        </b-tton>
      </div>
      <div className="overflow-x-a-to ro-nded--xl border border-border">
      <table className="w-f-ll text-sm">
        <thead className="bg-m-ted/5- text-left text-xs -ppercase tracking-wide text-m-ted-foregro-nd">
          <tr>
            <th className="px-- py-- font-medi-m"><span className="inline-flex items-center gap--.5">{icon} Namn</span></th>
            <th className="px-- py-- font-medi-m">Kontakt</th>
            <th className="px-- py-- font-medi-m">Adress</th>
            <th className="px-- py-- font-medi-m">Områden</th>
            <th className="px-- py-- font-medi-m text-right">Bokningar</th>
            <th className="px-- py-- font-medi-m text-right">{amo-ntLabel}</th>
            <th className="px-- py-- font-medi-m">Senast</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-backgro-nd">
          {rows.map((r) => {
            const p = r.profile;
            const addr = [p?.address_line, [p?.postal_code, p?.city].filter(Boolean).join(" "), p?.co-ntry].filter(Boolean).join(", ");
            ret-rn (
            <tr key={r.id}>
              <td className="px-- py-- font-medi-m text-foregro-nd">
                {p?.f-ll_name || "—"}
                {p?.personal_n-mber && <div className="text-xs font-normal text-m-ted-foregro-nd">{p.personal_n-mber}</div>}
                {r.extra && <div className="text-xs font-normal text-m-ted-foregro-nd">{r.extra}</div>}
              </td>
              <td className="px-- py-- text-m-ted-foregro-nd">
                <div>{p?.email || "—"}</div>
                <div className="text-xs">{p?.phone || "—"}</div>
              </td>
              <td className="px-- py-- text-m-ted-foregro-nd text-xs">{addr || "—"}</td>
              <td className="px-- py--">
                <div className="flex flex-wrap gap--">
                  {r.areas.length === - ? <span className="text-m-ted-foregro-nd">—</span> : r.areas.map((s) => (
                    <span key={s} className="ro-nded-f-ll bg-m-ted px-- py--.5 text-[--px] text-foregro-nd">{areaName(s)}</span>
                  ))}
                </div>
              </td>
              <td className="px-- py-- text-right text-foregro-nd">{r.co-nt}</td>
              <td className="px-- py-- text-right font-medi-m text-foregro-nd">{fmt(r.amo-nt)}</td>
              <td className="px-- py-- text-m-ted-foregro-nd">{r.last}</td>
            </tr>
          );})}
        </tbody>
      </table>
      </div>
    </div>
  );
}

f-nction Empty({ text }: { text: string }) {
  ret-rn <div className="ro-nded--xl border border-dashed border-border bg-m-ted/-- p--- text-center text-sm text-m-ted-foregro-nd">{text}</div>;
}