# Åtgärdsplan: gamla mejl och stugbilder

## Mål
Stäng de fyra fastnade mejlposterna säkert utan att skicka inaktuella eller förbjudna utskick, och begränsa nya stugbilder till rimliga format och storlekar.

## Genomförande
1. **Fastnade mejl**
   - Klassificera de fyra gamla posterna i stället för att skicka dem igen.
   - Blockera återförsök för den gamla utbetalningsmallen eftersom WP-000 förbjuder utbetalningsbesked utan verifierad betalningshändelse.
   - Blockera försenade incheckningspåminnelser efter incheckningsdatum.
   - Markera de två interna varningsmejlen som avslutade så att de inte ligger kvar som väntande.
   - Förbättra administratörens återförsök så att permanent nekade, inaktuella och avstängda mallar visar ett tydligt fel i stället för att nollställas och skickas.

2. **Automatiska återförsök**
   - Behåll ett enda återförsöksflöde och undvik ett nytt permanent kontrolljobb.
   - Dokumentera att dagens separata `email_attempts`-modell ska konsolideras med den befintliga mejlkön i WP-009.

3. **Stugbilder**
   - Sätt en gräns på 10 MB per bild i den publika bildlagringen.
   - Tillåt endast JPEG, PNG och WebP vid uppladdning.
   - Lägg samma validering i uppladdningsformuläret med tydliga svenska felmeddelanden.
   - Behåll nuvarande ägarstyrda åtkomstregler och publik visning av annonserade bilder.

4. **Verifiering och dokumentation**
   - Testa godkända och nekade bildfiler samt spärrade mejlåterförsök.
   - Kontrollera att inga av de fyra gamla mejlen längre visas som väntande.
   - Uppdatera WP-001-baslinjen och huvudplanens spårning med faktisk status och kvarvarande WP-009-arbete.

## Tekniska detaljer
- Berör `email_attempts`, administratörens mejlåterförsök, `CabinForm`, lagringen `cabin-images` och WP-001-dokumentationen.
- Ingen betalnings- eller utbetalningsfunktion aktiveras.
- Inga mejl skickas till de gamla mottagarna under saneringen.
