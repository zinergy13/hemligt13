import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AuthProvider } from "../hooks/useAuth";
import { Toaster } from "../components/ui/sonner";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <>
      <Header />
      <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-serif text-foreground">404</h1>
          <h2 className="mt-4 text-xl font-serif text-foreground">Sidan finns inte</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Den här sidan har antingen flyttat eller hittats inte.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Fjällmys — Hyr stuga i Sälenfjällen" },
      { name: "description", content: "Hitta och hyr stugor, lägenheter och ski-in/ski-out-boenden i Lindvallen, Tandådalen, Kläppen, Stöten och hela Sälenfjällen — direkt från värd till gäst." },
      { name: "author", content: "Fjällmys" },
      { property: "og:title", content: "Fjällmys — Hyr stuga i Sälenfjällen" },
      { property: "og:description", content: "Sälens samlade plats för stuguthyrning. Hyr eller hyr ut din stuga, direkt och tryggt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
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

function RootComponent() {
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("__chunk_reload_done") === "1") {
        sessionStorage.removeItem("__chunk_reload_done");
        toast.success("Sidan uppdaterades", {
          description: "Vi laddade om appen efter ett tillfälligt laddningsfel. Du kan fortsätta som vanligt.",
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    const isChunkError = (msg: unknown) => {
      const s = typeof msg === "string" ? msg : (msg as Error)?.message ?? "";
      return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk [\d]+ failed/i.test(s);
    };
    const recover = () => {
      try {
        const key = "__chunk_reload_at";
        const last = Number(sessionStorage.getItem(key) || "0");
        const now = Date.now();
        if (now - last < 10000) return;
        sessionStorage.setItem(key, String(now));
        sessionStorage.setItem("__chunk_reload_done", "1");
      } catch {}
      setRecovering(true);
      toast.loading("Laddar om appen…", {
        description: "Vi upptäckte ett laddningsfel och hämtar senaste versionen åt dig.",
        duration: 4000,
      });
      const url = new URL(window.location.href);
      url.searchParams.set("_r", Date.now().toString(36));
      setTimeout(() => window.location.replace(url.toString()), 600);
    };
    const onError = (e: ErrorEvent) => {
      if (isChunkError(e.message) || isChunkError(e.error)) recover();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason as { message?: string } | string | undefined;
      const msg = typeof reason === "string" ? reason : reason?.message;
      if (isChunkError(msg)) recover();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col">
        {recovering && (
          <div
            role="status"
            aria-live="polite"
            className="sticky top-0 z-50 w-full bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground shadow-md"
          >
            Återhämtar appen efter ett laddningsfel — sidan laddas om automatiskt…
          </div>
        )}
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <Toaster />
      </div>
    </AuthProvider>
  );
}
