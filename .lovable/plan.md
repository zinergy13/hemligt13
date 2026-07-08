## Sverige-expansion — full ompositionering

Idag: Fjällmys, 9 områden i Sälen. Efter: nytt varumärke som samlar Dalafjällen, Härjedalen och Jämtland, med kartförst-navigation och unika bilder per område.

---

### 1. Nytt namn — 3 förslag

Jag föreslår ett namn och två alternativ. Alla är korta, uttalbara, .se-vänliga och passar hela svenska fjällkedjan utan att låsa oss vid en region:

**Huvudförslag: "Fjällhuset"**
- Klingar hem, värme, kollektiv — som "stugbyn" på svenska, fast digitalt
- Fungerar från Sälen till Riksgränsen
- Kan användas verbalt: "hittade den på Fjällhuset"

**Alternativ A: "Nordfjäll"**
- Mer geografiskt/redaktionellt, känns lite större och seriösare
- Bra om ni vill växa mot Norge/Lappland senare

**Alternativ B: "Stugmarken"**
- Lekfullt, svenskt, syftar på både bokningsmarknad och fjällmark
- Mer marketplace-känsla, mindre "boutique"

Jag bygger med **Fjällhuset** som default (kan bytas i ett svep — namnet ligger i `Header`, `Footer`, alla `head()`-meta och en handfull ställen i copy). Säg till om ni vill ha A eller B istället.

---

### 2. Områden som läggs till

**Dalafjällen** (tillägg till befintliga Sälen-områden)
- Idre Fjäll
- Grövelsjön

**Härjedalen** (nytt)
- Vemdalen
- Funäsdalen
- Ramundberget
- Bruksvallarna
- Lofsdalen

**Jämtland** (nytt)
- Åre
- Duved
- Storlien
- Bydalen
- Trillevallen

Totalt: 9 befintliga Sälen-områden + 12 nya = 21 områden, grupperade i 3 regioner.

---

### 3. Datastruktur

Utökar `src/data/areas.ts`:
- Ny `Region` typ: `"dalafjallen" | "harjedalen" | "jamtland"`
- Varje `Area` får `region: Region` och `regionName` (för UI)
- Ny `regions` export: metadata per region (namn, tagline, beskrivning, hero-bild, ungefärlig position för karta)
- `AreaSlug` utökas med alla nya slugs
- `estimatedListings` sätts konservativt för nya områden (10–40)

Databasen påverkas inte — `cabins.area_slug` är redan en string, nya slugs funkar direkt. Sälen-stugor fortsätter fungera oförändrat.

---

### 4. Kartförst-navigation

Ny komponent: `src/components/SwedenMap.tsx`
- SVG-karta över norra Sverige (handtecknad stil, matchar warm/serif-estetiken — inte OpenStreetMap)
- Tre klickbara regionszoner: Dalafjällen (SV), Härjedalen (mitt), Jämtland (N)
- Hover: regionen lyfts, tagline visas
- Klick: navigerar till `/region/$slug`
- Under kartan: horisontell scroll-rad med "populära områden" som fallback för mobil

**Startsidan** (`src/routes/index.tsx`):
- Hero → sökbar → **karta som primär ingång** (ersätter dagens 4-kolumns områdesrutnät)
- Behåller "Varför Fjällmys" (döps om) och host CTA

**Ny route:** `src/routes/region.$slug.tsx`
- Regionshero + beskrivning
- Grid med områden i regionen
- Egen SEO (title, description, og:image = regionshero)

**Befintlig route:** `src/routes/omrade.$slug.tsx` — oförändrad, funkar för alla 21 områden

**Header/Footer:**
- Header: navigation grupperas per region (dropdown eller mega-menu på desktop)
- Footer: 3 kolumner istället för en lång lista

---

### 5. Bildgenerering

Använder `imagegen--generate_image` (standard-kvalitet, konsekvent stil med befintliga Sälen-bilder — varm belysning, snötäckta fjäll, mysig fjällarkitektur).

**12 nya områdesbilder** → `src/assets/area-{slug}.jpg`
**3 regionsheros** → `src/assets/region-{slug}.jpg` (bredare, mer episka)

Kör i parallella batcher (3–4 åt gången) för att inte överbelasta.

---

### 6. Copy & SEO

- Alla `head()` i befintliga routes uppdateras: "Sälen" → "svenska fjällen" / "hela fjällkedjan"
- Homepage-hero: ny H1 ("Hitta din stuga i fjällen"), ny sub ("Från Sälen till Åre — Sveriges samlade plats där värd möter gäst")
- `hyr-ut`, `hur-det-funkar`, `om-oss`, `sok`, `kontakt` — copy-svep för att ta bort Sälen-specifika formuleringar
- Ny region-route får egen SEO per region
- `Footer` områdes-lista blir grupperad per region

---

### Tekniska ändringar (för din utvecklare / referens)

```text
NYA FILER
  src/routes/region.$slug.tsx        // regionsöversikt
  src/components/SwedenMap.tsx        // SVG-karta med 3 regionszoner
  src/data/regions.ts                 // region-metadata (eller inline i areas.ts)
  src/assets/area-idre.jpg + 11 fler
  src/assets/region-dalafjallen.jpg + 2 fler

ÄNDRADE FILER
  src/data/areas.ts                   // + Region typ, + 12 areas, + region-fält
  src/routes/index.tsx                // hero-copy, byt grid mot SwedenMap
  src/routes/__root.tsx               // meta: nytt appnamn
  src/components/Header.tsx           // logo-namn, region-nav
  src/components/Footer.tsx           // logo-namn, grupperad områdeslista
  src/routes/hyr-ut.tsx               // copy-svep
  src/routes/hur-det-funkar.tsx       // copy-svep
  src/routes/om-oss.tsx               // copy-svep
  src/routes/sok.tsx                  // copy-svep + region-filter
  src/routes/kontakt.tsx              // copy-svep
  src/routes/omrade.$slug.tsx         // visa region-breadcrumb
```

Ingen databasändring. Ingen ändring av bokningsflöde, saldo, värddashboard eller PerfOverlay.

---

### Ordning jag kör det i

1. Utöka `areas.ts` med regioner + 12 nya områden (platshållarbilder tillfälligt)
2. Skapa `region.$slug.tsx` + `SwedenMap`
3. Byt startsidan till kartförst
4. Uppdatera Header, Footer, namnbytet överallt
5. Copy-svep i alla routes
6. Generera 15 nya bilder i parallella batcher, byt ut platshållarna
7. Verifiera build och SEO-meta

Vill du köra?