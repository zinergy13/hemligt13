import { Link, useNavigate } from "@tanstack/react-router";
import { Mountain, Menu, X, User as UserIcon, LogOut, Home } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Hem" },
  { to: "/sok", label: "Sök stuga" },
  { to: "/hyr-ut", label: "Hyr ut" },
  { to: "/hur-det-funkar", label: "Hur det funkar" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Utloggad");
    setMenuOpen(false);
    navigate({ to: "/" });
  };

  const initials = (profile?.full_name || user?.email || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Mountain className="h-5 w-5" />
          </span>
          <span>Fjällmys</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {loading ? null : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-border bg-background py-1.5 pl-2 pr-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </span>
                <span className="max-w-[120px] truncate">{profile?.full_name || user.email}</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                    <Link
                      to="/konto"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted"
                    >
                      <UserIcon className="h-4 w-4" /> Mitt konto
                    </Link>
                    {profile?.is_host && (
                      <Link
                        to="/hyr-ut"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-muted"
                      >
                        <Home className="h-4 w-4" /> Mina uthyrningar
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 border-t border-border px-4 py-3 text-left text-sm text-foreground hover:bg-muted"
                    >
                      <LogOut className="h-4 w-4" /> Logga ut
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/logga-in"
                className="rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Logga in
              </Link>
              <Link
                to="/hyr-ut"
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-warm)] transition-transform hover:scale-[1.02]"
              >
                Hyr ut din stuga
              </Link>
            </>
          )}
        </div>

        <button
          aria-label="Meny"
          className="rounded-full p-2 text-foreground hover:bg-muted md:hidden"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3">
              {user ? (
                <>
                  <Link
                    to="/konto"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Mitt konto
                  </Link>
                  <button
                    onClick={() => { setOpen(false); handleSignOut(); }}
                    className="rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Logga ut
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/logga-in"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Logga in
                  </Link>
                  <Link
                    to="/hyr-ut"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground"
                  >
                    Hyr ut din stuga
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
