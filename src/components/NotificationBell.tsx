import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Notif = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationBell() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("notifications" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (active && data) setItems(data as unknown as Notif[]);
    })();

    const channel = supabase
      .channel("notif-" + user.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => setItems((prev) => [payload.new as Notif, ...prev].slice(0, 20)),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const unread = items.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    const ids = items.filter((n) => !n.read_at).map((n) => n.id);
    setItems((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read_at: new Date().toISOString() } : n)));
    await supabase.from("notifications" as any).update({ read_at: new Date().toISOString() }).in("id", ids);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) markAllRead();
        }}
        aria-label="Notiser"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-background shadow-lg">
            <div className="border-b border-border px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Notiser
            </div>
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">Inga notiser ännu.</p>
            ) : (
              <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
                {items.map((n) => {
                  const content = (
                    <div>
                      <div className="text-sm font-medium text-foreground">{n.title}</div>
                      {n.body && <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</div>}
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {new Date(n.created_at).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id} className={n.read_at ? "" : "bg-primary/5"}>
                      {n.link ? (
                        <Link to={n.link as any} onClick={() => setOpen(false)} className="block px-4 py-3 hover:bg-muted">
                          {content}
                        </Link>
                      ) : (
                        <div className="px-4 py-3">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}