import { Link } from "@tanstack/react-router";
import { Mountain } from "lucide-react";
import { regions, areasByRegion } from "@/data/areas";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-serif text-xl font-semibold">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Mountain className="h-5 w-5" />
              </span>
              <span>Fjällportalen</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-secondary-foreground/75">
              Svenska fjällens samlade plats för stuguthyrning. Från Sälen till Åre - med trygg betalning och lokala värdar.
            </p>
          </div>

          {regions.map((r) => (
            <div key={r.slug}>
              <h4 className="mb-4 font-serif text-base">
                <Link
                  to="/region/$slug"
                  params={{ slug: r.slug }}
                  className="hover:text-secondary-foreground"
                >
                  {r.name}
                </Link>
              </h4>
              <ul className="space-y-2 text-sm">
                {areasByRegion(r.slug).map((a) => (
                  <li key={a.slug}>
                    <Link
                      to="/omrade/$slug"
                      params={{ slug: a.slug }}
                      className="text-secondary-foreground/75 hover:text-secondary-foreground"
                    >
                      {a.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-4 font-serif text-base">Fjällportalen</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/sok" className="text-secondary-foreground/75 hover:text-secondary-foreground">Sök stuga</Link></li>
              <li><Link to="/hur-det-funkar" className="text-secondary-foreground/75 hover:text-secondary-foreground">Hur det funkar</Link></li>
              <li><Link to="/hyr-ut" className="text-secondary-foreground/75 hover:text-secondary-foreground">Hyr ut din stuga</Link></li>
              <li><Link to="/favoriter" className="text-secondary-foreground/75 hover:text-secondary-foreground">Mina favoriter</Link></li>
              <li><Link to="/om-oss" className="text-secondary-foreground/75 hover:text-secondary-foreground">Om oss</Link></li>
              <li><Link to="/kontakt" className="text-secondary-foreground/75 hover:text-secondary-foreground">Hjälp & support</Link></li>
              <li><Link to="/logga-in" className="text-secondary-foreground/75 hover:text-secondary-foreground">Logga in</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-secondary-foreground/15 pt-6 text-xs text-secondary-foreground/60 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Fjällportalen. Alla rättigheter förbehållna.</p>
          <p>Sälen · Idre · Grövelsjön · Vemdalen · Funäsdalen · Ramundberget · Lofsdalen · Åre · Duved · Storlien</p>
        </div>
      </div>
    </footer>
  );
}