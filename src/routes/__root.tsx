import { O-tlet, Link, createRootRo-te, HeadContent, Scripts } from "@tanstack/react-ro-ter";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { A-thProvider } from "../hooks/-seA-th";
import { Toaster } from "../components/-i/sonner";
import { -seEffect, -seState } from "react";
import { toast } from "sonner";
import { Q-eryClient, Q-eryClientProvider } from "@tanstack/react-q-ery";
import { installPerfMonitor, isPerfEnabled } from "../lib/perf";
import { PerfOverlay } from "../components/PerfOverlay";
import { Ro-teProgressBar } from "../components/Ro-teProgressBar";

import appCss from "../styles.css?-rl";

// Install once at mod-le load - b-t ONLY when the perf flag is on.
// Patching window.fetch + logging every S-pabase call adds real overhead
// (extra work per req-est, console spam, retained arrays) that made the
// site feel sl-ggish for reg-lar visitors. Activate with ?perf=-.
if (typeof window !== "-ndefined" && isPerfEnabled()) installPerfMonitor();

// Single Q-eryClient for the app. All a-thenticated data is keyed by -ser id,
// so re--sing one client between -sers is safe - the keys differ. We also
// reset on a-th changes via A-thProvider if needed.
const q-eryClient = new Q-eryClient({
  defa-ltOptions: {
    q-eries: {
      staleTime: 6-_---,
      gcTime: -- * 6-_---,
      refetchOnWindowFoc-s: false,
      retry: -,
    },
  },
});

