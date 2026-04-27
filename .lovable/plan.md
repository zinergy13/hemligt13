# Stuga i Sälen — Plan för MVP

En samlad plattform där stugägare i Sälenfjällen (Lindvallen, Tandådalen, Kläppen, Stöten, Hundfjället, Högfjället, Gubbmyren, Sälfjällstorget m.fl.) kan hyra ut sina boenden, och gäster kan söka, boka och betala på ett ställe.

## Vision & känsla

Mysig fjällkänsla — varma jordtoner (mörkröd, varmt trä, kritvit snö), generösa bilder av stugor och fjällmiljö, rundade kort, lugn typografi. Känns lokalt och äkta — inte generiskt internationellt.

## Användarroller

Ett konto = både gäst och värd. När du loggar in kan du växla mellan att söka boende och att administrera dina egna stugor. Admin tillkommer i nästa steg.

## Sidor & flöden (v1)

**Publika sidor**
- **Startsida** — hero med sökfält (område, datum, antal gäster), populära områden som klickbara kort, "Hyr ut din stuga"-CTA, värdeförslag, footer.
- **Sökresultat** — split-vy: interaktiv karta (med pins per boende) till höger, lista med boendekort till vänster. Filter: område, datum, antal bäddar, pris, ski-in/ski-out, husdjur tillåtna, bastu, WiFi.
- **Områdessidor** — `/omrade/lindvallen`, `/omrade/tandadalen`, `/omrade/kläppen`, `/omrade/stoten`, `/omrade/hundfjallet`, `/omrade/hogfjallet`, `/omrade/gubbmyren`, `/omrade/salfjallstorget`. Varje med beskrivning, karta och boenden.
- **Boendesida** — bildgalleri, beskrivning, karta, faciliteter, bäddkarta, kalender med priser, husregler, värdpresentation, recensioner, bokningsruta med totalpris inkl. extratjänster.
- **Om oss / Hur det funkar / Värd-info / Kontakt**

**Inloggade sidor**
- **Mina sidor** — översikt av kommande resor och aktiva annonser.
- **Värddashboard** — lista över egna stugor, intäkter, kommande gäster.
- **Lägg till / redigera boende** — guidad flerstegsformulär (grunddata → läge & område → bilder → faciliteter → priser & tillgänglighet → regler → publicera).
- **Bokningar** — gästens bokningar och värdens inkommande bokningar med status (förfrågan, bekräftad, betald, avslutad).
- **Meddelanden** — chatt mellan gäst och värd kopplad till en bokning/förfrågan.
- **Profil & inställningar** — kontaktuppgifter, utbetalningsuppgifter (för värdar).

**Bokningsflöde**
1. Gäst väljer datum & gäster på boendesidan → ser totalpris.
2. Lägger till extratjänster (städning, sänglinne, skiduthyrning, liftkort, transfer från flygplats/station, ved, frukostkorg).
3. Granska & betala med kort.
4. Bekräftelse via e-post + bokning syns på Mina sidor.
5. Värden får notis och bokningen läggs i kalendern (datum blockeras automatiskt).

## Karta & områden

Karta byggs med MapLibre/Leaflet (OpenStreetMap). Varje boende har koordinater. Klustring vid utzoomning, popup vid klick på pin med miniatyrbild, pris och länk till boendesidan. Områdesfilter zoomar och filtrerar pins.

## Betalning & extratjänster

Betalning sker direkt vid bokning. Värden får utbetalning efter incheckning. Extratjänster väljs i bokningen och läggs till totalpriset. Plattformsavgift dras från värdens utbetalning.

För betalningar behöver vi välja leverantör — jag rekommenderar att vi kör Lovables inbyggda Stripe-integration eftersom den passar tjänster + uthyrning, hanterar svenska kort/Klarna/Swish, och du kan välja om Stripe ska sköta moms/skatt eller om du gör det själv. Vi sätter upp det när vi kommer till bokningssteget.

## Recensioner

Efter avslutad vistelse kan både gäst och värd lämna betyg (1–5) och kommentar. Visas på boendesidan och värdprofilen.

## Föreslagen byggordning

**Steg 1 – Fundament & design**
Designsystem (färger, typografi, komponenter), startsida, områdessidor (statiska först), header/footer, navigation.

**Steg 2 – Konto & profil**
Registrering/inloggning (e-post + Google), profil, värd/gäst-växling, "Mina sidor" skal.

**Steg 3 – Boenden (utan bokning)**
Databas för stugor, "Lägg till boende"-flöde med bilduppladdning, boendesida, sökresultat med lista + filter.

**Steg 4 – Karta**
MapLibre-karta med pins, klustring, popups, koppling till sökfilter.

**Steg 5 – Bokning utan betalning**
Kalender, tillgänglighet, bokningsförfrågan, värd godkänner/avvisar, statusflöde, e-postnotiser.

**Steg 6 – Betalning**
Stripe-integration, checkout, utbetalningar till värdar, plattformsavgift.

**Steg 7 – Extratjänster**
Värd lägger till tillval på sin stuga, gäst väljer i bokningen, totalpris uppdateras.

**Steg 8 – Meddelanden & recensioner**
Chatt mellan gäst och värd, recensionsflöde efter avslutad vistelse.

**Steg 9 – Polish**
Mobiloptimering, SEO per områdessida, prestanda, e-postmallar, hjälpsidor.

## Teknisk översikt (för referens)

- TanStack Start (React 19, SSR) — separata routes per områdessida för bra SEO.
- Lovable Cloud för databas, autentisering, fillagring (bilder), serverlogik.
- MapLibre GL JS + OpenStreetMap för karta (gratis, ingen API-nyckel).
- Stripe via Lovables inbyggda payments för betalning + utbetalningar.
- Resend eller liknande för transaktionsmejl.

## Vad som börjar byggas direkt efter godkännande

Steg 1 + 2: designsystem, startsida med hero & områdeskort, områdessidor, header/footer, samt konto med inloggning och en första version av "Mina sidor". Då har vi en körbar grund att fylla med stugor i nästa steg.
