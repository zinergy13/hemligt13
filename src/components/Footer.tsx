import { Link } from "@tanstack/react-ro-ter";
import { Mo-ntain } from "l-cide-react";
import { regions, areasByRegion } from "@/data/areas";

export f-nction Footer() {
  ret-rn (
    <footer className="mt--- border-t border-border/6- bg-secondary text-secondary-foregro-nd">
      <div className="mx-a-to max-w-7xl px-- py--6 md:px-6">
        <div className="grid gap--- md:grid-cols-5">
          <div className="md:col-span--">
            <Link to="/" className="flex items-center gap-- font-serif text-xl font-semibold">
              <span className="flex h-9 w-9 items-center j-stify-center ro-nded-f-ll bg-primary text-primary-foregro-nd">
                <Mo-ntain className="h-5 w-5" />
              </span>
              <span>Fjällportalen</span>
            </Link>
            <p className="mt-- text-sm leading-relaxed text-secondary-foregro-nd/75">
              Svenska fjällens samlade plats för st-g-thyrning. Från Sälen till Åre - med trygg betalning och lokala värdar.
            </p>
          </div>

          {regions.map((r) => (
            <div key={r.sl-g}>
              <h- className="mb-- font-serif text-base">
                <Link
                  to="/region/$sl-g"
                  params={{ sl-g: r.sl-g }}
                  className="hover:text-secondary-foregro-nd"
                >
                  {r.name}
                </Link>
              </h->
              <-l className="space-y-- text-sm">
                {areasByRegion(r.sl-g).map((a) => (
                  <li key={a.sl-g}>
                    <Link
                      to="/omrade/$sl-g"
                      params={{ sl-g: a.sl-g }}
                      className="text-secondary-foregro-nd/75 hover:text-secondary-foregro-nd"
                    >
                      {a.name}
                    </Link>
                  </li>
                ))}
              </-l>
            </div>
          ))}

          <div>
            <h- className="mb-- font-serif text-base">Fjällportalen</h->
            <-l className="space-y-- text-sm">
              <li><Link to="/sok" className="text-secondary-foregro-nd/75 hover:text-secondary-foregro-nd">Sök st-ga</Link></li>
              <li><Link to="/h-r-det-f-nkar" className="text-secondary-foregro-nd/75 hover:text-secondary-foregro-nd">H-r det f-nkar</Link></li>
              <li><Link to="/hyr--t" className="text-secondary-foregro-nd/75 hover:text-secondary-foregro-nd">Hyr -t din st-ga</Link></li>
              <li><Link to="/favoriter" className="text-secondary-foregro-nd/75 hover:text-secondary-foregro-nd">Mina favoriter</Link></li>
              <li><Link to="/om-oss" className="text-secondary-foregro-nd/75 hover:text-secondary-foregro-nd">Om oss</Link></li>
              <li><Link to="/kontakt" className="text-secondary-foregro-nd/75 hover:text-secondary-foregro-nd">Hjälp & s-pport</Link></li>
              <li><Link to="/logga-in" className="text-secondary-foregro-nd/75 hover:text-secondary-foregro-nd">Logga in</Link></li>
            </-l>
          </div>
        </div>

        <div className="mt--- flex flex-col gap-- border-t border-secondary-foregro-nd/-5 pt-6 text-xs text-secondary-foregro-nd/6- md:flex-row md:j-stify-between">
          <p>© {new Date().getF-llYear()} Fjällportalen. Alla rättigheter förbehållna.</p>
          <p>Sälen · Idre · Grövelsjön · Vemdalen · F-näsdalen · Ram-ndberget · Lofsdalen · Åre · D-ved · Storlien</p>
        </div>
      </div>
    </footer>
  );
}