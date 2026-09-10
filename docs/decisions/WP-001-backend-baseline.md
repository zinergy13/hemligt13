# WP-001 - Verifierad backend-baslinje

Datum: 2026-09-10. Underlag: direkta läsningar mot den hostade databasen (inte antaganden).

## Tabeller och åtkomstregler

34 tabeller i `public`. **Samtliga** har radnivåsäkerhet påslagen och minst en policy.
Tabeller med endast en policy (kontrollera att den täcker rätt roller vid nästa pass):
`cabin_ical_feeds`, `cabin_pricing_rules`, `email_send_state`, `favorites`,
`gift_card_redemptions`, `gift_cards`, `price_alerts`.

Publik läsning går via delade policyer (`TO anon, authenticated`) för publicerade stugor
och deras bilder. Privata kolumner (t.ex. kalendertoken) nås bara via skyddad RPC.

## Schemalagda jobb (cron)

| Jobb | Schema | Aktivt |
| --- | --- | --- |
| complete-past-bookings-daily | 0 2 * * * | ja |
| generate-monthly-host-invoices | 0 3 1 * * | ja |
| mark-overdue-host-invoices | 0 6 * * * | ja |
| guest-booking-notifications-hourly | 7 * * * * | ja |

Ingen utbetalnings-/escrow-cron finns kvar. `release_eligible_escrow()` är verifierat
en no-op (returnerar 0) enligt WP-000-frysningen.

## SECURITY DEFINER-funktioner (kärna)

`has_role`, `get_my_profile`, `admin_list_profiles`, `get_my_cabin_ical_tokens`,
`get_cron_secret`, `complete_past_bookings`, `release_eligible_escrow` (no-op).
Inga av dessa är anropbara av utloggade besökare utom där publik läsning kräver det.

## Lagring

En bucket: `cabin-images` (publik läsning, ingen storleksgräns satt).
Åtgärd att överväga i WP-002: sätt filstorleksgräns och MIME-begränsning.

## Datavolym (baslinje)

| Mått | Antal |
| --- | --- |
| Stugor | 3 (2 publicerade) |
| Bokningar | 4 (1 betald) |
| Användarprofiler | 5 |
| Värdfakturor | 0 |
| E-post: väntande / misslyckade | 2 / 2 |
| Loggade åtkomstnekningar | 21 |

## Öppna punkter till WP-002

1. Bucketen `cabin-images` saknar storleks- och filtypsgräns.
2. Fyra e-postutskick hänger (2 väntande, 2 misslyckade) - kör om eller avskriv.
3. Tabeller med bara en policy bör granskas rollvis.
4. Momsbehandling av gästavgiften (D-002) väntar fortfarande på revisorsgodkännande;
   live-läge förblir blockerat.
