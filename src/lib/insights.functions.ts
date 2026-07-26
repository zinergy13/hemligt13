import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'

const CabinIdInput = z.object({ cabinId: z.string().uuid() })
const TranslateInput = z.object({
  cabinId: z.string().uuid(),
  languages: z.array(z.enum(['en', 'de'])).min(1),
})

export type HeatmapMonth = {
  year: number
  month: number // 1-12
  bookedNights: number
  totalNights: number
  occupancy: number // 0..1
}

export type PriceRecommendation = {
  comparableCount: number
  currentPrice: number
  areaAvg: number | null
  areaMedian: number | null
  suggestedLow: number | null
  suggestedHigh: number | null
  yourPercentile: number | null // 0..100
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate()
}

export const getCabinInsights = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CabinIdInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context

    const { data: cabin, error: cabinErr } = await supabase
      .from('cabins')
      .select('id, host_id, area_slug, bedrooms, price_per_night, size_sqm')
      .eq('id', data.cabinId)
      .single()
    if (cabinErr || !cabin) throw new Response('Not found', { status: 404 })
    if (cabin.host_id !== userId) throw new Response('Forbidden', { status: 403 })

    // Heatmap: last 12 months
    const now = new Date()
    const startMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1) // exclusive

    const startIso = startMonth.toISOString().slice(0, 10)
    const endIso = endMonth.toISOString().slice(0, 10)

    const { data: bookings } = await supabase
      .from('bookings')
      .select('check_in, check_out, status')
      .eq('cabin_id', data.cabinId)
      .in('status', ['confirmed', 'completed'])
      .gte('check_out', startIso)
      .lt('check_in', endIso)

    const monthKey = (y: number, m: number) => `${y}-${m}`
    const bookedByMonth = new Map<string, number>()

    for (const b of bookings ?? []) {
      const ci = new Date(b.check_in)
      const co = new Date(b.check_out)
      // iterate each night (day = check-in inclusive, check-out exclusive)
      for (
        let d = new Date(ci);
        d < co;
        d.setDate(d.getDate() + 1)
      ) {
        if (d < startMonth || d >= endMonth) continue
        const k = monthKey(d.getFullYear(), d.getMonth() + 1)
        bookedByMonth.set(k, (bookedByMonth.get(k) ?? 0) + 1)
      }
    }

    const heatmap: HeatmapMonth[] = []
    for (let i = 0; i < 12; i++) {
      const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1)
      const y = d.getFullYear()
      const m = d.getMonth() + 1
      const total = daysInMonth(y, m)
      const booked = bookedByMonth.get(monthKey(y, m)) ?? 0
      heatmap.push({
        year: y,
        month: m,
        bookedNights: Math.min(booked, total),
        totalNights: total,
        occupancy: total > 0 ? Math.min(booked, total) / total : 0,
      })
    }

    // Price recommendation: comparable cabins in same area
    const bedroomsMin = Math.max(1, (cabin.bedrooms ?? 1) - 1)
    const bedroomsMax = (cabin.bedrooms ?? 1) + 1
    const { data: peers } = await supabase
      .from('cabins')
      .select('id, price_per_night, bedrooms')
      .eq('area_slug', cabin.area_slug)
      .eq('status', 'published')
      .gte('bedrooms', bedroomsMin)
      .lte('bedrooms', bedroomsMax)
      .neq('id', cabin.id)

    const prices = (peers ?? [])
      .map((p) => p.price_per_night)
      .filter((n): n is number => typeof n === 'number' && n > 0)
      .sort((a, b) => a - b)

    let priceRec: PriceRecommendation = {
      comparableCount: prices.length,
      currentPrice: cabin.price_per_night,
      areaAvg: null,
      areaMedian: null,
      suggestedLow: null,
      suggestedHigh: null,
      yourPercentile: null,
    }

    if (prices.length >= 2) {
      const sum = prices.reduce((a, b) => a + b, 0)
      const avg = Math.round(sum / prices.length)
      const median = prices[Math.floor(prices.length / 2)]
      const p25 = prices[Math.floor(prices.length * 0.25)]
      const p75 = prices[Math.floor(prices.length * 0.75)]
      const below = prices.filter((p) => p < cabin.price_per_night).length
      priceRec = {
        comparableCount: prices.length,
        currentPrice: cabin.price_per_night,
        areaAvg: avg,
        areaMedian: median,
        suggestedLow: p25,
        suggestedHigh: p75,
        yourPercentile: Math.round((below / prices.length) * 100),
      }
    }

    return { heatmap, priceRec }
  })

async function translateOne(text: string, target: 'en' | 'de', apiKey: string): Promise<string> {
  const langName = target === 'en' ? 'English' : 'German'
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-3.6-flash',
      messages: [
        {
          role: 'system',
          content: `You translate Swedish cabin rental listings into ${langName}. Preserve tone, formatting, and paragraph breaks. Return ONLY the translation, no preface, no quotes, no commentary.`,
        },
        { role: 'user', content: text },
      ],
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Response(`AI gateway ${res.status}: ${body}`, { status: 502 })
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const out = json.choices?.[0]?.message?.content?.trim()
  if (!out) throw new Response('AI returned empty translation', { status: 502 })
  return out
}

export const translateCabin = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => TranslateInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context

    const { data: cabin, error } = await supabase
      .from('cabins')
      .select('id, host_id, title, description')
      .eq('id', data.cabinId)
      .single()
    if (error || !cabin) throw new Response('Not found', { status: 404 })
    if (cabin.host_id !== userId) throw new Response('Forbidden', { status: 403 })

    const apiKey = process.env.LOVABLE_API_KEY
    if (!apiKey) throw new Response('LOVABLE_API_KEY missing', { status: 500 })

    const update: Record<string, string> = {}
    for (const lang of data.languages) {
      const [t, d] = await Promise.all([
        translateOne(cabin.title, lang, apiKey),
        cabin.description
          ? translateOne(cabin.description, lang, apiKey)
          : Promise.resolve(''),
      ])
      update[`title_${lang}`] = t
      update[`description_${lang}`] = d
    }
    update.translated_at = new Date().toISOString()

    const { error: uErr } = await supabase
      .from('cabins')
      .update(update as never)
      .eq('id', cabin.id)
    if (uErr) throw new Response(uErr.message, { status: 500 })

    return { ok: true, translated: data.languages }
  })