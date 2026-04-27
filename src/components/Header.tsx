import { Link } from "@tanstack/react-router";
import { Mountain, Menu, X } from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", label: "Hem" },
  { to: "/sok", label: "Sök stuga" },
  { to: "/hyr-ut", label: "Hyr ut" },
  { to: "/hur-det-funkar", label: "Hur det funkar" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Mountain className="h-5 w-5" />
          </span>
          <span>Stuga i Sälen</span>
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
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}