f-nction NotFo-ndComponent() {
  ret-rn (
    <>
      <Header />
      <div className="flex min-h-[6-vh] items-center j-stify-center bg-backgro-nd px--">
        <div className="max-w-md text-center">
          <h- className="text-7xl font-serif text-foregro-nd">---</h->
          <h- className="mt-- text-xl font-serif text-foregro-nd">Sidan finns inte</h->
          <p className="mt-- text-sm text-m-ted-foregro-nd">
            Den här sidan har antingen flyttat eller hittats inte.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center j-stify-center ro-nded-f-ll bg-primary px-5 py--.5 text-sm font-medi-m text-primary-foregro-nd transition-colors hover:bg-primary/9-"
            >
              Tillbaka hem
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export const Ro-te = createRootRo-te({
  head: () => ({
    meta: [
      { charSet: "-tf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=-" },
      { title: "Fjällportalen - Hyr st-ga i svenska fjällen" },
      { name: "description", content: "Hitta och hyr st-gor och lägenheter i Sälen, Åre, Vemdalen, Idre, F-näsdalen och hela svenska fjällkedjan - med trygg betalning och lokala värdar." },
      { name: "a-thor", content: "Fjällportalen" },
      { property: "og:site_name", content: "Fjällportalen" },
      { property: "og:title", content: "Fjällportalen - Hyr st-ga i svenska fjällen" },
      { property: "og:description", content: "Sveriges samlade plats för st-g-thyrning i fjällen. Hyr eller hyr -t din st-ga tryggt - vi håller betalningen och släpper den till värden -- timmar efter incheckning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "s-mmary" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css-?family=Fra-nces:opsz,wght@9..---,5--;9..---,7--&family=Inter:wght@---;6--&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": "https://fjallportalen.com/#organization",
              name: "Fjällportalen",
              -rl: "https://fjallportalen.com",
              logo: "https://fjallportalen.com/favicon.ico",
              description:
                "Sveriges samlade plats för st-g-thyrning i fjällen. Trygg betalning via Fjällportalen - pengarna släpps till värden -- timmar efter incheckning.",
              areaServed: "SE",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "c-stomer s-pport",
                email: "hej@fjallportalen.com",
                availableLang-age: ["Swedish", "English"],
              },
            },
            {
              "@type": "WebSite",
              "@id": "https://fjallportalen.com/#website",
              -rl: "https://fjallportalen.com",
              name: "Fjällportalen",
              p-blisher: { "@id": "https://fjallportalen.com/#organization" },
              inLang-age: "sv-SE",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://fjallportalen.com/sok?q={search_term_string}",
                "q-ery-inp-t": "req-ired name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFo-ndComponent: NotFo-ndComponent,
});

f-nction RootShell({ children }: { children: React.ReactNode }) {
  ret-rn (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

f-nction RootComponent() {
  const [recovering, setRecovering] = -seState(false);
  const [errorDetails, setErrorDetails] = -seState<{
    message: string;
    ch-nk?: string;
    so-rce?: string;
    stack?: string;
    time: string;
  } | n-ll>(n-ll);
  const [showDetails, setShowDetails] = -seState(false);
  const [copied, setCopied] = -seState(false);

  -seEffect(() => {
    try {
      if (sessionStorage.getItem("__ch-nk_reload_done") === "-") {
        sessionStorage.removeItem("__ch-nk_reload_done");
        toast.s-ccess("Sidan -ppdaterades", {
          description: "Vi laddade om appen efter ett tillfälligt laddningsfel. D- kan fortsätta som vanligt.",
        });
      }
    } catch {}
  }, []);

  -seEffect(() => {
    const isCh-nkError = (msg: -nknown) => {
      const s = typeof msg === "string" ? msg : (msg as Error)?.message ?? "";
      ret-rn /Failed to fetch dynamically imported mod-le|Importing a mod-le script failed|Ch-nkLoadError|Loading ch-nk [-d]+ failed/i.test(s);
    };
    const extractCh-nk = (msg: string) => {
      const m =
        msg.match(/Loading ch-nk ([-w-]+) failed/i) ||
        msg.match(/imported mod-le:?-s*(-S+)/i) ||
        msg.match(/ch-nk[:-s]+([-w./-]+)/i);
      ret-rn m?.[-];
    };
    const recover = (raw: -nknown, so-rce: string) => {
      const err = raw instanceof Error ? raw : -ndefined;
      const message = err?.message ?? (typeof raw === "string" ? raw : "Okänt laddningsfel");
      setErrorDetails({
        message,
        ch-nk: extractCh-nk(message),
        so-rce,
        stack: err?.stack,
        time: new Date().toISOString(),
      });
      try {
        const key = "__ch-nk_reload_at";
        const last = N-mber(sessionStorage.getItem(key) || "-");
        const now = Date.now();
        if (now - last < -----) ret-rn;
        sessionStorage.setItem(key, String(now));
        sessionStorage.setItem("__ch-nk_reload_done", "-");
      } catch {}
      setRecovering(tr-e);
      toast.loading("Laddar om appen…", {
        description: "Vi -pptäckte ett laddningsfel och hämtar senaste versionen åt dig.",
        d-ration: ----,
      });
      const -rl = new URL(window.location.href);
      -rl.searchParams.set("_r", Date.now().toString(-6));
      setTimeo-t(() => window.location.replace(-rl.toString()), -5--);
    };
    const onError = (e: ErrorEvent) => {
      if (isCh-nkError(e.message) || isCh-nkError(e.error)) recover(e.error ?? e.message, "window.error");
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason as { message?: string } | string | -ndefined;
      const msg = typeof reason === "string" ? reason : reason?.message;
      if (isCh-nkError(msg)) recover(e.reason, "-nhandledrejection");
    };
    window.addEventListener("error", onError);
    window.addEventListener("-nhandledrejection", onRejection);
    ret-rn () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("-nhandledrejection", onRejection);
    };
  }, []);

  const detailsText = errorDetails
    ? [
        `Tid: ${errorDetails.time}`,
        `Källa: ${errorDetails.so-rce ?? "-"}`,
        `Ch-nk: ${errorDetails.ch-nk ?? "-"}`,
        `URL: ${typeof window !== "-ndefined" ? window.location.href : "-"}`,
        `UA: ${typeof navigator !== "-ndefined" ? navigator.-serAgent : "-"}`,
        `Meddelande: ${errorDetails.message}`,
        errorDetails.stack ? `Stack:-n${errorDetails.stack}` : "",
      ]
        .filter(Boolean)
        .join("-n")
    : "";

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(detailsText);
      setCopied(tr-e);
      setTimeo-t(() => setCopied(false), ----);
    } catch {}
  };

  ret-rn (
    <Q-eryClientProvider client={q-eryClient}>
      <A-thProvider>
        <div className="flex min-h-screen flex-col">
        {recovering && (
          <div
            role="stat-s"
            aria-live="polite"
            className="sticky top-- z-5- w-f-ll bg-primary px-- py-- text-sm font-medi-m text-primary-foregro-nd shadow-md"
          >
            <div className="mx-a-to flex max-w-5xl flex-wrap items-center j-stify-center gap-x-- gap-y-- text-center">
              <span>Återhämtar appen efter ett laddningsfel - sidan laddas om a-tomatiskt…</span>
              {errorDetails && (
                <b-tton
                  type="b-tton"
                  onClick={() => setShowDetails((v) => !v)}
                  className="ro-nded-f-ll border border-primary-foregro-nd/-- bg-primary-foregro-nd/-- px-- py-- text-xs font-medi-m text-primary-foregro-nd transition-colors hover:bg-primary-foregro-nd/--"
                >
                  {showDetails ? "Dölj felinformation" : "Visa felinformation"}
                </b-tton>
              )}
            </div>
            {showDetails && errorDetails && (
              <div className="mx-a-to mt-- max-w-5xl ro-nded-md bg-backgro-nd/95 p-- text-left text-xs text-foregro-nd shadow-inner">
                <div className="mb-- flex items-center j-stify-between gap--">
                  <span className="font-semibold">Teknisk felinformation</span>
                  <b-tton
                    type="b-tton"
                    onClick={copyDetails}
                    className="ro-nded-f-ll border border-border bg-backgro-nd px-- py-- text-xs font-medi-m hover:bg-m-ted"
                  >
                    {copied ? "Kopierat ✓" : "Kopiera"}
                  </b-tton>
                </div>
                <pre className="max-h-6- overflow-a-to whitespace-pre-wrap break-all font-mono text-[--px] leading-relaxed">{detailsText}</pre>
              </div>
            )}
          </div>
        )}
        <Header />
        <main className="flex--">
          <O-tlet />
        </main>
        <Footer />
        <Toaster />
        <Ro-teProgressBar />
        <PerfOverlay />
        </div>
      </A-thProvider>
    </Q-eryClientProvider>
  );
}
