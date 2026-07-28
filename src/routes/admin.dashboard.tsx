import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldAlert, ArrowLeft, Users, Home, Coins, CalendarDays, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { areas } from "@/data/areas";
import { formatDateRange } from "@/lib/bookings";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard - Admin - Fjällportalen" }, { name: "robots", content: "noindex" }] }),
  component: AdminDashboard,
});

type Booking = {
  id: string;
  check_in: string;
  check_out: string;
  status: string;
  nights: number;
  total_price: number;
  nightly_total: number;
  commission_amount: number;
  commission_status: string;
  created_at: string;
  guest_id: string;
  host_id: string;
  cabin_id: string;
};

type Cabin = { id: string; title: string; area_slug: string; host_id: string };
type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address_line: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  personal_number: string | null;
  is_host: boolean | null;
};

const areaName = (slug: string) => areas.find((a) => a.slug === slug)?.name ?? slug;
const areaRegion = (slug: string) => areas.find((a) => a.slug === slug)?.region ?? "";
const fmt = (kr: number) => `${kr.toLocaleString("sv-SE")} kr`;

function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [cabins, setCabins] = useState<Record<string, Cabin>>({});
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [tab, setTab] = useState<"overview" | "bookings" | "guests" | "hosts">("overview");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/logga-in", search: { redirect: "/admin/dashboard" } });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data: bks } = await supabase
        .from("bookings")
        .select("id, check_in, check_out, status, nights, total_price, nightly_total, commission_amount, commission_status, created_at, guest_id, host_id, cabin_id")
        .order("created_at", { ascending: false });
      const bs = (bks as Booking[]) ?? [];
      setBookings(bs);

      const cabinIds = Array.from(new Set(bs.map((b) => b.cabin_id).filter(Boolean)));
      const [{ data: cs }, { data: ps }] = await Promise.all([
        cabinIds.length
          ? supabase.from("cabins").select("id, title, area_slug, host_id").in("id", cabinIds)
          : Promise.resolve({ data: [] as Cabin[] }),
        supabase.rpc("admin_list_profiles"),
      ]);

      const cmap: Record<string, Cabin> = {};
      (cs as Cabin[] | null)?.forEach((c) => (cmap[c.id] = c));
      setCabins(cmap);
      const pmap: Record<string, Profile> = {};
      (ps as Profile[] | null)?.forEach((p) => (pmap[p.id] = p));
      setProfiles(pmap);
    })();
  }, [isAdmin]);

  const kpis = useMemo(() => {
    const bs = bookings ?? [];
    const active = bs.filter((b) => ["confirmed", "completed"].includes(b.status));
    const gmv = active.reduce((s, b) => s + (b.total_price || 0), 0);
    const commissionEarned = bs
      .filter((b) => ["earned", "invoiced", "paid"].includes(b.commission_status))
      .reduce((s, b) => s + (b.commission_amount || 0), 0) / 100;
    const commissionPaid = bs
      .filter((b) => b.commission_status === "paid")
      .reduce((s, b) => s + (b.commission_amount || 0), 0) / 100;
    const commissionOutstanding = bs
      .filter((b) => ["earned", "invoiced"].includes(b.commission_status))
      .reduce((s, b) => s + (b.commission_amount || 0), 0) / 100;
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = bs.filter((b) => b.status === "confirmed" && b.check_in >= today).length;
    const nights = active.reduce((s, b) => s + (b.nights || 0), 0);
    return {
      totalBookings: bs.length,
      confirmed: bs.filter((b) => b.status === "confirmed").length,
      pending: bs.filter((b) => b.status === "pending").length,
      cancelled: bs.filter((b) => ["cancelled", "declined"].includes(b.status)).length,
      gmv,
      commissionEarned,
      commissionPaid,
      commissionOutstanding,
      upcoming,
      nights,
    };
  }, [bookings]);

  const guests = useMemo(() => {
    const map = new Map<string, { id: string; count: number; spend: number; areas: Set<string>; last: string }>();
    (bookings ?? []).forEach((b) => {
      if (!["confirmed", "completed", "pending"].includes(b.status)) return;
      const e = map.get(b.guest_id) ?? { id: b.guest_id, count: 0, spend: 0, areas: new Set(), last: b.check_in };
      e.count += 1;
      e.spend += b.total_price || 0;
      const c = cabins[b.cabin_id];
      if (c?.area_slug) e.areas.add(c.area_slug);
      if (b.check_in > e.last) e.last = b.check_in;
      map.set(b.guest_id, e);
    });
    return Array.from(map.values()).sort((a, b) => b.spend - a.spend);
  }, [bookings, cabins]);

  const hosts = useMemo(() => {
    const map = new Map<string, { id: string; count: number; gross: number; commission: number; areas: Set<string>; last: string }>();
    (bookings ?? []).forEach((b) => {
      const e = map.get(b.host_id) ?? { id: b.host_id, count: 0, gross: 0, commission: 0, areas: new Set(), last: b.check_in };
      if (["confirmed", "completed"].includes(b.status)) {
        e.count += 1;
        e.gross += b.total_price || 0;
      }
      if (["earned", "invoiced", "paid"].includes(b.commission_status)) {
        e.commission += (b.commission_amount || 0) / 100;
      }
      const c = cabins[b.cabin_id];
      if (c?.area_slug) e.areas.add(c.area_slug);
      if (b.check_in > e.last) e.last = b.check_in;
      map.set(b.host_id, e);
    });
    return Array.from(map.values()).sort((a, b) => b.gross - a.gross);
  }, [bookings, cabins]);

  if (loading || !user) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="font-serif text-3xl text-foreground">Endast för admin</h1>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">Till startsidan</Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link to="/admin" className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Admin
          </Link>
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Överblick över bokningar, intäkter, gäster och värdar.</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<CalendarDays className="h-4 w-4" />} label="Bokningar totalt" value={kpis.totalBookings.toString()} sub={`${kpis.confirmed} bekräftade · ${kpis.pending} väntar · ${kpis.cancelled} avbokade`} />
        <Kpi icon={<Coins className="h-4 w-4" />} label="GMV (bruttoomsättning)" value={fmt(kpis.gmv)} sub={`${kpis.nights} nätter sålda`} />
        <Kpi icon={<Coins className="h-4 w-4 text-primary" />} label="Provision intjänad" value={fmt(kpis.commissionEarned)} sub={`Utestående: ${fmt(kpis.commissionOutstanding)}`} />
        <Kpi icon={<CalendarDays className="h-4 w-4" />} label="Kommande bokningar" value={kpis.upcoming.toString()} sub="Bekräftade check-in ≥ idag" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2 border-b border-border">
        {([
          ["overview", "Översikt"],
          ["bookings", "Alla bokningar"],
          ["guests", `Gäster (${guests.length})`],
          ["hosts", `Värdar (${hosts.length})`],
        ] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </div>

      {bookings === null ? (
        <div className="flex min-h-[30vh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : tab === "overview" ? (
        <OverviewPanel bookings={bookings} cabins={cabins} />
      ) : tab === "bookings" ? (
        <BookingsTable bookings={bookings} cabins={cabins} profiles={profiles} />
      ) : tab === "guests" ? (
        <PeopleTable
          filename="gaster.csv"
          rows={guests.map((g) => ({
            id: g.id,
            profile: profiles[g.id],
            count: g.count, amount: g.spend, areas: Array.from(g.areas), last: g.last,
          }))}
          amountLabel="Totalt spenderat" icon={<Users className="h-4 w-4" />} emptyText="Inga gäster ännu." />
      ) : (
        <PeopleTable
          filename="vardar.csv"
          rows={hosts.map((h) => ({
            id: h.id,
            profile: profiles[h.id],
            count: h.count, amount: h.gross, areas: Array.from(h.areas), last: h.last,
            extra: `Provision: ${fmt(h.commission)}`,
          }))}
          amountLabel="Bruttoomsättning" icon={<Home className="h-4 w-4" />} emptyText="Inga värdar med bokningar ännu." />
      )}
    </section>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-2 font-serif text-2xl text-foreground">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function OverviewPanel({ bookings, cabins }: { bookings: Booking[]; cabins: Record<string, Cabin> }) {
  const byArea = useMemo(() => {
    const map = new Map<string, { bookings: number; revenue: number }>();
    bookings.forEach((b) => {
      const c = cabins[b.cabin_id];
      if (!c?.area_slug) return;
      if (!["confirmed", "completed"].includes(b.status)) return;
      const e = map.get(c.area_slug) ?? { bookings: 0, revenue: 0 };
      e.bookings += 1;
      e.revenue += b.total_price || 0;
      map.set(c.area_slug, e);
    });
    return Array.from(map.entries()).map(([slug, v]) => ({ slug, ...v })).sort((a, b) => b.revenue - a.revenue);
  }, [bookings, cabins]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-background p-6">
        <h3 className="mb-4 font-serif text-lg text-foreground">Populäraste områden</h3>
        {byArea.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ingen data ännu.</p>
        ) : (
          <ul className="divide-y divide-border">
            {byArea.slice(0, 12).map((a) => (
              <li key={a.slug} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="font-medium text-foreground">{areaName(a.slug)}</div>
                  <div className="text-xs text-muted-foreground capitalize">{areaRegion(a.slug)}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-foreground">{fmt(a.revenue)}</div>
                  <div className="text-xs text-muted-foreground">{a.bookings} bokningar</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-background p-6">
        <h3 className="mb-4 font-serif text-lg text-foreground">Senaste bokningarna</h3>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga bokningar ännu.</p>
        ) : (
          <ul className="divide-y divide-border">
            {bookings.slice(0, 8).map((b) => (
              <li key={b.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <div className="font-medium text-foreground">{cabins[b.cabin_id]?.title ?? "-"}</div>
                  <div className="text-xs text-muted-foreground">{formatDateRange(b.check_in, b.check_out)} · {b.status}</div>
                </div>
                <div className="font-medium text-foreground">{fmt(b.total_price)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function BookingsTable({ bookings, cabins, profiles }: { bookings: Booking[]; cabins: Record<string, Cabin>; profiles: Record<string, Profile> }) {
  if (bookings.length === 0) return <Empty text="Inga bokningar ännu." />;
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Skapad</th>
            <th className="px-4 py-3 font-medium">Stuga</th>
            <th className="px-4 py-3 font-medium">Område</th>
            <th className="px-4 py-3 font-medium">Gäst</th>
            <th className="px-4 py-3 font-medium">Värd</th>
            <th className="px-4 py-3 font-medium">Period</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Summa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {bookings.map((b) => {
            const c = cabins[b.cabin_id];
            return (
              <tr key={b.id}>
                <td className="px-4 py-3 text-muted-foreground">{new Date(b.created_at).toLocaleDateString("sv-SE")}</td>
                <td className="px-4 py-3 font-medium text-foreground">{c?.title ?? "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c ? areaName(c.area_slug) : "-"}</td>
                <td className="px-4 py-3 text-foreground">{profiles[b.guest_id]?.full_name ?? "-"}</td>
                <td className="px-4 py-3 text-foreground">{profiles[b.host_id]?.full_name ?? "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDateRange(b.check_in, b.check_out)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-foreground">{b.status}</span></td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(b.total_price)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

type PeopleRow = { id: string; profile?: Profile; count: number; amount: number; areas: string[]; last: string; extra?: string };
function PeopleTable({ rows, amountLabel, icon, emptyText, filename }: { rows: PeopleRow[]; amountLabel: string; icon: React.ReactNode; emptyText: string; filename: string }) {
  if (rows.length === 0) return <Empty text={emptyText} />;

  const exportCsv = () => {
    const header = ["Namn","E-post","Telefon","Personnummer","Adress","Postnummer","Ort","Land","Bokningar",amountLabel,"Områden","Senast"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(";")];
    rows.forEach((r) => {
      const p = r.profile;
      lines.push([
        p?.full_name ?? "",
        p?.email ?? "",
        p?.phone ?? "",
        p?.personal_number ?? "",
        p?.address_line ?? "",
        p?.postal_code ?? "",
        p?.city ?? "",
        p?.country ?? "",
        r.count,
        r.amount,
        r.areas.map(areaName).join(" | "),
        r.last,
      ].map(escape).join(";"));
    });
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          <Download className="h-4 w-4" /> Exportera CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium"><span className="inline-flex items-center gap-1.5">{icon} Namn</span></th>
            <th className="px-4 py-3 font-medium">Kontakt</th>
            <th className="px-4 py-3 font-medium">Adress</th>
            <th className="px-4 py-3 font-medium">Områden</th>
            <th className="px-4 py-3 font-medium text-right">Bokningar</th>
            <th className="px-4 py-3 font-medium text-right">{amountLabel}</th>
            <th className="px-4 py-3 font-medium">Senast</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {rows.map((r) => {
            const p = r.profile;
            const addr = [p?.address_line, [p?.postal_code, p?.city].filter(Boolean).join(" "), p?.country].filter(Boolean).join(", ");
            return (
            <tr key={r.id}>
              <td className="px-4 py-3 font-medium text-foreground">
                {p?.full_name || "-"}
                {p?.personal_number && <div className="text-xs font-normal text-muted-foreground">{p.personal_number}</div>}
                {r.extra && <div className="text-xs font-normal text-muted-foreground">{r.extra}</div>}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <div>{p?.email || "-"}</div>
                <div className="text-xs">{p?.phone || "-"}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{addr || "-"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {r.areas.length === 0 ? <span className="text-muted-foreground">-</span> : r.areas.map((s) => (
                    <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">{areaName(s)}</span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-right text-foreground">{r.count}</td>
              <td className="px-4 py-3 text-right font-medium text-foreground">{fmt(r.amount)}</td>
              <td className="px-4 py-3 text-muted-foreground">{r.last}</td>
            </tr>
          );})}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-border bg-muted/30 p-10 text-center text-sm text-muted-foreground">{text}</div>;
}