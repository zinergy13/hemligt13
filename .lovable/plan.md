## Mål

Lägg till ett automatiskt säkerhetstest som körs vid `bun run build` och blockar publicering om någon synlig referens till externa appskapare (Lovable, GPT Engineer m.fl.) hittas i renderad HTML — inklusive header, footer och splash/loader.

## Hur det fungerar

Eftersom appen är SSR (TanStack Start) renderas alla huvudvyer till HTML vid förfrågan. Vi gör skanningen i två lager:

1. **Statisk källkods-skanner** (snabb, körs alltid)
   - Söker igenom `src/**`, `index.html` och `public/**` efter en svartlista av termer.
   - Ignorerar interna integrationer (`src/integrations/lovable/**`, `src/integrations/supabase/**`, `node_modules`, `routeTree.gen.ts`) och själva skannerfilen.

2. **Renderad HTML-skanner** (fångar runtime-strängar och badges)
   - Startar en kortlivad preview-server av build-output.
   - Hämtar nyckelrutter: `/`, `/sok`, `/logga-in`, `/hyr-ut`, `/kontakt`, `/konto`, plus en avsiktlig 404 (`/__not_found_check`) för att täcka NotFoundComponent.
   - Skannar varje HTML-svar efter samma svartlista (case-insensitive), med whitelist för säkra ord (t.ex. "love" i fritext).
   - Inkluderar skannern av inline `<script>`/`<style>` så loader/splash-markup fångas.

Om något hittas: skript exitar med kod 1 → `bun run build` misslyckas → publicering blockas (Lovable publicerar bara lyckade builds).

## Svartlista (case-insensitive, ord-gränsade)

`lovable`, `lovable.dev`, `lovable.app`, `gpt engineer`, `gpt-engineer`, `gptengineer`, `made with`, `powered by lovable`, `built with lovable`, `edit with lovable`.

## Whitelist (tillåtna träffar)

- Filer under `src/integrations/lovable/`, `src/integrations/supabase/`
- `package.json`, `package-lock.json`, `bun.lockb`, `node_modules/**`
- `src/routeTree.gen.ts`
- Själva skannern (`scripts/brand-scan.*`)
- `.lovable/**`, `supabase/config.toml`
- `*.lovable.app`-URL:er i meta/og som inte är användarsynlig text (matchas bort via attributkontext)

## Filer som skapas/ändras

- **`scripts/brand-scan.ts`** (ny): Kör båda lagren. Tar flagga `--source-only` för snabb lokal körning.
- **`scripts/render-scan.ts`** (ny, anropas från brand-scan): Startar `vite preview`-process, gör fetch mot rutterna, parsar HTML, returnerar träffar.
- **`package.json`** (ändras):
  - Lägg till devDep: `tsx`
  - Nya scripts:
    - `"brand:scan": "tsx scripts/brand-scan.ts"`
    - `"brand:scan:full": "tsx scripts/brand-scan.ts --render"`
    - `"prebuild": "tsx scripts/brand-scan.ts"` ← detta är vad som blockar publicering
    - `"build": "vite build && tsx scripts/brand-scan.ts --render"` ← post-build render-skanning mot dist/SSR-output
- **`.lovableignore`** eller justering av prettier/eslint vid behov så skannern inte triggas av sig själv.

## Utdata

Vid träff:
```
✗ Brand scan failed — 2 forbidden references found:
  src/components/Footer.tsx:42  "Powered by Lovable"
  rendered: GET /sok            "<a href=\"https://lovable.dev\">"
Publicering blockad. Ta bort referenserna och försök igen.
```

Vid OK:
```
✓ Brand scan passed (scanned 187 source files, 7 rendered routes)
```

## Tekniska detaljer

- Skannern är ren Node (fs + fetch), inga externa beroenden förutom `tsx` för att köra TS direkt.
- Render-fasen försöker `bun run preview` på en ledig port, pollar tills `200`, gör fetcher, dödar processen.
- Om preview-servern inte startar inom 15s loggas ett varnings-skip (källkods-skannern räcker för att blocka build, men render-skanningen rapporterar warning så det märks i CI).
- Skannern är idempotent och säker att köra lokalt: `bun run brand:scan`.

## Begränsningar

- Skannern fångar inte text som hämtas från externa API:er vid runtime (t.ex. om en CMS-post innehåller "Made with Lovable") — det är rimligt utanför bygg-tid.
- "Edit with Lovable"-badgen injiceras endast på publicerade Lovable-deployments och är redan dold via `set_badge_visibility`. Render-skanningen täcker den i lokala builds; produktionsbadge skyddas separat av plattformsinställningen.