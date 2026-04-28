## Sprint 1 forts. — Stugor, värd-dashboard & riktig sök

### Mål
Gå från statiska demo-stugor till en riktig databas där värdar kan lägga upp egna stugor och gäster kan söka/se dem.

---

### 1. Databas (`cabins` + relaterat)

Ny migration som skapar:

- **`cabins`** — huvudtabell
  - `id` (uuid, pk), `host_id` (uuid → profiles), `slug` (unik)
  - `title`, `description` (text)
  - `area_slug` (text, ex. `are`, `salen`) — kopplas till områdessidorna
  - `address`, `lat`, `lng`
  - `bedrooms`, `beds`, `bathrooms`, `max_guests` (int)
  - `price_per_night` (int, SEK), `cleaning_fee` (int)
  - `amenities` (text[]) — bastu, wifi, ski-in/out, etc.
  - `status` (enum: `draft`, `published`, `paused`)
  - `created_at`, `updated_at`
- **`cabin_images`** — `id`, `cabin_id`, `url`, `sort_order`, `is_cover`
- **Storage bucket** `cabin-images` (publik läs, värdar skriver egna)

**RLS-policies:**
- Alla kan läsa `cabins` där `status = 'published'`
- Värd kan CRUD egna stugor (`host_id = auth.uid()` + `has_role(uid, 'host')`)
- Admin kan allt
- Samma mönster för `cabin_images`

**Trigger:** auto-uppdatera `updated_at`, auto-generera `slug` från titel om tom.

---

### 2. Värd-dashboard (`/vard`)

Ny skyddad route-grupp som kräver inloggning + `host`-roll. Annars redirect till `/konto` med "Bli värd"-CTA.

- **`/vard`** — översikt: lista över egna stugor med status-badge, snabb-stats (visningar kommer i Sprint 3)
- **`/vard/stugor/ny`** — flerstegsformulär:
  1. Grundinfo (titel, område, beskrivning)
  2. Kapacitet & pris
  3. Bekvämligheter (checkbox-grid)
  4. Bilder (drag-and-drop upload till storage)
  5. Granska & publicera (sätter `status='published'`)
- **`/vard/stugor/$id/redigera`** — samma formulär, förifyllt
- Knapp "Pausa" / "Återpublicera" / "Radera"

Använder `react-hook-form` + `zod` för validering (redan installerat förmodligen — kollas).

---

### 3. Riktig sök & visningar

Ersätt nuvarande hårdkodade demo-stugor:

- **`/sok`** — query-params: `omrade`, `gaster`, `incheckning`, `utcheckning`, `prismin`, `prismax`
  - Hämtar via TanStack Query från Supabase
  - Visar grid med stugkort (cover-bild, titel, område, pris/natt, max gäster)
  - Filter-sidopanel
  - "Inga träffar"-state
- **`/stuga/$slug`** — publik stugsida
  - Bildgalleri (cover + thumbs)
  - Titel, område-link, beskrivning, amenities
  - Pris + bokningsbox (knappen "Boka" → disabled tills Sprint 2)
  - Värd-info (förnamn + avatar från `profiles`)
- **`/omrade/$slug`** — uppdatera så den listar publicerade stugor i området istället för demo-data

---

### 4. Headers & navigation

- I header dropdown för inloggad värd: lägg till "Mina stugor" → `/vard`
- "Bli värd"-CTA i header för icke-värdar (sidans översta nav)

---

### Tekniska detaljer

- Storage-uppladdning via `supabase.storage.from('cabin-images').upload()` med pathprefix `${user.id}/${cabin_id}/`
- Bild-URL:er sparas som publika URLs i `cabin_images.url`
- Sökfrågor: `supabase.from('cabins').select('*, cabin_images(url, is_cover)').eq('status','published')` med chained `.eq/.gte/.lte` för filter
- Slug-generering: lowercase + bindestreck + 6-teckens random suffix för unikhet
- Skyddade routes: HOC/wrapper-komponent `<RequireRole role="host">` som använder `useAuth`

---

### Vad jag INTE gör i denna sprint
- Bokningar / kalender / Stripe (Sprint 2)
- Recensioner, meddelanden (Sprint 3+)
- Karta med pins (senare)

---

Säg **"kör"** så börjar jag, eller berätta vad du vill ändra (t.ex. färre fält i formuläret, hoppa över storage, etc.).