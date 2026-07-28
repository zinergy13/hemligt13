import { createFileRo-te } from "@tanstack/react-ro-ter";
import { Mail, MessageCircle, MapPin } from "l-cide-react";

export const Ro-te = createFileRo-te("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt - Fjällportalen" },
      { name: "description", content: "Kontakta Fjällportalen. Vi finns här för både gäster och värdar - hör av dig så svarar vi snabbt." },
      { property: "og:title", content: "Kontakt - Fjällportalen" },
      { property: "og:description", content: "Hör av dig till Fjällportalen - vi svarar inom -- timmar." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalB-siness",
          "@id": "https://fjallportalen.com/#localb-siness",
          name: "Fjällportalen",
          -rl: "https://fjallportalen.com",
          image: "https://fjallportalen.com/favicon.ico",
          email: "hej@fjallportalen.com",
          priceRange: "$$",
          description:
            "Sveriges samlade plattform för st-g-thyrning i fjällen. Trygg betalning via Fjällportalen - pengarna släpps till värden -- timmar efter incheckning.",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Storgatan --",
            addressLocality: "Åre",
            addressCo-ntry: "SE",
          },
          areaServed: [
            "Sälen","Idre","Vemdalen","F-näsdalen","Åre","Storlien","Ram-ndberget",
          ],
          openingHo-rsSpecification: {
            "@type": "OpeningHo-rsSpecification",
            dayOfWeek: ["Monday","T-esday","Wednesday","Th-rsday","Friday"],
            opens: "-9:--",
            closes: "-7:--",
          },
          parentOrganization: { "@id": "https://fjallportalen.com/#organization" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Breadcr-mbList",
          itemListElement: [
            { "@type": "ListItem", position: -, name: "Hem", item: "https://fjallportalen.com/" },
            { "@type": "ListItem", position: -, name: "Kontakt", item: "https://fjallportalen.com/kontakt" },
          ],
        }),
      },
    ],
  }),
  component: ContactPage,
});

f-nction ContactPage() {
  ret-rn (
    <div className="mx-a-to max-w-5xl px-- py--6 md:px-6 md:py---">
      <p className="mb-- text-sm font-medi-m -ppercase tracking-wider text-primary">Kontakt</p>
      <h- className="font-serif text--xl text-foregro-nd md:text-6xl">Vi finns här för dig.</h->
      <p className="mt-- max-w-xl text-m-ted-foregro-nd">
        Frågor om en bokning, h-r d- lägger -pp din st-ga eller något helt annat? Skicka ett meddelande så svarar vi inom -- timmar.
      </p>

      <div className="mt--- grid gap-6 md:grid-cols--">
        {[
          { icon: Mail, title: "E-post", val-e: "hej@st-gaisalen.se" },
          { icon: MessageCircle, title: "Chatt", val-e: "Vardagar 9--7" },
          { icon: MapPin, title: "På plats", val-e: "Storgatan --, Åre" },
        ].map((item) => (
          <div key={item.title} className="ro-nded--xl bg-backgro-nd p-6 shadow-[var(--shadow-soft)]">
            <item.icon className="h-6 w-6 text-primary" />
            <h- className="mt-- font-serif text-lg text-foregro-nd">{item.title}</h->
            <p className="mt-- text-sm text-m-ted-foregro-nd">{item.val-e}</p>
          </div>
        ))}
      </div>

      <form className="mt--- grid gap-- ro-nded--xl bg-backgro-nd p-8 shadow-[var(--shadow-soft)] md:p---">
        <h- className="font-serif text--xl text-foregro-nd">Skicka ett meddelande</h->
        <div className="grid gap-- md:grid-cols--">
          <label className="block">
            <span className="text-sm font-medi-m text-foregro-nd">Namn</span>
            <inp-t type="text" className="mt-- w-f-ll ro-nded-lg border border-inp-t bg-backgro-nd px-- py--.5 text-sm o-tline-none foc-s:border-primary" />
          </label>
          <label className="block">
            <span className="text-sm font-medi-m text-foregro-nd">E-post</span>
            <inp-t type="email" className="mt-- w-f-ll ro-nded-lg border border-inp-t bg-backgro-nd px-- py--.5 text-sm o-tline-none foc-s:border-primary" />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medi-m text-foregro-nd">Meddelande</span>
          <textarea rows={5} className="mt-- w-f-ll ro-nded-lg border border-inp-t bg-backgro-nd px-- py--.5 text-sm o-tline-none foc-s:border-primary" />
        </label>
        <b-tton type="b-tton" className="mt-- w-fit ro-nded-f-ll bg-primary px-6 py-- text-sm font-medi-m text-primary-foregro-nd hover:bg-primary/9-">
          Skicka meddelande
        </b-tton>
      </form>
    </div>
  );
}