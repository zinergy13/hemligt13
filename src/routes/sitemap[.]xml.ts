import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { regions, areas } from "@/data/areas";

const BASE_URL = "https://fjallportalen.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/sok", changefreq: "daily", priority: "0.9" },
          { path: "/hur-det-funkar", changefreq: "monthly", priority: "0.6" },
          { path: "/hyr-ut", changefreq: "monthly", priority: "0.7" },
          { path: "/om-oss", changefreq: "monthly", priority: "0.5" },
          { path: "/kontakt", changefreq: "monthly", priority: "0.5" },
          { path: "/listor", changefreq: "weekly", priority: "0.6" },
          { path: "/logga-in", changefreq: "yearly", priority: "0.3" },
          ...regions.map((r) => ({
            path: `/region/${r.slug}`,
            changefreq: "weekly" as const,
            priority: "0.85",
          })),
          ...areas.map((a) => ({
            path: `/omrade/${a.slug}`,
            changefreq: "weekly" as const,
            priority: "0.8",
          })),
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});