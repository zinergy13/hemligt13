import { createFileRoute } from '@tanstack/react-router'
import fs from 'node:fs'
import path from 'node:path'

const queries: Record<string, string> = {
  'klappen': 'sweden ski resort cabin snow',
  'transtrand': 'swedish village winter snow',
  'salen-by': 'swedish mountain village winter',
  'lindvallen': 'ski slope cabin sweden',
  'hogfjallet': 'snowy mountain peak sweden',
  'tandadalen': 'ski resort pine forest snow',
  'hundfjallet': 'family ski resort snow cabin',
  'stoten': 'mountain ski resort snow sweden',
  'rorbacksnas': 'rural swedish village winter forest',
}

export const Route = createFileRoute('/api/_pexels-fetch')({
  server: {
    handlers: {
      GET: async () => {
        const KEY = process.env.PEXELS_API_KEY
        if (!KEY) return new Response('no key', { status: 500 })
        const results: any[] = []
        for (const [slug, q] of Object.entries(queries)) {
          const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`, { headers: { Authorization: KEY } })
          const j: any = await r.json()
          if (!j.photos?.length) { results.push({ slug, ok: false }); continue }
          const p = j.photos[0]
          const url = p.src.large2x || p.src.large
          const img = await fetch(url)
          const buf = Buffer.from(await img.arrayBuffer())
          const out = path.join(process.cwd(), 'src/assets/areas', `${slug}.jpg`)
          fs.writeFileSync(out, buf)
          results.push({ slug, ok: true, photographer: p.photographer, url })
        }
        return new Response(JSON.stringify(results, null, 2), { headers: { 'content-type': 'application/json' } })
      }
    }
  }
})