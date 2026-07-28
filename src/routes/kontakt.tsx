import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, MapPin } from "lucide-react";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — Fjällportalen" },
      { name: "description", content: "Kontakta Fjällportalen. Vi finns här för både gäster och värdar — hör av dig så svarar vi snabbt." },
      { property: "og:title", content: "Kontakt — Fjällportalen" },
      { property: "og:description", content: "Hör av dig till Fjällportalen — vi svarar inom 24 timmar." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "@id": "https://fjallportalen.com/#localbusiness",
          name: "Fjällportalen",
          url: "https://fjallportalen.com",
          image: "https://fjallportalen.com/favicon.ico",
          email: "hej@fjallportalen.com",
          priceRange: "$$",
          description:
            "Sveriges samlade plattform för stuguthyrning i fjällen. Trygg betalning via Fjällportalen — pengarna släpps till värden 24 timmar efter incheckning.",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Storgatan 12",
            addressLocality: "Åre",
            addressCountry: "SE",
          },
          areaServed: [
            "Sälen","Idre","Vemdalen","Funäsdalen","Åre","Storlien","Ramundberget",
          ],
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"],
            opens: "09:00",
            closes: "17:00",
          },
          parentOrganization: { "@id": "https://fjallportalen.com/#organization" },
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
      <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Kontakt</p>
      <h1 className="font-serif text-4xl text-foreground md:text-6xl">Vi finns här för dig.</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Frågor om en bokning, hur du lägger upp din stuga eller något helt annat? Skicka ett meddelande så svarar vi inom 24 timmar.
      </p>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {[
          { icon: Mail, title: "E-post", value: "hej@stugaisalen.se" },
          { icon: MessageCircle, title: "Chatt", value: "Vardagar 9–17" },
          { icon: MapPin, title: "På plats", value: "Storgatan 12, Åre" },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl bg-background p-6 shadow-[var(--shadow-soft)]">
            <item.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-4 font-serif text-lg text-foreground">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      <form className="mt-12 grid gap-4 rounded-3xl bg-background p-8 shadow-[var(--shadow-soft)] md:p-10">
        <h2 className="font-serif text-2xl text-foreground">Skicka ett meddelande</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-foreground">Namn</span>
            <input type="text" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-foreground">E-post</span>
            <input type="email" className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Meddelande</span>
          <textarea rows={5} className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </label>
        <button type="button" className="mt-2 w-fit rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Skicka meddelande
        </button>
      </form>
    </div>
  );
}