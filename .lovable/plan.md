## Sprint 3 — Betalning, prissättning & kalendersync

Ingen pengahantering via Fjällhuset. Vi visar värdens betaluppgifter efter bekräftad bokning och synkar kalendrar med Airbnb/Booking.

### 1. Betalning direkt värd→gäst

Utöka `profiles` (eller ny `host_payout_settings`) med värdens betaluppgifter:
- `swish_number` (text, valfritt) — validera format `07XXXXXXXX` eller `123XXXXXXX`
- `bankgiro` (text, valfritt) — format `XXX-XXXX` eller `XXXX-XXXX`
- `bank_account` (text, valfritt) — fritt clearing + kontonr
- `payment_instructions` (text, valfritt) — värdens egen instruktion ("Märk med bokning + namn")
- `is_business` (bool) — påverkar bara vilka fält som visas prominent

Minst ett fält krävs innan stugan får publiceras (validering i CabinForm + serverside check).

**Visning:** Efter `status='confirmed'` visas en betalningspanel på `/mina-bokningar` för gästen:
- Totalt att betala (kr)
- Swish-nr med "Kopiera"-knapp + `swish://` deeplink på mobil
- Bankgiro/konto med kopieringsknapp
- Föreslagen meddelanderad: "Fjällhuset #<kort-id> — <gästnamn>"
- Värdens egna instruktioner

Innan bekräftelse: **inga** betaluppgifter läcker. RLS: `bookings.status='confirmed' AND guest_id=auth.uid()` för att se värdens betalfält.

Status `payment_status` behålls men flippas manuellt av värden på `/vard/bokningar` ("Markera som betald"). Vi visar gästen "Väntar på att värden bekräftar betalning" tills flipp.

### 2. Säsongspriser (låg / hög / topp)

Ny tabell `cabin_season_prices`:
```
id, cabin_id (FK), label ('lag'|'hog'|'topp'), start_date, end_date,
price_per_night, min_nights, weekend_only bool, created_at
```

- `cabins.price_per_night` blir **basspris** (fallback när ingen säsong matchar)
- `cabins.min_nights` (ny kolumn, default 1) blir baseline; per-säsong `min_nights` overrider
- `weekend_only=true` = tvingar lör→lör (eller annan `check_in_weekday` som värden väljer, default lördag) under den perioden

**Priskalkyl** (`calcQuote` i `lib/bookings.ts`) läser alla säsonger som täcker resan, plockar pris per natt, summerar. Blandade säsonger tillåts (nätter beräknas individuellt).

**UI värd:** ny sektion i CabinForm — "Säsonger" med lista + "Lägg till period". Datepicker-intervall + pris + min-nätter + veckotvång-toggle. Konflikter (överlappande perioder) valideras.

**UI gäst:** BookingForm visar prisuppdelning per säsong när bokning spänner över flera.

Validering framåt: minst basspris krävs; säsonger valfria.

### 3. iCal-sync (in + ut)

**Export ut (våra bokningar → Airbnb/Booking):**
- Ny server route: `/api/public/ical/cabin/[token].ics` (obfuskerad slug-token per stuga)
- Nya kolumn `cabins.ical_token` (random 32 hex) genereras vid publicering
- Returnerar VEVENT för varje `confirmed`/`completed` bokning + varje rad i `cabin_unavailable_dates`
- Values: `SUMMARY:Bokad (Fjällhuset)`, DTSTART/DTEND som DATE (all-day)
- Cache-Control: private, max-age=300

**Import in (externa kalendrar → oss):**
- Ny tabell `cabin_ical_feeds`: `id, cabin_id, url, label, last_synced_at, last_error`
- Server function `syncIcalFeed(feed_id)` hämtar ICS, parsar VEVENT, upserar i `cabin_unavailable_dates` med `source='ical:<feed_id>'`
- Cron var 30:e min via pg_cron POST till `/api/public/hooks/sync-ical-feeds` (skyddad med signaturheader)
- Vi lägger `source`-kolumn på `cabin_unavailable_dates` så manuellt spärrade datum inte skrivs över

**UI värd:** ny flik "Kalendersynk" på `/vard/stugor/[id]/redigera`:
- Visar exportlänk med "Kopiera" (instruktioner: klistra in i Airbnb → Kalender → Tillgänglighet → Importera kalender)
- Lista över inkommande feeds + "Lägg till kalender" (url + etikett)
- Senaste sync + felmeddelande per feed
- Knapp "Synka nu"

### 4. Migrationer (sammanfattat)

```sql
-- Betalfält
ALTER TABLE profiles ADD COLUMN swish_number text,
  ADD COLUMN bankgiro text, ADD COLUMN bank_account text,
  ADD COLUMN payment_instructions text, ADD COLUMN is_business boolean DEFAULT false;

-- Bokningsregler
ALTER TABLE cabins ADD COLUMN min_nights int DEFAULT 1,
  ADD COLUMN check_in_weekday smallint,  -- null = valfri, 6 = lördag
  ADD COLUMN ical_token text UNIQUE;

-- Säsongspriser
CREATE TABLE cabin_season_prices (...);

-- iCal-import
CREATE TABLE cabin_ical_feeds (...);
ALTER TABLE cabin_unavailable_dates ADD COLUMN source text DEFAULT 'manual';
```

Alla nya tabeller: GRANT + RLS (host_id = auth.uid() för skrivning, publik SELECT bara för `cabin_season_prices` för publicerade stugor).

### 5. Ordning jag bygger i

1. Migration: alla schemaändringar + RLS + GRANT
2. Betaluppgifter i profil + gate på publish + visning på gästens bokningssida
3. Säsongspriser: form, kalkylator, visning
4. iCal export (våra → externa)
5. iCal import (externa → våra) + cron
6. Uppdatera `.lovable/plan.md`

### Tekniska detaljer

- **iCal-parsing:** `ical.js`-paketet (WASM-fri, edge-kompatibel), körs i server function
- **Swish deeplink:** `swish://payment?data=<base64 JSON>` för mobil, fallback: nummer + kopiera
- **Prisberäkning:** görs client-side för snabb preview, valideras server-side vid insert via trigger som räknar om `nightly_total`
- **Ingen dubbelbokningsrisk:** befintlig EXCLUDE-constraint på `bookings` fångar överlapp; iCal-import går via `cabin_unavailable_dates` (ingen constraint) så vi lägger unik constraint på `(cabin_id, check_in, source)`

### Avgränsat (inte i denna sprint)

- Automatisk detektion av "betald" via bankintegration (kräver Open Banking, senare)
- Booking.com iCal-quirks (deras format skiljer sig; vi tar Airbnb-standard först)
- Dynamiska "smart pricing" (ML). Värden sätter själv säsongspriserna.
